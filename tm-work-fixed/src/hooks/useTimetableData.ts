import { useEffect, useState, useCallback, useRef } from 'react';
import type { LabSession, Holiday, DayKey, TermConfig, TermType } from '@/types';
import {
  SHEET_CSV_BASE_URL,
  SHEET_PUBHTML_URL,
  FALLBACK_TIMETABLE,
  FALLBACK_HOLIDAYS,
  FALLBACK_TERM,
  TERM_DURATIONS,
  KNOWN_TAB_NAMES,
} from '@/config';
import { parseCSV, getField, type CsvRow } from '@/utils/csv';
import { processHolidayRollover, type ProcessedHoliday } from '@/utils/dates';
import { isHolidayTab, isTermTab, type SheetTab } from '@/utils/sheetTabs';

interface TimetableDataState {
  sessions: LabSession[];
  holidays: ProcessedHoliday[];
  term: TermConfig;
  loading: boolean;
  error: string | null;
  dataSource: 'google-sheets' | 'fallback' | 'cache';
  refresh: () => void;
}

const DAY_MAP: Record<string, DayKey> = {
  'sunday': 'sunday', 'monday': 'monday', 'tuesday': 'tuesday',
  'wednesday': 'wednesday', 'thursday': 'thursday', 'friday': 'friday', 'saturday': 'saturday',
  'الأحد': 'sunday', 'الإثنين': 'monday', 'الاثنين': 'monday',
  'الثلاثاء': 'tuesday', 'الأربعاء': 'wednesday', 'الاربعاء': 'wednesday',
  'الخميس': 'thursday', 'الجمعة': 'friday', 'السبت': 'saturday',
};

function parseDay(value: string): DayKey | null {
  const normalized = value.trim().toLowerCase();
  if (DAY_MAP[normalized]) return DAY_MAP[normalized];
  if (DAY_MAP[value.trim()]) return DAY_MAP[value.trim()];
  for (const key of Object.keys(DAY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return DAY_MAP[key];
  }
  return null;
}

// ponytail: convert 12h time+ampm to 24h string "HH:MM"
function to24h(time: string, ampm: string | undefined): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time;
  if (ampm) {
    const suffix = ampm.toUpperCase();
    if (suffix === 'PM' && h !== 12) h += 12;
    if (suffix === 'AM' && h === 12) h = 0;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseTimeRange(period: string): { startTime: string; endTime: string } | null {
  const text = period.trim();
  // Captures AM/PM so we can convert correctly
  const rangeMatch = /(\d{1,2}:\d{2})\s*(AM|PM)?\s*(?:-|–|—|to|إلى|الى)\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i.exec(text);
  if (rangeMatch) {
    return {
      startTime: to24h(rangeMatch[1], rangeMatch[2]),
      endTime: to24h(rangeMatch[3], rangeMatch[4]),
    };
  }
  return null;
}

function isHtmlResponse(text: string): boolean {
  const t = text.trimStart();
  // ponytail: catches <!DOCTYPE, <html, <HTML, redirect pages, etc.
  return /^<[!h]/i.test(t);
}

function rowToSession(row: CsvRow, index: number, fallbackLab: string): LabSession | null {
  const day = parseDay(getField(row, 'day', 'اليوم', 'Day'));
  if (!day) return null;

  let startTime = getField(row, 'startTime', 'start', 'start time', 'من', 'البداية', 'وقت البداية');
  let endTime = getField(row, 'endTime', 'end', 'end time', 'إلى', 'الى', 'النهاية', 'وقت النهاية');

  if (!startTime || !endTime) {
    const period = getField(row, 'period', 'الفترة', 'الوقت', 'Period', 'Time', 'Time Slot');
    if (period) {
      const range = parseTimeRange(period);
      if (range) {
        startTime = range.startTime;
        endTime = range.endTime;
      } else {
        startTime = period;
      }
    }
  }

  // If startTime came from explicit column, still run through to24h if it has AM/PM
  if (startTime && /am|pm/i.test(startTime)) {
    const m = /(\d{1,2}:\d{2})\s*(AM|PM)/i.exec(startTime);
    if (m) startTime = to24h(m[1], m[2]);
  }
  if (endTime && /am|pm/i.test(endTime)) {
    const m = /(\d{1,2}:\d{2})\s*(AM|PM)/i.exec(endTime);
    if (m) endTime = to24h(m[1], m[2]);
  }

  const course = getField(row, 'course', 'المقرر', 'المادة', 'Course', 'Subject', 'المادة الدراسية');
  const instructor = getField(row, 'instructor', 'المدرب', 'المدرس', 'الدكتور', 'Instructor', 'Teacher', 'Lecturer');
  const labCol = getField(row, 'lab', 'المعمل', 'Lab', 'Laboratory', 'Room');
  const group = getField(row, 'group', 'المجموعة', 'Group');
  const note = getField(row, 'note', 'ملاحظة', 'ملاحظات', 'Note', 'Notes');
  if (!startTime || !endTime || !course) return null;
  return {
    id: `csv-${index}`, day, startTime: startTime.trim(), endTime: endTime.trim(),
    course: course.trim(), instructor: instructor.trim() || 'غير محدد',
    lab: labCol.trim() || fallbackLab,
    group: group.trim() || undefined, note: note.trim() || undefined,
  };
}

function rowToHoliday(row: CsvRow, index: number): Holiday | null {
  const name = getField(row, 'name', 'اسم', 'الاسم', 'المناسبة', 'Name', 'Holiday', 'Title', 'Holiday Name');
  const date =
    getField(row, 'date', 'التاريخ', 'Date') ||
    getField(row, 'startDate', 'تاريخ البداية', 'البداية', 'Start Date', 'Start');
  const endDate = getField(row, 'endDate', 'تاريخ النهاية', 'نهاية', 'End Date');
  const description = getField(row, 'description', 'الوصف', 'ملاحظات', 'Description', 'Notes');
  if (!name || !date) return null;
  return {
    id: `csv-h-${index}`, name: name.trim(), date: date.trim(),
    endDate: endDate.trim() || undefined, description: description.trim() || undefined,
  };
}

function rowToTerm(row: CsvRow): TermConfig | null {
  const typeStr = getField(row, 'type', 'الترم', 'Type', 'Term').trim().toLowerCase();
  const startDate = getField(row, 'startDate', 'بداية', 'تاريخ البداية', 'Start Date', 'Start');
  const weeksStr = getField(row, 'weeks', 'أسابيع', 'Weeks', 'Duration', 'Duration Weeks');
  if (!startDate) return null;

  let type: TermType = 'first';
  if (typeStr.includes('second') || typeStr.includes('ثان')) type = 'second';
  else if (typeStr.includes('summer') || typeStr.includes('صيف')) type = 'summer';

  let weeks = TERM_DURATIONS[type] ?? 16;
  const parsedWeeks = parseInt(weeksStr, 10);
  if (!isNaN(parsedWeeks) && parsedWeeks > 0) weeks = parsedWeeks;

  return { type, startDate: startDate.trim(), weeks };
}

const CACHE_KEY = 'labs-cache-v2';

interface CacheData {
  sessions: LabSession[];
  holidays: Holiday[];
  term: TermConfig;
  timestamp: number;
}

function loadCache(): CacheData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheData;
  } catch {
    return null;
  }
}

function saveCache(sessions: LabSession[], holidays: Holiday[], term: TermConfig) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ sessions, holidays, term, timestamp: Date.now() }));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// CORS PROXY – Google Sheets does not send CORS headers for direct fetches.
// All remote requests go through a proxy so the browser can read the response.
// Replace the proxy URL below with your own if needed.
// ---------------------------------------------------------------------------
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

async function proxiedFetch(url: string): Promise<Response> {
  return fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, { credentials: 'omit' });
}

// ---------------------------------------------------------------------------
// Tab discovery – parse the pubhtml page to get sheet names + gids.
// ---------------------------------------------------------------------------
interface DiscoveredTab {
  name: string;
  gid: string;
}

async function discoverTabsFromPubhtml(pubhtmlUrl: string): Promise<DiscoveredTab[]> {
  const res = await proxiedFetch(pubhtmlUrl);
  if (!res.ok) throw new Error(`pubhtml HTTP ${res.status}`);
  const html = await res.text();

  const tabs: DiscoveredTab[] = [];
  // Matches: items.push({name: "312", pageUrl: "...", gid: "335238377", ...});
  const regex = /name:\s*"([^"]+)"[^}]*?gid:\s*"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    tabs.push({ name: match[1], gid: match[2] });
  }

  // Deduplicate by gid (the same gid can appear multiple times)
  const seen = new Set<string>();
  return tabs.filter(t => {
    if (seen.has(t.gid)) return false;
    seen.add(t.gid);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Sheet fetching
// ---------------------------------------------------------------------------
interface FetchedSheet {
  name: string;
  text: string;
}

async function fetchSheetCSVByGid(gid: string, name: string): Promise<FetchedSheet | null> {
  // Build a reliable CSV URL for a published sheet using its gid.
  const url = `${SHEET_CSV_BASE_URL}&gid=${gid}&single=true&output=csv`;
  try {
    const res = await proxiedFetch(url);
    if (!res.ok) {
      console.warn(`[labs] sheet "${name}" (gid=${gid}) returned HTTP ${res.status}`);
      return null;
    }
    const text = await res.text();
    if (!text || isHtmlResponse(text)) {
      console.warn(`[labs] sheet "${name}" returned HTML (not published or wrong gid)`);
      return null;
    }
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      console.warn(`[labs] sheet "${name}" has no data rows`);
      return null;
    }
    return { name, text };
  } catch (e) {
    console.warn(`[labs] fetch error for sheet "${name}" (gid=${gid}):`, e instanceof Error ? e.message : e);
    return null;
  }
}

async function fetchSheetCSVByName(name: string): Promise<FetchedSheet | null> {
  const url = `${SHEET_CSV_BASE_URL}&sheet=${encodeURIComponent(name)}&output=csv`;
  try {
    const res = await proxiedFetch(url);
    if (!res.ok) {
      console.warn(`[labs] sheet "${name}" returned HTTP ${res.status}`);
      return null;
    }
    const text = await res.text();
    if (!text || isHtmlResponse(text)) {
      console.warn(`[labs] sheet "${name}" returned HTML (not published or wrong name)`);
      return null;
    }
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      console.warn(`[labs] sheet "${name}" has no data rows`);
      return null;
    }
    return { name, text };
  } catch (e) {
    console.warn(`[labs] fetch error for sheet "${name}":`, e instanceof Error ? e.message : e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useTimetableData(): TimetableDataState {
  const [sessions, setSessions] = useState<LabSession[]>(FALLBACK_TIMETABLE);
  const [holidays, setHolidays] = useState<ProcessedHoliday[]>(
    processHolidayRollover(FALLBACK_HOLIDAYS)
  );
  const [term, setTerm] = useState<TermConfig>(FALLBACK_TERM);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'google-sheets' | 'fallback' | 'cache'>('fallback');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const hasMounted = useRef(false);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        let allFetched: FetchedSheet[] = [];

        // 1. Try to discover tabs from the pubhtml page (gives us gids + names)
        try {
          const discovered = await discoverTabsFromPubhtml(SHEET_PUBHTML_URL);
          if (discovered.length > 0) {
            console.log('[labs] discovered tabs:', discovered);
            const results = await Promise.all(
              discovered.map(tab => fetchSheetCSVByGid(tab.gid, tab.name))
            );
            allFetched = results.filter((s): s is FetchedSheet => s !== null);
            console.log('[labs] fetched via discovery:', allFetched.map(s => s.name));
          }
        } catch (e) {
          console.warn('[labs] discoverTabsFromPubhtml failed:', e);
        }

        // 2. If discovery failed, fall back to known tab names
        if (allFetched.length === 0 && KNOWN_TAB_NAMES.length > 0) {
          console.log('[labs] trying KNOWN_TAB_NAMES:', KNOWN_TAB_NAMES);
          const results = await Promise.all(KNOWN_TAB_NAMES.map(fetchSheetCSVByName));
          allFetched = results.filter((s): s is FetchedSheet => s !== null);
          console.log('[labs] fetched via known names:', allFetched.map(s => s.name));
        }

        if (cancelled) return;

        if (allFetched.length === 0) {
          console.warn('[labs] all fetch strategies failed — using fallback data');
          setSessions(FALLBACK_TIMETABLE);
          setHolidays(processHolidayRollover(FALLBACK_HOLIDAYS));
          setTerm(FALLBACK_TERM);
          setDataSource('fallback');
          setLoading(false);
          return;
        }

        // 3. Classify and parse — reuse fetched text, no second HTTP request
        const roomSheets = allFetched.filter(s => !isHolidayTab(s.name) && !isTermTab(s.name));
        const holidaySheets = allFetched.filter(s => isHolidayTab(s.name));
        const termSheets = allFetched.filter(s => isTermTab(s.name));

        let sessionIdx = 0;
        const allSessions: LabSession[] = [];

        for (const sheet of roomSheets) {
          const rows = parseCSV(sheet.text);
          if (sheet === roomSheets[0]) {
            console.log(`[labs] CSV headers for "${sheet.name}":`, Object.keys(rows[0] ?? {}));
          }
          for (const row of rows) {
            const s = rowToSession(row, sessionIdx++, sheet.name);
            if (s) allSessions.push(s);
          }
        }

        console.log('[labs] total sessions:', allSessions.length);

        let newHolidays: Holiday[] = FALLBACK_HOLIDAYS;
        if (holidaySheets.length > 0) {
          const parsed = holidaySheets.flatMap(s =>
            parseCSV(s.text).map((r, i) => rowToHoliday(r, i)).filter((h): h is Holiday => !!h)
          );
          if (parsed.length > 0) newHolidays = parsed;
        }

        let newTerm: TermConfig = FALLBACK_TERM;
        if (termSheets.length > 0) {
          const parsed = termSheets.flatMap(s =>
            parseCSV(s.text).map(rowToTerm).filter((t): t is TermConfig => !!t)
          );
          if (parsed.length > 0) newTerm = parsed[parsed.length - 1];
        }

        if (cancelled) return;

        const finalSessions = allSessions.length > 0 ? allSessions : FALLBACK_TIMETABLE;
        setSessions(finalSessions);
        setHolidays(processHolidayRollover(newHolidays));
        setTerm(newTerm);
        setDataSource('google-sheets');
        saveCache(finalSessions, newHolidays, newTerm);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load data';
        console.error('[labs] fetchData error:', msg);
        setError(msg);

        const cache = loadCache();
        if (cache) {
          setSessions(cache.sessions);
          setHolidays(processHolidayRollover(cache.holidays));
          setTerm(cache.term);
          setDataSource('cache');
        } else {
          setSessions(FALLBACK_TIMETABLE);
          setHolidays(processHolidayRollover(FALLBACK_HOLIDAYS));
          setTerm(FALLBACK_TERM);
          setDataSource('fallback');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!hasMounted.current) {
      hasMounted.current = true;
      const cache = loadCache();
      if (cache) {
        setSessions(cache.sessions);
        setHolidays(processHolidayRollover(cache.holidays));
        setTerm(cache.term);
        setDataSource('cache');
        setLoading(false);
      }
    }

    void fetchData();

    return () => { cancelled = true; };
  }, [refreshKey]);

  return { sessions, holidays, term, loading, error, dataSource, refresh };
}

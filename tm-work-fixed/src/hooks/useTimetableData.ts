import { useEffect, useState, useCallback, useRef } from 'react';
import type { LabSession, Holiday, DayKey, TermConfig, TermType } from '@/types';
import {
  SHEET_CSV_BASE_URL,
  SHEET_PUBHTML_URL,
  MAX_TAB_PROBE,
  FALLBACK_TIMETABLE,
  FALLBACK_HOLIDAYS,
  FALLBACK_TERM,
  TERM_DURATIONS,
  KNOWN_TAB_NAMES,
} from '@/config';
import { parseCSV, getField, type CsvRow } from '@/utils/csv';
import { processHolidayRollover, type ProcessedHoliday } from '@/utils/dates';
import { discoverTabs, probeTabs, isHolidayTab, isTermTab, type SheetTab } from '@/utils/sheetTabs';

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
  const name = getField(row, 'name', 'اسم', 'الاسم', 'المناسبة', 'Name', 'Holiday', 'Title');
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
  const weeksStr = getField(row, 'weeks', 'أسابيع', 'Weeks', 'Duration');
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

// ponytail: single-fetch-per-sheet — discovered text is reused directly, no second round-trip
interface FetchedSheet {
  name: string;
  text: string;
}

async function fetchSheetCSV(name: string): Promise<FetchedSheet | null> {
  const url = `${SHEET_CSV_BASE_URL}&sheet=${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url, { credentials: 'omit' });
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
        // 1. Fetch all known sheets in parallel — ONE fetch per sheet, text is kept for parsing
        const results = await Promise.all(KNOWN_TAB_NAMES.map(fetchSheetCSV));
        const fetched = results.filter((s): s is FetchedSheet => s !== null);

        console.log('[labs] loaded sheets:', fetched.map(s => s.name));

        // 2. If all name-based fetches fail, try gid probing as last resort
        let tabs: SheetTab[] = [];
        let fetchedByGid: FetchedSheet[] = [];

        if (fetched.length === 0) {
          console.warn('[labs] name-based fetch failed — trying pubhtml tab discovery');
          // Try pubhtml discovery first (widget=true shows all tab names + gids)
          try {
            tabs = await discoverTabs(SHEET_PUBHTML_URL);
          } catch (e) {
            console.warn('[labs] discoverTabs failed:', e);
            tabs = await probeTabs(SHEET_CSV_BASE_URL, MAX_TAB_PROBE);
          }
          // Fetch discovered tabs to get actual CSV text
          const probeResults = await Promise.all(
            tabs.map(async (tab): Promise<FetchedSheet | null> => {
              try {
                const res = await fetch(`${SHEET_CSV_BASE_URL}&gid=${tab.gid}`, { credentials: 'omit' });
                if (!res.ok) return null;
                const text = await res.text();
                if (!text || isHtmlResponse(text)) return null;
                if (text.split('\n').filter(l => l.trim()).length < 2) return null;
                return { name: tab.name, text };
              } catch { return null; }
            })
          );
          fetchedByGid = probeResults.filter((s): s is FetchedSheet => s !== null);
          console.log('[labs] fallback-fetched sheets:', fetchedByGid.map(s => s.name));
        }

        if (cancelled) return;

        const allFetched = fetched.length > 0 ? fetched : fetchedByGid;

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

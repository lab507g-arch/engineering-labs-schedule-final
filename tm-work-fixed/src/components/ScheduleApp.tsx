import { useState, useMemo, useCallback, useEffect } from 'react';
import { Database, Search, WifiOff, X } from 'lucide-react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import LabFilter from '@/components/LabFilter';
import DayFilter from '@/components/DayFilter';
import HolidayBanner from '@/components/HolidayBanner';
import LabsOverview from '@/components/LabsOverview';
import TimetableGrid from '@/components/TimetableGrid';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useTimeSync } from '@/hooks/useTimeSync';
import { useTimetableData } from '@/hooks/useTimetableData';
import { useLectureNotifications } from '@/hooks/useLectureNotifications';
import { useLang } from '@/context/LanguageContext';
import {
  dateToDayKey,
  isTimeInRange,
  timeToMinutes,
  parseDateLocal,
  toDateKey,
  daysBetween,
} from '@/utils/dates';
import { extractUniqueLabs } from '@/utils/labColors';
import { getTermStatus } from '@/utils/terms';
import type { DayKey, LabSession } from '@/types';

function App() {
  const { t } = useLang();
  const { now } = useTimeSync();
  const { sessions, holidays, term, loading, error, dataSource } = useTimetableData();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [instructorQuery, setInstructorQuery] = useState<string>('');
  const [selectedLab, setSelectedLab] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayKey | 'all'>('all');
  const [notifEnabled, setNotifEnabled] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [kioskLab, setKioskLab] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareLabA, setCompareLabA] = useState<string | null>(null);
  const [compareLabB, setCompareLabB] = useState<string | null>(null);
  const [conflictMode, setConflictMode] = useState<boolean>(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  // Opened via a lab QR link: auto-select that lab and hide all filters.
  useEffect(() => {
    const labParam = new URLSearchParams(window.location.search).get('lab');
    if (labParam) {
      setKioskLab(labParam);
      setSelectedLab(labParam);
    }
  }, []);

  // Hidden admin shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return;
      const key = e.key.toLowerCase();
      if (key === 'm') {
        e.preventDefault();
        setCompareMode((v) => !v);
      } else if (key === 'c') {
        e.preventDefault();
        setConflictMode((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const currentDay = dateToDayKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const labs = useMemo(() => extractUniqueLabs(sessions), [sessions]);
  const termStatus = useMemo(() => getTermStatus(term, now), [term, now]);

  const { enable: enableNotifs } = useLectureNotifications(now, sessions, notifEnabled, t, holidays);

  // Ask for notification permission once on page load.
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      setNotifEnabled(true);
      return;
    }
    if (Notification.permission === 'default') {
      Notification.requestPermission()
        .then((result) => {
          if (result === 'granted') setNotifEnabled(true);
        })
        .catch(() => { /* ignore */ });
    }
  }, []);

  // All sessions happening right now across all labs.
  const runningSessions = useMemo(() => {
    return sessions
      .filter((s) => s.day === currentDay && isTimeInRange(currentMinutes, s.startTime, s.endTime))
      .sort((a, b) => timeToMinutes(a.endTime) - timeToMinutes(b.endTime));
  }, [sessions, currentDay, currentMinutes]);

  // Vacation starting within the next 2 days (Friday excluded).
  const upcomingVacation = useMemo(() => {
    const today = parseDateLocal(toDateKey(now));
    return (
      holidays
        .filter((h) => {
          const date = parseDateLocal(h.effectiveDate);
          if (date.getDay() === 5) return false;
          const diff = daysBetween(date, today);
          return diff > 0 && diff <= 2;
        })
        .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))[0] ?? null
    );
  }, [holidays, now]);

  // Conflict detection: overlapping sessions in the same lab on the same day.
  const conflicts = useMemo(() => {
    const pairs: { lab: string; a: LabSession; b: LabSession }[] = [];
    const byLabDay = new Map<string, LabSession[]>();
    for (const s of sessions) {
      const key = `${s.lab}|${s.day}`;
      const list = byLabDay.get(key);
      if (list) list.push(s);
      else byLabDay.set(key, [s]);
    }
    for (const list of byLabDay.values()) {
      const sorted = [...list].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const a = sorted[i];
          const b = sorted[j];
          if (timeToMinutes(b.startTime) < timeToMinutes(a.endTime)) {
            pairs.push({ lab: a.lab, a, b });
          }
        }
      }
    }
    return pairs;
  }, [sessions]);

  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of conflicts) {
      ids.add(c.a.id);
      ids.add(c.b.id);
    }
    return ids;
  }, [conflicts]);

  const handlePrint = useCallback(() => {
    if (selectedLab) {
      // Mark all session cards for the selected lab
      document.querySelectorAll('.print-card').forEach((el) => {
        const card = el as HTMLElement;
        const labAttr = card.getAttribute('data-instructor') ?? '';
        // Use data-lab attribute if present, otherwise check parent context
        const labEl = card.closest('[data-lab]') as HTMLElement | null;
        const cardLab = labEl?.dataset['lab'] ?? '';
        card.setAttribute('data-lab-match', cardLab === selectedLab ? 'true' : 'false');
      });
      document.body.setAttribute('data-print-lab', selectedLab);
    }
    window.print();
    setTimeout(() => {
      document.body.removeAttribute('data-print-lab');
    }, 1000);
  }, [selectedLab]);

  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  const handleToggleTheme = useCallback(() => {
    setIsDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle('dark', next);
      document.documentElement.classList.toggle('light', !next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const handleToggleNotifications = useCallback(async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
    } else {
      const granted = await enableNotifs();
      if (granted) setNotifEnabled(true);
    }
  }, [notifEnabled, enableNotifs]);

  const handleLabOverviewSelect = useCallback((lab: string) => {
    setSelectedLab(lab);
    setTimeout(() => {
      const el = document.getElementById('timetable-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  return (
    <div className="app-shell min-h-screen max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-5 md:px-6 md:py-7">
      {/* Header */}
      <Header
        now={now}
        onPrint={handlePrint}
        onExportPDF={handleExportPDF}
        notificationsEnabled={notifEnabled}
        onToggleNotifications={handleToggleNotifications}
        termStatus={termStatus}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      {/* Current session alerts — one banner per running session */}
      {runningSessions.map((s) => (
        <div
          key={s.id}
          data-testid="current-session-banner"
          className="mb-2 no-print rounded-xl px-4 py-3 bg-red-500/15 border border-red-500/40 text-sm font-medium text-red-300"
        >
          {`🔴 جارٍ الآن: ${s.course} — ${s.lab} — ينتهي ${s.endTime}`}
        </div>
      ))}

      {/* Upcoming vacation alert */}
      {upcomingVacation && (
        <div
          data-testid="upcoming-vacation-banner"
          className="mb-3 no-print rounded-xl px-4 py-3 bg-amber-500/15 border border-amber-500/40 text-sm font-medium text-amber-300"
        >
          {`⚠️ تنبيه: إجازة قادمة — ${upcomingVacation.name} تبدأ في ${upcomingVacation.effectiveDate}`}
        </div>
      )}

      {/* Conflict detection banner (admin) */}
      {conflictMode && conflicts.length > 0 && (
        <div
          data-testid="conflict-banner"
          className="mb-3 no-print rounded-xl px-4 py-3 bg-red-500/15 border border-red-500/50 text-sm font-medium text-red-300 flex flex-col gap-1"
        >
          {conflicts.map((c, i) => (
            <span key={`${c.a.id}-${c.b.id}-${i}`}>
              {`⚠️ تعارض في المواعيد: ${c.lab} — ${c.a.course} و ${c.b.course} في نفس الوقت`}
            </span>
          ))}
        </div>
      )}

      {/* Error banner only */}
      {error && !loading && (
        <div className="mb-3 sm:mb-4 no-print">
          <div className="glass-card rounded-xl p-3 flex items-center gap-3 border-amber-500/30">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm text-amber-300">{t.loadError}</span>
          </div>
        </div>
      )}

      {/* Cache indicator */}
      {dataSource === 'cache' && !loading && (
        <div className="mb-3 sm:mb-4 no-print">
          <div className="glass-card rounded-lg p-2 flex items-center gap-2 border-blue-500/20">
            <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-xs text-slate-400">{t.fallbackData} (offline)</span>
          </div>
        </div>
      )}

      {/* Holiday Banner — collapsed by default */}
      <div className="mb-3 sm:mb-5">
        <HolidayBanner holidays={holidays} now={now} />
      </div>

      {/* Search */}
      {!kioskLab && !compareMode && (
      <>
      <div className="mb-3 sm:mb-4 no-print">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Lab, day, and instructor filters */}
      <div className="mb-4 sm:mb-5 no-print flex flex-col gap-2.5 sm:gap-3">
        <LabFilter labs={labs} selectedLab={selectedLab} onSelect={setSelectedLab} />
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <DayFilter
              selectedDay={selectedDay}
              onSelect={setSelectedDay}
              currentDay={currentDay}
            />
          </div>
          <label className="relative block w-full lg:w-72 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={instructorQuery}
              onChange={(event) => setInstructorQuery(event.target.value)}
              placeholder={t.instructor}
              aria-label={t.instructor}
              className="w-full glass-card rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/50 rtl:pl-3 rtl:pr-10"
            />
          </label>
        </div>
      </div>
      </>
      )}

      {/* Labs Overview */}
      {!kioskLab && !compareMode && selectedLab === null && selectedDay === 'all' && !searchQuery && !instructorQuery && !loading && (
        <div className="mb-4 sm:mb-5">
          <h2 className="text-xs sm:text-sm font-medium text-slate-400 mb-2 sm:mb-3 no-print">
            {t.availableLabs}
          </h2>
          <LabsOverview
            sessions={sessions}
            onSelectLab={handleLabOverviewSelect}
            currentDay={currentDay}
            currentMinutes={currentMinutes}
          />
        </div>
      )}

      {/* Timetable Grid or Skeleton */}
      {compareMode && (
        <div data-testid="compare-mode" className="mb-4 no-print flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DayFilter selectedDay={selectedDay} onSelect={setSelectedDay} currentDay={currentDay} />
            </div>
            <button
              type="button"
              aria-label="close comparison"
              data-testid="close-compare"
              onClick={() => setCompareMode(false)}
              className="glass-card rounded-xl p-2 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4 text-slate-300" />
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {([
              [compareLabA, setCompareLabA] as const,
              [compareLabB, setCompareLabB] as const,
            ]).map(([labValue, setLabValue], idx) => (
              <div key={idx} className="glass-card rounded-2xl p-3 flex flex-col gap-3">
                <LabFilter labs={labs} selectedLab={labValue} onSelect={setLabValue} />
                <TimetableGrid
                  sessions={sessions}
                  selectedDay={selectedDay}
                  selectedLab={labValue}
                  searchQuery=""
                  instructorQuery=""
                  currentDay={currentDay}
                  currentMinutes={currentMinutes}
                  holidays={holidays}
                  todayDate={now}
                  termStatus={termStatus}
                  conflictIds={conflictMode ? conflictIds : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="timetable-section" hidden={compareMode}>
        {loading && dataSource !== 'cache' ? (
          <SkeletonLoader />
        ) : (
          <TimetableGrid
            sessions={sessions}
            selectedDay={selectedDay}
            selectedLab={selectedLab}
            searchQuery={searchQuery}
            instructorQuery={instructorQuery}
            currentDay={currentDay}
            currentMinutes={currentMinutes}
            holidays={holidays}
            todayDate={now}
            termStatus={termStatus}
            conflictIds={conflictMode ? conflictIds : undefined}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="mt-6 sm:mt-10 pt-4 sm:pt-5 border-t border-slate-700/30 no-print">
        <p className="text-xs text-slate-500 text-center">
          {t.footer}
        </p>
      </footer>
    </div>
  );
}

export default App;

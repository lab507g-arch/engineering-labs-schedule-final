import { CalendarDays, AlertCircle, Archive } from 'lucide-react';
import type { LabSession, DayKey } from '@/types';
import { DAYS } from '@/types';
import SessionCard from './SessionCard';
import { isTimeInRange, timeToMinutes, type ProcessedHoliday } from '@/utils/dates';
import { useLang } from '@/context/LanguageContext';
import { formatDateStrForLang } from '@/i18n';
import type { TermStatus } from '@/utils/terms';

interface TimetableGridProps {
  sessions: LabSession[];
  selectedDay: DayKey | 'all';
  selectedLab: string | null;
  searchQuery: string;
  instructorQuery: string;
  currentDay: DayKey;
  currentMinutes: number;
  holidays: ProcessedHoliday[];
  todayDate: Date;
  termStatus: TermStatus | null;
  conflictIds?: Set<string>;
}

export default function TimetableGrid({
  sessions,
  selectedDay,
  selectedLab,
  searchQuery,
  instructorQuery,
  currentDay,
  currentMinutes,
  holidays,
  todayDate,
  termStatus,
  conflictIds,
}: TimetableGridProps) {
  const { t, lang } = useLang();
  const query = searchQuery.trim().toLowerCase();
  const instructor = instructorQuery.trim().toLowerCase();

  const filtered = sessions.filter((s) => {
    if (selectedDay !== 'all' && s.day !== selectedDay) return false;
    if (selectedLab !== null && s.lab !== selectedLab) return false;
    if (instructor && !s.instructor.toLowerCase().includes(instructor)) return false;
    if (query) {
      const haystack = [s.course, s.instructor, s.lab, s.group ?? '', s.note ?? '', s.startTime, s.endTime]
        .join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const daysToShow = selectedDay === 'all' ? DAYS : DAYS.filter((d) => d.key === selectedDay);

  const todayKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const todayHoliday = holidays.find((h) => h.effectiveDate === todayKey);

  // Term completed state
  if (termStatus?.isCompleted) {
    return (
      <div className="glass-card rounded-2xl p-8 md:p-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-700/30 border border-slate-600/40 mx-auto mb-4">
          <Archive className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-300 mb-2">{t.termCompleted}</h2>
        <p className="text-sm text-slate-500">{t.termArchived}</p>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>{t.termStart}: {formatDateStrForLang(termStatus.config.startDate, lang)}</span>
          <span>{t.termEnd}: {formatDateStrForLang(`${termStatus.endDate.getFullYear()}-${String(termStatus.endDate.getMonth()+1).padStart(2,'0')}-${String(termStatus.endDate.getDate()).padStart(2,'0')}`, lang)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-grid flex flex-col gap-4">
      {todayHoliday && selectedDay === 'all' && (
        <div className="glass-card rounded-xl p-4 border-amber-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            {t.todayHoliday}: <span className="font-bold">{todayHoliday.name}</span>
            {todayHoliday.rolledOver && (
              <span className="text-amber-400/70 text-xs mr-2 ml-2">
                ({t.rolledOverFrom} {formatDateStrForLang(todayHoliday.date, lang)})
              </span>
            )}
          </p>
        </div>
      )}

      {daysToShow.map((dayInfo) => {
        const daySessions = filtered
          .filter((s) => s.day === dayInfo.key)
          .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        const isToday = dayInfo.key === currentDay;

        const dayDate = new Date(todayDate);
        const diff = DAYS.findIndex((d) => d.key === dayInfo.key) - DAYS.findIndex((d) => d.key === currentDay);
        dayDate.setDate(dayDate.getDate() + diff);
        const dayKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
        const dayHoliday = holidays.find((h) => h.effectiveDate === dayKey);

        return (
          <div key={dayInfo.key} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl ${
                  isToday ? 'bg-green-500/15 border border-green-500/40' : 'glass-card'
                }`}
              >
                <CalendarDays className={`w-4 h-4 sm:w-5 sm:h-5 ${isToday ? 'text-green-400' : 'text-blue-400'}`} />
                <h2 className={`text-sm sm:text-base font-bold ${isToday ? 'text-green-300' : 'text-slate-200'}`}>
                  {t.days[dayInfo.key]}
                  {isToday && <span className="text-green-400 text-xs mr-2 ml-2">— {t.today}</span>}
                </h2>
              </div>
              <span className="text-xs text-slate-500">{daySessions.length} {t.lectures}</span>
              {dayHoliday && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {t.dayHoliday}: {dayHoliday.name}
                </span>
              )}
            </div>

            {daySessions.length > 0 ? (
              <div className="session-list flex flex-col gap-4">
                {daySessions.map((session) => {
                  const isCurrent = isToday && isTimeInRange(currentMinutes, session.startTime, session.endTime);
                  return (
                    <div key={session.id} data-lab={session.lab}>
                      <SessionCard
                        session={session}
                        isCurrent={isCurrent}
                        isToday={isToday}
                        currentMinutes={currentMinutes}
                        isConflicting={conflictIds?.has(session.id) ?? false}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-4 sm:p-6 text-center">
                <p className="text-sm text-slate-500">
                  {dayHoliday ? t.noLecturesHoliday : t.noLectures}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="glass-card rounded-xl p-8 sm:p-12 text-center">
          <p className="text-slate-400 text-base sm:text-lg">{t.noResults}</p>
          <p className="text-slate-500 text-sm mt-2">{t.noResultsHint}</p>
        </div>
      )}
    </div>
  );
}

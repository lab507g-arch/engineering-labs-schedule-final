import { useState } from 'react';
import { CalendarClock, ChevronDown, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import type { ProcessedHoliday } from '@/utils/dates';
import { daysBetween, parseDateLocal, toDateKey } from '@/utils/dates';
import { useLang } from '@/context/LanguageContext';
import { formatDateStrForLang } from '@/i18n';

interface HolidayBannerProps {
  holidays: ProcessedHoliday[];
  now: Date;
}

export default function HolidayBanner({ holidays, now }: HolidayBannerProps) {
  const { t, lang } = useLang();
  const [expanded, setExpanded] = useState<boolean>(false);
  const today = parseDateLocal(toDateKey(now));

  const upcoming = holidays
    .filter((h) => {
      const diff = daysBetween(parseDateLocal(h.effectiveDate), today);
      return diff >= 0 && diff <= 2;
    })
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));

  const allHolidays = [...holidays].sort((a, b) =>
    a.effectiveDate.localeCompare(b.effectiveDate)
  );

  const hasUpcoming = upcoming.length > 0;

  return (
    <div
      className={`glass-card rounded-xl sm:rounded-2xl overflow-hidden transition-all no-print ${
        hasUpcoming ? 'border-amber-500/40' : ''
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 cursor-pointer hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${
              hasUpcoming
                ? 'bg-amber-500/20 border border-amber-500/40'
                : 'bg-blue-500/15 border border-blue-500/30'
            }`}
          >
            <CalendarClock
              className={`w-4 h-4 sm:w-5 sm:h-5 ${hasUpcoming ? 'text-amber-400' : 'text-blue-400'}`}
            />
          </div>
          <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-200">
              {t.holidays}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500">
              {hasUpcoming
                ? lang === 'ar'
                  ? `${upcoming.length} ${t.holidaysUpcoming}`
                  : `${upcoming.length} ${t.holidaysUpcoming}`
                : t.holidaysNone}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 flex flex-col gap-3">
          {hasUpcoming && (
            <div className="flex flex-col gap-2">
              {upcoming.map((h) => {
                const diff = daysBetween(parseDateLocal(h.effectiveDate), today);
                const dayLabel = diff === 0 ? t.todayLabel : diff === 1 ? t.tomorrow : t.inDays.replace('{n}', String(diff));
                return (
                  <div
                    key={h.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-200">{h.name}</p>
                      <p className="text-xs text-amber-400/70 mt-0.5">
                        {dayLabel} — {formatDateStrForLang(h.effectiveDate, lang)}
                      </p>
                      {h.rolledOver && (
                        <p className="text-[11px] text-amber-500/60 mt-1 flex items-center gap-1">
                          <ArrowLeftRight className="w-3 h-3" />
                          {t.rolledOverFrom} {formatDateStrForLang(h.date, lang)} ({t.rolledFromMidweek})
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-700/50 pt-3">
            <p className="text-xs text-slate-500 mb-2 font-medium">{t.allHolidays}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {allHolidays.map((h) => {
                const diff = daysBetween(parseDateLocal(h.effectiveDate), today);
                const isPast = diff < 0;
                const isUpcoming = diff >= 0 && diff <= 2;
                return (
                  <div
                    key={h.id}
                    className={`flex flex-col gap-1 p-3 rounded-lg border transition-all ${
                      isUpcoming
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : isPast
                          ? 'bg-slate-800/30 border-slate-700/30 opacity-50'
                          : 'bg-slate-800/40 border-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-200 truncate">{h.name}</span>
                      {h.rolledOver && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 shrink-0 flex items-center gap-0.5"
                        >
                          <ArrowLeftRight className="w-2.5 h-2.5" />
                          {t.rolledOver}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatDateStrForLang(h.effectiveDate, lang)}
                    </span>
                    {h.description && (
                      <span className="text-[10px] text-slate-500">{h.description}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

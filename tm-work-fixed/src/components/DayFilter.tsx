import { DAYS } from '@/types';
import type { DayKey } from '@/types';
import { useLang } from '@/context/LanguageContext';

interface DayFilterProps {
  selectedDay: DayKey | 'all';
  onSelect: (day: DayKey | 'all') => void;
  currentDay: DayKey;
}

export default function DayFilter({ selectedDay, onSelect, currentDay }: DayFilterProps) {
  const { t } = useLang();
  return (
    <div className="no-print">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
        <DayPill
          active={selectedDay === 'all'}
          onClick={() => onSelect('all')}
          label={t.allDays}
        />
        {DAYS.map((day) => {
          const isToday = day.key === currentDay;
          return (
            <DayPill
              key={day.key}
              active={selectedDay === day.key}
              onClick={() => onSelect(day.key)}
              label={t.days[day.key]}
              isToday={isToday}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayPill({
  active,
  onClick,
  label,
  isToday,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  isToday?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
        active
          ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 glow-blue'
          : 'glass-card text-slate-400 hover:text-slate-200 hover:border-slate-500/50'
      }`}
    >
      {label}
      {isToday && (
        <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900 live-dot" />
      )}
    </button>
  );
}

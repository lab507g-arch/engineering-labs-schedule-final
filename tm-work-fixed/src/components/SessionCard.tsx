import { User, Clock, MapPin, Users, Info, Radio, Timer, CircleDot } from 'lucide-react';
import type { LabSession } from '@/types';
import { useLang } from '@/context/LanguageContext';
import { formatTime12hForLang } from '@/i18n';
import { getLabColor } from '@/utils/labColors';

interface SessionCardProps {
  session: LabSession;
  isCurrent: boolean;
  isToday: boolean;
  currentMinutes: number;
  isConflicting?: boolean;
}

function formatCountdown(minutes: number, lang: 'ar' | 'en'): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (lang === 'ar') {
    if (h > 0) return `${h}س ${m}د`;
    return `${m}د`;
  }
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SessionCard({ session, isCurrent, isToday, currentMinutes, isConflicting = false }: SessionCardProps) {
  const { t, lang } = useLang();
  const color = getLabColor(session.lab);

  const startMin = parseMin(session.startTime);
  const endMin = parseMin(session.endTime);
  const remaining = endMin - currentMinutes;
  const untilStart = startMin - currentMinutes;
  const isStartingSoon = isToday && !isCurrent && untilStart >= 0 && untilStart <= 10;

  return (
    <div
      data-instructor={session.instructor}
      data-conflicting={isConflicting ? 'true' : undefined}
      className={`print-card glass-card rounded-xl border-r-[6px] p-4 md:p-5 transition-all min-h-[140px] ${
        isConflicting ? 'border-2 border-red-500' : isCurrent ? 'pulse-glow border-green-500/50' : 'glass-card-hover'
      }`}
      style={{ borderRightColor: color }}
    >
      <div className="flex flex-col gap-2.5 pr-2">
        {(isCurrent || isStartingSoon) && (
          <div className={`self-start flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isCurrent ? 'bg-green-500/20 border-green-500/40' : 'bg-blue-500/20 border-blue-500/40'}`}>
            {isCurrent ? <Radio className="w-3.5 h-3.5 text-green-400 live-dot" /> : <Timer className="w-3.5 h-3.5 text-blue-400 countdown-pulse" />}
            <span className={`text-[10px] font-bold ${isCurrent ? 'text-green-400' : 'text-blue-400'}`}>
              {isCurrent ? t.now : t.startingSoon}
            </span>
          </div>
        )}
        {/* Time + countdown */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-sm font-semibold text-blue-300 tabular-nums" dir="ltr">
              {formatTime12hForLang(session.startTime, lang)} — {formatTime12hForLang(session.endTime, lang)}
            </span>
          </div>
          {isCurrent && remaining > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-green-400/80 shrink-0">
              <Timer className="w-3.5 h-3.5" />
              <span className="tabular-nums">{formatCountdown(remaining, lang)} {t.remaining}</span>
            </div>
          )}
          {!isCurrent && isToday && untilStart > 0 && untilStart <= 10 && (
            <div className="flex items-center gap-1 text-[11px] text-blue-400/80 shrink-0">
              <Timer className="w-3.5 h-3.5 countdown-pulse" />
              <span className="tabular-nums">
                {lang === 'ar' ? `⏱ تبدأ بعد ${untilStart} دقيقة` : `⏱ starts in ${untilStart}m`}
              </span>
            </div>
          )}
        </div>

        {/* Course */}
        <h3
          className={`text-base md:text-lg font-bold leading-tight ${
            isCurrent ? 'text-green-300' : 'text-white'
          }`}
        >
          {session.course}
        </h3>

        {/* Lab + status badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-sm text-cyan-300 font-medium truncate">{session.lab}</span>
          </div>
          {isCurrent ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full shrink-0">
              <CircleDot className="w-3 h-3 live-dot" />
              {t.busy}
            </span>
          ) : isToday && !isStartingSoon ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full shrink-0">
              <CircleDot className="w-3 h-3" />
              {t.vacant}
            </span>
          ) : null}
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm text-slate-300">{session.instructor}</span>
        </div>

        {/* Group */}
        {session.group && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-400">{session.group}</span>
          </div>
        )}

        {/* Note */}
        {session.note && (
          <div className="flex items-start gap-2 mt-1">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-xs text-amber-300/80">{session.note}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function parseMin(time: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return NaN;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

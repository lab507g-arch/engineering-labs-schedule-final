import { Clock, Printer, FileDown, Bell, BellOff, Settings2 } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';
import { formatDateForLang } from '@/i18n';
import type { TermStatus } from '@/utils/terms';

interface HeaderProps {
  now: Date;
  onPrint: () => void;
  onExportPDF: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  termStatus: TermStatus | null;
  isDark: boolean;
  onToggleTheme: () => void;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function Header({
  now,
  onPrint,
  onExportPDF,
  notificationsEnabled,
  onToggleNotifications,
  termStatus,
  isDark,
  onToggleTheme,
}: HeaderProps) {
  const { t, lang, toggleLang } = useLang();
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateStr = formatDateForLang(now, lang);

  return (
    <header className="glass-card rounded-2xl px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5 mb-3 md:mb-5 no-print">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Title section */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Animated gear logo */}
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 shrink-0 overflow-hidden">
            <Settings2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-400 gear-spin" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white text-glow leading-tight truncate">
              {t.title}
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-400 mt-0.5 truncate">
              {t.subtitle}
              {termStatus && (
                <span className="text-blue-400/70 mr-1 ml-1">
                  {' · '}
                  {t.term}: {termStatus.currentWeek}/{termStatus.config.weeks}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-stretch sm:self-auto">
          {/* Live Clock */}
          <div className="glass-card rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 flex items-center gap-2 sm:gap-2.5 flex-1 sm:flex-none min-w-0">
            <div className="relative shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full live-dot" />
            </div>
            <div className="flex flex-col items-end min-w-0">
              <div className="text-sm sm:text-base md:text-lg font-bold text-white tabular-nums tracking-wider" dir="ltr" suppressHydrationWarning>
                {timeStr}
              </div>
              <div className="text-[8px] sm:text-[10px] text-slate-500 truncate hidden sm:block">{dateStr}</div>
            </div>
          </div>

          {/* Notification toggle */}
          <button
            onClick={onToggleTheme}
            className="glass-card rounded-lg sm:rounded-xl p-2 sm:p-2.5 cursor-pointer hover:border-blue-500/40 transition-all shrink-0"
            title={isDark ? 'Light mode' : 'Dark mode'}
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
          >
            <span className="block text-base leading-4" aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
          </button>

          {/* Notification toggle */}
          <button
            onClick={onToggleNotifications}
            className="glass-card rounded-lg sm:rounded-xl p-2 sm:p-2.5 cursor-pointer hover:border-blue-500/40 transition-all shrink-0"
            title={notificationsEnabled ? t.notificationsEnabled : t.enableNotifications}
          >
            {notificationsEnabled ? (
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            ) : (
              <BellOff className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            )}
          </button>

          {/* Print button */}
          <button
            onClick={onPrint}
            className="glass-card rounded-lg sm:rounded-xl p-2 sm:p-2.5 cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/10 transition-all group shrink-0"
            title={t.print}
          >
            <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* Export PDF button */}
          <button
            onClick={onExportPDF}
            className="glass-card rounded-lg sm:rounded-xl p-2 sm:p-2.5 cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/10 transition-all group shrink-0"
            title={t.exportPDF}
          >
            <FileDown className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="glass-card rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/10 transition-all shrink-0 flex items-center gap-1"
            title={t.language}
          >
            <span className="text-xs sm:text-sm font-bold text-blue-400">{lang === 'ar' ? 'EN' : 'AR'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

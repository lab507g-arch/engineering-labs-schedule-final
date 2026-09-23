import { Search, X } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const { t } = useLang();
  return (
    <div className="relative no-print">
      <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${useLang().isRTL ? 'right-3.5' : 'left-3.5'}`}>
        <Search className="w-5 h-5 text-slate-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.search}
        className={`w-full glass-card rounded-xl py-3 sm:py-3.5 text-sm md:text-base text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:glow-blue transition-all ${useLang().isRTL ? 'pr-11 pl-11' : 'pl-11 pr-11'}`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer ${useLang().isRTL ? 'left-3.5' : 'right-3.5'}`}
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

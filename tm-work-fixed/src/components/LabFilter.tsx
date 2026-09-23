import { LayoutGrid } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';

interface LabFilterProps {
  labs: string[];
  selectedLab: string | null;
  onSelect: (lab: string | null) => void;
}

export default function LabFilter({ labs, selectedLab, onSelect }: LabFilterProps) {
  const { t } = useLang();
  return (
    <div className="no-print">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
        <LabPill
          active={selectedLab === null}
          onClick={() => onSelect(null)}
          label={t.showAll}
          icon={<LayoutGrid className="w-4 h-4" />}
        />
        {labs.map((lab) => (
          <LabPill
            key={lab}
            active={selectedLab === lab}
            onClick={() => onSelect(lab)}
            label={lab}
          />
        ))}
      </div>
    </div>
  );
}

function LabPill({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
        active
          ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 glow-blue'
          : 'glass-card text-slate-400 hover:text-slate-200 hover:border-slate-500/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

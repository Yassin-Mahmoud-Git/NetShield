import { AppMode } from '../data/curriculum';

interface TopBarProps {
  activeMode: AppMode;
  tourActive: boolean;
  onSelectMode: (mode: AppMode) => void;
  onToggleTour: () => void;
  onResetOverview: () => void;
}

const NAV_ITEMS: { id: AppMode; label: string }[] = [
  { id: 'network', label: 'Network Basics' },
  { id: 'osi', label: 'OSI Stack' },
  { id: 'security', label: 'Cyber Defense' },
  { id: 'threats', label: 'Attack Lab' },
  { id: 'crypto', label: 'Cyber Guide' },
];

export function TopBar({
  activeMode,
  tourActive,
  onSelectMode,
  onToggleTour,
  onResetOverview,
}: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0b111e]/92 border-b border-slate-800/80">
      {/* Zone 1: Single-line Brand Wordmark */}
      <button
        type="button"
        onClick={onResetOverview}
        className="text-left font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-slate-50 hover:text-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 rounded"
      >
        NetShield 3D
      </button>

      {/* Zone 2: 5 clean single-line navigation links */}
      <nav aria-label="Primary sections" className="hidden md:flex items-center gap-6">
        {NAV_ITEMS.map((item) => {
          const isActive = !tourActive && activeMode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMode(item.id)}
              className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 rounded ${
                isActive ? 'text-sky-300' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-sky-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onToggleTour}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 ${
            tourActive
              ? 'bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700'
              : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
          }`}
        >
          {tourActive ? 'Exit Guided Tour' : 'Start Guided Tour'}
        </button>
      </div>
    </header>
  );
}

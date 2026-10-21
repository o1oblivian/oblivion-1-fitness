import { Inbox, Layers, LayoutGrid, Radio, Users, Wallet } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import type { CoachFloorTab } from '../../store/useCoachViewStore';

const TABS: { id: CoachFloorTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'films', label: 'Films', icon: LayoutGrid },
  { id: 'programs', label: 'Programs', icon: Layers },
  { id: 'floor', label: 'Clients', icon: Users },
  { id: 'directives', label: 'Notes', icon: Radio },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
];

interface FloorTabBarProps {
  tab: CoachFloorTab;
  /** The Films tab only shows once the coach has films, or loading them failed. */
  showFilms: boolean;
  onSelect: (tab: CoachFloorTab) => void;
}

/** The coach console's tab row. */
export function FloorTabBar({ tab, showFilms, onSelect }: FloorTabBarProps) {
  const visibleTabs = TABS.filter((item) => item.id !== 'films' || showFilms);
  return (
    <div
      className="flex justify-around border-b border-white/[0.07]"
      role="tablist"
      aria-label="Coach console"
    >
      {visibleTabs.map((item) => {
        const Icon = item.icon;
        const on = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onSelect(item.id);
            }}
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 border-b-2 active:scale-[0.98] ${on ? 'border-o1-crimson text-o1-text' : 'border-transparent text-o1-muted'}`}
          >
            <Icon size={18} />
            <span className="text-o1-label font-semibold">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

import React, { useState } from 'react';
import { X, Dumbbell, UtensilsCrossed, MapPin, Users, Video } from 'lucide-react';

const DISMISSED_KEY = 'o1fc_explore_rail_dismissed';

interface ExploreItem {
  icon: React.ElementType;
  label: string;
  action: string;
}

const EXPLORE_ITEMS: ExploreItem[] = [
  {
    icon: Dumbbell,
    label: 'Log session',
    action: 'workout',
  },
  {
    icon: UtensilsCrossed,
    label: 'Track fuel',
    action: 'fuel',
  },
  {
    icon: MapPin,
    label: 'Find a gym',
    action: 'gym',
  },
  {
    icon: Users,
    label: 'Match partner',
    action: 'buddy',
  },
  {
    icon: Video,
    label: 'Browse coaches',
    action: 'coaches',
  },
];

interface WelcomeCrewCardsProps {
  variant: 'athlete' | 'coach';
  onAction?: (action: string) => void;
}

export const WelcomeCrewCards: React.FC<WelcomeCrewCardsProps> = ({ onAction }) => {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {}
  };

  return (
    <div className="relative rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#121214] overflow-hidden text-zinc-900 dark:text-white shadow-sm dark:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div>
          <h4 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-wider">Quick Navigation</h4>
          <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">Jump into any module</p>
        </div>
        <button
          onClick={handleDismiss}
          className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Dismiss explore rail"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Horizontal scroll rail */}
      <div className="px-3 pb-3 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {EXPLORE_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.action}
                onClick={() => onAction?.(item.action)}
                className="flex flex-col items-center gap-1.5 w-[80px] py-2.5 px-2 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 active:scale-[0.97] transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-center justify-center text-zinc-700 dark:text-zinc-200 group-hover:scale-110 group-hover:text-red-500 transition-all">
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-zinc-900 dark:text-white text-center leading-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

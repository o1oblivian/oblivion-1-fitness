import React from 'react';
import { Dumbbell, Utensils, Users, FileText } from 'lucide-react';
import { tactileEngine } from '../services/tactileEngine';

export type TabMode = 'tracker' | 'fuel' | 'coach' | 'client' | 'workout';

/** Turns a tab name from a link, a hash or an event into a real tab, or null when there is no such tab. */
export function toTabMode(name: unknown): TabMode | null {
  const key = String(name ?? '').toLowerCase();
  if (key === 'log') return 'client';
  if (key === 'dashboard') return 'tracker';
  return (
    (['tracker', 'fuel', 'coach', 'client', 'workout'] as const).find((tab) => tab === key) ?? null
  );
}
export interface NavigationDockProps {
  currentMode: TabMode;
  onSelectTab: (mode: TabMode) => void;
}

interface TabConfig {
  id: TabMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: 'tracker', label: 'Workout', icon: Dumbbell },
  { id: 'fuel', label: 'Fuel', icon: Utensils },
  { id: 'coach', label: 'Coach', icon: Users },
  { id: 'client', label: 'Log', icon: FileText },
];

export const NavigationDock: React.FC<NavigationDockProps> = ({ currentMode, onSelectTab }) => {
  return (
    <nav
      id="navigation-dock-floating"
      role="navigation"
      aria-label="Main Navigation"
      style={{
        bottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
      }}
      className="fixed inset-x-0 mx-auto w-[calc(100%-1.5rem)] max-w-[440px] z-40 h-[48px] rounded-full border bg-black backdrop-blur-xl border-white/[0.07] shadow-[0_8px_28px_rgba(0,0,0,0.6)] flex items-center justify-between select-none transition-colors"
    >
      <div className="w-full flex items-center justify-around h-full">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            currentMode === tab.id || (tab.id === 'tracker' && currentMode === 'workout');

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              data-dock-tab={tab.id}
              type="button"
              onClick={() => {
                if (
                  currentMode !== tab.id &&
                  !(tab.id === 'tracker' && currentMode === 'workout')
                ) {
                  tactileEngine.triggerSelectionBuzz();
                  onSelectTab(tab.id);
                }
              }}
              className="flex-1 h-full py-0.5 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform duration-100 select-none group"
            >
              {/* Tab Icon */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-[18px] h-[18px] transition-colors ${
                    isActive
                      ? 'text-o1-crimson stroke-[2.4]'
                      : 'text-o1-muted stroke-[1.9] group-hover:text-o1-bone'
                  }`}
                />
              </div>

              {/* Tab Label */}
              <span
                className={`text-o1-label mt-0.5 tracking-tight leading-none select-none transition-colors ${
                  isActive
                    ? 'text-o1-crimson font-bold'
                    : 'text-o1-muted font-medium group-hover:text-o1-bone'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

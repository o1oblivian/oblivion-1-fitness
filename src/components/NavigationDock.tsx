import React from 'react';
import { Dumbbell, Utensils, Heart, Users, FileText } from 'lucide-react';
import { tactileEngine } from '../services/tactileEngine';
import { useBuddyMessageStore } from '../stores/useBuddyMessageStore';

export type TabMode = 'tracker' | 'fuel' | 'radar' | 'coach' | 'client' | 'workout';
export type NavTab = TabMode;

export interface NavigationDockProps {
  currentMode: TabMode;
  onSelectTab: (mode: TabMode) => void;
}

export type BottomNavigationProps = NavigationDockProps;

interface TabConfig {
  id: TabMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isBuddy?: boolean;
}

const TABS: TabConfig[] = [
  { id: 'tracker', label: 'Workout', icon: Dumbbell },
  { id: 'fuel', label: 'Fuel', icon: Utensils },
  { id: 'radar', label: 'Buddy', icon: Heart, isBuddy: true },
  { id: 'coach', label: 'Coach', icon: Users },
  { id: 'client', label: 'Log', icon: FileText },
];

export const NavigationDock: React.FC<NavigationDockProps> = ({ currentMode, onSelectTab }) => {
  const buddyUnreadCount = useBuddyMessageStore((s) => s.unreadCount);

  return (
    <nav
      id="navigation-dock-floating"
      role="navigation"
      aria-label="Main Navigation"
      style={{
        bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
      }}
      className="fixed inset-x-0 mx-auto w-[calc(100%-1.5rem)] max-w-[440px] z-40 h-[48px] rounded-full border bg-black backdrop-blur-xl border-white/[0.07] shadow-[0_8px_28px_rgba(0,0,0,0.6)] flex items-center justify-between select-none transition-colors"
    >
      <div className="w-full flex items-center justify-around h-full">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentMode === tab.id || (tab.id === 'tracker' && currentMode === 'workout');
          const isBuddy = tab.isBuddy;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              data-dock-tab={tab.id}
              type="button"
              onClick={() => {
                if (currentMode !== tab.id && !(tab.id === 'tracker' && currentMode === 'workout')) {
                  tactileEngine.triggerSelectionBuzz();
                  onSelectTab(tab.id);
                }
              }}
              className="flex-1 h-full py-0.5 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform duration-100 select-none group"
            >
              {/* Tab Icon */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`${isBuddy ? 'w-[21px] h-[21px]' : 'w-[18px] h-[18px]'} transition-colors ${
                    isBuddy
                      ? isActive
                        ? 'text-o1-crimson fill-o1-crimson stroke-[2.2]'
                        : 'text-o1-crimson fill-o1-crimson opacity-90 stroke-[2]'
                      : isActive
                        ? 'text-o1-crimson stroke-[2.4]'
                        : 'text-neutral-400 stroke-[1.9] group-hover:text-neutral-100'
                  }`}
                />
                {isBuddy && buddyUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[13px] h-[13px] px-0.5 rounded-full bg-o1-crimson text-white text-[8.5px] font-bold font-mono flex items-center justify-center border border-white/[0.07]">
                    {buddyUnreadCount > 9 ? '9+' : buddyUnreadCount}
                  </span>
                )}
              </div>

              {/* Tab Label */}
              <span
                className={`text-[9.5px] mt-0.5 tracking-tight leading-none select-none transition-colors ${
                  isActive
                    ? 'text-o1-crimson font-bold'
                    : 'text-neutral-400 font-medium group-hover:text-neutral-100'
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

export const BottomNavigation = NavigationDock;
export default NavigationDock;

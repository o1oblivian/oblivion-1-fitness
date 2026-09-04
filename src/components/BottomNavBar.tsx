import React from 'react';
import { Dumbbell, Utensils, Heart, Users, FileText } from 'lucide-react';
import { AppMode } from '../types';

interface BottomNavBarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenProfile?: () => void;
  currentUserEmail?: string;
  userName?: string;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  onOpenExportHelp?: () => void;
  theme?: 'dark' | 'light' | 'system';
  onToggleTheme?: () => void;
  profileImage?: string;
  onUpdateProfileImage?: (url: string) => void;
  themeAccent?: string;
  onUpdateThemeAccent?: (hex: string) => void;
  onExportData?: () => void;
  onOpenGymNetwork?: () => void;
}

interface NavItem {
  mode: AppMode;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    mode: 'tracker',
    label: 'Workout',
    icon: (active) => (
      <Dumbbell className={`w-3.5 h-3.5 transition-transform duration-150 ${active ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
    ),
  },
  {
    mode: 'fuel',
    label: 'Fuel',
    icon: (active) => (
      <Utensils className={`w-3.5 h-3.5 transition-transform duration-150 ${active ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
    ),
  },
  {
    mode: 'buddy',
    label: 'Buddy',
    icon: (active) => (
      <Heart className={`w-3.5 h-3.5 fill-[#C4121A] dark:fill-[#D91F28] text-[#C4121A] dark:text-[#D91F28] transition-transform duration-150 ${active ? 'scale-110' : 'opacity-85 hover:scale-105'}`} />
    ),
  },
  {
    mode: 'coach',
    label: 'Coach',
    icon: (active) => (
      <Users className={`w-3.5 h-3.5 transition-transform duration-150 ${active ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
    ),
  },
  {
    mode: 'client',
    label: 'Log',
    icon: (active) => (
      <FileText className={`w-3.5 h-3.5 transition-transform duration-150 ${active ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
    ),
  },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentMode,
  onModeChange,
  onOpenGymNetwork,
}) => {
  return (
    <nav
      className="fixed left-0 right-0 z-50 mx-auto w-[88%] max-w-xs select-none pointer-events-auto transition-all"
      style={{
        bottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))',
      }}
    >
      <div className="relative rounded-full bg-white dark:bg-[#121214] border border-black/10 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="flex items-center justify-between px-1.5 py-0.5 relative z-10">
          {NAV_ITEMS.map((item) => {
            const isActive = currentMode === item.mode;

            return (
              <button
                key={item.mode}
                type="button"
                onClick={() => {
                  if (item.mode === 'buddy' && onOpenGymNetwork) {
                    onOpenGymNetwork();
                  } else {
                    onModeChange(item.mode);
                  }
                }}
                className={`relative flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-full transition-all duration-150 cursor-pointer group ${
                  isActive
                    ? item.mode === 'buddy'
                      ? 'text-[#C4121A] dark:text-[#D91F28] font-bold'
                      : 'text-zinc-950 dark:text-white font-bold'
                    : item.mode === 'buddy'
                      ? 'text-[#C4121A]/80 dark:text-[#D91F28]/80 hover:text-[#C4121A] dark:hover:text-[#D91F28] font-medium'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium'
                }`}
                title={item.label}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {item.icon(isActive)}
                </span>

                <span className="relative z-10 text-[9px] leading-tight mt-0.5 tracking-tight font-medium">
                  {item.label}
                </span>

                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C4121A] dark:bg-[#D91F28]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

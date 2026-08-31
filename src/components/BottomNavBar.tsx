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
      <Dumbbell className={`w-4.5 h-4.5 transition-transform duration-150 ${active ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
    ),
  },
  {
    mode: 'fuel',
    label: 'Fuel',
    icon: (active) => (
      <Utensils className={`w-4.5 h-4.5 transition-transform duration-150 ${active ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
    ),
  },
  {
    mode: 'buddy',
    label: 'Buddy',
    icon: (active) => (
      <Heart className={`w-4.5 h-4.5 fill-[#DC2626] text-[#DC2626] transition-transform duration-150 ${active ? 'scale-110 drop-shadow-[0_0_6px_rgba(225,29,72,0.4)]' : 'opacity-90 hover:scale-105'}`} />
    ),
  },
  {
    mode: 'coach',
    label: 'Coach',
    icon: (active) => (
      <Users className={`w-4.5 h-4.5 transition-transform duration-150 ${active ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
    ),
  },
  {
    mode: 'client',
    label: 'Log',
    icon: (active) => (
      <FileText className={`w-4.5 h-4.5 transition-transform duration-150 ${active ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
    ),
  },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentMode,
  onModeChange,
  onOpenGymNetwork,
}) => {
  return (
    <nav className="fixed bottom-1 left-0 right-0 z-50 mx-auto w-[92%] max-w-sm select-none pointer-events-auto">
      <div className="relative rounded-full backdrop-blur-2xl backdrop-saturate-150 bg-white/25 dark:bg-black/25 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.55)] overflow-hidden">
        {/* Specular glass highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between px-1.5 py-1 relative z-10">
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
                className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-full transition-all duration-150 cursor-pointer group ${
                  isActive
                    ? item.mode === 'buddy'
                      ? 'text-[#DC2626] font-bold'
                      : 'text-zinc-950 dark:text-white font-bold'
                    : item.mode === 'buddy'
                      ? 'text-[#DC2626]/80 hover:text-[#DC2626] font-medium'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium'
                }`}
                title={item.label}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {item.icon(isActive)}
                </span>

                <span className="relative z-10 text-[10px] leading-tight mt-0.5 tracking-tight">
                  {item.label}
                </span>

                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#DC2626] shadow-[0_0_6px_rgba(220,38,38,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

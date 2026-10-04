import React, { useState } from 'react';
import { Sun, Moon, Images, ChevronRight } from 'lucide-react';
import { ThemeMode } from '../../stores/useThemeStore';
import { InputStyleType } from '../../hooks/useAthleteSettings';
import { tactileEngine } from '../../services/tactileEngine';
import { useWallpaperStore } from '../../stores/useWallpaperStore';
import { WallpaperSelectorModal } from './WallpaperSelectorModal';

interface AppearanceSectionProps {
  theme: ThemeMode;
  inputStyle: InputStyleType;
  onSetTheme: (theme: ThemeMode) => void;
  onSetInputStyle: (style: InputStyleType) => void;
  onShowToast?: (msg: string) => void;
}

export const SettingsAppearanceSection: React.FC<AppearanceSectionProps> = ({
  theme,
  inputStyle,
  onSetTheme,
  onSetInputStyle,
  onShowToast,
}) => {
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const { getActiveWallpaper, isEnabled, isPaused, intervalSeconds } = useWallpaperStore();
  const currentWallpaper = getActiveWallpaper();

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark OLED', icon: Moon },
  ];

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-500 dark:text-neutral-400 font-bold uppercase px-1">
        Appearance &amp; Controls
      </h3>

      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 shadow-sm p-4 space-y-4 text-neutral-900 dark:text-white transition-colors">
        {/* Dual-Theme Atmosphere Selector: Light vs Dark OLED */}
        <div>
          <div className="mb-2">
            <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-100 block">
              Display Atmosphere
            </span>
            <span className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400 block">
              Choose Light Mode or Dark OLED Tactical mode
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-black/5 dark:border-white/10">
            {themeOptions.map(({ mode, label, icon: Icon }) => {
              const isActive = theme === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    onSetTheme(mode);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-tactical capitalize flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#C4121A] text-white font-bold shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Style Segmented Control */}
        <div className="pt-3 border-t border-black/5 dark:border-white/10">
          <div className="mb-2">
            <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-100 block">
              Input Style
            </span>
            <span className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400 block">
              Workout entry dial or keypad
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-black/5 dark:border-white/10">
            {(['Rotary Dial', 'Keypad'] as InputStyleType[]).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onSetInputStyle(style);
                }}
                className={`py-1.5 rounded-lg text-xs font-tactical transition-all cursor-pointer ${
                  inputStyle === style
                    ? 'bg-[#C4121A] text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Wallpaper Row: Clean row without small wallpaper preview screen */}
        <div className="pt-3 border-t border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-tactical font-semibold text-neutral-900 dark:text-neutral-100 block">
                Live Wallpapers
              </span>
              <span className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400 block truncate">
                {currentWallpaper?.title ? currentWallpaper.title : '100 Curated Visual Atmospheres'} •{' '}
                {isEnabled ? (isPaused ? 'Paused' : `${intervalSeconds}s Interval`) : 'Off'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setShowWallpaperModal(true);
              }}
              className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-[#C4121A] text-neutral-800 hover:text-white dark:bg-[#18181b] dark:text-neutral-200 dark:hover:bg-[#C4121A] dark:hover:text-white border border-black/10 dark:border-white/10 text-xs font-tactical font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <Images className="w-3.5 h-3.5" />
              <span>Change</span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>
          </div>
        </div>
      </div>

      {/* Wallpaper Selector & Interval Modal */}
      <WallpaperSelectorModal
        isOpen={showWallpaperModal}
        onClose={() => setShowWallpaperModal(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
export default SettingsAppearanceSection;

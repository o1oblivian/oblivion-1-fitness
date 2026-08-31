import React from 'react';
import { SectionHeader, SettingsGroup, SettingsRow } from './SettingsShared';

interface AppearanceSectionProps {
  themeMode: 'dark' | 'light' | 'system';
  onSelectThemeMode: (mode: 'dark' | 'light' | 'system') => void;
  inputMethod: 'dial' | 'numpad';
  onSelectInputMethod: (method: 'dial' | 'numpad') => void;
  onOpenWallpaperSettings?: () => void;
}

export function AppearanceSection({
  themeMode,
  onSelectThemeMode,
  inputMethod,
  onSelectInputMethod,
  onOpenWallpaperSettings,
}: AppearanceSectionProps) {
  return (
    <div>
      <SectionHeader title="Appearance & Controls" />
      <SettingsGroup>
        {/* Theme mode row */}
        <div className="min-h-[52px] px-3.5 py-1.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 block">Theme</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Select visual atmosphere</span>
          </div>

          <div className="h-[30px] flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => onSelectThemeMode('light')}
              className={`h-full px-2.5 rounded-full text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                themeMode === 'light'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => onSelectThemeMode('dark')}
              className={`h-full px-2.5 rounded-full text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => onSelectThemeMode('system')}
              className={`h-full px-2.5 rounded-full text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                themeMode === 'system'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-200'
              }`}
            >
              System
            </button>
          </div>
        </div>

        {/* Input method row */}
        <div className="min-h-[52px] px-3.5 py-1.5 flex items-center justify-between gap-3">
          <div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 block">Input Style</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Workout entry dial or keypad</span>
          </div>

          <div className="h-[30px] flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => onSelectInputMethod('dial')}
              className={`h-full px-3 rounded-full text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                inputMethod === 'dial'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Rotary Dial
            </button>
            <button
              type="button"
              onClick={() => onSelectInputMethod('numpad')}
              className={`h-full px-3 rounded-full text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                inputMethod === 'numpad'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Keypad
            </button>
          </div>
        </div>

        {onOpenWallpaperSettings && (
          <SettingsRow
            label="Atmosphere & Wallpapers"
            sublabel="Customize ambient background aesthetics"
            onClick={onOpenWallpaperSettings}
          />
        )}
      </SettingsGroup>
    </div>
  );
}

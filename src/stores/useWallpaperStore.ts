import { create } from 'zustand';
import { FRESH_100_WALLPAPERS, FreshWallpaperItem } from '../data/freshWallpaperCatalog';
import { tactileEngine } from '../services/tactileEngine';

export type WallpaperInterval = 10 | 15 | 30;

interface WallpaperStoreState {
  wallpapers: FreshWallpaperItem[];
  activeWallpaperIndex: number;
  intervalSeconds: WallpaperInterval;
  isPaused: boolean;
  isEnabled: boolean; // Battery Saver Mode: disable wallpaper entirely

  // Actions
  setWallpaperIndex: (index: number) => void;
  setWallpaperById: (id: string) => void;
  nextWallpaper: () => void;
  prevWallpaper: () => void;
  setIntervalSeconds: (sec: WallpaperInterval) => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  toggleEnabled: () => void;
  setEnabled: (enabled: boolean) => void;
  getActiveWallpaper: () => FreshWallpaperItem;
}

const STORAGE_KEY = 'o1fc_wallpaper_settings_v2';

const loadSavedSettings = (): { index: number; interval: WallpaperInterval; isPaused: boolean; isEnabled: boolean } => {
  if (typeof window === 'undefined') {
    return { index: 0, interval: 15, isPaused: false, isEnabled: true };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const interval = [10, 15, 30].includes(parsed.interval) ? parsed.interval : 15;
      const index = typeof parsed.index === 'number' && parsed.index >= 0 && parsed.index < FRESH_100_WALLPAPERS.length
        ? parsed.index
        : 0;
      const isPaused = Boolean(parsed.isPaused);
      const isEnabled = parsed.isEnabled !== undefined ? Boolean(parsed.isEnabled) : true;
      return { index, interval, isPaused, isEnabled };
    }
  } catch {
    // fallback
  }
  return { index: 0, interval: 15, isPaused: false, isEnabled: true };
};

const saveSettings = (index: number, interval: WallpaperInterval, isPaused: boolean, isEnabled: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ index, interval, isPaused, isEnabled })
    );
  } catch {
    // ignore
  }
};

const initial = loadSavedSettings();

export const useWallpaperStore = create<WallpaperStoreState>((set, get) => ({
  wallpapers: FRESH_100_WALLPAPERS,
  activeWallpaperIndex: initial.index,
  intervalSeconds: initial.interval,
  isPaused: initial.isPaused,
  isEnabled: initial.isEnabled,

  setWallpaperIndex: (index: number) => {
    const safeIdx = (index + FRESH_100_WALLPAPERS.length) % FRESH_100_WALLPAPERS.length;
    set({ activeWallpaperIndex: safeIdx });
    saveSettings(safeIdx, get().intervalSeconds, get().isPaused, get().isEnabled);
  },

  setWallpaperById: (id: string) => {
    const foundIdx = FRESH_100_WALLPAPERS.findIndex((w) => w.id === id);
    if (foundIdx !== -1) {
      set({ activeWallpaperIndex: foundIdx });
      saveSettings(foundIdx, get().intervalSeconds, get().isPaused, get().isEnabled);
    }
  },

  nextWallpaper: () => {
    const nextIdx = (get().activeWallpaperIndex + 1) % FRESH_100_WALLPAPERS.length;
    set({ activeWallpaperIndex: nextIdx });
    saveSettings(nextIdx, get().intervalSeconds, get().isPaused, get().isEnabled);
  },

  prevWallpaper: () => {
    const prevIdx =
      (get().activeWallpaperIndex - 1 + FRESH_100_WALLPAPERS.length) % FRESH_100_WALLPAPERS.length;
    set({ activeWallpaperIndex: prevIdx });
    saveSettings(prevIdx, get().intervalSeconds, get().isPaused, get().isEnabled);
  },

  setIntervalSeconds: (sec: WallpaperInterval) => {
    tactileEngine.triggerSelectionBuzz();
    set({ intervalSeconds: sec });
    saveSettings(get().activeWallpaperIndex, sec, get().isPaused, get().isEnabled);
  },

  togglePause: () => {
    tactileEngine.triggerSelectionBuzz();
    const nextPaused = !get().isPaused;
    set({ isPaused: nextPaused });
    saveSettings(get().activeWallpaperIndex, get().intervalSeconds, nextPaused, get().isEnabled);
  },

  setPaused: (paused: boolean) => {
    tactileEngine.triggerSelectionBuzz();
    set({ isPaused: paused });
    saveSettings(get().activeWallpaperIndex, get().intervalSeconds, paused, get().isEnabled);
  },

  toggleEnabled: () => {
    tactileEngine.triggerSelectionBuzz();
    const nextEnabled = !get().isEnabled;
    set({ isEnabled: nextEnabled });
    saveSettings(get().activeWallpaperIndex, get().intervalSeconds, get().isPaused, nextEnabled);
  },

  setEnabled: (enabled: boolean) => {
    tactileEngine.triggerSelectionBuzz();
    set({ isEnabled: enabled });
    saveSettings(get().activeWallpaperIndex, get().intervalSeconds, get().isPaused, enabled);
  },

  getActiveWallpaper: () => {
    const idx = get().activeWallpaperIndex;
    return FRESH_100_WALLPAPERS[idx] || FRESH_100_WALLPAPERS[0];
  },
}));

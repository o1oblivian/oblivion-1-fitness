import { create } from 'zustand';
import { tactileEngine } from '../services/tactileEngine';
import {
  fetchLiveWallpapers,
  LiveWallpaper,
  WallpaperTopic,
  migrateWallpaperTopic,
} from '../services/liveWallpaperService';

export type WallpaperInterval = 10 | 15 | 30;

const SETTINGS_KEY = 'o1fc_wallpaper_settings_v5';
const LEGACY_SETTINGS_KEY = 'o1fc_wallpaper_settings_v4';
const CUSTOM_KEY = 'o1fc_wallpaper_custom_v1';
const BROKEN_KEY = 'o1fc_wallpaper_broken_v1';

export interface ActiveWallpaper {
  url: string;
  title: string;
  thumbUrl?: string;
  isCustom: boolean;
}

interface WallpaperStoreState {
  pool: LiveWallpaper[];
  activeIndex: number;
  topic: WallpaperTopic;
  intervalSeconds: WallpaperInterval;
  isPaused: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  sourceLabel: string;
  customUrl: string | null;
  /** URLs that failed to load this session; they are purged from the rotation. */
  brokenUrls: string[];
  reportBroken: (url: string) => void;
  setCustomWallpaper: (dataUrl: string) => boolean;
  clearCustomWallpaper: () => void;
  setTopic: (topic: WallpaperTopic) => void;
  setIntervalSeconds: (sec: WallpaperInterval) => void;
  togglePause: () => void;
  setEnabled: (enabled: boolean) => void;
  nextWallpaper: () => void;
  prevWallpaper: () => void;
  selectWallpaper: (index: number) => void;
  refreshLive: (force?: boolean) => Promise<void>;
  getActiveWallpaper: () => ActiveWallpaper | null;
}

interface SavedSettings {
  topic?: unknown;
  interval?: WallpaperInterval;
  isPaused?: boolean;
  isEnabled?: boolean;
}

interface LoadedSettings {
  topic: WallpaperTopic;
  interval: WallpaperInterval;
  isPaused: boolean;
  isEnabled: boolean;
}

const loadSettings = (): LoadedSettings => {
  const fallback: LoadedSettings = {
    topic: 'hyrox',
    interval: 15,
    isPaused: false,
    isEnabled: true,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY) ?? localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as SavedSettings;
    const interval: WallpaperInterval = [10, 15, 30].includes(parsed.interval as number)
      ? (parsed.interval as WallpaperInterval)
      : 15;
    return {
      topic: migrateWallpaperTopic(parsed.topic),
      interval,
      isPaused: Boolean(parsed.isPaused),
      isEnabled: parsed.isEnabled !== undefined ? Boolean(parsed.isEnabled) : true,
    };
  } catch {
    return fallback;
  }
};

const loadCustom = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (typeof raw === 'string' && raw.startsWith('data:image/')) return raw;
  } catch {
    /* ignore */
  }
  return null;
};

const loadBroken = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(BROKEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
};

const persistBroken = (urls: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(BROKEN_KEY, JSON.stringify(urls));
  } catch {
    /* ignore */
  }
};

const persistSettings = (s: Pick<WallpaperStoreState, 'topic' | 'intervalSeconds' | 'isPaused' | 'isEnabled'>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        topic: s.topic,
        interval: s.intervalSeconds,
        isPaused: s.isPaused,
        isEnabled: s.isEnabled,
      }),
    );
  } catch {
    /* ignore */
  }
};

const persistCustom = (dataUrl: string | null): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (dataUrl) localStorage.setItem(CUSTOM_KEY, dataUrl);
    else localStorage.removeItem(CUSTOM_KEY);
    return true;
  } catch {
    return false;
  }
};

const initial = loadSettings();

function slidesOf(state: { customUrl: string | null; pool: LiveWallpaper[] }): ActiveWallpaper[] {
  const live = state.pool.map((p) => ({
    url: p.url,
    title: p.title,
    thumbUrl: p.thumbUrl,
    isCustom: false,
  }));
  if (state.customUrl) {
    return [{ url: state.customUrl, title: 'Your wallpaper', isCustom: true }, ...live];
  }
  return live;
}

export const useWallpaperStore = create<WallpaperStoreState>((set, get) => ({
  pool: [],
  activeIndex: 0,
  topic: initial.topic,
  intervalSeconds: initial.interval,
  isPaused: initial.isPaused,
  isEnabled: initial.isEnabled,
  isLoading: false,
  sourceLabel: '',
  customUrl: loadCustom(),
  brokenUrls: loadBroken(),

  reportBroken: (url: string) => {
    if (!url) return;
    const state = get();

    // A corrupt personal photo is removed so it can never render as a broken card.
    if (state.customUrl && state.customUrl === url) {
      persistCustom(null);
      set({ customUrl: null, activeIndex: 0 });
      return;
    }

    // Offline is not a bad URL — never purge the whole catalog because the network dropped.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    if (!state.pool.some((p) => p.url === url)) return;

    const activeUrl = slidesOf(state)[state.activeIndex]?.url;
    const brokenUrls = state.brokenUrls.includes(url) ? state.brokenUrls : [...state.brokenUrls, url];
    const pool = state.pool.filter((p) => p.url !== url);
    persistBroken(brokenUrls);

    // Keep the viewer on the same frame when possible; otherwise land on the next valid one.
    const slides = slidesOf({ customUrl: state.customUrl, pool });
    let activeIndex = activeUrl && activeUrl !== url ? slides.findIndex((s) => s.url === activeUrl) : state.activeIndex;
    if (activeIndex < 0) activeIndex = 0;
    if (slides.length > 0) activeIndex = activeIndex % slides.length;
    else activeIndex = 0;
    set({ pool, brokenUrls, activeIndex });

    // If every frame in this category failed, reset the blocklist and reload once.
    if (pool.length === 0 && !state.customUrl) {
      persistBroken([]);
      set({ brokenUrls: [] });
      void get().refreshLive(true);
    }
  },

  setCustomWallpaper: (dataUrl: string) => {
    const ok = persistCustom(dataUrl);
    if (!ok) return false;
    set({ customUrl: dataUrl, isEnabled: true, activeIndex: 0 });
    persistSettings({ ...get(), isEnabled: true });
    return true;
  },

  clearCustomWallpaper: () => {
    persistCustom(null);
    set({ customUrl: null, activeIndex: 0 });
  },

  setTopic: (topic: WallpaperTopic) => {
    tactileEngine.triggerSelectionBuzz();
    set({ topic });
    persistSettings(get());
    void get().refreshLive(true);
  },

  setIntervalSeconds: (sec: WallpaperInterval) => {
    tactileEngine.triggerSelectionBuzz();
    set({ intervalSeconds: sec });
    persistSettings(get());
  },

  togglePause: () => {
    tactileEngine.triggerSelectionBuzz();
    set({ isPaused: !get().isPaused });
    persistSettings(get());
  },

  setEnabled: (enabled: boolean) => {
    tactileEngine.triggerSelectionBuzz();
    set({ isEnabled: enabled });
    persistSettings(get());
    if (enabled) void get().refreshLive();
  },

  nextWallpaper: () => {
    const slides = slidesOf(get());
    if (slides.length === 0) return;
    set({ activeIndex: (get().activeIndex + 1) % slides.length });
  },

  selectWallpaper: (index: number) => {
    const slides = slidesOf(get());
    if (slides.length === 0) return;
    tactileEngine.triggerSelectionBuzz();
    set({ activeIndex: ((index % slides.length) + slides.length) % slides.length });
  },

  prevWallpaper: () => {
    const slides = slidesOf(get());
    if (slides.length === 0) return;
    set({ activeIndex: (get().activeIndex - 1 + slides.length) % slides.length });
  },

  refreshLive: async (force = false) => {
    const { isEnabled, isLoading, pool, topic, brokenUrls } = get();
    if (!isEnabled) return;
    if (!force && (isLoading || pool.length > 0)) return;
    set({ isLoading: true });
    try {
      const { items, source } = await fetchLiveWallpapers(topic, new Set(brokenUrls));
      set({ pool: items, sourceLabel: source, activeIndex: 0, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  getActiveWallpaper: () => {
    const slides = slidesOf(get());
    if (slides.length === 0) return null;
    return slides[get().activeIndex % slides.length];
  },
}));

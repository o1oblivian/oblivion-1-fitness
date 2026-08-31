import {
  CURATED_100_WALLPAPERS,
  type CuratedWallpaper,
  type WallpaperCategory,
  getCuratedWallpaperUrl,
  getCuratedThumbUrl,
} from '../data/curatedWallpapers';

export type WallpaperMode = 'curated' | 'custom' | 'off';

export interface WallpaperItem {
  id: string;
  title: string;
  category: string;
  thumbUrl: string;
  fullUrl: string;
  author?: string;
  ringColors: {
    outer: string;
    middle: string;
    inner: string;
  };
}

export interface WallpaperSettings {
  mode: WallpaperMode;
  categoryFilter: WallpaperCategory;
  autoPlay: boolean;
  shuffle?: boolean;
  refreshIntervalSec: number;
  selectedWallpaperId?: string;
  customImages: string[];
  continuousRotation?: boolean;
}

const STORAGE_KEY = 'o1fc_wallpaper_settings_v3';

const DEFAULT_SETTINGS: WallpaperSettings = {
  mode: 'curated',
  categoryFilter: 'all',
  autoPlay: true,
  shuffle: true,
  refreshIntervalSec: 15,
  selectedWallpaperId: 'gym-01',
  customImages: [],
  continuousRotation: true,
};

export function loadWallpaperSettings(): WallpaperSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        mode: ['curated', 'custom', 'off'].includes(parsed.mode) ? parsed.mode : 'curated',
        categoryFilter: parsed.categoryFilter || 'all',
        autoPlay: parsed.autoPlay !== undefined ? parsed.autoPlay : true,
        shuffle: parsed.shuffle !== undefined ? parsed.shuffle : true,
      };
    }
  } catch (e) {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveWallpaperSettings(settings: WallpaperSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('o1fc-wallpaper-settings-updated', { detail: settings }));
  } catch (e) {
    // ignore
  }
}

export function getFilteredCuratedWallpapers(filter: WallpaperCategory = 'all'): CuratedWallpaper[] {
  if (!filter || filter === 'all') return CURATED_100_WALLPAPERS;
  return CURATED_100_WALLPAPERS.filter((wp) => wp.category === filter);
}

export function getCuratedWallpaperById(id: string): WallpaperItem | null {
  const found = CURATED_100_WALLPAPERS.find((w) => w.id === id);
  if (!found) return null;
  return {
    id: found.id,
    title: found.title,
    category: found.categoryLabel,
    thumbUrl: getCuratedThumbUrl(found.photoId),
    fullUrl: getCuratedWallpaperUrl(found.photoId),
    author: found.author,
    ringColors: found.ringColors,
  };
}

const ROTATION_INDEX_KEY = 'o1fc_curated_wallpaper_idx';

export function pickNextCuratedWallpaper(
  filter: WallpaperCategory = 'all',
  currentId?: string,
  shuffle: boolean = true
): WallpaperItem {
  const pool = getFilteredCuratedWallpapers(filter);
  if (pool.length === 0) {
    const fallback = CURATED_100_WALLPAPERS[0];
    return {
      id: fallback.id,
      title: fallback.title,
      category: fallback.categoryLabel,
      thumbUrl: getCuratedThumbUrl(fallback.photoId),
      fullUrl: getCuratedWallpaperUrl(fallback.photoId),
      author: fallback.author,
      ringColors: fallback.ringColors,
    };
  }

  let nextIdx = 0;
  if (shuffle && pool.length > 1) {
    // Pick a random wallpaper in no fixed order, avoiding immediate repeat
    const curIndex = currentId ? pool.findIndex((w) => w.id === currentId) : -1;
    let attempts = 0;
    do {
      nextIdx = Math.floor(Math.random() * pool.length);
      attempts++;
    } while (nextIdx === curIndex && attempts < 10);
  } else if (currentId) {
    const curIndex = pool.findIndex((w) => w.id === currentId);
    if (curIndex >= 0) {
      nextIdx = (curIndex + 1) % pool.length;
    } else {
      nextIdx = 0;
    }
  } else {
    let stored = 0;
    try {
      const raw = localStorage.getItem(ROTATION_INDEX_KEY);
      if (raw) stored = parseInt(raw, 10) || 0;
    } catch {}
    nextIdx = (stored + 1) % pool.length;
  }

  try {
    localStorage.setItem(ROTATION_INDEX_KEY, String(nextIdx));
  } catch {}

  const item = pool[nextIdx] || pool[0];

  // Preload upcoming image and subsequent buffer image in background
  try {
    const nextPhotoUrl = getCuratedWallpaperUrl(item.photoId);
    const img = new Image();
    img.src = nextPhotoUrl;

    const lookaheadIdx = (nextIdx + 1) % pool.length;
    const lookaheadItem = pool[lookaheadIdx];
    if (lookaheadItem) {
      const aheadImg = new Image();
      aheadImg.src = getCuratedWallpaperUrl(lookaheadItem.photoId);
    }
  } catch {}

  return {
    id: item.id,
    title: item.title,
    category: item.categoryLabel,
    thumbUrl: getCuratedThumbUrl(item.photoId),
    fullUrl: getCuratedWallpaperUrl(item.photoId),
    author: item.author,
    ringColors: item.ringColors,
  };
}

export function pickPrevCuratedWallpaper(
  filter: WallpaperCategory = 'all',
  currentId?: string
): WallpaperItem {
  const pool = getFilteredCuratedWallpapers(filter);
  if (pool.length === 0) {
    const fallback = CURATED_100_WALLPAPERS[0];
    return {
      id: fallback.id,
      title: fallback.title,
      category: fallback.categoryLabel,
      thumbUrl: getCuratedThumbUrl(fallback.photoId),
      fullUrl: getCuratedWallpaperUrl(fallback.photoId),
      author: fallback.author,
      ringColors: fallback.ringColors,
    };
  }

  let prevIdx = 0;
  if (currentId) {
    const curIndex = pool.findIndex((w) => w.id === currentId);
    if (curIndex > 0) {
      prevIdx = curIndex - 1;
    } else {
      prevIdx = pool.length - 1;
    }
  }

  try {
    localStorage.setItem(ROTATION_INDEX_KEY, String(prevIdx));
  } catch {}

  const item = pool[prevIdx] || pool[0];
  return {
    id: item.id,
    title: item.title,
    category: item.categoryLabel,
    thumbUrl: getCuratedThumbUrl(item.photoId),
    fullUrl: getCuratedWallpaperUrl(item.photoId),
    author: item.author,
    ringColors: item.ringColors,
  };
}

const CUSTOM_INDEX_KEY = 'o1fc_custom_wallpaper_idx';

export function pickNextCustomWallpaper(customImages: string[], shuffle: boolean = true): {
  url: string;
  fullUrl: string;
  index: number;
  total: number;
  title: string;
  ringColors: { outer: string; middle: string; inner: string };
} | null {
  if (!customImages || customImages.length === 0) return null;

  let nextIndex = 0;
  if (shuffle && customImages.length > 1) {
    let currentIndex = 0;
    try {
      const raw = localStorage.getItem(CUSTOM_INDEX_KEY);
      if (raw) currentIndex = parseInt(raw, 10) || 0;
    } catch {}
    do {
      nextIndex = Math.floor(Math.random() * customImages.length);
    } while (nextIndex === currentIndex && customImages.length > 1);
  } else {
    let currentIndex = 0;
    try {
      const raw = localStorage.getItem(CUSTOM_INDEX_KEY);
      if (raw) currentIndex = parseInt(raw, 10) || 0;
    } catch {}
    nextIndex = (currentIndex + 1) % customImages.length;
  }
  try {
    localStorage.setItem(CUSTOM_INDEX_KEY, String(nextIndex));
  } catch {}

  const img = customImages[nextIndex] || customImages[0];
  return {
    url: img,
    fullUrl: img,
    index: nextIndex + 1,
    total: customImages.length,
    title: `Phone Gallery Photo #${nextIndex + 1}`,
    ringColors: { outer: '#DC2626', middle: '#EF4444', inner: '#F87171' },
  };
}

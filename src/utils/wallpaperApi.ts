export interface WallpaperItem {
  id: string;
  title: string;
  category: string;
  thumbUrl: string;
  fullUrl: string;
  authorName?: string;
  authorUrl?: string;
  downloadLocation?: string;
  ringColors: {
    outer: string;
    middle: string;
    inner: string;
  };
}

const WALLPAPER_OVERRIDE_KEY = 'lumina_wallpaper_override';
const RING_PALETTE_KEY = 'lumina_ring_palette';

export function loadWallpaperOverride(): string | null {
  try {
    return localStorage.getItem(WALLPAPER_OVERRIDE_KEY);
  } catch {
    return null;
  }
}

export function saveWallpaperOverride(url: string): void {
  try {
    localStorage.setItem(WALLPAPER_OVERRIDE_KEY, url);
  } catch {}
}

export function clearWallpaperOverride(): void {
  try {
    localStorage.removeItem(WALLPAPER_OVERRIDE_KEY);
  } catch {}
}

export function loadRingPalette(): WallpaperItem['ringColors'] | null {
  try {
    const raw = localStorage.getItem(RING_PALETTE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveRingPalette(colors: WallpaperItem['ringColors']): void {
  try {
    localStorage.setItem(RING_PALETTE_KEY, JSON.stringify(colors));
  } catch {}
}

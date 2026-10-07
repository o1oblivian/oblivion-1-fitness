import {
  WALLPAPER_CATALOG,
  WALLPAPER_CATEGORY_LABELS,
  WallpaperCategory,
} from '../data/wallpaperCatalog';

export type WallpaperTopic = WallpaperCategory | 'all';

export interface LiveWallpaper {
  id: string;
  url: string;
  thumbUrl: string;
  title: string;
  category: WallpaperCategory;
}

export const WALLPAPER_TOPIC_IDS: WallpaperTopic[] = ['hyrox', 'iron', 'track', 'combat', 'nature', 'all'];

export function isWallpaperTopic(value: unknown): value is WallpaperTopic {
  return typeof value === 'string' && (WALLPAPER_TOPIC_IDS as string[]).includes(value);
}

export function wallpaperTopicLabel(topic: WallpaperTopic): string {
  return topic === 'all' ? 'All categories' : WALLPAPER_CATEGORY_LABELS[topic];
}

/** Legacy saved topics from earlier builds map onto the new categories. */
export function migrateWallpaperTopic(value: unknown): WallpaperTopic {
  if (isWallpaperTopic(value)) return value;
  if (value === 'gym') return 'iron';
  if (value === 'motivational') return 'track';
  return 'hyrox';
}

function shuffle<T>(rows: T[]): T[] {
  const out = rows.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Interleave categories so "All" never shows five iron shots in a row. */
function interleave(rows: LiveWallpaper[]): LiveWallpaper[] {
  const buckets = new Map<WallpaperCategory, LiveWallpaper[]>();
  for (const row of rows) {
    const list = buckets.get(row.category) ?? [];
    list.push(row);
    buckets.set(row.category, list);
  }
  const lists = [...buckets.values()];
  const out: LiveWallpaper[] = [];
  for (let i = 0; lists.some((l) => i < l.length); i++) {
    for (const l of lists) if (i < l.length) out.push(l[i]);
  }
  return out;
}

/**
 * Catalog-backed wallpaper pool. `exclude` carries URLs that already failed to load,
 * so a refresh never re-adds an image the device could not render.
 */
export async function fetchLiveWallpapers(
  topic: WallpaperTopic,
  exclude: ReadonlySet<string> = new Set(),
): Promise<{ items: LiveWallpaper[]; source: string }> {
  const rows = WALLPAPER_CATALOG.filter((w) => (topic === 'all' ? true : w.category === topic))
    .filter((w) => !exclude.has(w.url))
    .map<LiveWallpaper>((w) => ({
      id: w.id,
      url: w.url,
      thumbUrl: w.thumbUrl,
      title: w.title,
      category: w.category,
    }));
  const ordered = topic === 'all' ? interleave(shuffle(rows)) : shuffle(rows);
  return { items: ordered, source: `${ordered.length} verified HD` };
}

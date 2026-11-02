import { supabase } from '../../../services/supabaseClient';
import { fetchCoachCards, toExploreCoach } from '../../coach/services/coachDirectory';
import type { ExploreCoach } from '../../coach/coachTypes';
import type { ExploreReelItem } from '../reelTypes';
import { normalizeBodyPart, normalizeReelCategory } from '../reelCategories';

type Row = Record<string, unknown>;

const REEL_COLUMNS =
  'id, coach_id, title, category, filter_tag, video_url, thumbnail_url, cues, duration_secs, created_at, author_name, author_avatar, storage_path, poster_path';
const FEED_LIMIT = 100;

function clock(secs: unknown): string {
  const total = Math.round(Number(secs));
  if (!Number.isFinite(total) || total <= 0) return '--';
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/** Maps a `reels` row. `coach` is the uploader's coach profile, or null for an athlete. */
export function mapReelRow(row: Row, coach: ExploreCoach | null): ExploreReelItem {
  const category = normalizeReelCategory(row.category, row.filter_tag) ?? 'ALL';
  const filterTag = normalizeBodyPart(row.filter_tag);
  const videoUrl = text(row.video_url);
  const thumbnail = text(row.thumbnail_url);
  const duration = clock(row.duration_secs);
  const title = text(row.title) || 'Reel';
  const authorId = text(row.coach_id);
  return {
    id: String(row.id),
    title,
    category,
    filterTag,
    videoUrl,
    thumbnail,
    views: '--',
    duration,
    cues: text(row.cues),
    author: {
      id: authorId,
      name: coach?.name || text(row.author_name).trim() || 'Member',
      avatar: coach?.avatar || text(row.author_avatar),
    },
    coach,
    filmstripClips: [{ id: `${row.id}-clip`, title, duration, thumbnail, videoUrl, tag: category }],
    storagePath: text(row.storage_path) || null,
    posterPath: text(row.poster_path) || null,
  };
}

async function mapRows(rows: Row[]): Promise<ExploreReelItem[]> {
  const ids = [...new Set(rows.map((row) => text(row.coach_id)).filter(Boolean))];
  const cards = ids.length ? await fetchCoachCards(ids) : [];
  const coaches = new Map(cards.map((card) => [card.id, toExploreCoach(card)]));
  return rows
    .filter((row) => row.video_url)
    .map((row) => mapReelRow(row, coaches.get(text(row.coach_id)) ?? null));
}

/** Newest reels from every member. Throws when the feed could not be loaded. */
export async function fetchReelFeed(): Promise<ExploreReelItem[]> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('You are offline. Reels load when you reconnect.');
  }
  const { data, error } = await supabase
    .from('reels')
    .select(REEL_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(FEED_LIMIT);
  if (error) throw new Error(`Reels could not load. ${error.message}`);
  if (!Array.isArray(data)) throw new Error('Reels could not load. The server sent no rows.');
  return mapRows(data as Row[]);
}

/** One member's reels, newest first, including any hidden after reports. Throws when they could not be loaded. */
export async function fetchMemberReels(memberId: string): Promise<ExploreReelItem[]> {
  if (!memberId) return [];
  const { data, error } = await supabase
    .from('reels')
    .select(REEL_COLUMNS)
    .eq('coach_id', memberId)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw new Error(`Your reels could not load. ${error.message}`);
  if (!Array.isArray(data)) throw new Error('Your reels could not load. The server sent no rows.');
  return mapRows(data as Row[]);
}

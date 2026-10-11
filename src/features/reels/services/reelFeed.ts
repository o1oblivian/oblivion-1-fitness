import { supabase } from '../../../services/supabaseClient';
import { CoachCard, fetchCoachCards, toExploreCoach } from '../../coach/services/coachDirectory';
import type { ExploreCoach, ExploreReelItem } from '../reelTypes';

type Row = Record<string, unknown>;

const REEL_COLUMNS = 'id, coach_id, title, category, filter_tag, video_url, thumbnail_url, cues, duration_secs, created_at';
const FEED_LIMIT = 100;

const CATEGORIES: ExploreReelItem['category'][] = ['ALL', 'TUTORIAL', 'MOBILITY', 'BIOMECHANICS', 'HYPERTROPHY', 'STRENGTH', 'REHAB'];
const FILTER_TAGS: ExploreReelItem['filterTag'][] = [
  'TUTORIAL',
  'CHEST & TRICEPS',
  'BACK & BICEPS',
  'QUADS & GLUTES',
  'SHOULDERS & ARMS',
  'MOBILITY & REHAB',
  'HYROX / CONDITIONING',
];

function clock(secs: unknown): string {
  const total = Math.round(Number(secs));
  if (!Number.isFinite(total) || total <= 0) return '--';
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function fallbackCoach(id: string): ExploreCoach {
  return {
    id,
    name: 'Coach',
    handle: '',
    avatar: '',
    verified: false,
    specialtyTitle: 'Coach',
    rating: 0,
    reviewCount: 0,
    certificationPill: '',
    rate: '',
    slotsRemaining: 0,
    bio: '',
    disciplines: [],
  };
}

export function mapReelRow(row: Row, coach: ExploreCoach): ExploreReelItem {
  const category = CATEGORIES.includes(row.category as ExploreReelItem['category']) ? (row.category as ExploreReelItem['category']) : 'ALL';
  const filterTag = FILTER_TAGS.includes(row.filter_tag as ExploreReelItem['filterTag']) ? (row.filter_tag as ExploreReelItem['filterTag']) : 'TUTORIAL';
  const videoUrl = String(row.video_url || '');
  const thumbnail = String(row.thumbnail_url || '');
  const duration = clock(row.duration_secs);
  const title = String(row.title || 'Reel');
  return {
    id: String(row.id),
    title,
    category,
    filterTag,
    videoUrl,
    thumbnail,
    views: '--',
    duration,
    cues: String(row.cues || ''),
    coach,
    filmstripClips: [{ id: `${row.id}-clip`, title, duration, thumbnail, videoUrl, tag: category }],
  };
}

async function mapRows(rows: Row[], known?: CoachCard[]): Promise<ExploreReelItem[]> {
  const cards = known ?? (await fetchCoachCards(rows.map((row) => String(row.coach_id || ''))));
  const byId = new Map(cards.map((card) => [card.id, toExploreCoach(card)]));
  return rows
    .filter((row) => row.video_url)
    .map((row) => {
      const coachId = String(row.coach_id || '');
      return mapReelRow(row, byId.get(coachId) ?? fallbackCoach(coachId));
    });
}

/** Newest reels from every coach. Null when the feed could not be loaded. */
export async function fetchReelFeed(): Promise<ExploreReelItem[] | null> {
  const { data, error } = await supabase.from('reels').select(REEL_COLUMNS).order('created_at', { ascending: false }).limit(FEED_LIMIT);
  if (error || !Array.isArray(data)) return null;
  return mapRows(data as Row[]);
}

/** One coach's reels, newest first. Null when they could not be loaded. */
export async function fetchCoachReels(coachId: string): Promise<ExploreReelItem[] | null> {
  if (!coachId) return [];
  const { data, error } = await supabase
    .from('reels')
    .select(REEL_COLUMNS)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error || !Array.isArray(data)) return null;
  return mapRows(data as Row[]);
}

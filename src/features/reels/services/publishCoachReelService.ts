import { CompressedMediaResult } from '../../../utils/mediaCompressor';
import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { isSharedUrl, saveVaultRow, uploadMedia } from '../../../services/mediaStorage';
import { useReelsStore } from '../../../stores/useReelsStore';
import { fetchCoachCard, toExploreCoach } from '../../coach/services/coachDirectory';
import { ExploreReelItem } from '../reelTypes';
import type { BodyPartTag, ReelCategoryId } from '../reelCategories';
import { mapReelRow } from './reelFeed';

interface PublishReelParams {
  title: string;
  cues: string;
  selectedCategory: ReelCategoryId;
  selectedFilterTag: BodyPartTag | null;
  previewUrl: string;
  compressedResult: CompressedMediaResult | null;
  fallbackName: string;
}

export type PublishReelResult = { ok: true; reel: ExploreReelItem } | { ok: false; reason: 'signed-out' | 'upload' | 'save' };

/** Writes the reel to the shared `reels` table. Only uploaded clips are written; phone-only links would not play for anyone else. */
export async function insertReelRow(reel: ExploreReelItem, durationSecs?: number): Promise<boolean> {
  if (!isSharedUrl(reel.videoUrl)) return false;
  const { error } = await supabase.from('reels').insert({
    id: reel.id,
    title: reel.title,
    category: reel.category,
    filter_tag: reel.filterTag,
    video_url: reel.videoUrl,
    thumbnail_url: isSharedUrl(reel.thumbnail) ? reel.thumbnail : null,
    coach_id: reel.coach.id,
    cues: reel.cues,
    duration_secs: durationSecs ? Math.round(durationSecs) : null,
  });
  if (error) console.warn('[publishCoachReel] reels row failed:', error.message);
  return !error;
}

/** Uploads the clip and poster, writes the reel and its Vault copy. Nothing is kept when the upload fails. */
export async function publishCoachReel({
  title,
  cues,
  selectedCategory,
  selectedFilterTag,
  previewUrl,
  compressedResult,
  fallbackName,
}: PublishReelParams): Promise<PublishReelResult> {
  const coachId = await getAuthenticatedUserId();
  if (!coachId) return { ok: false, reason: 'signed-out' };
  const [clip, poster, card] = await Promise.all([
    uploadMedia(compressedResult?.file || previewUrl, 'reels'),
    compressedResult?.thumbnailUrl ? uploadMedia(compressedResult.thumbnailUrl, 'reels') : Promise.resolve(null),
    fetchCoachCard(coachId),
  ]);
  if (!clip) return { ok: false, reason: 'upload' };

  const id = `coach-reel-${Date.now()}`;
  const coach = toExploreCoach(
    card ?? { id: coachId, name: fallbackName || 'Coach', handle: '', avatar: '', bio: '', specialties: [], hourlyRate: null, monthlyRate: null, verified: false, accepting: true },
  );
  const reel = mapReelRow(
    {
      id,
      title: title.trim(),
      category: selectedCategory,
      filter_tag: selectedFilterTag,
      video_url: clip.url,
      thumbnail_url: poster?.url || '',
      cues: cues.trim(),
      duration_secs: compressedResult?.durationSecs ?? null,
    },
    coach,
  );

  if (!(await insertReelRow(reel, compressedResult?.durationSecs))) return { ok: false, reason: 'save' };
  useReelsStore.getState().addCoachReel(reel);
  void saveVaultRow({
    id: `vault-reel-${Date.now()}`,
    type: compressedResult?.type === 'photo' ? 'photo' : 'video',
    title: reel.title,
    media_url: clip.url,
    thumbnail_url: poster?.url || null,
    storage_path: clip.path,
  });
  return { ok: true, reel };
}

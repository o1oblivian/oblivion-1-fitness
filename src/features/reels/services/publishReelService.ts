import { CompressedMediaResult } from '../../../utils/mediaCompressor';
import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { isSharedUrl, removeMedia, uploadMedia } from '../../../services/mediaStorage';
import { useReelsStore } from '../../../stores/useReelsStore';
import { fetchCoachCard, toExploreCoach } from '../../coach/services/coachDirectory';
import type { ExploreReelItem } from '../reelTypes';
import type { BodyPartTag, ReelCategoryId } from '../reelCategories';
import { mapReelRow } from './reelFeed';

interface PublishReelParams {
  title: string;
  cues: string;
  selectedCategory: ReelCategoryId;
  selectedFilterTag: BodyPartTag | null;
  compressed: CompressedMediaResult;
  /** The name and photo shown on the reel when the uploader has no coach profile. */
  authorName: string;
  authorAvatar: string;
}

export type PublishReelResult =
  | { ok: true; reel: ExploreReelItem }
  | { ok: false; reason: 'signed-out' | 'upload' | 'limit' | 'save'; detail?: string };

/** Uploads the compressed clip and poster, then writes the reel. Uploaded files are removed again when the reel is refused. */
export async function publishReel({
  title,
  cues,
  selectedCategory,
  selectedFilterTag,
  compressed,
  authorName,
  authorAvatar,
}: PublishReelParams): Promise<PublishReelResult> {
  const uploaderId = await getAuthenticatedUserId();
  if (!uploaderId) return { ok: false, reason: 'signed-out' };
  const [clip, poster, card] = await Promise.all([
    uploadMedia(compressed.file, 'reels'),
    compressed.thumbnailUrl ? uploadMedia(compressed.thumbnailUrl, 'reels') : Promise.resolve(null),
    fetchCoachCard(uploaderId),
  ]);
  if (!clip) {
    await removeMedia([poster?.path]);
    return { ok: false, reason: 'upload' };
  }

  const coach = card ? toExploreCoach(card) : null;
  const row = {
    id: `reel-${uploaderId.slice(0, 8)}-${Date.now()}`,
    coach_id: uploaderId,
    title: title.trim(),
    category: selectedCategory,
    filter_tag: selectedFilterTag,
    video_url: clip.url,
    thumbnail_url: poster?.url ?? null,
    cues: cues.trim(),
    duration_secs: compressed.durationSecs ? Math.round(compressed.durationSecs) : null,
    author_name: (coach?.name || authorName).trim().slice(0, 80) || null,
    author_avatar: isSharedUrl(coach?.avatar || authorAvatar)
      ? coach?.avatar || authorAvatar
      : null,
    storage_path: clip.path,
    poster_path: poster?.path ?? null,
  };
  const { error } = await supabase.from('reels').insert(row);
  if (error) {
    await removeMedia([clip.path, poster?.path]);
    if (error.message.includes('REEL_LIMIT')) return { ok: false, reason: 'limit' };
    console.error('[publishReel] reels row failed', error);
    return { ok: false, reason: 'save', detail: error.message };
  }
  const reel = mapReelRow(row, coach);
  useReelsStore.getState().addReel(reel);
  return { ok: true, reel };
}

/** Deletes one of the member's own reels and its files. False when the row could not be deleted. */
export async function deleteOwnReel(reel: ExploreReelItem): Promise<boolean> {
  const { error } = await supabase.from('reels').delete().eq('id', reel.id);
  if (error) {
    console.error('[deleteOwnReel] reels row delete failed', error);
    return false;
  }
  await removeMedia([reel.storagePath, reel.posterPath]);
  useReelsStore.getState().removeReel(reel.id);
  return true;
}

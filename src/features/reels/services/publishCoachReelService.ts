import { CompressedMediaResult } from '../../../utils/mediaCompressor';
import { supabase } from '../../../services/supabaseClient';
import { isSharedUrl, saveVaultRow, storeMedia } from '../../../services/mediaStorage';
import { useReelsStore } from '../../../stores/useReelsStore';
import { ExploreCoach, ExploreReelItem } from '../reelTypes';
import { REEL_CATEGORIES, SUB_FILTER_TAGS } from '../components/ReelCategorySelector';

interface PublishReelParams {
  title: string;
  cues: string;
  selectedCategory: (typeof REEL_CATEGORIES)[number]['id'];
  selectedFilterTag: (typeof SUB_FILTER_TAGS)[number];
  previewUrl: string;
  compressedResult: CompressedMediaResult | null;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorId: string;
}

export interface PublishedReel {
  reel: ExploreReelItem;
  /** False when the clip could not be uploaded and only plays on this phone. */
  shared: boolean;
}

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

export async function publishCoachReel({
  title,
  cues,
  selectedCategory,
  selectedFilterTag,
  previewUrl,
  compressedResult,
  authorName,
  authorHandle,
  authorAvatar,
  authorId,
}: PublishReelParams): Promise<PublishedReel> {
  const [clip, poster] = await Promise.all([
    storeMedia(compressedResult?.file || previewUrl, 'reels'),
    compressedResult?.thumbnailUrl ? storeMedia(compressedResult.thumbnailUrl, 'reels') : Promise.resolve(null),
  ]);
  const videoUrl = clip.url;
  const thumbnail = poster?.url || videoUrl;

  const coachMeta: ExploreCoach = {
    id: authorId,
    name: authorName,
    handle: authorHandle,
    avatar: authorAvatar,
    verified: true,
    specialtyTitle: `${authorName} • Performance Coach`,
    rating: 0,
    reviewCount: 0,
    certificationPill: 'O1 CERTIFIED',
    rate: 'Club Coach',
    slotsRemaining: 1,
    bio: 'Verified Coach Protocol',
    disciplines: [selectedCategory],
  };

  const newReel: ExploreReelItem = {
    id: `coach-reel-${Date.now()}`,
    title: title.trim(),
    category: (selectedCategory === 'HYROX' ? 'ALL' : selectedCategory) as ExploreReelItem['category'],
    filterTag:
      selectedCategory === 'HYROX'
        ? 'HYROX / CONDITIONING'
        : selectedCategory === 'MOBILITY' || selectedCategory === 'REHAB'
        ? 'MOBILITY & REHAB'
        : selectedFilterTag,
    videoUrl,
    thumbnail,
    views: '--',
    duration: compressedResult?.durationSecs ? `0:${compressedResult.durationSecs.toString().padStart(2, '0')}` : '0:30',
    cues: cues.trim() || 'Focus on controlled eccentric tension and standardized biomechanics.',
    coach: coachMeta,
    filmstripClips: [
      {
        id: `clip-1-${Date.now()}`,
        title: 'Prime Form Cue',
        duration: '0:15',
        thumbnail,
        videoUrl,
        tag: selectedCategory,
        badge: 'KEY CUE',
      },
    ],
  };

  useReelsStore.getState().addCoachReel(newReel);
  const shared = clip.remote && (await insertReelRow(newReel, compressedResult?.durationSecs));

  const isVideo = compressedResult?.type !== 'photo';
  const vaultItem = {
    id: `vault-reel-${Date.now()}`,
    type: isVideo ? ('video' as const) : ('photo' as const),
    title: title.trim(),
    category: 'Biomechanics Audit' as const,
    athleteName: authorName,
    url: videoUrl,
    thumbnailUrl: thumbnail,
    createdAt: 'Just now',
    fileSize: compressedResult?.formattedCompressed,
    notes: cues.trim() || undefined,
    storagePaths: [clip.path, poster?.path].filter((p): p is string => Boolean(p)),
  };
  try {
    const stored = localStorage.getItem('o1_coach_exercise_vault_media');
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem('o1_coach_exercise_vault_media', JSON.stringify([vaultItem, ...existing]));
  } catch {
    /* storage full or unavailable */
  }
  void saveVaultRow({
    id: vaultItem.id,
    type: vaultItem.type,
    title: vaultItem.title,
    media_url: videoUrl,
    thumbnail_url: thumbnail,
    storage_path: clip.path,
  });

  return { reel: newReel, shared };
}

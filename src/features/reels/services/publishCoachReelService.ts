import { CompressedMediaResult } from '../../../utils/mediaCompressor';
import { supabase } from '../../../services/supabaseClient';
import { useReelsStore } from '../../../stores/useReelsStore';
import { ExploreCoach, ExploreReelItem } from '../../../data/reelsExploreCatalog';
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
}: PublishReelParams): Promise<ExploreReelItem> {
  const coachMeta: ExploreCoach = {
    id: authorId,
    name: authorName,
    handle: authorHandle,
    avatar: authorAvatar,
    verified: true,
    specialtyTitle: `${authorName} • Performance Coach`,
    rating: 5.0,
    reviewCount: 1,
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
    videoUrl: previewUrl,
    thumbnail: compressedResult?.thumbnailUrl || previewUrl,
    views: '1.0K',
    duration: compressedResult?.durationSecs ? `0:${compressedResult.durationSecs.toString().padStart(2, '0')}` : '0:30',
    cues: cues.trim() || 'Focus on controlled eccentric tension and standardized biomechanics.',
    coach: coachMeta,
    filmstripClips: [
      {
        id: `clip-1-${Date.now()}`,
        title: 'Prime Form Cue',
        duration: '0:15',
        thumbnail: compressedResult?.thumbnailUrl || previewUrl,
        videoUrl: previewUrl,
        tag: selectedCategory,
        badge: 'KEY CUE',
      },
    ],
  };

  useReelsStore.getState().addCoachReel(newReel);

  try {
    await supabase.from('reels').insert({
      id: newReel.id,
      title: newReel.title,
      category: newReel.category,
      video_url: newReel.videoUrl,
      thumbnail_url: newReel.thumbnail,
      coach_id: authorId,
      cues: newReel.cues,
    });
  } catch {}

  try {
    const stored = localStorage.getItem('o1_coach_exercise_vault_media');
    const existing = stored ? JSON.parse(stored) : [];
    const vaultItem = {
      id: `vault-reel-${Date.now()}`,
      type: 'video' as const,
      title: title.trim(),
      category: 'Biomechanics Audit' as const,
      athleteName: authorName,
      url: previewUrl,
      thumbnailUrl: compressedResult?.thumbnailUrl || previewUrl,
      createdAt: 'Just now',
      fileSize: compressedResult?.formattedCompressed,
      notes: cues.trim() || undefined,
    };
    localStorage.setItem('o1_coach_exercise_vault_media', JSON.stringify([vaultItem, ...existing]));
  } catch {}

  return newReel;
}

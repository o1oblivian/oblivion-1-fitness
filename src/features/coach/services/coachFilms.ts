import { fetchCoachReels } from '../../reels/services/reelFeed';

export interface ProfileFilm {
  id: string;
  title: string;
  thumb: string;
}

/** A coach's published reels from the `reels` table. Null when they could not be loaded. */
export async function fetchCoachFilms(coachId: string): Promise<ProfileFilm[] | null> {
  const reels = await fetchCoachReels(coachId);
  if (!reels) return null;
  return reels.map((reel) => ({ id: reel.id, title: reel.title, thumb: reel.thumbnail || reel.videoUrl }));
}

export function figureCount(count: number): string {
  return count > 0 ? String(count) : '--';
}

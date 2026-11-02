import type { ExploreCoach } from '../coach/coachTypes';
import type { BodyPartTag, ReelCategoryId } from './reelCategories';

export type { ExploreCoach };

export interface FilmstripClip {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  tag: string;
  badge?: string;
}

/** The member who posted a reel. Every member, athlete or coach, can post. */
export interface ReelAuthor {
  id: string;
  name: string;
  avatar: string;
}

export interface ExploreReelItem {
  id: string;
  title: string;
  /** 'ALL' only for rows that predate exclusive categories; those show in the Reels circle only. */
  category: 'ALL' | ReelCategoryId;
  /** Optional body-part tag inside the category. */
  filterTag: BodyPartTag | null;
  videoUrl: string;
  thumbnail: string;
  views: string;
  duration: string;
  cues: string;
  author: ReelAuthor;
  /** The uploader's coach profile, or null when an athlete posted the reel. */
  coach: ExploreCoach | null;
  filmstripClips: FilmstripClip[];
  /** Storage paths, so the owner can delete the files with the reel. */
  storagePath: string | null;
  posterPath: string | null;
}

export interface FilmstripClip {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  tag: string;
  badge?: string;
}

export interface ExploreCoach {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  specialtyTitle: string;
  specialty?: string;
  rating: number;
  reviewCount: number;
  certificationPill: string;
  rate: string;
  slotsRemaining: number;
  bio: string;
  disciplines: string[];
  physiquePhotos?: string[];
  physiqueStats?: {
    height?: string;
    weight?: string;
    bodyFatEst?: string;
    experienceYears?: number;
    competitionLifts?: { label: string; value: string }[];
  };
}

export interface ExploreReelItem {
  id: string;
  title: string;
  category: 'ALL' | 'TUTORIAL' | 'MOBILITY' | 'BIOMECHANICS' | 'HYPERTROPHY' | 'STRENGTH' | 'REHAB';
  filterTag:
    | 'TUTORIAL'
    | 'CHEST & TRICEPS'
    | 'BACK & BICEPS'
    | 'QUADS & GLUTES'
    | 'SHOULDERS & ARMS'
    | 'MOBILITY & REHAB'
    | 'HYROX / CONDITIONING';
  videoUrl: string;
  thumbnail: string;
  views: string;
  duration: string;
  cues: string;
  coach: ExploreCoach;
  filmstripClips: FilmstripClip[];
}

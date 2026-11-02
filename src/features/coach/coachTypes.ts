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

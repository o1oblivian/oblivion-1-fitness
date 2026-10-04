export interface CoachProfile {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatar: string;
  bannerImage: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  activeClientsCount: number;
  specialtyTitle?: string;
  specialty?: string;
  specialties: string[];
  certifications: string[];
  physiquePhotos?: string[];
  physiqueStats?: {
    height?: string;
    weight?: string;
    bodyFatEst?: string;
    experienceYears?: number;
    competitionLifts?: { label: string; value: string }[];
  };
  movementReels?: Array<{
    id: string;
    title: string;
    views: string;
    thumbnail: string;
    videoUrl?: string;
    duration?: string;
    exerciseFocus?: string;
  }>;
  slotsRemaining?: number;
  pricing: {
    monthlyOneOnOneUsd: number;
    teamSubscriptionUsd: number;
  };
}

export interface CoachReview {
  id: string;
  coachId: string;
  athleteName: string;
  athleteHandle: string;
  avatar?: string;
  rating: number;
  verifiedProgram: string;
  date: string;
  comment: string;
  helpfulCount: number;
}

export interface CoachMarketplaceProgram {
  id: string;
  coachId: string;
  coachName: string;
  coachAvatar?: string;
  coachTitle?: string;
  title: string;
  tagline: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
  durationWeeks: number;
  daysPerWeek: number;
  priceUsd: number;
  rating: number;
  enrolledCount: number;
  coverImage: string;
  videoPreviewUrl?: string;
  description: string;
  highlights: string[];
  sampleWeek: Array<{
    dayNumber: number;
    dayName: string;
    focus: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      notes?: string;
    }>;
  }>;
}

export interface AthleteCheckInSubmission {
  id: string;
  athleteId: string;
  athleteName: string;
  coachId: string;
  date: string;
  weightKg: number;
  sleepHours: number;
  sorenessRating: number; // 1-10
  stressRating: number; // 1-10
  nutritionAdherence: number; // 1-100%
  completedSessionsCount: number;
  targetSessionsCount: number;
  notes: string;
  coachFeedback?: {
    feedbackText: string;
    audioUrl?: string;
    givenAt: string;
    status: 'pending' | 'reviewed';
    suggestedAdjustments?: string[];
  };
}

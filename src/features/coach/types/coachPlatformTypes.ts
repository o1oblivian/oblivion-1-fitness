export interface AthleteCheckInSubmission {
  id: string;
  athleteId: string;
  athleteName: string;
  coachId: string;
  date: string;
  createdAt?: string;
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

import { CoachProfile, CoachMarketplaceProgram, CoachReview, AthleteCheckInSubmission } from '../types/coachPlatformTypes';

/**
 * Coach Marketplace Data
 * Purged of all mock data, dummy athletes, and synthetic catalogs.
 * All coaching operations must bind directly to live Supabase tables (coach_profiles, coach_programs, coach_reviews).
 */

export const VERIFIED_COACH_PROFILE: CoachProfile | null = null;
export const VERIFIED_COACHES_CATALOG: CoachProfile[] = [];
export const COACH_MARKETPLACE_PROGRAMS: CoachMarketplaceProgram[] = [];
export const COACH_VERIFIED_REVIEWS: CoachReview[] = [];
export const RECENT_CLIENT_CHECKINS: AthleteCheckInSubmission[] = [];

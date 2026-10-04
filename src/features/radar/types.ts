export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BuddyProfile {
  id: string;
  athlete_name: string;
  handle: string;
  avatar_url: string;
  discipline: string;
  current_split: string;
  experience_level: 'Novice' | 'Intermediate' | 'Advanced' | 'Elite';
  training_time: 'Morning' | 'Midday' | 'Evening' | 'Night';
  home_gym: string;
  current_gym?: string;
  latitude: number;
  longitude: number;
  is_ghost_mode: boolean;
  streak_days: number;
  volume_kg: number;
  last_active: string;
  is_verified?: boolean;
  verified_at?: string;
}

export interface MatchFilter {
  discipline: string;
  maxDistanceKm: number;
  trainingTime: string;
  minCompatibility: number;
}

export interface BuddyMatchResult {
  profile: BuddyProfile;
  distanceKm: number;
  compatibilityScore: number;
  matchReasons: string[];
}

export interface DemoAthlete {
  id: string;
  name: string;
  age: number;
  home_gym: string;
  distance_km: number;
  match_score: number;
  image_url: string;
  discipline: string;
  current_split?: string;
  handle?: string;
  photos?: string[];
  schedule?: string;
  intent_quote?: string;
  disciplines?: string[];
  bench_kg?: number;
  squat_kg?: number;
  deadlift_kg?: number;
  avatar?: string;
  matchPercentage?: number;
  homeGym?: string;
  distanceKm?: number;
  training_discipline?: string;
  bio?: string;
  experience_level?: string;
  preferred_time?: string;
  focus?: string;
  is_online?: boolean;
  is_verified?: boolean;
  verified_at?: string;
  benchmarks?: { label: string; value: string }[];
}

export type Athlete = DemoAthlete;

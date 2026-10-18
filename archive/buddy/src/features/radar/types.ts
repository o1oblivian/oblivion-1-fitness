export interface Coordinates {
  latitude: number;
  longitude: number;
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
  gender?: string;
  looking_for?: string;
  training_place?: string;
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
  match_reasons?: string[];
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

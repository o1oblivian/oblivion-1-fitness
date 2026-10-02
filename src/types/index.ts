export type TabType = 'workout' | 'fuel' | 'radar' | 'coach' | 'log';

export interface CardioMode {
  id: string;
  name: string;
  icon: string;
  cadence: string;
  intensity: 'Zone 2' | 'HIIT' | 'Threshold' | 'Recovery';
  activeMinutes: number;
}

// WORKOUT CONTRACTS
export * from './workout';

export interface ProgramReel {
  id: string;
  title: string;
  category: string;
  level: 'Elite' | 'Tactical' | 'Tier 1';
  durationMin: number;
  focus: string;
  accentColor: 'crimson' | 'amber' | 'cyan';
  exercisesCount: number;
  intensityScore: number;
  description: string;
}

export interface DailyVolumePoint {
  day: string;
  shortDay: string;
  volumeKg: number;
  targetKg: number;
  strain: number;
  setsCount?: number;
  isToday?: boolean;
}

// FUEL OS
export * from './fuel';

// BUDDY RADAR
export type RadarCorridor = 'local_25km' | 'regional_250km';

export interface BuddyRadarAthlete {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  status: string;
  discipline: 'Powerlifting' | 'Hyrox' | 'Bodybuilding' | 'CrossFit' | 'Calisthenics';
  locationName: string;
  distanceKm: number;
  coordinates: { lat: number; lng: number };
}

export interface BuddyProfilePayload {
  user_uuid: string;
  user_name: string;
  avatar_url?: string;
  current_gym: string;
  home_gym: string;
  age: number;
  height: number;
  weight: number;
  show_weight: boolean;
  training_focus: string;
  discipline_category: string;
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';
  preferred_time: 'Morning' | 'Afternoon' | 'Evening' | 'Late Night';
  gym_zone_sharing: boolean;
  public_telemetry: boolean;
  is_ghost_mode: boolean;
  best_squat_kg?: string;
  best_bench_kg?: string;
  best_deadlift_kg?: string;
}

export interface TravelPassState {
  is_travel_mode: boolean;
  travel_city: string;
  travel_country: string;
  travel_latitude: number;
  travel_longitude: number;
  arrival_date: string;
  departure_date: string;
  activated_at?: string;
}

export interface AthleteBlip {
  id: string;
  callsign: string;
  realName: string;
  avatarSeed: string;
  distanceKm: number;
  angleDeg: number;
  statusBadge: string;
  statusType: 'lifting' | 'cardio' | 'recovery' | 'pr_attempt';
  discipline: 'Powerlifting' | 'Tactical Hyrox' | 'Hypertrophy' | 'Cross-Training';
  batteryLevel: number;
  heartRateBpm: number;
  locationLabel: string;
  availableForSession: boolean;
  activeSession: string;
}

export interface WorkoutHistoryLog {
  id: string;
  date: string;
  title: string;
  durationMinutes: number;
  tonnageKg: number;
  strainScore: number;
  peakHr: number;
  avgHr: number;
  prAchieved?: string;
}

// Re-exports from modular type modules
export * from './athlete';
export * from './telemetry';
export * from './coach';
export * from './database';
export * from './iap';
export type { MobilityCategory, MobilityExercise, RecoveryRoutine } from '../data/recoveryRoutines';

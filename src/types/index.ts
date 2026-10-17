// WORKOUT CONTRACTS
export * from './workout';

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

// Re-exports from modular type modules
export * from './athlete';
export * from './telemetry';
export * from './coach';
export * from './database';
export * from './iap';

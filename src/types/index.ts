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

// Re-exports from modular type modules
export * from './athlete';
export * from './telemetry';
export * from './coach';
export * from './database';
export * from './iap';

export type CardioMachineType = 
  | 'treadmill'
  | 'stairmaster'
  | 'rower'
  | 'echo_bike'
  | 'elliptical'
  | 'skierg'
  | 'outdoor_walk'
  | 'outdoor_run';

export interface CardioMachineEntry {
  id: string;
  date: string;
  timestamp: number;
  machineType: CardioMachineType;
  durationMinutes: number;
  distanceKm?: number;
  caloriesBurned: number;
  avgHeartRate?: number;
  stepsCount?: number;
  floorsClimbed?: number;
  inclinePercent?: number;
  avgWatts?: number;
  avgSpeedKmh?: number;
  resistanceLevel?: number;
  photoUrl?: string;
  rawOcrText?: string;
  notes?: string;
  source: 'ocr_scan' | 'manual_dial' | 'smart_preset';
}

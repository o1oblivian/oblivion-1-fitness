// Types that lived in src/types/index.ts for Buddy Radar.
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

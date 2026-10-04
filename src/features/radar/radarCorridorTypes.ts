import { DemoAthlete, Coordinates } from './types';

/**
 * Radar & Athlete Corridor Types
 * Purged of all mock athlete constants.
 * Must bind exclusively to live Supabase buddy_profiles records.
 */

export interface RadarCorridorDefinition {
  corridorId: string;
  name: string;
  originCoords: Coordinates;
  destinationCoords?: Coordinates;
  radiusKm: number;
}

// Purged: Zero mock athletes or synthetic corridor blips
export const DEFAULT_CORRIDOR_BUDDIES: DemoAthlete[] = [];
export const LOCAL_MOCK_BUDDIES: DemoAthlete[] = [];

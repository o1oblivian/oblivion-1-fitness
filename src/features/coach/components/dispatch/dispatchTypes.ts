import type { Athlete } from '../../services/coachService';
import type { AthleticVector } from '../../data/dispatchBlueprintSynthesizer';

export interface StackExerciseSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe: number;
  restSecs: number;
}

export interface StackExercise {
  id: string;
  catalogId?: string;
  name: string;
  muscle: string;
  category: string;
  cue: string;
  sets: StackExerciseSet[];
  expanded?: boolean;
}

export type DispatchTab = 'stack' | 'library' | 'blueprints';

export type ExerciseType = 'All' | 'Compound' | 'Isolation' | 'Functional';

export const RECOMMENDED_CUE_CHIPS = [
  'Retract scapulae',
  '3s eccentric tempo',
  'Explode out of hole',
  '360 core brace',
  '1s peak squeeze',
  'Pinch lats down',
  'Drive through heels',
  'Spine neutral, ribs down',
  'Full lockout extension',
  'Reset deadstop on floor',
];

export const VECTOR_PILLS: AthleticVector[] = [
  'Push Alpha',
  'Push Beta',
  'Pull Alpha',
  'Pull Beta',
  'Legs Alpha',
  'Legs Beta',
  'Upper Body',
  'Lower Body',
  'Hyrox/Metcon',
  'Speed & COD',
  'Strength S&C',
  'Bio-Recovery',
];

export const MUSCLE_FILTER_CHIPS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Core',
  'Calves',
  'Olympic',
  'Hyrox',
  'Sports',
  'Recovery',
] as const;

export const EXERCISE_TYPES: ExerciseType[] = ['All', 'Compound', 'Isolation', 'Functional'];

export function mergeRoster(...groups: Athlete[][]): Athlete[] {
  const seen = new Set<string>();
  return groups.flat().filter((row) => {
    const key = row.client_id || row.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

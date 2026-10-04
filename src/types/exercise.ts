export type DisciplineType = 'lift' | 'sports' | 'recovery';

export type EquipmentCategory =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'turf'
  | 'erg'
  | 'mat'
  | 'kettlebell'
  | 'sandbag';

export type ExerciseMechanic =
  | 'compound'
  | 'isolation'
  | 'isometric'
  | 'aerobic'
  | 'mobility';

export type MovementPattern =
  | 'push'
  | 'pull'
  | 'hinge'
  | 'squat'
  | 'carry'
  | 'core'
  | 'locomotion'
  | 'mobility';

/**
 * COMPREHENSIVE RELATIONAL EXERCISE SCHEMA (O1FC)
 * Strict entity contract grounded in exercise physiology.
 */
export interface ExerciseDefinition {
  id: string;
  name: string;
  discipline: DisciplineType;
  primaryMuscleGroup?: string; // e.g., 'Chest', 'Quads', 'Posterior Chain'
  secondaryMuscles?: string[]; // e.g., ['Triceps', 'Anterior Deltoid']
  equipment: EquipmentCategory | string;
  mechanic?: ExerciseMechanic;
  baseMET?: number; // Exact MET value from exercise science registries
  defaultSets: number;
  defaultReps?: number;
  defaultRestSeconds?: number;
  unilateral?: boolean;

  // Relational & backward compatibility attributes
  category: string;
  subLabel: string;
  tier?: string;
  defaultWeightKg?: number;
  estCalories?: number;
  restSecs?: number;
  primaryMuscle?: string;
  movementPattern?: MovementPattern | string;
}

export interface ExerciseSet {
  id?: string;
  setNumber: number;
  weightKg: number;
  weight?: number;
  reps: number;
  rpe: number;
  completed: boolean;
}

export interface ExerciseItem {
  id: string;
  name: string;
  exerciseName?: string;
  targetMuscle: string;
  sets: ExerciseSet[];
  notes?: string;
  restSecs: number;
  equipment?: string;
  tier?: string;
  baseMET?: number;
  mechanic?: ExerciseMechanic;
  movementPattern?: MovementPattern;
  supersetGroupId?: string | null;
  supersetIndex?: number;
}

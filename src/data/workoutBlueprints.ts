// ============================================================================
// PROGRAM & BLUEPRINT TYPE CONTRACTS & MASTER REPOSITORY
// ============================================================================

type BlueprintCategory =
  | 'Warm-Up'
  | 'Activation / Prime'
  | 'Main Lifts'
  | 'Accessories'
  | 'Finisher';

export interface BlueprintExercise {
  id: string;
  name: string;
  category: BlueprintCategory;
  sets: number;
  reps: string;
  rest: string;
  tempo: string;
  cues: string;
  targetMuscle: string;
  defaultWeightKg?: number;
}

export interface WorkoutBlueprint {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  phase: string;
  focus: string;
  estimatedTime: string;
  description: string;
  targetMuscles: string[];
  exercises: BlueprintExercise[];
}

// Re-export all modular category blueprint repositories
export * from './blueprints';

// Aggregate master collection of all 37 blueprints
import { ALL_MASTER_BLUEPRINTS } from './blueprints';

export const WORKOUT_BLUEPRINTS: WorkoutBlueprint[] = ALL_MASTER_BLUEPRINTS;

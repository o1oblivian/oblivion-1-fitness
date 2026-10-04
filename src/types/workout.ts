import {
  DisciplineType,
  ExerciseDefinition,
  ExerciseSet,
  ExerciseItem,
} from './exercise';

export type { DisciplineType, ExerciseDefinition, ExerciseSet, ExerciseItem };

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Quads'
  | 'Hamstrings'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Chest & Triceps'
  | 'Back & Biceps'
  | 'Legs & Calves'
  | 'Boxing & Combat'
  | 'Hyrox'
  | 'Full Mobility'
  | 'Breathwork & Mind';

export type EquipmentType =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Cable'
  | 'Bodyweight'
  | 'Drill'
  | 'Sprint'
  | 'Turf'
  | 'Mat'
  | (string & {});

export type ExerciseTier =
  | 'Compound Prime'
  | 'Hypertrophy Volume'
  | 'Isolation Finish'
  | 'Conditioning'
  | 'Mobility Flow'
  | 'Breath Regulation'
  | 'Competition Pace'
  | 'Heavy Loading'
  | 'Sprint Velocity'
  | 'Agility Cut'
  | 'Power Output'
  | 'Reactive Elasticity'
  | 'Engine Threshold'
  | 'Rotational Torque'
  | 'Loaded Carry'
  | 'Combat Conditioning'
  | 'Base Endurance'
  | 'Decompression'
  | 'Deep Stretch'
  | 'Joint Prehab'
  | 'Fascial Release'
  | (string & {});

export type WorkoutMode = 'LIFT' | 'SPORTS' | 'RECOVERY';
export type WorkoutSubMode = 'AUTO' | 'MANUAL' | 'SWAPPER';

export interface WorkoutState {
  readonly activeSession: boolean;
  readonly selectedMode: WorkoutMode;
  readonly subMode: WorkoutSubMode;
  readonly activeRoutine: string;
  readonly exercises: readonly ExerciseItem[];
  readonly sets: readonly ExerciseSet[];
}

export interface ActiveWorkoutSession {
  id: string;
  routineTitle: string;
  startedAt: string;
  completedAt?: string;
  exercises: ExerciseItem[];
  strainScore: number;
  tonnageKg: number;
}


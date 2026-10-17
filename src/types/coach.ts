export interface CoachDirective {
  readonly id: string;
  readonly tag: 'RECOVERY' | 'TRAINING' | 'NUTRITION' | 'PERFORMANCE';
  readonly title: string;
  readonly summary: string;
  readonly affectedCount: number;
  readonly priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  readonly badgeStyle: string;
  readonly createdAt?: string;
}

export interface DispatchedExercise {
  readonly id: string;
  readonly name: string;
  readonly sets: number;
  readonly reps: number | string;
  readonly rpe?: number;
  readonly targetMuscle?: string;
  readonly restSecs?: number;
  readonly notes?: string;
  readonly weightKg?: number;
}

/** A set as coaches' clients write it; any field may be missing. */
interface AssignedSetRow {
  setNumber?: number;
  reps?: number;
  targetReps?: number;
  rpe?: number;
  weightKg?: number;
  weight?: number;
  targetWeightKg?: number;
}

export interface AssignedExerciseRow {
  id?: string | number;
  name?: string;
  exerciseName?: string;
  sets?: AssignedSetRow[] | number;
  setsCount?: number;
  reps?: number;
  rpe?: number;
  targetMuscle?: string;
  muscle?: string;
  equipment?: string;
  restSecs?: number;
  notes?: string;
  cue?: string;
  weightKg?: number;
}

/** Raw `assigned_workouts` row, as it arrives from a query or a realtime event. */
export interface AssignedWorkoutRow {
  id?: string;
  title?: string;
  coach_name?: string;
  status?: string;
  assigned_date?: string;
  parameters?: { focus?: string } | null;
  exercises?: AssignedExerciseRow[] | null;
  workout_data?: { title?: string; exercises?: AssignedExerciseRow[] } | null;
  routine_data?: { title?: string } | null;
}

export interface CoachDispatchedWorkout {
  readonly id: string;
  readonly title: string;
  readonly coachName: string;
  readonly coachAvatar?: string;
  readonly category: string;
  readonly totalSets: number;
  readonly durationMins: number;
  readonly status: 'pending' | 'active' | 'completed';
  readonly dispatchedAt: string;
  readonly notes?: string;
  readonly exercises: readonly DispatchedExercise[];
}

import { ExerciseItem, ExerciseSet, DailyVolumePoint } from '../../../types';

export const INITIAL_MICROCYCLE_VOLUME: DailyVolumePoint[] = [
  { day: 'Mon', shortDay: 'M', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Tue', shortDay: 'T', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Wed', shortDay: 'W', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Thu', shortDay: 'T', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Fri', shortDay: 'F', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Sat', shortDay: 'S', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Sun', shortDay: 'S', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
];

export interface CommittedSession {
  id: string;
  title: string;
  dateKey: string;
  tonnageKg: number;
  completedSets: number;
  totalReps: number;
  exercises: import('../../log/store/useTelemetryHistoryStore').ExerciseEntry[];
  items: ExerciseItem[];
  durationMinutes: number;
  avgRpe: number | null;
  /** Estimated net active kcal. Null when bodyweight is unknown. */
  burnedKcal: number | null;
}

export type NormalizedWorkoutMode = 'Lift' | 'Sports' | 'Recovery';
export type NormalizedWorkoutSubMode = 'AUTO' | 'MANUAL' | 'SWAPPER';
export type WorkoutExercise = ExerciseItem;
export type WorkoutSet = ExerciseSet;

export interface WorkoutStoreState {
  activeSession: boolean;
  selectedMode: NormalizedWorkoutMode;
  subMode: NormalizedWorkoutSubMode;
  activeRoutine: string;
  exercises: ExerciseItem[];
  activeLogs: ExerciseItem[];
  isRestDayActive: boolean;
  sessionTonnageKg: number;
  completedSetsCount: number;
  totalRepsCount: number;
  recoveryEnergyScore: number;
  weeklyVolumeData: DailyVolumePoint[];
}

export interface WorkoutStoreActions {
  setActiveSession: (active: boolean) => void;
  setMode: (mode: NormalizedWorkoutMode | 'LIFT' | 'SPORTS' | 'RECOVERY') => void;
  addExerciseToActiveLog: (exercise: WorkoutExercise) => void;
  addExercisesToActiveLog: (exercises: WorkoutExercise[]) => void;
  clearActiveLog: () => void;
  /** Saves ticked sets to today, then empties the tracker. Null when nothing was ticked. */
  commitSession: () => CommittedSession | null;
  setActiveRoutine: (routine: string) => void;
  setActiveLogs: (
    exercises: ExerciseItem[] | ((prev: ExerciseItem[]) => ExerciseItem[])
  ) => void;
  setExercises: (
    exercises: ExerciseItem[] | ((prev: ExerciseItem[]) => ExerciseItem[])
  ) => void;
  swapExercise: (oldExerciseId: string, newExercise: Partial<ExerciseItem>) => void;
  deployProtocol: (newExercises: ExerciseItem[]) => void;
  updateExerciseSet: (
    exerciseId: string,
    setNumber: number,
    updates: Partial<ExerciseSet>
  ) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setNumber: number) => void;
  toggleSetCompleted: (exerciseId: string, setNumber: number) => void;
  completeEarlierSets: (exerciseId: string, setNumber: number) => void;
  clearDailyWorkout: () => void;
}

export const initialWorkoutState: WorkoutStoreState = {
  activeSession: false,
  selectedMode: 'Lift',
  subMode: 'AUTO',
  activeRoutine: '',
  exercises: [],
  activeLogs: [],
  isRestDayActive: false,
  sessionTonnageKg: 0,
  completedSetsCount: 0,
  totalRepsCount: 0,
  recoveryEnergyScore: 0,
  weeklyVolumeData: INITIAL_MICROCYCLE_VOLUME,
};


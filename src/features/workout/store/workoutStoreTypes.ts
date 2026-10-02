import { ExerciseItem, ExerciseSet, DailyVolumePoint } from '../../../types';
import { MobilityExercise } from '../../../data/recoveryRoutines';

export const INITIAL_MICROCYCLE_VOLUME: DailyVolumePoint[] = [
  { day: 'Mon', shortDay: 'M', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Tue', shortDay: 'T', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Wed', shortDay: 'W', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Thu', shortDay: 'T', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Fri', shortDay: 'F', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Sat', shortDay: 'S', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
  { day: 'Sun', shortDay: 'S', volumeKg: 0, targetKg: 0, strain: 0, setsCount: 0, isToday: false },
];

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
  activeExercises: ExerciseItem[];
  isExerciseHubOpen: boolean;
  hydrationLiters: number;
  isRestDayActive: boolean;
  supplementsLogged: number;
  selectedProgramTitle: string;
  toastMessage: string | null;
  currentWallpaperIndex: number;
  customWallpaperUrl: string | null;
  sessionTonnageKg: number;
  completedSetsCount: number;
  totalRepsCount: number;
  recoveryEnergyScore: number;
  weeklyVolumeData: DailyVolumePoint[];
}

export interface WorkoutStoreActions {
  setActiveSession: (active: boolean) => void;
  setMode: (mode: NormalizedWorkoutMode | 'LIFT' | 'SPORTS' | 'RECOVERY') => void;
  setSubMode: (sub: NormalizedWorkoutSubMode) => void;
  toggleExerciseHub: () => void;
  setExerciseHubOpen: (open: boolean) => void;
  addExerciseToActiveLog: (exercise: WorkoutExercise) => void;
  addExercisesToActiveLog: (exercises: WorkoutExercise[]) => void;
  clearActiveLog: () => void;
  cycleWallpaper: () => void;
  setWallpaperIndex: (index: number) => void;
  setCustomWallpaperUrl: (url: string | null) => void;
  setActiveRoutine: (routine: string) => void;
  setActiveLogs: (
    exercises: ExerciseItem[] | ((prev: ExerciseItem[]) => ExerciseItem[])
  ) => void;
  setExercises: (
    exercises: ExerciseItem[] | ((prev: ExerciseItem[]) => ExerciseItem[])
  ) => void;
  swapExercise: (oldExerciseId: string, newExercise: Partial<ExerciseItem>) => void;
  deployProtocol: (newExercises: ExerciseItem[]) => void;
  loadSevenWorkouts: (programTitle: string) => void;
  postCardio: (cardioData: {
    type: string;
    calories: number;
    durationMins: number;
    avgHr: number;
    steps: number;
  }) => void;
  appendExercise: (exercise: ExerciseItem) => void;
  addRecoveryExercise: (drill: MobilityExercise) => void;
  updateExerciseSet: (
    exerciseId: string,
    setNumber: number,
    updates: Partial<ExerciseSet>
  ) => void;
  updateSet: (
    exerciseId: string,
    setIndex: number,
    field: string,
    value: any
  ) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setNumber: number) => void;
  toggleSetCompleted: (exerciseId: string, setNumber: number) => void;
  setHydrationLiters: (liters: number | ((prev: number) => number)) => void;
  toggleRestDay: () => void;
  setSupplementsLogged: (count: number | ((prev: number) => number)) => void;
  setSelectedProgramTitle: (title: string) => void;
  clearDailyWorkout: () => void;
  seedWorkoutDemo: () => void;
  clearWorkoutState: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

export const initialWorkoutState: WorkoutStoreState = {
  activeSession: false,
  selectedMode: 'Lift',
  subMode: 'AUTO',
  activeRoutine: '',
  exercises: [],
  activeLogs: [],
  activeExercises: [],
  isExerciseHubOpen: false,
  hydrationLiters: 0,
  isRestDayActive: false,
  supplementsLogged: 0,
  selectedProgramTitle: 'V-TAPER SCULPTOR',
  toastMessage: null,
  currentWallpaperIndex: 0,
  customWallpaperUrl: null,
  sessionTonnageKg: 0,
  completedSetsCount: 0,
  totalRepsCount: 0,
  recoveryEnergyScore: 92,
  weeklyVolumeData: INITIAL_MICROCYCLE_VOLUME,
};


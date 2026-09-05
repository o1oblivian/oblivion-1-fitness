export type AppMode = 'home' | 'tracker' | 'fuel' | 'buddy' | 'coach' | 'client' | 'tandem';

export type AuthMode = 'signin' | 'signup';

export interface UserSession {
  email: string;
  name?: string;
}

export interface SetData {
  id: string;
  reps: number | string;
  weight: number; // or seconds or meters
  rpe: number;
  rawVal1?: string;
  rawVal2?: string;
  isWarmup?: boolean;
}

export interface ExerciseLog {
  id: string;
  exerciseName: string;
  sets: SetData[];
  supersetGroupId?: string;
  supersetIndex?: number;
}

export type TrackingType = 'reps_weight' | 'reps_time' | 'time_dist';

export interface SizeOption {
  name: string;
  weightGrams: number;
  p: number;
  c: number;
  f: number;
}

export interface FoodItem {
  icon: string;
  name: string;
  p: number;
  c: number;
  f: number;
  brand?: string;
  category?: string;
  country?: string; // e.g. 'US', 'AU', 'GB', 'IN', 'GLOBAL'
  servingUnit?: string;
  defaultServingGrams?: number;
  sizes?: SizeOption[];
}

export interface LoggedMealItem {
  id: string;
  name: string;
  weight: number | string;
  p: number;
  c: number;
  f: number;
  cals: number;
}

export interface DailyMeals {
  breakfast: LoggedMealItem[];
  lunch: LoggedMealItem[];
  dinner: LoggedMealItem[];
  snack: LoggedMealItem[];
  drinks: LoggedMealItem[];
}

export interface AthleteData {
  key: string;
  name: string;
  handle: string;
  avatar: string;
  badge: string;
  todayLog: { name: string; sets: string }[];
  history: { day: string; summary: string }[];
  status?: string;
  volume?: string;
}

export interface SessionSet {
  weight: number;
  reps: number;
  rpe: number;
}

export interface SessionExercise {
  name: string;
  sets: SessionSet[];
  hasVideo?: boolean;
  videoDuration?: string;
  isPR?: boolean;
  prDelta?: number;
}

export interface TrainingSession {
  id: string;
  date: string;
  dateLabel: string;
  title: string;
  totalVolume: number;
  duration: string;
  avgRPE: number;
  exercises: SessionExercise[];
  completed: boolean;
}

export interface DailyMacroLog {
  date: string;
  dateLabel: string;
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
  hydration: number;
  hydrationTarget: number;
}

export interface ExerciseProgressPoint {
  week: string;
  estimated1RM: number;
  topWeight: number;
  totalVolume: number;
  avgRPE: number;
}

export interface AthleteTelemetry {
  athleteId: string;
  name: string;
  handle: string;
  tier: string;
  recoveryScore: number;
  recoveryTrend: number[];
  sessions: TrainingSession[];
  macroHistory: DailyMacroLog[];
  exerciseProgress: Record<string, ExerciseProgressPoint[]>;
  prs: { exercise: string; weight: number; delta: number; date: string }[];
  bodyweightHistory: { week: string; weight: number }[];
  compliance: {
    trainingAdherence: number;
    nutritionAdherence: number;
    weeklyStreak: number;
  };
  aiBriefing: string;
}

export interface DialConfig {
  isOpen: boolean;
  type: string;
  maxVal: number;
  currentVal: number;
  onConfirm: (val: number) => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export type MuscleId =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'upperBack'
  | 'lowerBack';

export type VolumeStatus = 'none' | 'under' | 'optimal' | 'over';

export interface LoggedSet {
  exercise: string;
  weightKg: number;
  reps: number;
  rpe: number | null;
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
}

export interface SleepSample {
  day: string;
  hours: number;
  recoveryPct: number | null;
}

export interface WeighIn {
  day: string;
  kg: number;
}

export interface ReportInput {
  sets: LoggedSet[];
  sleep: SleepSample[];
  weighIns: WeighIn[];
  currentWeightKg: number;
  targetWeightKg: number;
  targetSessionsPerWeek: number;
  now: number;
}

export interface MuscleVolume {
  id: MuscleId;
  label: string;
  /** Weighted hard sets in the last 7 days (secondary muscles credited at 0.5). */
  sets: number;
  status: VolumeStatus;
  min: number;
  max: number;
  lastTrainedDaysAgo: number | null;
  /** Weighted sets per rolling week, oldest → newest (4 entries). */
  weekly: number[];
  topExercises: { name: string; sets: number }[];
}

export type LiftTrend = 'rising' | 'steady' | 'plateau' | 'declining';

export interface LiftProgress {
  name: string;
  sessions: number;
  currentE1rm: number;
  bestE1rm: number;
  bestDay: string;
  changePct: number | null;
  trend: LiftTrend;
  recentPb: boolean;
  /** Best set of the most recent session. */
  lastWeightKg: number;
  lastReps: number;
  lastDay: string;
  series: { day: string; e1rm: number }[];
}

export interface PersonalBest {
  exercise: string;
  e1rm: number;
  weightKg: number;
  reps: number;
  day: string;
}

export type ScorePartId = 'strength' | 'consistency' | 'recovery' | 'bodyComp';

export interface ScorePart {
  id: ScorePartId;
  label: string;
  /** null = not enough data; render as `--`. */
  value: number | null;
  weight: number;
  detail: string;
}

export type ActionKind =
  | 'volume_add'
  | 'volume_reduce'
  | 'plateau'
  | 'deload'
  | 'consistency'
  | 'recovery';

export interface ReportAction {
  id: string;
  kind: ActionKind;
  severity: 'info' | 'caution' | 'alert';
  title: string;
  detail: string;
  muscle?: MuscleId;
  exercise?: string;
}

export interface ReportStats {
  sessions28d: number;
  targetSessionsPerWeek: number;
  setsLast7: number;
  tonnageLast7Kg: number;
  acwr: number | null;
  acwrLabel: string;
  avgSleepHours: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
}

export interface OblivionReport {
  version: 1;
  generatedAt: number;
  hasData: boolean;
  /** null when fewer than two score components have data. */
  score: number | null;
  grade: string;
  parts: ScorePart[];
  muscles: MuscleVolume[];
  lifts: LiftProgress[];
  personalBests: PersonalBest[];
  actions: ReportAction[];
  stats: ReportStats;
}

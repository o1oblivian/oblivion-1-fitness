import { CoachDispatchedWorkout } from '../types';

interface CoachAthleteRecord {
  id: string;
  name: string;
  avatar: string;
  split: string;
  complianceRate: number;
  lastActive: string;
  status?: string;
  currentWorkout?: string;
  rpe?: number;
  needsReview?: boolean;
  hasPr?: boolean;
}

export interface CoachFinishedWorkoutLog {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteAvatar?: string;
  title: string;
  tonnageKg: number;
  totalSets: number;
  totalReps: number;
  avgRpe: number;
  durationMinutes: number;
  completedAt: string;
  feedback?: string;
  feedbackGivenAt?: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weightKg: number;
    rpe: number;
  }>;
}

interface CoachLiveTelemetry {
  athleteId: string;
  athleteName: string;
  activeExercise?: string;
  currentSet?: number;
  currentWeightKg?: number;
  currentRpe?: number;
  sessionTonnageKg: number;
  isLive: boolean;
  lastUpdated: string;
}

export interface CoachState {
  /** Read by the Log tab's dispatch modal; the coach roster itself lives in `coach_clients`. */
  athletes: CoachAthleteRecord[];
  liveTelemetry: Record<string, CoachLiveTelemetry>;
  /** The coach's athletes' finished sessions, loaded from `workout_completions`. */
  finishedWorkouts: CoachFinishedWorkoutLog[];
  assignedWorkouts: CoachDispatchedWorkout[];
}

interface CoachActions {
  updateLiveTelemetry: (telemetry: CoachLiveTelemetry) => void;
  /** Athlete side: marks the session finished in live telemetry. */
  recordFinishedWorkout: (log: CoachFinishedWorkoutLog) => void;
  setFinishedWorkouts: (rows: CoachFinishedWorkoutLog[]) => void;
  upsertFinishedWorkout: (row: CoachFinishedWorkoutLog) => void;
  applyWorkoutFeedback: (workoutId: string, feedback: string, givenAt: string) => void;
  dispatchWorkout: (workout: CoachDispatchedWorkout) => void;
  ingestAssigned: (workout: CoachDispatchedWorkout) => void;
  completeAssigned: (id: string) => void;
}

export type CoachStore = CoachState & CoachActions;

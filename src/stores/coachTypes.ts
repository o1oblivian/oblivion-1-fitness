import { CoachDirective, CoachDispatchedWorkout, CoachEarnings, SquadAthlete } from '../types';

export type CoachSubTab = 'INTEL' | 'STORE' | 'CHECKINS' | 'INBOX' | 'CLIENTS' | 'EARNINGS' | 'CONSULTS';
export type CoachRosterFilter = 'ALL' | 'NEEDS REVIEW' | 'PRs';

export interface CoachAthleteRecord {
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

export interface DirectivePayload {
  targetAthleteId: string;
  split: 'Push' | 'Pull' | 'Legs' | 'Recovery';
  intensityRpe: number;
  coachMemo: string;
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

export interface CoachLiveTelemetry {
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

export interface CoachFinishNotification {
  id: string;
  athleteId: string;
  athleteName: string;
  workoutTitle: string;
  tonnageKg: number;
  timestamp: string;
  read: boolean;
}

export interface CoachState {
  selectedSubTab: CoachSubTab;
  activeRosterCount: number;
  rosterFilter: CoachRosterFilter;
  isRosterOpen: boolean;
  athletes: CoachAthleteRecord[];
  squadAthletes: SquadAthlete[];
  isDispatcherOpen: boolean;
  selectedAthleteForDirective: string | null;
  toastMessage: string | null;
  // Live Telemetry & Workout Logs
  liveTelemetry: Record<string, CoachLiveTelemetry>;
  finishedWorkouts: CoachFinishedWorkoutLog[];
  finishNotifications: CoachFinishNotification[];
  // Legacy / cross-feature compat
  directives: CoachDirective[];
  assignedWorkouts: CoachDispatchedWorkout[];
  earningsTransactions: CoachEarnings;
  auditAthlete: SquadAthlete | null;
  assignAthlete: SquadAthlete | null;
}

export interface CoachActions {
  setSelectedSubTab: (tab: CoachSubTab) => void;
  setRosterFilter: (filter: CoachRosterFilter) => void;
  toggleRoster: (open?: boolean) => void;
  toggleDispatcher: (open?: boolean, athleteId?: string) => void;
  dispatchDirective: (directive: DirectivePayload) => void;
  populateSampleRoster: () => void;
  clearRoster: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  // Live Telemetry & Workout Logs Actions
  updateLiveTelemetry: (telemetry: CoachLiveTelemetry) => void;
  recordFinishedWorkout: (log: CoachFinishedWorkoutLog) => void;
  submitCoachFeedback: (workoutId: string, feedback: string) => void;
  clearNotifications: () => void;
  // Legacy / cross-feature actions
  setSquadAthletes: (ath: SquadAthlete[]) => void;
  deployDirective: (dir: CoachDirective) => void;
  setAuditAthlete: (ath: SquadAthlete | null) => void;
  setAssignAthlete: (ath: SquadAthlete | null) => void;
  completeAudit: (athleteId: string, verdict: string) => void;
  confirmAssign: (athleteId: string, protocolName: string) => void;
  dispatchWorkout: (workout: CoachDispatchedWorkout) => void;
  ingestAssigned: (workout: CoachDispatchedWorkout) => void;
  completeAssigned: (id: string) => void;
}

export type CoachStore = CoachState & CoachActions;

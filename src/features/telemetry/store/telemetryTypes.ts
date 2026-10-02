import { TrainingSplit } from '../../../types';

export interface OperatorProfileMetrics {
  handle: string;
  strainValue: number;
  streakDays: number;
  avgVolumeKg: number;
  readinessScore: number;
  macroPrecision: number;
}

export interface HistoryWorkoutSession {
  id: string;
  title: string;
  timestamp: string;
  duration: string;
  strain: number;
  tonnageKg: number;
  totalSets: number;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    load: string;
  }[];
}

export interface TelemetryStoreState {
  metrics: OperatorProfileMetrics;
  stepCount: number;
  stepTarget: number;
  moveTarget: number;
  distTarget: number;
  selectedMicrocycleDay: number;
  activeSplit: TrainingSplit;
  isPhotoVaultOpen: boolean;
  isShareBenchmarkOpen: boolean;
  isQuickAddOpen: boolean;
  bioSyncPhase: string;
  bioSyncDayLabel: string;
  bioSyncStatusMessage: string;
  drinksCount: number;
  cleanHabitStreakDays: number;
  isClean: boolean;
  toastMessage: string | null;
  historyLogs: HistoryWorkoutSession[];
}

export interface TelemetryStoreActions {
  selectMicrocycleDay: (dayNum: number) => void;
  setActiveSplit: (split: TrainingSplit) => void;
  setPhotoVaultOpen: (open: boolean) => void;
  setShareBenchmarkOpen: (open: boolean) => void;
  setQuickAddOpen: (open: boolean) => void;
  updateMetrics: (updates: Partial<OperatorProfileMetrics>) => void;
  setBioSync: (phase: string, dayLabel: string, statusMessage?: string) => void;
  setDrinksCount: (drinks: number) => void;
  setStepCount: (steps: number) => void;
  setStepTarget: (target: number) => void;
  setMoveTarget: (target: number) => void;
  setDistTarget: (target: number) => void;
  addSteps: (steps: number) => void;
  logFastClean: () => void;
  addHistorySession: (session: HistoryWorkoutSession) => void;
  seedTelemetryDemo: () => void;
  clearTelemetryState: () => void;
  clearAllTelemetry: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

import { createStore } from '../utils/createStore';
import { safeStorage } from '../utils/safeStorage';
import { tactileEngine } from '../services/tactileEngine';

export interface AthleteProfile {
  handle: string;
  verified: boolean;
  avatarUrl: string;
}

export interface MicrocycleStats {
  strikeRate: string;
  streakDays: number;
  totalVolumeKg: number;
}

export interface PastSessionExercise {
  name: string;
  sets: number;
  reps: string;
  load: string;
}

export interface PastWorkoutSession {
  id: string;
  title: string;
  timestamp: string;
  duration: string;
  tonnageKg: number;
  totalSets: number;
  strain: number;
  exercises: PastSessionExercise[];
}

export interface CardioTelemetry {
  distanceKm: number;
  durationMinutes: number;
  zone2Minutes: number;
  avgHeartRateBpm: number;
  elevationMeters: number;
  burnedKcal: number;
  activityType?: string;
}

export interface NutritionTelemetry {
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinG: number;
  proteinTargetG: number;
  carbsG: number;
  carbsTargetG: number;
  fatsG: number;
  fatsTargetG: number;
  hydrationLiters: number;
  hydrationTargetLiters: number;
}

export interface SleepTelemetry {
  durationHours: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  deepPercentage: number;
  remPercentage: number;
  sleepPerformancePercent: number;
  restingHeartRate: number;
  hrvMs: number;
}

export interface MeditationTelemetry {
  minutesLogged: number;
  targetMinutes: number;
  sessionsCount: number;
  hrvSpikePercent: number;
  state: string;
}

export interface SubModulesTelemetry {
  cardio: CardioTelemetry;
  nutrition: NutritionTelemetry;
  sleep: SleepTelemetry;
  meditation: MeditationTelemetry;
}

export interface LogStoreState {
  athleteProfile: AthleteProfile;
  readinessScore: number;
  readinessLabel: string;
  microcycleStats: MicrocycleStats;
  selectedDayIndex: number;
  days: { dayNum: number; dayName: string; completed: boolean; strain: number }[];
  recentSessions: PastWorkoutSession[];
  subModules: SubModulesTelemetry;
  toastMessage: string | null;
}

export interface LogStoreActions {
  setSelectedDayIndex: (index: number) => void;
  setReadinessScore: (score: number, label?: string) => void;
  updateAthleteProfile: (profile: Partial<AthleteProfile>) => void;
  updateMicrocycleStats: (stats: Partial<MicrocycleStats>) => void;
  addRecentSession: (session: PastWorkoutSession) => void;
  setRecentSessions: (sessions: PastWorkoutSession[]) => void;
  updateSubModule: <K extends keyof SubModulesTelemetry>(key: K, data: Partial<SubModulesTelemetry[K]>) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const LOG_SESSIONS_STORAGE_KEY = 'o1fc_recent_sessions_v1';
const LOG_STATS_STORAGE_KEY = 'o1fc_microcycle_stats_v1';

const savedSessions = safeStorage.getItem<PastWorkoutSession[]>(LOG_SESSIONS_STORAGE_KEY, []);
const savedStats = safeStorage.getItem<MicrocycleStats | null>(LOG_STATS_STORAGE_KEY, null);

const initialLogState: LogStoreState = {
  athleteProfile: {
    handle: '@o1oblivionfitness',
    verified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&auto=format&fit=crop&q=80',
  },
  readinessScore: 85,
  readinessLabel: 'CNS READY // SESSION ACTIVE',
  microcycleStats: savedStats || {
    strikeRate: '0 / 7',
    streakDays: 0,
    totalVolumeKg: 0,
  },
  selectedDayIndex: 0,
  days: [
    { dayNum: 1, dayName: 'Mon', completed: false, strain: 0 },
    { dayNum: 2, dayName: 'Tue', completed: false, strain: 0 },
    { dayNum: 3, dayName: 'Wed', completed: false, strain: 0 },
    { dayNum: 4, dayName: 'Thu', completed: false, strain: 0 },
    { dayNum: 5, dayName: 'Fri', completed: false, strain: 0 },
    { dayNum: 6, dayName: 'Sat', completed: false, strain: 0 },
    { dayNum: 7, dayName: 'Sun', completed: false, strain: 0 },
  ],
  recentSessions: savedSessions || [],
  subModules: {
    cardio: {
      distanceKm: 0,
      durationMinutes: 0,
      zone2Minutes: 0,
      avgHeartRateBpm: 0,
      elevationMeters: 0,
      burnedKcal: 0,
    },
    nutrition: {
      caloriesConsumed: 0,
      caloriesTarget: 0,
      proteinG: 0,
      proteinTargetG: 0,
      carbsG: 0,
      carbsTargetG: 0,
      fatsG: 0,
      fatsTargetG: 0,
      hydrationLiters: 0,
      hydrationTargetLiters: 3.0,
    },
    sleep: {
      durationHours: 0,
      deepSleepMinutes: 0,
      remSleepMinutes: 0,
      deepPercentage: 0,
      remPercentage: 0,
      sleepPerformancePercent: 0,
      restingHeartRate: 0,
      hrvMs: 0,
    },
    meditation: {
      minutesLogged: 0,
      targetMinutes: 15,
      sessionsCount: 0,
      hrvSpikePercent: 0,
      state: 'Baseline',
    },
  },
  toastMessage: null,
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

const logStore = createStore<LogStoreState, LogStoreActions>(initialLogState, (set) => ({
  setSelectedDayIndex: (index) => {
    tactileEngine.triggerSelectionBuzz();
    set({ selectedDayIndex: index });
  },
  setReadinessScore: (score, label) => set((prev) => ({
    readinessScore: score,
    readinessLabel: label || prev.readinessLabel,
  })),
  updateAthleteProfile: (profile) => set((prev) => ({
    athleteProfile: { ...prev.athleteProfile, ...profile },
  })),
  updateMicrocycleStats: (stats) => set((prev) => {
    const nextStats = { ...prev.microcycleStats, ...stats };
    safeStorage.setItem(LOG_STATS_STORAGE_KEY, nextStats);
    return { microcycleStats: nextStats };
  }),
  addRecentSession: (session) => set((prev) => {
    const nextSessions = [session, ...prev.recentSessions];
    safeStorage.setItem(LOG_SESSIONS_STORAGE_KEY, nextSessions);
    return { recentSessions: nextSessions };
  }),
  setRecentSessions: (sessions) => set(() => {
    safeStorage.setItem(LOG_SESSIONS_STORAGE_KEY, sessions);
    return { recentSessions: sessions };
  }),
  updateSubModule: (key, data) => set((prev) => ({
    subModules: {
      ...prev.subModules,
      [key]: { ...prev.subModules[key], ...data },
    },
  })),
  showToast: (_msg) => {
    // Intentionally neutralized: in-app toast banners disabled permanently
  },
  clearToast: () => set({ toastMessage: null }),
}));

export const useLogStore = logStore.useStore;

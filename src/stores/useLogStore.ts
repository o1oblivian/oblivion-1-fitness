import { createStore } from '../utils/createStore';

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

/** Today's live telemetry. Day history lives in useTelemetryHistoryStore, hydrated from Supabase. */
export interface LogStoreState {
  subModules: SubModulesTelemetry;
}

export interface LogStoreActions {
  updateSubModule: <K extends keyof SubModulesTelemetry>(key: K, data: Partial<SubModulesTelemetry[K]>) => void;
}

const initialLogState: LogStoreState = {
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
};

const logStore = createStore<LogStoreState, LogStoreActions>(initialLogState, (set) => ({
  updateSubModule: (key, data) => set((prev) => ({
    subModules: {
      ...prev.subModules,
      [key]: { ...prev.subModules[key], ...data },
    },
  })),
}));

export const useLogStore = logStore.useStore;

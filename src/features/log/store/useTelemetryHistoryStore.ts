import { createStore } from '../../../utils/createStore';
import { safeStorage } from '../../../utils/safeStorage';
import { tactileEngine } from '../../../services/tactileEngine';
import { cancelDayLogSync, queueDayLogSync } from '../services/dayLogCloud';
import { scrubLegacySleepDefaults } from './legacySleep';

export type TelemetryCategory = 'workout' | 'cardio' | 'nutrition' | 'sleep' | 'meditation';

export interface LoggedSet {
  reps: number;
  weightKg: number;
}

export interface ExerciseEntry {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  /** Sum of load × reps. Session tonnage can differ when bodyweight is included. */
  volumeKg?: number;
  completed?: boolean;
  /** One entry per logged set. Absent on older days that only stored the first set. */
  setLog?: LoggedSet[];
}

interface MealEntry {
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  time?: string;
  slot?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drinks' | 'supplements';
}

export interface WorkoutDayRecord {
  hasData: boolean;
  tonnageKg: number;
  completedSets: number;
  durationMinutes: number;
  routineName: string;
  intensityRpe: number;
  exercises: ExerciseEntry[];
  /** Estimated net active kcal from lifting. Absent when bodyweight was unknown. */
  burnedKcal?: number;
}

export interface CardioDayRecord {
  hasData: boolean;
  distanceKm: number;
  durationMinutes: number;
  burnedKcal: number;
  avgHeartRateBpm: number;
  zone2Minutes: number;
  activityType: string;
  steps?: number;
  /** Estimated active kcal from the day's steps. Phone only, and kept apart from a logged session's burn. */
  stepKcal?: number;
}

export interface NutritionDayRecord {
  hasData: boolean;
  calories: number;
  calorieTarget: number;
  proteinG: number;
  proteinTargetG: number;
  carbsG: number;
  carbsTargetG: number;
  fatsG: number;
  fatsTargetG: number;
  meals: MealEntry[];
}

export interface SleepDayRecord {
  hasData: boolean;
  durationHours: number;
  durationMinutes: number;
  recoveryPercent: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  sleepEfficiencyPercent: number;
  restingHeartRate: number;
  bedtime: string;
  wakeTime: string;
}

export interface MeditationDayRecord {
  hasData: boolean;
  minutes: number;
  coherence: string;
  protocol: string;
  sessions: number;
  hrvScore: number;
}

export interface DayTelemetryRecord {
  workout: WorkoutDayRecord;
  cardio: CardioDayRecord;
  nutrition: NutritionDayRecord;
  sleep: SleepDayRecord;
  meditation: MeditationDayRecord;
}

interface TelemetryHistoryState {
  // Keyed by dateKey 'YYYY-MM-DD'
  historyByDate: Record<string, Partial<DayTelemetryRecord>>;
}

interface TelemetryHistoryActions {
  updateDayRecord: <C extends TelemetryCategory>(
    dateKey: string,
    category: C,
    record: Partial<DayTelemetryRecord[C]>,
    options?: { skipCloud?: boolean },
  ) => void;
  clearDayRecord: (dateKey: string, category: TelemetryCategory) => void;
  resetAllHistory: () => void;
}

const STORAGE_KEY = 'o1fc_telemetry_5day_history_v1';

export interface DayMeta {
  offset: number;
  dateKey: string;
  dayLabel: string;
  dayPillLabel: string;
  dateFormatted: string;
  isToday: boolean;
  isYesterday: boolean;
}

const sanitizeAndMigrateHistory = (
  saved: Record<string, Partial<DayTelemetryRecord>>,
): Record<string, Partial<DayTelemetryRecord>> => {
  const result: Record<string, Partial<DayTelemetryRecord>> = { ...saved };

  for (const dateKey of Object.keys(result)) {
    const day = result[dateKey];
    if (!day) continue;

    if (day.sleep) day.sleep = scrubLegacySleepDefaults(day.sleep);

    // Detect if workout has cardio exercises mistakenly stored
    if (day.workout?.exercises && Array.isArray(day.workout.exercises)) {
      const cardioExs = day.workout.exercises.filter(
        (e) =>
          e.name.toLowerCase().startsWith('cardio:') || e.name.toLowerCase().includes('telemetry'),
      );

      if (cardioExs.length > 0) {
        const cEx = cardioExs[0];
        const match = cEx.name.match(/\((\d+)m\)/);
        const duration = match ? parseInt(match[1], 10) : 0;

        if (!day.cardio || !day.cardio.hasData) {
          day.cardio = {
            hasData: true,
            distanceKm: 0,
            durationMinutes: duration,
            burnedKcal: 0,
            avgHeartRateBpm: 0,
            zone2Minutes: 0,
            activityType:
              cEx.name.replace(/^Cardio:\s*/i, '').replace(/\s*\(\d+m\)$/, '') || 'Cardio',
          };
        }

        // Clean out cardio items from workout resistance exercises
        const realLifts = day.workout.exercises.filter(
          (e) =>
            !e.name.toLowerCase().startsWith('cardio:') &&
            !e.name.toLowerCase().includes('telemetry'),
        );

        if (realLifts.length === 0 && (!day.workout.tonnageKg || day.workout.tonnageKg === 0)) {
          day.workout = {
            ...defaultWorkout,
            hasData: false,
            tonnageKg: 0,
            completedSets: 0,
            durationMinutes: 0,
            exercises: [],
          };
        } else {
          day.workout = {
            ...day.workout,
            exercises: realLifts,
            completedSets: realLifts.length,
          };
        }
      }
    }
  }

  // Ensure cardio exercises mistakenly in resistance workouts are classified properly
  return result;
};

const loadPersistedHistory = (): Record<string, Partial<DayTelemetryRecord>> => {
  if (typeof window === 'undefined') return {};
  const saved = safeStorage.getItem<Record<string, Partial<DayTelemetryRecord>>>(STORAGE_KEY, {});
  return sanitizeAndMigrateHistory(saved || {});
};

const defaultWorkout: WorkoutDayRecord = {
  hasData: false,
  tonnageKg: 0,
  completedSets: 0,
  durationMinutes: 0,
  routineName: '',
  intensityRpe: 0,
  exercises: [],
};

const defaultCardio: CardioDayRecord = {
  hasData: false,
  distanceKm: 0,
  durationMinutes: 0,
  burnedKcal: 0,
  avgHeartRateBpm: 0,
  zone2Minutes: 0,
  activityType: '',
};

const defaultNutrition: NutritionDayRecord = {
  hasData: false,
  calories: 0,
  calorieTarget: 0,
  proteinG: 0,
  proteinTargetG: 0,
  carbsG: 0,
  carbsTargetG: 0,
  fatsG: 0,
  fatsTargetG: 0,
  meals: [],
};

const defaultSleep: SleepDayRecord = {
  hasData: false,
  durationHours: 0,
  durationMinutes: 0,
  recoveryPercent: 0,
  deepSleepMinutes: 0,
  remSleepMinutes: 0,
  sleepEfficiencyPercent: 0,
  restingHeartRate: 0,
  bedtime: '',
  wakeTime: '',
};

const defaultMeditation: MeditationDayRecord = {
  hasData: false,
  minutes: 0,
  coherence: '',
  protocol: '',
  sessions: 0,
  hrvScore: 0,
};

const getDefaultCategoryRecord = <C extends TelemetryCategory>(
  category: C,
): DayTelemetryRecord[C] => {
  switch (category) {
    case 'workout':
      return { ...defaultWorkout } as DayTelemetryRecord[C];
    case 'cardio':
      return { ...defaultCardio } as DayTelemetryRecord[C];
    case 'nutrition':
      return { ...defaultNutrition } as DayTelemetryRecord[C];
    case 'sleep':
      return { ...defaultSleep } as DayTelemetryRecord[C];
    case 'meditation':
      return { ...defaultMeditation } as DayTelemetryRecord[C];
  }
};

const initialHistory = loadPersistedHistory();

const telemetryHistoryStore = createStore<TelemetryHistoryState, TelemetryHistoryActions>(
  { historyByDate: initialHistory },
  (set) => ({
    updateDayRecord: (dateKey, category, record, options) => {
      const toSync: Array<[TelemetryCategory, Record<string, unknown>]> = [];
      let repairCloud = false;
      set((prev) => {
        const currentDay = { ...(prev.historyByDate[dateKey] || {}) };
        const currentCategory = currentDay[category] || getDefaultCategoryRecord(category);

        let sanitizedRecord = { ...record };
        if (category === 'nutrition') {
          const nr = { ...(record as Partial<NutritionDayRecord>) };
          if (nr.carbsG !== undefined) nr.carbsG = Math.round(nr.carbsG * 10) / 10;
          if (nr.proteinG !== undefined) nr.proteinG = Math.round(nr.proteinG * 10) / 10;
          if (nr.fatsG !== undefined) nr.fatsG = Math.round(nr.fatsG * 10) / 10;
          if (nr.calories !== undefined) nr.calories = Math.round(nr.calories);
          sanitizedRecord = nr as unknown as typeof sanitizedRecord;
        }

        if (category === 'workout' && (sanitizedRecord as Partial<WorkoutDayRecord>).exercises) {
          const wr = sanitizedRecord as Partial<WorkoutDayRecord>;
          const currentLifts = (currentCategory as WorkoutDayRecord).exercises || [];
          const currentHasSets = currentLifts.some((lift) => (lift.setLog?.length || 0) > 0);
          const incomingHasSets = (wr.exercises || []).some(
            (lift) => (lift.setLog?.length || 0) > 0,
          );
          if (currentHasSets && !incomingHasSets) wr.exercises = currentLifts;
          const cardioExs = (wr.exercises || []).filter(
            (e) =>
              e.name.toLowerCase().startsWith('cardio:') ||
              e.name.toLowerCase().includes('telemetry'),
          );
          if (cardioExs.length > 0) {
            const cEx = cardioExs[0];
            const match = cEx.name.match(/\((\d+)m\)/);
            const duration = match ? parseInt(match[1], 10) : 0;
            if (!currentDay.cardio?.hasData) {
              currentDay.cardio = {
                hasData: true,
                distanceKm: 0,
                durationMinutes: duration,
                burnedKcal: 0,
                avgHeartRateBpm: 0,
                zone2Minutes: 0,
                activityType:
                  cEx.name.replace(/^Cardio:\s*/i, '').replace(/\s*\(\d+m\)$/, '') || 'Cardio',
              };
              toSync.push(['cardio', { ...currentDay.cardio }]);
            }
            wr.exercises = (wr.exercises || []).filter(
              (e) =>
                !e.name.toLowerCase().startsWith('cardio:') &&
                !e.name.toLowerCase().includes('telemetry'),
            );
            if (wr.exercises.length === 0 && (!wr.tonnageKg || wr.tonnageKg === 0)) {
              wr.hasData = false;
              wr.completedSets = 0;
            }
          }
        }

        let updatedCategory = {
          ...currentCategory,
          ...sanitizedRecord,
          hasData: true,
        };
        if (category === 'sleep') {
          const sleep = updatedCategory as unknown as SleepDayRecord;
          const scrubbed = scrubLegacySleepDefaults(sleep);
          if (scrubbed !== sleep) {
            updatedCategory = scrubbed as unknown as typeof updatedCategory;
            repairCloud = true;
          }
        }

        // If data is already identical, bail out without mutating store
        if (
          currentCategory.hasData &&
          JSON.stringify(currentCategory) === JSON.stringify(updatedCategory)
        ) {
          toSync.length = 0;
          if (repairCloud) toSync.push([category, { ...updatedCategory }]);
          return prev;
        }

        const nextHistory = {
          ...prev.historyByDate,
          [dateKey]: {
            ...currentDay,
            [category]: updatedCategory,
          },
        };

        toSync.push([category, { ...updatedCategory }]);
        safeStorage.setItem(STORAGE_KEY, nextHistory);
        return { historyByDate: nextHistory };
      });
      if (options?.skipCloud && !repairCloud) return;
      for (const [syncCategory, payload] of toSync) {
        queueDayLogSync(dateKey, syncCategory, payload);
      }
    },

    clearDayRecord: (dateKey, category) => {
      tactileEngine.triggerSelectionBuzz();
      cancelDayLogSync(dateKey, category);
      set((prev) => {
        const currentDay = prev.historyByDate[dateKey];
        if (!currentDay) return prev;

        const nextHistory = {
          ...prev.historyByDate,
          [dateKey]: {
            ...currentDay,
            [category]: getDefaultCategoryRecord(category),
          },
        };
        safeStorage.setItem(STORAGE_KEY, nextHistory);
        return { historyByDate: nextHistory };
      });
    },

    resetAllHistory: () => {
      tactileEngine.triggerSelectionBuzz();
      safeStorage.removeItem(STORAGE_KEY);
      set({ historyByDate: {} });
    },
  }),
);

export const useTelemetryHistoryStore = telemetryHistoryStore.useStore;
export const getTelemetryHistoryState = telemetryHistoryStore.getState;

import { createStore } from '../../../utils/createStore';
import { safeStorage } from '../../../utils/sanitizers';
import { tactileEngine } from '../../../services/tactileEngine';

export type TelemetryCategory = 'workout' | 'cardio' | 'nutrition' | 'sleep' | 'meditation';

export interface ExerciseEntry {
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  completed?: boolean;
}

export interface MealEntry {
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  time?: string;
}

export interface WorkoutDayRecord {
  hasData: boolean;
  tonnageKg: number;
  completedSets: number;
  durationMinutes: number;
  routineName: string;
  intensityRpe: number;
  exercises: ExerciseEntry[];
}

export interface CardioDayRecord {
  hasData: boolean;
  distanceKm: number;
  durationMinutes: number;
  burnedKcal: number;
  avgHeartRateBpm: number;
  zone2Minutes: number;
  activityType: string;
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

export interface TelemetryHistoryState {
  // Keyed by dateKey 'YYYY-MM-DD'
  historyByDate: Record<string, Partial<DayTelemetryRecord>>;
}

export interface TelemetryHistoryActions {
  updateDayRecord: <C extends TelemetryCategory>(
    dateKey: string,
    category: C,
    record: Partial<DayTelemetryRecord[C]>
  ) => void;
  clearDayRecord: (dateKey: string, category: TelemetryCategory) => void;
  resetAllHistory: () => void;
}

const STORAGE_KEY = 'o1fc_telemetry_5day_history_v1';

// Dynamic helper for past 5 days
export interface DayMeta {
  offset: number;
  dateKey: string;
  dayLabel: string;
  dayPillLabel: string;
  dateFormatted: string;
  isToday: boolean;
  isYesterday: boolean;
}

export function getPastDays(daysCount: number = 5): DayMeta[] {
  const days: DayMeta[] = [];
  const dayNamesShort = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const dayNamesFull = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    const isToday = i === 0;
    const isYesterday = i === 1;

    const dayLabel = isToday ? 'TODAY' : isYesterday ? 'YESTERDAY' : dayNamesFull[dayOfWeek];
    const dayPillLabel = isToday ? 'TO' : isYesterday ? 'YE' : dayNamesShort[dayOfWeek];

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    days.push({
      offset: i,
      dateKey,
      dayLabel,
      dayPillLabel,
      dateFormatted,
      isToday,
      isYesterday,
    });
  }
  return days;
}

export function getPast5Days(): DayMeta[] {
  return getPastDays(5);
}

const sanitizeAndMigrateHistory = (
  saved: Record<string, Partial<DayTelemetryRecord>>
): Record<string, Partial<DayTelemetryRecord>> => {
  let modified = false;
  const result: Record<string, Partial<DayTelemetryRecord>> = { ...saved };

  for (const dateKey of Object.keys(result)) {
    const day = result[dateKey];
    if (!day) continue;

    // Detect if workout has cardio exercises mistakenly stored
    if (day.workout?.exercises && Array.isArray(day.workout.exercises)) {
      const cardioExs = day.workout.exercises.filter((e) =>
        e.name.toLowerCase().startsWith('cardio:') || e.name.toLowerCase().includes('telemetry')
      );

      if (cardioExs.length > 0) {
        modified = true;
        const cEx = cardioExs[0];
        const match = cEx.name.match(/\((\d+)m\)/);
        const duration = match ? parseInt(match[1], 10) : 33;
        const dist = Number((duration * 0.13).toFixed(1)) || 4.2;
        const cals = Math.round(duration * 7.5) || 240;

        // Populate cardio record if missing or empty
        if (!day.cardio || !day.cardio.hasData || day.cardio.durationMinutes === 0 || day.cardio.distanceKm === 0) {
          day.cardio = {
            hasData: true,
            distanceKm: dist,
            durationMinutes: duration,
            burnedKcal: cals,
            avgHeartRateBpm: 142,
            zone2Minutes: Math.round(duration * 0.75),
            activityType: cEx.name.replace(/^Cardio:\s*/i, '').replace(/\s*\(\d+m\)$/, '') || 'Watch Telemetry',
          };
        }

        // Clean out cardio items from workout resistance exercises
        const realLifts = day.workout.exercises.filter(
          (e) => !e.name.toLowerCase().startsWith('cardio:') && !e.name.toLowerCase().includes('telemetry')
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
  routineName: 'Push Hypertrophy',
  intensityRpe: 8,
  exercises: [],
};

const defaultCardio: CardioDayRecord = {
  hasData: false,
  distanceKm: 0,
  durationMinutes: 0,
  burnedKcal: 0,
  avgHeartRateBpm: 0,
  zone2Minutes: 0,
  activityType: 'Treadmill Incline',
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
  bedtime: '23:00',
  wakeTime: '07:00',
};

const defaultMeditation: MeditationDayRecord = {
  hasData: false,
  minutes: 0,
  coherence: 'Alpha Wave',
  protocol: 'Tactical Box Breathing 4-4-4-4',
  sessions: 0,
  hrvScore: 0,
};

export const getDefaultCategoryRecord = <C extends TelemetryCategory>(category: C): DayTelemetryRecord[C] => {
  switch (category) {
    case 'workout':
      return { ...defaultWorkout } as DayTelemetryRecord[C];
    case 'cardio':
      return { ...defaultCardio } as DayTelemetryRecord[C];
    case 'nutrition': {
      // Dynamic fallback to client's configured targets if saved in fuel store
      let targetCal = 0;
      let targetP = 0;
      let targetC = 0;
      let targetF = 0;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('o1fc_fuel_state_v5');
          if (raw) {
            const parsed = JSON.parse(raw);
            targetCal = Number(parsed.calorieTarget) || 0;
            targetP = Number(parsed.targetProteinG) || 0;
            targetC = Number(parsed.targetCarbsG) || 0;
            targetF = Number(parsed.targetFatsG) || 0;
          }
        } catch {
          // ignore
        }
      }
      return {
        ...defaultNutrition,
        calorieTarget: targetCal,
        proteinTargetG: targetP,
        carbsTargetG: targetC,
        fatsTargetG: targetF,
      } as DayTelemetryRecord[C];
    }
    case 'sleep':
      return { ...defaultSleep } as DayTelemetryRecord[C];
    case 'meditation':
      return { ...defaultMeditation } as DayTelemetryRecord[C];
  }
};

const initialHistory = loadPersistedHistory();

const telemetryHistoryStore = createStore<TelemetryHistoryState, TelemetryHistoryActions>(
  { historyByDate: initialHistory },
  (set, get) => ({
    updateDayRecord: (dateKey, category, record) => {
      set((prev) => {
        const currentDay = prev.historyByDate[dateKey] || {};
        const currentCategory = currentDay[category] || getDefaultCategoryRecord(category);
        
        let sanitizedRecord = { ...record };
        if (category === 'nutrition') {
          const nr = { ...(record as Partial<NutritionDayRecord>) };
          if (nr.carbsG !== undefined) nr.carbsG = Math.round(nr.carbsG * 10) / 10;
          if (nr.proteinG !== undefined) nr.proteinG = Math.round(nr.proteinG * 10) / 10;
          if (nr.fatsG !== undefined) nr.fatsG = Math.round(nr.fatsG * 10) / 10;
          if (nr.calories !== undefined) nr.calories = Math.round(nr.calories);
          sanitizedRecord = nr as any;
        }

        if (category === 'workout' && (sanitizedRecord as any).exercises) {
          const wr = sanitizedRecord as Partial<WorkoutDayRecord>;
          const cardioExs = (wr.exercises || []).filter((e) =>
            e.name.toLowerCase().startsWith('cardio:') || e.name.toLowerCase().includes('telemetry')
          );
          if (cardioExs.length > 0) {
            const cEx = cardioExs[0];
            const match = cEx.name.match(/\((\d+)m\)/);
            const duration = match ? parseInt(match[1], 10) : 33;
            currentDay.cardio = {
              hasData: true,
              distanceKm: Number((duration * 0.13).toFixed(1)) || 4.2,
              durationMinutes: duration,
              burnedKcal: Math.round(duration * 7.5) || 240,
              avgHeartRateBpm: 142,
              zone2Minutes: Math.round(duration * 0.75),
              activityType: cEx.name.replace(/^Cardio:\s*/i, '').replace(/\s*\(\d+m\)$/, '') || 'Watch Telemetry',
            };
            wr.exercises = (wr.exercises || []).filter(
              (e) => !e.name.toLowerCase().startsWith('cardio:') && !e.name.toLowerCase().includes('telemetry')
            );
            if (wr.exercises.length === 0 && (!wr.tonnageKg || wr.tonnageKg === 0)) {
              wr.hasData = false;
              wr.completedSets = 0;
            }
          }
        }

        const updatedCategory = {
          ...currentCategory,
          ...sanitizedRecord,
          hasData: true,
        };

        // If data is already identical, bail out without mutating store
        if (
          currentCategory.hasData &&
          JSON.stringify(currentCategory) === JSON.stringify(updatedCategory)
        ) {
          return prev;
        }

        const nextHistory = {
          ...prev.historyByDate,
          [dateKey]: {
            ...currentDay,
            [category]: updatedCategory,
          },
        };

        safeStorage.setItem(STORAGE_KEY, nextHistory);
        return { historyByDate: nextHistory };
      });
    },

    clearDayRecord: (dateKey, category) => {
      tactileEngine.triggerSelectionBuzz();
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
  })
);

export const useTelemetryHistoryStore = telemetryHistoryStore.useStore;
export const getTelemetryHistoryState = telemetryHistoryStore.getState;
export const setTelemetryHistoryState = telemetryHistoryStore.setState;

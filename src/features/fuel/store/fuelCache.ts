import { safeStorage } from '../../../utils/safeStorage';
import { type FuelDayTotals, localDateKey } from '../services/fuelCloud';
import { blankDay, blankProfile, emptyMeals } from './fuelDefaults';
import { type Outbox, emptyOutbox } from './fuelOutbox';
import type { FuelDayFields, FuelProfileFields, FuelState } from './fuelTypes';

/** What is kept on the device between launches so the app works offline. */
export interface FuelCache {
  userId: string | null;
  profile: FuelProfileFields;
  day: FuelDayFields;
  outbox: Outbox;
  week?: Record<string, FuelDayTotals>;
}

const CACHE_KEY = 'o1fc_fuel_cache_v6';
const LEGACY_KEYS = [
  'o1fc_fuel_state_v5',
  'o1_supplements_stack_v2',
  'o1_electrolytes_log_v1',
  'O1_OFFLINE_MUTATION_QUEUE',
  'O1_LAST_SYNCED_AT',
];

/** Reads the saved cache, removing old formats. A different day's log starts blank. */
export function readCache(): FuelCache {
  const cached = safeStorage.getItem<FuelCache | null>(CACHE_KEY, null);
  for (const key of LEGACY_KEYS) safeStorage.removeItem(key);
  if (!cached || typeof cached !== 'object' || !cached.profile || !cached.day) {
    return {
      userId: null,
      profile: blankProfile(),
      day: blankDay(),
      outbox: emptyOutbox(),
      week: {},
    };
  }
  const today = localDateKey();
  return {
    userId: cached.userId ?? null,
    week: cached.week && typeof cached.week === 'object' ? cached.week : {},
    profile: {
      ...blankProfile(),
      ...cached.profile,
      body: { ...blankProfile().body, ...cached.profile.body },
    },
    day:
      cached.day.dateKey === today
        ? { ...blankDay(today), ...cached.day, meals: { ...emptyMeals(), ...cached.day.meals } }
        : blankDay(today),
    outbox: { ...emptyOutbox(), ...cached.outbox },
  };
}

export function writeCache(state: FuelState, userId: string | null, outbox: Outbox): void {
  safeStorage.setItem(CACHE_KEY, {
    userId,
    profile: {
      calorieTarget: state.calorieTarget,
      targetProteinG: state.targetProteinG,
      targetCarbsG: state.targetCarbsG,
      targetFatsG: state.targetFatsG,
      hydrationTargetL: state.hydrationTargetL,
      weightKg: state.weightKg,
      body: state.body,
      countryMarket: state.countryMarket,
      dietPreference: state.dietPreference,
      supplementStack: state.supplementStack,
    },
    day: {
      dateKey: state.dateKey,
      meals: state.meals,
      hydrationCurrentL: state.hydrationCurrentL,
      burnedKcal: state.burnedKcal,
      supplementsTaken: state.supplementsTaken,
      electrolytes: state.electrolytes,
    },
    outbox,
    week: state.weekTotals,
  } satisfies FuelCache);
}

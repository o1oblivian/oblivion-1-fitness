import { create } from 'zustand';
import { safeStorage } from '../../../utils/safeStorage';
import { tactileEngine } from '../../../services/tactileEngine';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { registerExternalQueue } from '../../../services/syncOutbox';
import { getTelemetryHistoryState } from '../../log/store/useTelemetryHistoryStore';
import {
  CloudMeal,
  Electrolytes,
  FUEL_SLOTS,
  FuelDayPatch,
  FuelDayTotals,
  FuelProfilePatch,
  FuelSlot,
  SupplementItem,
  SupplementTiming,
  SupplementUnit,
  deleteMealRow,
  fetchFuelSnapshot,
  fetchFuelWeek,
  insertMealRow,
  localDateKey,
  toMealRow,
  upsertFuelDay,
  upsertFuelProfile,
} from '../services/fuelCloud';
import { lastSevenDateKeys, sumMacros } from '../utils/fuelMath';

export type { FuelSlot, SupplementItem, SupplementTiming, SupplementUnit, Electrolytes };

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export type FuelMeals = Record<FuelSlot, MealItem[]>;

export type BiologicalSex = 'male' | 'female';

interface FuelBody {
  heightCm: number | null;
  ageYears: number | null;
  sex: BiologicalSex | null;
}

const ZERO_ELECTROLYTES: Electrolytes = { sodium: 0, potassium: 0, magnesium: 0 };

interface FuelProfileFields {
  calorieTarget: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatsG: number | null;
  hydrationTargetL: number | null;
  weightKg: number | null;
  body: FuelBody;
  countryMarket: string;
  dietPreference: string;
  supplementStack: SupplementItem[];
}

interface FuelDayFields {
  dateKey: string;
  meals: FuelMeals;
  hydrationCurrentL: number;
  burnedKcal: number;
  supplementsTaken: string[];
  electrolytes: Electrolytes;
}

export interface FuelState extends FuelProfileFields, FuelDayFields {
  cloudReady: boolean;
  /** Cloud totals for the six days before today; today always comes from live meals. */
  weekTotals: Record<string, FuelDayTotals>;

  hydrate: () => Promise<void>;
  setEnergyTargets: (cal: number, p: number, c: number, f: number, weight?: number | null) => void;
  setWeightKg: (kg: number) => void;
  setBody: (patch: Partial<FuelBody>) => void;
  setCountryMarket: (country: string) => void;
  setDietPreference: (diet: string) => void;
  logHydration: (liters: number) => void;
  setHydrationLiters: (liters: number) => void;
  logBurned: (kcal: number) => void;
  addMealItem: (slot: FuelSlot, item: MealItem) => void;
  addFoodItem: (category: string, item: Partial<MealItem> & { name: string }) => void;
  removeMealItem: (slot: FuelSlot, itemId: string) => void;
  clearDailyMeals: () => void;
  setSupplementStack: (stack: SupplementItem[]) => void;
  toggleSupplementTaken: (id: string) => void;
  setSupplementsTaken: (ids: string[]) => void;
  setElectrolytes: (next: Electrolytes) => void;
}

interface PendingMeal {
  dateKey: string;
  meal: CloudMeal;
}

interface Outbox {
  inserts: PendingMeal[];
  deletes: string[];
  profile: FuelProfilePatch;
  days: Record<string, FuelDayPatch>;
}

interface FuelCache {
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
const LEGACY_WORKOUT_STACK_KEY = 'o1fc_supplement_stack_v1';
const MAX_WATER_L = 10;

interface LegacyWorkoutStack {
  items?: Array<{ id: string; name: string; dose: string; timing: 'Morning' | 'Evening' }>;
  takenByDay?: Record<string, string[]>;
}

function emptyMeals(): FuelMeals {
  return { breakfast: [], lunch: [], dinner: [], snack: [], drinks: [], supplements: [] };
}

function deviceCountry(): string {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    if (region && /^[A-Z]{2}$/.test(region)) return region;
  } catch {
    /* locale unavailable */
  }
  return 'AU';
}

function blankProfile(): FuelProfileFields {
  return {
    calorieTarget: null,
    targetProteinG: null,
    targetCarbsG: null,
    targetFatsG: null,
    hydrationTargetL: null,
    weightKg: null,
    body: { heightCm: null, ageYears: null, sex: null },
    countryMarket: typeof navigator === 'undefined' ? 'AU' : deviceCountry(),
    dietPreference: 'Omnivore',
    supplementStack: [],
  };
}

function blankDay(dateKey = localDateKey()): FuelDayFields {
  return {
    dateKey,
    meals: emptyMeals(),
    hydrationCurrentL: 0,
    burnedKcal: 0,
    supplementsTaken: [],
    electrolytes: { ...ZERO_ELECTROLYTES },
  };
}

function emptyOutbox(): Outbox {
  return { inserts: [], deletes: [], profile: {}, days: {} };
}

function positiveOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readCache(): FuelCache {
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

const boot = readCache();
let cacheUserId = boot.userId;
let outbox: Outbox = boot.outbox;

function historyCategory(slot: FuelSlot): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' {
  if (slot === 'breakfast') return 'Breakfast';
  if (slot === 'dinner') return 'Dinner';
  if (slot === 'snack' || slot === 'drinks' || slot === 'supplements') return 'Snacks';
  return 'Lunch';
}

function slotFromCategory(category: string): FuelSlot {
  const lower = category.toLowerCase();
  if (lower.includes('breakfast')) return 'breakfast';
  if (lower.includes('lunch')) return 'lunch';
  if (lower.includes('dinner')) return 'dinner';
  if (lower.includes('drink')) return 'drinks';
  if (lower.includes('supplement') || lower.includes('electrolyte')) return 'supplements';
  return 'snack';
}

function mealsFromCloud(rows: CloudMeal[]): FuelMeals {
  const meals = emptyMeals();
  for (const row of rows) {
    meals[row.slot].push({
      id: row.id,
      name: row.name,
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fats: row.fats,
    });
  }
  return meals;
}

export const useFuelStore = create<FuelState>((set, get) => {
  let flushing: Promise<void> | null = null;
  let flushAgain = false;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const persist = () => {
    const s = get();
    safeStorage.setItem(CACHE_KEY, {
      userId: cacheUserId,
      profile: {
        calorieTarget: s.calorieTarget,
        targetProteinG: s.targetProteinG,
        targetCarbsG: s.targetCarbsG,
        targetFatsG: s.targetFatsG,
        hydrationTargetL: s.hydrationTargetL,
        weightKg: s.weightKg,
        body: s.body,
        countryMarket: s.countryMarket,
        dietPreference: s.dietPreference,
        supplementStack: s.supplementStack,
      },
      day: {
        dateKey: s.dateKey,
        meals: s.meals,
        hydrationCurrentL: s.hydrationCurrentL,
        burnedKcal: s.burnedKcal,
        supplementsTaken: s.supplementsTaken,
        electrolytes: s.electrolytes,
      },
      outbox,
      week: s.weekTotals,
    } satisfies FuelCache);
  };

  const flushOutbox = async (userId: string): Promise<void> => {
    for (const pending of [...outbox.inserts]) {
      if (!(await insertMealRow(toMealRow(userId, pending.dateKey, pending.meal)))) return;
      outbox.inserts = outbox.inserts.filter((p) => p.meal.id !== pending.meal.id);
    }
    for (const id of [...outbox.deletes]) {
      if (!(await deleteMealRow(userId, id))) return;
      outbox.deletes = outbox.deletes.filter((d) => d !== id);
    }
    const profilePatch = outbox.profile;
    if (Object.keys(profilePatch).length > 0) {
      if (!(await upsertFuelProfile(userId, profilePatch))) return;
      if (outbox.profile === profilePatch) outbox.profile = {};
    }
    for (const [dateKey, dayPatch] of Object.entries(outbox.days)) {
      if (!(await upsertFuelDay(userId, dateKey, dayPatch))) return;
      if (outbox.days[dateKey] === dayPatch) {
        const { [dateKey]: _sent, ...rest } = outbox.days;
        outbox.days = rest;
      }
    }
  };

  const flush = async (): Promise<void> => {
    if (flushing) {
      flushAgain = true;
      return flushing;
    }
    flushing = (async () => {
      do {
        flushAgain = false;
        const userId = await getAuthenticatedUserId();
        if (!userId) break;
        await flushOutbox(userId);
        persist();
      } while (flushAgain);
    })().finally(() => {
      flushing = null;
    });
    return flushing;
  };

  const scheduleFlush = (delayMs: number) => {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flush();
    }, delayMs);
  };

  const queueProfile = (patch: FuelProfilePatch) => {
    outbox.profile = { ...outbox.profile, ...patch };
    persist();
    scheduleFlush(600);
  };

  const queueDay = (patch: FuelDayPatch) => {
    const key = get().dateKey;
    outbox.days = { ...outbox.days, [key]: { ...outbox.days[key], ...patch } };
    persist();
    scheduleFlush(600);
  };

  const ensureToday = () => {
    const today = localDateKey();
    const s = get();
    if (s.dateKey === today) return;
    const items = FUEL_SLOTS.flatMap((slot) => s.meals[slot]);
    const closed = items.length > 0 ? { [s.dateKey]: sumMacros(items) } : {};
    const keep = new Set(lastSevenDateKeys().slice(0, 6));
    const weekTotals = Object.fromEntries(
      Object.entries({ ...s.weekTotals, ...closed }).filter(([k]) => keep.has(k)),
    );
    set({ ...blankDay(today), weekTotals });
  };

  const mirrorHistory = () => {
    const s = get();
    const items = FUEL_SLOTS.flatMap((slot) => s.meals[slot].map((meal) => ({ meal, slot })));
    const totals = sumMacros(items.map((i) => i.meal));
    getTelemetryHistoryState().updateDayRecord(
      s.dateKey,
      'nutrition',
      {
        hasData: items.length > 0,
        calories: totals.calories,
        calorieTarget: s.calorieTarget ?? 0,
        proteinG: totals.protein,
        proteinTargetG: s.targetProteinG ?? 0,
        carbsG: totals.carbs,
        carbsTargetG: s.targetCarbsG ?? 0,
        fatsG: totals.fats,
        fatsTargetG: s.targetFatsG ?? 0,
        meals: items.map(({ meal, slot }) => ({
          name: meal.name,
          category: historyCategory(slot),
          slot,
          calories: meal.calories,
          proteinG: meal.protein,
          carbsG: meal.carbs,
          fatsG: meal.fats,
        })),
      },
      { skipCloud: true },
    );
  };

  const adoptLegacyWorkoutStack = () => {
    const legacy = safeStorage.getItem<LegacyWorkoutStack | null>(LEGACY_WORKOUT_STACK_KEY, null);
    safeStorage.removeItem(LEGACY_WORKOUT_STACK_KEY);
    const items = Array.isArray(legacy?.items) ? legacy.items : [];
    if (items.length === 0) return;
    const s = get();
    const known = new Set(s.supplementStack.map((x) => x.name.trim().toLowerCase()));
    const adopted: SupplementItem[] = items
      .filter((it) => it?.name && !known.has(it.name.trim().toLowerCase()))
      .map((it) => ({
        id: it.id,
        name: it.name.trim(),
        dosage: it.dose || '1 serving',
        timing: it.timing,
        category: 'Custom',
      }));
    if (adopted.length === 0) return;
    const takenToday = new Set(legacy?.takenByDay?.[s.dateKey] ?? []);
    s.setSupplementStack([...s.supplementStack, ...adopted]);
    const adoptedTaken = adopted.filter((a) => takenToday.has(a.id)).map((a) => a.id);
    if (adoptedTaken.length > 0)
      s.setSupplementsTaken([...get().supplementsTaken, ...adoptedTaken]);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => void flush());
  }
  registerExternalQueue('fuel', {
    flush,
    pending: () =>
      outbox.inserts.length +
      outbox.deletes.length +
      (Object.keys(outbox.profile).length > 0 ? 1 : 0) +
      Object.keys(outbox.days).length,
  });

  return {
    ...boot.profile,
    ...boot.day,
    cloudReady: false,
    weekTotals: boot.week ?? {},

    hydrate: async () => {
      ensureToday();
      const userId = await getAuthenticatedUserId();
      if (!userId) return;
      if (cacheUserId && cacheUserId !== userId) {
        outbox = emptyOutbox();
        set({ ...blankProfile(), ...blankDay(), weekTotals: {} });
      }
      cacheUserId = userId;
      await flush();
      const dateKey = get().dateKey;
      const weekKeys = lastSevenDateKeys().slice(0, 6);
      const [snapshot, week] = await Promise.all([
        fetchFuelSnapshot(userId, dateKey),
        fetchFuelWeek(userId, weekKeys[0], weekKeys[5]),
      ]);
      if (week && get().dateKey === dateKey) set({ weekTotals: week });
      if (!snapshot || get().dateKey !== dateKey) return;

      const p = snapshot.profile;
      const d = snapshot.day;
      const pendingIds = new Set(
        outbox.inserts.filter((x) => x.dateKey === dateKey).map((x) => x.meal.id),
      );
      const meals = mealsFromCloud([
        ...snapshot.meals.filter((m) => !outbox.deletes.includes(m.id) && !pendingIds.has(m.id)),
        ...outbox.inserts.filter((x) => x.dateKey === dateKey).map((x) => x.meal),
      ]);
      const local = get();
      set({
        cloudReady: true,
        calorieTarget: p ? positiveOrNull(p.calorie_target) : local.calorieTarget,
        targetProteinG: p ? positiveOrNull(p.protein_g) : local.targetProteinG,
        targetCarbsG: p ? positiveOrNull(p.carbs_g) : local.targetCarbsG,
        targetFatsG: p ? positiveOrNull(p.fats_g) : local.targetFatsG,
        hydrationTargetL: p
          ? (positiveOrNull(p.hydration_target_ml) ?? 0) / 1000 || null
          : local.hydrationTargetL,
        weightKg: p ? positiveOrNull(p.weight_kg) : local.weightKg,
        body: p
          ? {
              heightCm: positiveOrNull(p.height_cm),
              ageYears: positiveOrNull(p.age_years),
              sex: p.sex ?? null,
            }
          : local.body,
        countryMarket: p?.country || local.countryMarket,
        dietPreference: p?.diet || local.dietPreference,
        supplementStack:
          p && Array.isArray(p.supplement_stack) ? p.supplement_stack : local.supplementStack,
        meals,
        hydrationCurrentL: d ? Math.round(Number(d.water_ml || 0)) / 1000 : 0,
        burnedKcal: d ? Number(d.burned_kcal || 0) : 0,
        supplementsTaken: d && Array.isArray(d.supplements_taken) ? d.supplements_taken : [],
        electrolytes: d?.electrolytes
          ? { ...ZERO_ELECTROLYTES, ...d.electrolytes }
          : { ...ZERO_ELECTROLYTES },
      });
      if (!p) {
        const s = get();
        queueProfile({
          calorie_target: s.calorieTarget,
          protein_g: s.targetProteinG,
          carbs_g: s.targetCarbsG,
          fats_g: s.targetFatsG,
          weight_kg: s.weightKg,
          country: s.countryMarket,
          diet: s.dietPreference,
          supplement_stack: s.supplementStack,
        });
      }
      adoptLegacyWorkoutStack();
      mirrorHistory();
      persist();
    },

    setEnergyTargets: (cal, p, c, f, weight) => {
      const next = {
        calorieTarget: positiveOrNull(Math.round(cal)),
        targetProteinG: positiveOrNull(Math.round(p)),
        targetCarbsG: positiveOrNull(Math.round(c)),
        targetFatsG: positiveOrNull(Math.round(f)),
        ...(weight != null && weight > 0 ? { weightKg: Math.round(weight * 10) / 10 } : {}),
      };
      set(next);
      queueProfile({
        calorie_target: next.calorieTarget,
        protein_g: next.targetProteinG,
        carbs_g: next.targetCarbsG,
        fats_g: next.targetFatsG,
        ...(next.weightKg != null ? { weight_kg: next.weightKg } : {}),
      });
    },

    setWeightKg: (kg) => {
      const weightKg = positiveOrNull(Math.round(kg * 10) / 10);
      if (weightKg === get().weightKg) return;
      set({ weightKg });
      queueProfile({ weight_kg: weightKg });
    },

    setBody: (patch) => {
      const body = { ...get().body, ...patch };
      set({ body });
      queueProfile({ height_cm: body.heightCm, age_years: body.ageYears, sex: body.sex });
    },

    setCountryMarket: (country) => {
      set({ countryMarket: country });
      queueProfile({ country });
    },

    setDietPreference: (diet) => {
      set({ dietPreference: diet });
      queueProfile({ diet });
    },

    logHydration: (liters) => {
      ensureToday();
      tactileEngine.triggerDialHaptic();
      get().setHydrationLiters(get().hydrationCurrentL + liters);
    },

    setHydrationLiters: (liters) => {
      ensureToday();
      const next = Math.max(0, Math.min(MAX_WATER_L, Math.round(liters * 1000) / 1000));
      set({ hydrationCurrentL: next });
      queueDay({ water_ml: Math.round(next * 1000) });
    },

    logBurned: (kcal) => {
      ensureToday();
      const next = Math.max(0, Math.round(get().burnedKcal + kcal));
      set({ burnedKcal: next });
      queueDay({ burned_kcal: next });
    },

    addMealItem: (slot, item) => {
      ensureToday();
      tactileEngine.triggerSelectionBuzz();
      const meal: MealItem = {
        id: item.id || `meal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: item.name || 'Food',
        calories: Math.max(0, Number(item.calories) || 0),
        protein: Math.max(0, Number(item.protein) || 0),
        carbs: Math.max(0, Number(item.carbs) || 0),
        fats: Math.max(0, Number(item.fats) || 0),
      };
      set((s) => ({
        meals: { ...s.meals, [slot]: [meal, ...s.meals[slot].filter((m) => m.id !== meal.id)] },
      }));
      outbox.inserts = [
        ...outbox.inserts.filter((p) => p.meal.id !== meal.id),
        { dateKey: get().dateKey, meal: { ...meal, slot } },
      ];
      mirrorHistory();
      persist();
      void flush();
    },

    addFoodItem: (category, item) => {
      get().addMealItem(slotFromCategory(category), {
        id: item.id || '',
        name: item.name,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fats: Number(item.fats) || 0,
      });
    },

    removeMealItem: (slot, itemId) => {
      tactileEngine.triggerSelectionBuzz();
      set((s) => ({ meals: { ...s.meals, [slot]: s.meals[slot].filter((m) => m.id !== itemId) } }));
      if (outbox.inserts.some((p) => p.meal.id === itemId)) {
        outbox.inserts = outbox.inserts.filter((p) => p.meal.id !== itemId);
      } else if (!outbox.deletes.includes(itemId)) {
        outbox.deletes = [...outbox.deletes, itemId];
      }
      mirrorHistory();
      persist();
      void flush();
    },

    clearDailyMeals: () => {
      set(blankDay());
      persist();
    },

    setSupplementStack: (stack) => {
      const ids = new Set(stack.map((s) => s.id));
      set((s) => ({
        supplementStack: stack,
        supplementsTaken: s.supplementsTaken.filter((id) => ids.has(id)),
      }));
      queueProfile({ supplement_stack: stack });
      queueDay({ supplements_taken: get().supplementsTaken });
    },

    toggleSupplementTaken: (id) => {
      ensureToday();
      tactileEngine.triggerSelectionBuzz();
      const taken = get().supplementsTaken;
      const next = taken.includes(id) ? taken.filter((t) => t !== id) : [...taken, id];
      set({ supplementsTaken: next });
      queueDay({ supplements_taken: next });
    },

    setSupplementsTaken: (ids) => {
      ensureToday();
      const valid = new Set(get().supplementStack.map((s) => s.id));
      const next = [...new Set(ids)].filter((id) => valid.has(id));
      set({ supplementsTaken: next });
      queueDay({ supplements_taken: next });
    },

    setElectrolytes: (next) => {
      ensureToday();
      const clean: Electrolytes = {
        sodium: Math.max(0, Math.round(next.sodium)),
        potassium: Math.max(0, Math.round(next.potassium)),
        magnesium: Math.max(0, Math.round(next.magnesium)),
      };
      set({ electrolytes: clean });
      queueDay({ electrolytes: clean });
    },
  };
});

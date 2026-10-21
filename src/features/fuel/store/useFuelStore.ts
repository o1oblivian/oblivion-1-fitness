import { create } from 'zustand';
import { safeStorage } from '../../../utils/safeStorage';
import { tactileEngine } from '../../../services/tactileEngine';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { registerExternalQueue } from '../../../services/syncOutbox';
import { getTelemetryHistoryState } from '../../log/store/useTelemetryHistoryStore';
import {
  type Electrolytes,
  type FuelDayPatch,
  type FuelProfilePatch,
  type FuelSlot,
  type SupplementItem,
  type SupplementTiming,
  type SupplementUnit,
  fetchFuelSnapshot,
  fetchFuelWeek,
  localDateKey,
} from '../services/fuelCloud';
import { lastSevenDateKeys } from '../utils/fuelMath';
import { readCache, writeCache } from './fuelCache';
import {
  blankDay,
  blankProfile,
  mealsFromCloud,
  normalizeMeal,
  positiveOrNull,
  slotFromCategory,
} from './fuelDefaults';
import {
  type LegacyWorkoutStack,
  adoptableSupplements,
  nutritionHistoryRecord,
  rollWeekTotals,
  stateFromSnapshot,
} from './fuelDerive';
import { clearOutbox, flushOutbox, outboxPending } from './fuelOutbox';
import type { FuelState } from './fuelTypes';

export type { FuelSlot, SupplementItem, SupplementTiming, SupplementUnit, Electrolytes };
export type { BiologicalSex, FuelMeals, FuelState, MealItem } from './fuelTypes';

const LEGACY_WORKOUT_STACK_KEY = 'o1fc_supplement_stack_v1';
const MAX_WATER_L = 10;

const boot = readCache();
let cacheUserId = boot.userId;
const outbox = boot.outbox;

export const useFuelStore = create<FuelState>((set, get) => {
  let flushing: Promise<void> | null = null;
  let flushAgain = false;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const persist = () => writeCache(get(), cacheUserId, outbox);

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
        await flushOutbox(outbox, userId);
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

  /** Starts a fresh log when the calendar day has changed since the app last ran. */
  const ensureToday = () => {
    const today = localDateKey();
    const s = get();
    if (s.dateKey === today) return;
    set({ ...blankDay(today), weekTotals: rollWeekTotals(s) });
  };

  const mirrorHistory = () => {
    const s = get();
    getTelemetryHistoryState().updateDayRecord(s.dateKey, 'nutrition', nutritionHistoryRecord(s), {
      skipCloud: true,
    });
  };

  const adoptLegacyWorkoutStack = () => {
    const legacy = safeStorage.getItem<LegacyWorkoutStack | null>(LEGACY_WORKOUT_STACK_KEY, null);
    safeStorage.removeItem(LEGACY_WORKOUT_STACK_KEY);
    const s = get();
    const { adopted, takenIds } = adoptableSupplements(legacy, s.supplementStack, s.dateKey);
    if (adopted.length === 0) return;
    s.setSupplementStack([...s.supplementStack, ...adopted]);
    if (takenIds.length > 0) s.setSupplementsTaken([...get().supplementsTaken, ...takenIds]);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => void flush());
  }
  registerExternalQueue('fuel', { flush, pending: () => outboxPending(outbox) });

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
        clearOutbox(outbox);
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

      // Meals still waiting to upload stay; meals waiting to be deleted stay gone.
      const pendingIds = new Set(
        outbox.inserts.filter((x) => x.dateKey === dateKey).map((x) => x.meal.id),
      );
      const meals = mealsFromCloud([
        ...snapshot.meals.filter((m) => !outbox.deletes.includes(m.id) && !pendingIds.has(m.id)),
        ...outbox.inserts.filter((x) => x.dateKey === dateKey).map((x) => x.meal),
      ]);
      set(stateFromSnapshot(snapshot, meals, get()));
      if (!snapshot.profile) {
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
      const meal = normalizeMeal(item);
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

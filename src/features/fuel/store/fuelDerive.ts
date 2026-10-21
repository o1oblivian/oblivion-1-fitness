import { FUEL_SLOTS, type FuelSnapshot, type SupplementItem } from '../services/fuelCloud';
import { lastSevenDateKeys, sumMacros } from '../utils/fuelMath';
import { ZERO_ELECTROLYTES, historyCategory, positiveOrNull } from './fuelDefaults';
import type { FuelMeals, FuelState } from './fuelTypes';

/**
 * The state to show once the account's data has arrived. Where the account has no profile yet,
 * the values already on this device stay.
 */
export function stateFromSnapshot(
  snapshot: FuelSnapshot,
  meals: FuelMeals,
  local: FuelState,
): Partial<FuelState> {
  const p = snapshot.profile;
  const d = snapshot.day;
  return {
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
  };
}

/** Week totals after the day rolls over: yesterday's meals are added, old days dropped. */
export function rollWeekTotals(state: FuelState): FuelState['weekTotals'] {
  const items = FUEL_SLOTS.flatMap((slot) => state.meals[slot]);
  const closed = items.length > 0 ? { [state.dateKey]: sumMacros(items) } : {};
  const keep = new Set(lastSevenDateKeys().slice(0, 6));
  return Object.fromEntries(
    Object.entries({ ...state.weekTotals, ...closed }).filter(([k]) => keep.has(k)),
  );
}

/** Today's meals and targets in the shape the day history keeps. */
export function nutritionHistoryRecord(state: FuelState) {
  const items = FUEL_SLOTS.flatMap((slot) => state.meals[slot].map((meal) => ({ meal, slot })));
  const totals = sumMacros(items.map((i) => i.meal));
  return {
    hasData: items.length > 0,
    calories: totals.calories,
    calorieTarget: state.calorieTarget ?? 0,
    proteinG: totals.protein,
    proteinTargetG: state.targetProteinG ?? 0,
    carbsG: totals.carbs,
    carbsTargetG: state.targetCarbsG ?? 0,
    fatsG: totals.fats,
    fatsTargetG: state.targetFatsG ?? 0,
    meals: items.map(({ meal, slot }) => ({
      name: meal.name,
      category: historyCategory(slot),
      slot,
      calories: meal.calories,
      proteinG: meal.protein,
      carbsG: meal.carbs,
      fatsG: meal.fats,
    })),
  };
}

/** An older version of the app kept supplements in a separate workout list. */
export interface LegacyWorkoutStack {
  items?: Array<{ id: string; name: string; dose: string; timing: 'Morning' | 'Evening' }>;
  takenByDay?: Record<string, string[]>;
}

/**
 * Supplements from the old workout list that the stack does not have yet, and which of them
 * were ticked on the given day.
 */
export function adoptableSupplements(
  legacy: LegacyWorkoutStack | null,
  stack: SupplementItem[],
  dateKey: string,
): { adopted: SupplementItem[]; takenIds: string[] } {
  const items = Array.isArray(legacy?.items) ? legacy.items : [];
  const known = new Set(stack.map((x) => x.name.trim().toLowerCase()));
  const adopted: SupplementItem[] = items
    .filter((it) => it?.name && !known.has(it.name.trim().toLowerCase()))
    .map((it) => ({
      id: it.id,
      name: it.name.trim(),
      dosage: it.dose || '1 serving',
      timing: it.timing,
      category: 'Custom',
    }));
  const takenToday = new Set(legacy?.takenByDay?.[dateKey] ?? []);
  return { adopted, takenIds: adopted.filter((a) => takenToday.has(a.id)).map((a) => a.id) };
}

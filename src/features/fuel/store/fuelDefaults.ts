import {
  type CloudMeal,
  type Electrolytes,
  type FuelSlot,
  localDateKey,
} from '../services/fuelCloud';
import type { FuelDayFields, FuelMeals, FuelProfileFields, MealItem } from './fuelTypes';

export const ZERO_ELECTROLYTES: Electrolytes = { sodium: 0, potassium: 0, magnesium: 0 };

export function emptyMeals(): FuelMeals {
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

export function blankProfile(): FuelProfileFields {
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

export function blankDay(dateKey = localDateKey()): FuelDayFields {
  return {
    dateKey,
    meals: emptyMeals(),
    hydrationCurrentL: 0,
    burnedKcal: 0,
    supplementsTaken: [],
    electrolytes: { ...ZERO_ELECTROLYTES },
  };
}

/** The value as a number if it is a positive, finite number; otherwise null. */
export function positiveOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** The meal group the day history uses for a slot. */
export function historyCategory(slot: FuelSlot): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' {
  if (slot === 'breakfast') return 'Breakfast';
  if (slot === 'dinner') return 'Dinner';
  if (slot === 'snack' || slot === 'drinks' || slot === 'supplements') return 'Snacks';
  return 'Lunch';
}

/** Which slot a free-text category such as "Pre-workout drink" belongs in. */
export function slotFromCategory(category: string): FuelSlot {
  const lower = category.toLowerCase();
  if (lower.includes('breakfast')) return 'breakfast';
  if (lower.includes('lunch')) return 'lunch';
  if (lower.includes('dinner')) return 'dinner';
  if (lower.includes('drink')) return 'drinks';
  if (lower.includes('supplement') || lower.includes('electrolyte')) return 'supplements';
  return 'snack';
}

export function mealsFromCloud(rows: CloudMeal[]): FuelMeals {
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

/** A meal ready to store: an id, a name, and macros that are never negative or NaN. */
export function normalizeMeal(item: MealItem): MealItem {
  return {
    id: item.id || `meal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: item.name || 'Food',
    calories: Math.max(0, Number(item.calories) || 0),
    protein: Math.max(0, Number(item.protein) || 0),
    carbs: Math.max(0, Number(item.carbs) || 0),
    fats: Math.max(0, Number(item.fats) || 0),
  };
}

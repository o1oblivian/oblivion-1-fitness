import type { FuelSlot } from '../services/fuelCloud';

/** The part of a logged meal that the usuals need. */
interface HistoryMeal {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  slot?: FuelSlot;
}

/** Logged days keyed by 'YYYY-MM-DD', as the telemetry history store holds them. */
export type MealHistory = Record<string, { nutrition?: { meals?: HistoryMeal[] } } | undefined>;

export interface Usual {
  name: string;
  slot: FuelSlot;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  /** How many past days this food was logged on. */
  days: number;
}

/** A food needs this many separate days before it counts as a usual. */
const MIN_DAYS = 2;
/** A food logged in the slot being shown ranks ahead of one logged elsewhere. */
const SLOT_WEIGHT = 3;
const FOOD_SLOTS: FuelSlot[] = ['breakfast', 'lunch', 'dinner', 'snack', 'drinks'];

/** The meal a person is most likely logging at this hour. */
export function slotForHour(hour: number): FuelSlot {
  if (hour >= 4 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 15) return 'lunch';
  if (hour >= 17 && hour < 22) return 'dinner';
  return 'snack';
}

interface Tally {
  display: string;
  latest: string;
  meal: HistoryMeal;
  days: Set<string>;
  bySlot: Map<FuelSlot, number>;
}

/**
 * The foods this person logs again and again, best first for the given meal slot.
 * Today is left out so a food logged this morning does not vouch for itself.
 */
export function buildUsuals(
  history: MealHistory,
  todayKey: string,
  slot: FuelSlot,
  limit = 5,
): Usual[] {
  const tallies = new Map<string, Tally>();

  for (const [dateKey, record] of Object.entries(history)) {
    if (dateKey >= todayKey) continue;
    for (const meal of record?.nutrition?.meals ?? []) {
      const name = meal.name?.trim();
      const mealSlot = meal.slot;
      if (!name || !mealSlot || !FOOD_SLOTS.includes(mealSlot) || !(meal.calories > 0)) continue;
      const key = name.toLowerCase();
      const tally = tallies.get(key) ?? {
        display: name,
        latest: dateKey,
        meal,
        days: new Set<string>(),
        bySlot: new Map<FuelSlot, number>(),
      };
      tally.days.add(dateKey);
      tally.bySlot.set(mealSlot, (tally.bySlot.get(mealSlot) ?? 0) + 1);
      if (dateKey >= tally.latest) {
        tally.latest = dateKey;
        tally.meal = meal;
      }
      tallies.set(key, tally);
    }
  }

  const score = (tally: Tally) =>
    tally.days.size + (tally.bySlot.get(slot) ?? 0) * (SLOT_WEIGHT - 1);

  return [...tallies.values()]
    .filter((tally) => tally.days.size >= MIN_DAYS)
    .sort((a, b) => score(b) - score(a) || (a.latest < b.latest ? 1 : -1))
    .slice(0, limit)
    .map((tally) => {
      const [likelySlot] = [...tally.bySlot.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        name: tally.display,
        slot: tally.bySlot.has(slot) ? slot : likelySlot,
        calories: Math.round(tally.meal.calories),
        protein: Math.round(tally.meal.proteinG),
        carbs: Math.round(tally.meal.carbsG),
        fats: Math.round(tally.meal.fatsG),
        days: tally.days.size,
      };
    });
}

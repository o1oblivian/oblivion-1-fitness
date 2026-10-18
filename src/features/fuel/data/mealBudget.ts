import type { MacroBudget, MealSlot } from '../../../../shared/mealSuggestion';

export type { MacroBudget, MealSlot };

/** How much of the day's food each meal usually carries. */
export const MEAL_SLOT_SHARE: Record<MealSlot, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

/** No meal is planned smaller than this, so a nearly finished day still gets a real suggestion. */
const SLOT_FLOOR: Record<MealSlot, { kcal: number; protein: number }> = {
  breakfast: { kcal: 300, protein: 25 },
  lunch: { kcal: 400, protein: 30 },
  dinner: { kcal: 400, protein: 30 },
  snack: { kcal: 150, protein: 12 },
};

const CARB_SHARE_OF_LEFTOVER = 0.6;
const KCAL_PER_G = { protein: 4, carbs: 4, fats: 9 };

/** Splits what is left of the day across the meals still open, weighted by their usual share. */
export function slotBudget(
  slot: MealSlot,
  remaining: MacroBudget,
  loggedSlots: readonly MealSlot[],
): MacroBudget {
  const open = (Object.keys(MEAL_SLOT_SHARE) as MealSlot[]).filter(
    (s) => s === slot || !loggedSlots.includes(s),
  );
  const weight = MEAL_SLOT_SHARE[slot] / open.reduce((total, s) => total + MEAL_SLOT_SHARE[s], 0);
  const floor = SLOT_FLOOR[slot];
  const part = (n: number) => Math.max(0, Math.round(n * weight));
  const kcal = Math.max(floor.kcal, part(remaining.kcal));
  const protein = Math.max(floor.protein, part(remaining.protein));
  const share = (n: number) => (remaining.kcal > 0 ? part(n) : 0);
  let carbs = share(remaining.carbs);
  let fats = share(remaining.fats);
  const leftover =
    kcal - protein * KCAL_PER_G.protein - carbs * KCAL_PER_G.carbs - fats * KCAL_PER_G.fats;
  if (leftover > 0) {
    carbs += Math.round((leftover * CARB_SHARE_OF_LEFTOVER) / KCAL_PER_G.carbs);
    fats += Math.round((leftover * (1 - CARB_SHARE_OF_LEFTOVER)) / KCAL_PER_G.fats);
  }
  return { kcal, protein, carbs, fats };
}

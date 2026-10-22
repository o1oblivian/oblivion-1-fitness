import type { BiologicalSex } from '../store/useFuelStore';

/** Energy in one kilogram of body weight. The usual rule of thumb for planning a pace. */
const KCAL_PER_KG = 7700;
/** Below this a plan stops being a diet and starts being a risk. */
export const CALORIE_FLOOR = 1200;
/** The activity multiplier the Energy Engine starts on: moderate, 3 to 5 sessions a week. */
export const DEFAULT_ACTIVITY_FACTOR = 1.55;
/** A pace above this share of bodyweight per week is too fast to hold. */
const MAX_WEEKLY_SHARE = 0.01;

export const PACE_CHOICES_KG_PER_WEEK = [0.25, 0.5, 0.75, 1] as const;

/** Mifflin-St Jeor resting burn, or null until weight, height, age and sex are all known. */
export function restingBurn(
  weightKg: number | null,
  heightCm: number | null,
  ageYears: number | null,
  sex: BiologicalSex | null,
): number | null {
  if (!weightKg || !heightCm || !ageYears || !sex) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

export const dailyBurn = (bmr: number, activityFactor = DEFAULT_ACTIVITY_FACTOR): number =>
  Math.round(bmr * activityFactor);

/** Calories a day that a pace in kg per week asks you to eat under, or over, your burn. */
export const paceKcalPerDay = (paceKgPerWeek: number): number =>
  Math.round((paceKgPerWeek * KCAL_PER_KG) / 7);

export interface PacePlan {
  kcal: number;
  /** Calories a day actually kept under (or over) the burn, which is less than asked at the floor. */
  gapKcal: number;
  atFloor: boolean;
  weeks: number;
}

/** What eating for a given pace looks like, or null when there is no goal to head for. */
export function planForPace(
  burnKcal: number,
  weightKg: number,
  goalKg: number,
  paceKgPerWeek: number,
): PacePlan | null {
  const remaining = goalKg - weightKg;
  if (!(burnKcal > 0) || !(weightKg > 0) || !(goalKg > 0) || remaining === 0) return null;
  const delta = paceKcalPerDay(paceKgPerWeek);
  const losing = remaining < 0;
  const wanted = losing ? burnKcal - delta : burnKcal + delta;
  const kcal = losing ? Math.max(CALORIE_FLOOR, wanted) : wanted;
  return {
    kcal,
    gapKcal: Math.abs(burnKcal - kcal),
    atFloor: losing && wanted < CALORIE_FLOOR,
    weeks: Math.max(1, Math.round(Math.abs(remaining) / paceKgPerWeek)),
  };
}

/** The paces worth offering: none faster than 1% of bodyweight a week. */
export function sensiblePaces(weightKg: number): number[] {
  return PACE_CHOICES_KG_PER_WEEK.filter((pace) => pace <= weightKg * MAX_WEEKLY_SHARE);
}

export interface MacroGrams {
  proteinG: number;
  fatsG: number;
  carbsG: number;
}

/** Protein and fat by bodyweight, carbohydrate takes whatever calories are left. */
export function macroGrams(
  weightKg: number,
  kcal: number,
  proteinPerKg = 2,
  fatsPerKg = 0.8,
): MacroGrams {
  const weight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 0;
  const proteinG = Math.round(weight * proteinPerKg);
  const fatsG = Math.round(weight * fatsPerKg);
  const carbsG = Math.round(Math.max(0, kcal - proteinG * 4 - fatsG * 9) / 4);
  return { proteinG, fatsG, carbsG };
}

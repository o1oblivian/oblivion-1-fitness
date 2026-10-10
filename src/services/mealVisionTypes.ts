export type ScanMode = 'plate' | 'package' | 'barcode';

/** Nutrient fields are `null` when the source did not report them; never substitute estimates. */
export interface ScannedMealBreakdown {
  dishName: string;
  servingDescription: string;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatsGrams: number | null;
  confidenceScore: number | null;
  ingredientsDetected: string[];
  barcode?: string;
  brand?: string;
}

/** Rounds a reported non-negative quantity, or returns `null` when it is missing or invalid. */
export function readNutrient(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/**
 * Calories as reported, otherwise derived from macros when all three are known.
 * A reported 0 alongside non-zero macros is treated as missing.
 */
export function resolveCalories(
  reported: number | null,
  protein: number | null,
  carbs: number | null,
  fat: number | null,
): number | null {
  const macrosKnown = protein !== null && carbs !== null && fat !== null;
  const derived = macrosKnown ? Math.round(protein * 4 + carbs * 4 + fat * 9) : null;
  if (reported === null) return derived;
  if (reported === 0 && derived !== null && derived > 0) return derived;
  return reported;
}

/** Model confidence as a 0-100 percentage, or `null` when not reported. */
export function readConfidence(value: unknown): number | null {
  const n = readNutrient(value);
  return n === null ? null : Math.min(100, n);
}

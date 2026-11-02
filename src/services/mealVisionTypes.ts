export type ScanMode = 'plate' | 'package' | 'barcode';

/** Every field is `null` when the source did not report it; never substitute estimates or labels. */
export interface ScannedMealBreakdown {
  dishName: string | null;
  servingDescription: string | null;
  /** Grams in one serving. `null` when the source gave no serving weight; the athlete then enters grams. */
  servingGrams: number | null;
  /** True when the nutrient figures are per 100 g of product rather than per serving. */
  per100g?: boolean;
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

/** Trimmed text, or `null` when the source sent nothing usable. */
export function readText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** A positive weight in grams, or `null`. A zero weight cannot scale anything. */
export function readGrams(value: unknown): number | null {
  const n = readNutrient(value);
  return n !== null && n > 0 ? n : null;
}

/** Grams written in a serving label such as "40 g" or "1 bar (45g)", or `null`. */
export function gramsInLabel(label: string | null): number | null {
  const match = label?.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  return match ? readGrams(match[1]) : null;
}

import type {
  MacroBudget,
  MealSuggestion,
  MealSuggestionRequest,
  SuggestedIngredient,
} from '../../shared/mealSuggestion';

/** One ingredient as the model proposed it, before any nutrition is looked up. */
export interface DraftIngredient {
  food: string;
  grams: number;
}

export interface DraftMeal {
  name: string;
  prepTime: string;
  ingredients: DraftIngredient[];
}

/** Nutrition for 100 g of a food, taken from a real database. */
export interface Per100g {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface ResolvedIngredient {
  draft: DraftIngredient;
  per100g: Per100g;
}

const MIN_INGREDIENTS = 2;
const MAX_INGREDIENTS = 7;
const MAX_MEALS = 3;
const MIN_GRAMS = 5;
const MAX_GRAMS = 600;
/** A plate may be rescaled by at most this much to hit the calorie target. */
const SCALE_RANGE = { min: 0.5, max: 1.7 };
/** Meals scoring below this are not worth showing. */
export const MIN_FIT = 60;

export function buildPrompt(request: MealSuggestionRequest): string {
  const { slot, target, diet, country, usuals, exclude } = request;
  const lines = [
    `You are a sports nutritionist. Suggest ${MAX_MEALS} different ${slot} ideas for an athlete.`,
    `Each meal should come to about ${target.kcal} kcal, ${target.protein} g protein, ${target.carbs} g carbohydrate and ${target.fats} g fat.`,
    `Diet: ${diet}. Every ingredient must be allowed on this diet.`,
    `Eating in: ${country}. Prefer foods that are easy to buy there.`,
    `Use plain, common ingredients named the way the USDA FoodData Central names them, for example "Chicken, broilers or fryers, breast, meat only, cooked, roasted" or "Rice, white, long-grain, cooked". Give weight in grams as eaten (cooked weight for cooked foods).`,
    `Use ${MIN_INGREDIENTS} to ${MAX_INGREDIENTS} ingredients per meal. No supplements.`,
  ];
  if (usuals.length) lines.push(`Foods this person already eats often: ${usuals.join(', ')}.`);
  if (exclude.length) lines.push(`Do not suggest these meals again: ${exclude.join(', ')}.`);
  lines.push(
    'Answer with JSON only, in this shape:',
    '{"meals":[{"name":"short meal name","prepTime":"10 min","ingredients":[{"food":"USDA style food name","grams":150}]}]}',
  );
  return lines.join('\n');
}

function clean(text: unknown, max: number): string {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Reads the model's JSON and keeps only well-formed meals, with weights clamped to a sane range. */
export function parseDraftMeals(raw: unknown): DraftMeal[] {
  const list = (raw as { meals?: unknown })?.meals;
  if (!Array.isArray(list)) return [];
  const meals: DraftMeal[] = [];
  for (const entry of list) {
    const name = clean((entry as { name?: unknown })?.name, 60);
    const source = (entry as { ingredients?: unknown })?.ingredients;
    if (!name || !Array.isArray(source)) continue;
    const ingredients: DraftIngredient[] = [];
    for (const item of source) {
      const food = clean((item as { food?: unknown })?.food, 120);
      const grams = Number((item as { grams?: unknown })?.grams);
      if (!food || !Number.isFinite(grams) || grams <= 0) continue;
      ingredients.push({
        food,
        grams: Math.min(MAX_GRAMS, Math.max(MIN_GRAMS, Math.round(grams))),
      });
      if (ingredients.length === MAX_INGREDIENTS) break;
    }
    if (ingredients.length < MIN_INGREDIENTS) continue;
    meals.push({
      name,
      prepTime: clean((entry as { prepTime?: unknown }).prepTime, 20) || '--',
      ingredients,
    });
    if (meals.length === MAX_MEALS) break;
  }
  return meals;
}

function totalsOf(ingredients: SuggestedIngredient[]): MacroBudget {
  const sum = (pick: (i: SuggestedIngredient) => number) =>
    ingredients.reduce((total, i) => total + pick(i), 0);
  return {
    kcal: Math.round(sum((i) => i.calories)),
    protein: Math.round(sum((i) => i.protein)),
    carbs: Math.round(sum((i) => i.carbs)),
    fats: Math.round(sum((i) => i.fats)),
  };
}

function portion(resolved: ResolvedIngredient, scale: number): SuggestedIngredient {
  const grams = Math.max(MIN_GRAMS, Math.round((resolved.draft.grams * scale) / 5) * 5);
  const factor = grams / 100;
  return {
    label: resolved.draft.food.split(',')[0].trim() || resolved.draft.food,
    grams,
    display: `${grams} g`,
    calories: Math.round(resolved.per100g.calories * factor),
    protein: Math.round(resolved.per100g.protein * factor * 10) / 10,
    carbs: Math.round(resolved.per100g.carbs * factor * 10) / 10,
    fats: Math.round(resolved.per100g.fats * factor * 10) / 10,
  };
}

/** How closely a meal lands on its target, 0 to 100. Calories count most, then protein. */
export function fitScore(actual: MacroBudget, target: MacroBudget): number {
  const miss = (have: number, want: number) =>
    want > 0 ? Math.min(1, Math.abs(have - want) / want) : have > 0 ? 1 : 0;
  const weighted =
    miss(actual.kcal, target.kcal) * 2 +
    miss(actual.protein, target.protein) * 1.5 +
    miss(actual.carbs, target.carbs) * 0.75 +
    miss(actual.fats, target.fats) * 0.75;
  return Math.max(0, Math.round(100 - (weighted / 5) * 100));
}

/**
 * Turns a draft with looked-up nutrition into a meal. The weights are rescaled so the
 * real calories land on the target, then every number is recomputed from the database values.
 */
export function buildMeal(
  draft: DraftMeal,
  resolved: ResolvedIngredient[],
  target: MacroBudget,
  id: string,
): MealSuggestion | null {
  if (resolved.length < MIN_INGREDIENTS) return null;
  const asDrafted = totalsOf(resolved.map((r) => portion(r, 1)));
  if (asDrafted.kcal <= 0) return null;
  const scale = Math.min(SCALE_RANGE.max, Math.max(SCALE_RANGE.min, target.kcal / asDrafted.kcal));
  const ingredients = resolved.map((r) => portion(r, scale));
  const totals = totalsOf(ingredients);
  return {
    id,
    name: draft.name,
    prepTime: draft.prepTime,
    calories: totals.kcal,
    protein: totals.protein,
    carbs: totals.carbs,
    fats: totals.fats,
    ingredients,
    fit: fitScore(totals, target),
  };
}

/** Keeps the meals worth showing, best fit first. */
export function rankMeals(meals: MealSuggestion[]): MealSuggestion[] {
  return meals.filter((m) => m.fit >= MIN_FIT).sort((a, b) => b.fit - a.fit);
}

const DIETS_MAX = 40;

/** Checks the request body from the app and returns a safe, bounded version of it. */
export function parseRequest(body: unknown): MealSuggestionRequest | null {
  const b = body as Partial<MealSuggestionRequest> | undefined;
  const slots = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!b || !slots.includes(String(b.slot))) return null;
  const num = (n: unknown, max: number) => {
    const value = Number(n);
    return Number.isFinite(value) && value >= 0 && value <= max ? Math.round(value) : null;
  };
  const kcal = num(b.target?.kcal, 3000);
  const protein = num(b.target?.protein, 300);
  const carbs = num(b.target?.carbs, 500);
  const fats = num(b.target?.fats, 250);
  if (kcal === null || kcal < 80 || protein === null || carbs === null || fats === null)
    return null;
  const names = (list: unknown) =>
    Array.isArray(list)
      ? list
          .map((n) => clean(n, 60))
          .filter(Boolean)
          .slice(0, 12)
      : [];
  return {
    slot: b.slot as MealSuggestionRequest['slot'],
    target: { kcal, protein, carbs, fats },
    diet: clean(b.diet, DIETS_MAX) || 'Omnivore',
    country: clean(b.country, 40) || 'Global',
    usuals: names(b.usuals),
    exclude: names(b.exclude),
  };
}

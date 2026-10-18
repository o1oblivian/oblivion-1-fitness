/** USDA FoodData Central lookups. Every number returned is per 100 g. */

export interface UsdaFood {
  id: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  dataType: string;
}

interface FdcNutrient {
  nutrientNumber?: string | number;
  nutrientName?: string;
  unitName?: string;
  value?: number;
}

interface FdcFood {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  dataType?: string;
  foodNutrients?: FdcNutrient[];
}

type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

/** FDC nutrient numbers: 208 energy in kcal, 957 and 958 Atwater energy, 203 protein, 204 fat, 205 carbohydrate. */
const ENERGY_NUMBERS = ['208', '957', '958'];

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function valueOf(nutrients: FdcNutrient[], numbers: string[]): number {
  for (const number of numbers) {
    const row = nutrients.find((n) => String(n.nutrientNumber) === number);
    if (row && Number(row.value) >= 0) return Number(row.value);
  }
  return 0;
}

/** Energy is listed twice by FDC, once in kJ and once in kcal. Only the kcal row counts. */
function kcalOf(nutrients: FdcNutrient[]): number {
  const byNumber = valueOf(nutrients, ENERGY_NUMBERS);
  if (byNumber > 0) return byNumber;
  const row = nutrients.find(
    (n) => /^energy/i.test(String(n.nutrientName)) && /^kcal$/i.test(String(n.unitName)),
  );
  return Number(row?.value) || 0;
}

export function normalizeFdcFood(food: FdcFood): UsdaFood | null {
  const name = String(food.description || '').trim();
  const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
  if (!name || !food.fdcId) return null;
  const calories = Math.round(kcalOf(nutrients));
  const protein = round1(valueOf(nutrients, ['203']));
  const carbs = round1(valueOf(nutrients, ['205']));
  const fats = round1(valueOf(nutrients, ['204']));
  const reportsZeroEnergy = nutrients.some(
    (n) => ENERGY_NUMBERS.includes(String(n.nutrientNumber)) && Number(n.value) === 0,
  );
  // A record with no numbers at all is unusable, but a food that reports 0 kcal (water) is real.
  if (calories <= 0 && protein <= 0 && carbs <= 0 && fats <= 0 && !reportsZeroEnergy) return null;
  return {
    id: `usda-${food.fdcId}`,
    name,
    brand: String(food.brandOwner || food.brandName || 'USDA').trim(),
    calories,
    protein,
    carbs,
    fats,
    dataType: String(food.dataType || ''),
  };
}

export async function searchFdc(
  query: string,
  apiKey: string,
  options: { pageSize?: number; dataTypes?: string[] } = {},
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<UsdaFood[]> {
  const dataTypes = options.dataTypes ?? ['Foundation', 'SR Legacy'];
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}` +
    `&query=${encodeURIComponent(query)}&pageSize=${options.pageSize ?? 10}` +
    `&dataType=${encodeURIComponent(dataTypes.join(','))}`;
  const res = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`USDA FoodData Central answered with an error.`);
  const body = (await res.json()) as { foods?: FdcFood[] };
  return (body.foods ?? []).map(normalizeFdcFood).filter((f): f is UsdaFood => f !== null);
}

const TOKEN = /[a-z0-9]+/g;
/** Words that mean a different food than the plain one the query names. */
const PREPARED =
  /\b(breaded|battered|fried|frozen|canned|dehydrated|dried|dry|powder|powdered|concentrate|condensed|imitation|substitute)\b/;

function tokens(text: string): string[] {
  return text.toLowerCase().match(TOKEN) ?? [];
}

/** Words that appear in many unrelated records, so matching them proves nothing. */
const GENERIC = new Set([
  'fast',
  'food',
  'foods',
  'restaurant',
  'all',
  'type',
  'types',
  'with',
  'and',
  'the',
  'of',
  'on',
  'in',
  'no',
  'a',
  'an',
  'or',
  'only',
  'regular',
]);
/** A query word this long that the record lacks means it is a different food. */
const DISTINCTIVE_LENGTH = 6;
const MIN_SHARE = 0.7;

/** The same word as a record might spell it: plural or singular. */
function spellings(word: string): string[] {
  return [
    word,
    `${word}s`,
    `${word}es`,
    word.replace(/ies$/, 'y'),
    word.replace(/es$/, ''),
    word.replace(/s$/, ''),
  ];
}

/**
 * Whether the energy fits the macros. Energy is about 4 kcal per gram of protein or carbohydrate
 * and 9 per gram of fat, so a record far from that is a data error. Alcohol adds energy the
 * macros do not show, so drinks that contain it are exempt.
 */
function energyFitsMacros(food: UsdaFood): boolean {
  if (
    /\b(beer|wine|vodka|whisk(?:e)?y|rum|gin|liqueur|cider|spirits?|alcohol|brandy|tequila)\b/i.test(
      food.name,
    )
  )
    return true;
  const fromMacros = food.protein * 4 + food.carbs * 4 + food.fats * 9;
  return (
    Math.abs(food.calories - fromMacros) <= Math.max(15, 0.4 * Math.max(food.calories, fromMacros))
  );
}

/**
 * Picks the record that is the food the query names, not a prepared variant of it. Returns null
 * rather than a near miss: a missing food is better than the wrong food under its name.
 */
export function pickBestFood(query: string, foods: UsdaFood[]): UsdaFood | null {
  const wanted = [...new Set(tokens(query))].filter((word) => !GENERIC.has(word));
  if (wanted.length === 0 || foods.length === 0) return null;
  const queryText = query.toLowerCase();
  let best: { food: UsdaFood; score: number } | null = null;
  for (const food of foods) {
    if (!energyFitsMacros(food)) continue;
    const have = new Set(tokens(food.name));
    const found = wanted.filter((word) => spellings(word).some((form) => have.has(form)));
    if (found.length / wanted.length < MIN_SHARE) continue;
    const missingDistinct = wanted.some(
      (word) => word.length >= DISTINCTIVE_LENGTH && !found.includes(word),
    );
    if (missingDistinct) continue;
    let score = found.length / wanted.length - (have.size - found.length) * 0.02;
    const prepared = food.name.toLowerCase().match(PREPARED);
    if (prepared && !queryText.includes(prepared[1])) score -= 0.5;
    if (!best || score > best.score) best = { food, score };
  }
  return best && best.score > 0.3 ? best.food : null;
}

const lookupCache = new Map<string, UsdaFood | null>();
const brandedCache = new Map<string, UsdaFood | null>();

/** The best packaged-product match for a name, for takeaway and snack items plain-food records lack. */
export async function lookupBranded(
  query: string,
  apiKey: string,
  fetchImpl?: FetchLike,
): Promise<UsdaFood | null> {
  const key = query.trim().toLowerCase();
  if (brandedCache.has(key)) return brandedCache.get(key) ?? null;
  const foods = await searchFdc(key, apiKey, { pageSize: 10, dataTypes: ['Branded'] }, fetchImpl);
  const food = pickBestFood(key, foods);
  brandedCache.set(key, food);
  return food;
}

/** The single best FDC match for a plain food name, remembered for the life of the server. */
export async function lookupPer100g(
  query: string,
  apiKey: string,
  fetchImpl?: FetchLike,
): Promise<UsdaFood | null> {
  const key = query.trim().toLowerCase();
  if (lookupCache.has(key)) return lookupCache.get(key) ?? null;
  const foods = await searchFdc(key, apiKey, { pageSize: 12 }, fetchImpl);
  const food = pickBestFood(key, foods);
  lookupCache.set(key, food);
  return food;
}

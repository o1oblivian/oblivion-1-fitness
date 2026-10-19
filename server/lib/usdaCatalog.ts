/**
 * The whole USDA SR Legacy catalogue (about 7,800 plain foods), read live from FoodData Central and kept in
 * memory so a category can be browsed at once. Every number is per 100 g.
 */

export interface CatalogFood {
  id: string;
  name: string;
  /** USDA's own food group, such as "Poultry Products". */
  group: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface ListNutrient {
  number?: string | number;
  nutrientNumber?: string | number;
  name?: string;
  unitName?: string;
  amount?: number;
  value?: number;
}

interface ListFood {
  fdcId?: number;
  description?: string;
  foodCategory?: string | { description?: string };
  foodNutrients?: ListNutrient[];
}

type FetchLike = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

const PAGE_SIZE = 200;
/** SR Legacy holds 7,793 foods; this many pages is a safe ceiling. */
const MAX_PAGES = 45;
const CONCURRENCY = 4;
const KEEP_MS = 7 * 24 * 60 * 60 * 1000;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function amountOf(nutrients: ListNutrient[], number: string): number {
  const row = nutrients.find((n) => String(n.number ?? n.nutrientNumber) === number);
  const value = Number(row?.amount ?? row?.value);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function catalogFoodFrom(food: ListFood): CatalogFood | null {
  const name = String(food.description || '').trim();
  if (!name || !food.fdcId) return null;
  const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
  const calories = Math.round(amountOf(nutrients, '208'));
  const protein = round1(amountOf(nutrients, '203'));
  const carbs = round1(amountOf(nutrients, '205'));
  const fats = round1(amountOf(nutrients, '204'));
  const water = nutrients.some((n) => String(n.number ?? n.nutrientNumber) === '208');
  if (calories <= 0 && protein <= 0 && carbs <= 0 && fats <= 0 && !water) return null;
  const group =
    typeof food.foodCategory === 'string'
      ? food.foodCategory
      : String(food.foodCategory?.description ?? '');
  return { id: `usda-${food.fdcId}`, name, group: group.trim(), calories, protein, carbs, fats };
}

async function fetchPage(
  page: number,
  apiKey: string,
  fetchImpl: FetchLike,
): Promise<CatalogFood[] | null> {
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/list?api_key=${encodeURIComponent(apiKey)}` +
    `&dataType=${encodeURIComponent('SR Legacy')}&pageSize=${PAGE_SIZE}&pageNumber=${page}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`USDA FoodData Central answered with an error on page ${page}.`);
  const body = await res.json();
  if (!Array.isArray(body) || body.length === 0) return null;
  return (body as ListFood[]).map(catalogFoodFrom).filter((f): f is CatalogFood => f !== null);
}

/** Reads every page, a few at a time, stopping at the first empty one. */
export async function downloadCatalog(
  apiKey: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<CatalogFood[]> {
  const foods: CatalogFood[] = [];
  let next = 1;
  let done = false;
  const worker = async () => {
    while (!done && next <= MAX_PAGES) {
      const page = next++;
      const rows = await fetchPage(page, apiKey, fetchImpl);
      if (rows === null) {
        done = true;
        return;
      }
      foods.push(...rows);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return foods;
}

let cached: { at: number; foods: CatalogFood[] } | null = null;
let pending: Promise<CatalogFood[]> | null = null;

/** The catalogue if it is already in memory, else null. Never starts a download. */
export function peekCatalog(): CatalogFood[] | null {
  return cached && Date.now() - cached.at < KEEP_MS ? cached.foods : null;
}

/** The catalogue, downloaded once and then served from memory for a week. */
export function loadCatalog(apiKey: string): Promise<CatalogFood[]> {
  if (cached && Date.now() - cached.at < KEEP_MS) return Promise.resolve(cached.foods);
  if (pending) return pending;
  pending = downloadCatalog(apiKey)
    .then((foods) => {
      if (foods.length < 1000) throw new Error('USDA returned too few foods.');
      cached = { at: Date.now(), foods };
      return foods;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

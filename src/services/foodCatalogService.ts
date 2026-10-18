import { filterCustomFoods } from './customFoodDatabase';
import { errorMessage, errorName } from '../../shared/errorMessage';
import { rankByFoodQuery } from '../features/fuel/utils/foodSearchMatch';
import { apiFetch } from './apiBase';
import type { FoodItemRecord } from './foodTypes';

export type { FoodItemRecord };

/** How long a search may take before it is given up on. */
const SEARCH_TIMEOUT_MS = 12_000;

/** Row shape returned by `/api/fuel/live-food-search`. Numbers are for 100 g. */
export interface LiveFoodRow {
  id: string;
  name: string;
  brand?: string;
  calories?: number | string;
  protein?: number | string;
  carbs?: number | string;
  fats?: number | string;
  servingSize?: string;
  servingGrams?: number | string;
  country?: string;
  source?: string;
}

export interface FoodSearchResult {
  items: FoodItemRecord[];
  /** Sources that did not answer, in words fit for the screen. Empty when everything answered. */
  unavailable: string[];
}

export interface FoodSearchParams {
  query: string;
  country?: string;
  limit?: number;
  signal?: AbortSignal;
}

export function liveRowToRecord(row: LiveFoodRow, country: string): FoodItemRecord {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand || 'Food',
    calories: Number(row.calories) || 0,
    protein: Number(row.protein) || 0,
    carbs: Number(row.carbs) || 0,
    fats: Number(row.fats) || 0,
    serving_size: row.servingSize || '100 g',
    serving_grams: Number(row.servingGrams) || 100,
    country: row.country || country,
    source: row.source === 'usda' ? 'usda' : 'openfoodfacts',
  };
}

/** The person's own saved foods, newest first. Shown when nothing is typed. */
export function listCustomFoods(): FoodItemRecord[] {
  return filterCustomFoods();
}

/**
 * Searches the person's own foods first, then the live food databases.
 * Nothing is bundled with the app: with no connection only saved foods can be found.
 */
export async function searchFoods({
  query,
  country = 'AU',
  limit = 60,
  signal,
}: FoodSearchParams): Promise<FoodSearchResult> {
  const trimmed = query.trim();
  const market = (country || 'AU').toUpperCase();
  const mine = filterCustomFoods(undefined, trimmed);
  if (!trimmed) return { items: mine, unavailable: [] };

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, SEARCH_TIMEOUT_MS);
  try {
    const params = new URLSearchParams({ q: trimmed, country: market, limit: String(limit) });
    const res = await apiFetch(`/api/fuel/live-food-search?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Food search answered ${res.status}`);
    const json = (await res.json()) as { items?: LiveFoodRow[]; failed?: string[] };
    const live = (json.items ?? []).map((row) => liveRowToRecord(row, market));
    const known = new Set(mine.map((it) => it.name.toLowerCase()));
    const fresh = live.filter((it) => !known.has(it.name.toLowerCase()));
    return {
      items: [...mine, ...rankByFoodQuery(fresh, trimmed)].slice(0, limit),
      unavailable: json.failed ?? [],
    };
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn('[searchFoods] Live search unavailable:', errorMessage(err));
    const timedOut = errorName(err) === 'AbortError';
    return {
      items: mine,
      unavailable: [timedOut ? 'Live search timed out' : 'Live search could not be reached'],
    };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

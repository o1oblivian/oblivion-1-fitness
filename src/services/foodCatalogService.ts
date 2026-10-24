import { filterCustomFoods } from './customFoodDatabase';
import { errorMessage, errorName } from '../../shared/errorMessage';
import { rankByFoodQuery } from '../features/fuel/utils/foodSearchMatch';
import { apiFetch } from './apiBase';
import type { DietFacts } from '../../shared/foodDiet';
import type { FoodItemRecord } from './foodTypes';

export type { FoodItemRecord };

/** How long a search may take before it is given up on. */
const SEARCH_TIMEOUT_MS = 9_000;

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
  image?: string;
  diet?: DietFacts;
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
  /** Called with the results so far each time one source answers, before the other has. */
  onPartial?: (result: FoodSearchResult) => void;
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
    image: row.image,
    diet: row.diet,
  };
}

/** One source's answer to a search. */
interface SourceAnswer {
  items: FoodItemRecord[];
  /** Set when the source did not answer, in words fit for the screen. */
  failure: string | null;
}

async function searchSource(
  source: 'usda' | 'off',
  params: { query: string; market: string; limit: number },
  signal: AbortSignal,
): Promise<SourceAnswer> {
  const search = new URLSearchParams({
    q: params.query,
    country: params.market,
    limit: String(params.limit),
    source,
  });
  const label = source === 'usda' ? 'USDA' : 'Open Food Facts';
  try {
    const res = await apiFetch(`/api/fuel/live-food-search?${search.toString()}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Food search answered ${res.status}`);
    const json = (await res.json()) as { items?: LiveFoodRow[]; failed?: string[] };
    if (json.failed && json.failed.length > 0) {
      return { items: [], failure: json.failed.join(', ') };
    }
    return {
      items: (json.items ?? []).map((row) => liveRowToRecord(row, params.market)),
      failure: null,
    };
  } catch (err) {
    console.warn(`[searchFoods] ${label} unavailable:`, errorMessage(err));
    const timedOut = errorName(err) === 'AbortError';
    return { items: [], failure: timedOut ? `${label} timed out` : label };
  }
}

/**
 * Searches the person's own foods first, then the live food databases.
 * USDA and Open Food Facts are asked at the same time and `onPartial` is called as each answers, so the
 * first results appear without waiting for the slower one. Resolves with everything once both are done.
 * Nothing is bundled for search: with no connection only saved foods can be found.
 */
export async function searchFoods({
  query,
  country = 'AU',
  limit = 60,
  signal,
  onPartial,
}: FoodSearchParams): Promise<FoodSearchResult> {
  const trimmed = query.trim();
  const market = (country || 'AU').toUpperCase();
  const mine = filterCustomFoods(undefined, trimmed);
  if (!trimmed) return { items: mine, unavailable: [] };

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, SEARCH_TIMEOUT_MS);

  const known = new Set(mine.map((it) => it.name.toLowerCase()));
  const answers: Partial<Record<'usda' | 'off', SourceAnswer>> = {};
  const combine = (): FoodSearchResult => {
    const seen = new Set<string>();
    const fresh = [...(answers.usda?.items ?? []), ...(answers.off?.items ?? [])].filter((it) => {
      const key = `${it.name.toLowerCase()}|${it.brand.toLowerCase()}`;
      if (known.has(it.name.toLowerCase()) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return {
      items: [...mine, ...rankByFoodQuery(fresh, trimmed)].slice(0, limit),
      unavailable: Object.values(answers)
        .map((answer) => answer.failure)
        .filter((failure): failure is string => failure !== null),
    };
  };

  try {
    const run = (source: 'usda' | 'off') =>
      searchSource(source, { query: trimmed, market, limit }, controller.signal).then((answer) => {
        answers[source] = answer;
        if (!controller.signal.aborted) onPartial?.(combine());
      });
    await Promise.all([run('usda'), run('off')]);
    return combine();
  } catch (err) {
    if (signal?.aborted) throw err;
    return { items: mine, unavailable: ['Live search could not be reached'] };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

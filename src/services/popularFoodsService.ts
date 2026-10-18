import { errorMessage, errorName } from '../../shared/errorMessage';
import type { FoodBrowseId } from '../../shared/foodBrowse';
import { apiFetch } from './apiBase';
import { liveRowToRecord, type LiveFoodRow } from './foodCatalogService';
import type { FoodItemRecord } from './foodTypes';

/** The first request of the day makes the server look up to 50 foods, so it is given time. */
const POPULAR_TIMEOUT_MS = 150_000;

const remembered = new Map<string, FoodItemRecord[]>();

/**
 * The most searched foods in one category, read live (ranked by a model, numbers from USDA).
 * Kept in memory for the session so switching categories back and forth is instant.
 * Throws a message fit for the screen when the list cannot be loaded.
 */
export async function fetchPopularFoods(
  category: FoodBrowseId,
  country: string,
  signal?: AbortSignal,
): Promise<FoodItemRecord[]> {
  const market = (country || 'AU').toUpperCase();
  const key = `${category}|${market}`;
  const known = remembered.get(key);
  if (known) return known;

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, POPULAR_TIMEOUT_MS);
  try {
    const params = new URLSearchParams({ category, country: market });
    const res = await apiFetch(`/api/fuel/popular-foods?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    const json = (await res.json().catch(() => ({}))) as { items?: LiveFoodRow[]; error?: string };
    if (!res.ok) throw new Error(json.error || `Popular foods answered ${res.status}`);
    const items = (json.items ?? []).map((row) => liveRowToRecord(row, market));
    if (items.length === 0) throw new Error('No popular foods came back.');
    remembered.set(key, items);
    return items;
  } catch (err) {
    if (signal?.aborted) throw err;
    if (errorName(err) === 'AbortError') throw new Error('Popular foods took too long to load.');
    throw new Error(errorMessage(err, 'Popular foods could not be reached.'));
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

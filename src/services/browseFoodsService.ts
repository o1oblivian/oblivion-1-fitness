import type { FoodBrowseId } from '../../shared/foodBrowse';
import { errorMessage, errorName } from '../../shared/errorMessage';
import { apiFetch } from './apiBase';
import { liveRowToRecord, type LiveFoodRow } from './foodCatalogService';
import type { FoodItemRecord } from './foodTypes';

/** Plain foods come from memory on the server, but the first answer after a cold start can be slow. */
const PLAIN_TIMEOUT_MS = 20_000;
/** Packaged products are fetched from Open Food Facts, which can be slow or down. */
const LOCAL_TIMEOUT_MS = 12_000;
/** A category read in this session is shown again at once when the sheet is reopened. */
const KEEP_MS = 10 * 60 * 1000;

/** Which half of a category: the country's packaged products, or the plain foods every country shares. */
export type BrowsePart = 'plain' | 'local';

export interface BrowseAnswer {
  items: FoodItemRecord[];
  /** Sources that did not answer, in words fit for the screen. */
  failed: string[];
}

const remembered = new Map<string, { at: number; answer: BrowseAnswer }>();

/**
 * One live part of an Add Food category. Resolves with what answered; never rejects except on abort,
 * so a source that is down leaves an empty part and a reason instead of an empty screen.
 */
export async function browseFoods(params: {
  category: FoodBrowseId;
  country: string;
  part: BrowsePart;
  signal?: AbortSignal;
}): Promise<BrowseAnswer> {
  const country = (params.country || 'AU').toUpperCase();
  const key = `${params.part}|${country}|${params.category}`;
  const hit = remembered.get(key);
  if (hit && Date.now() - hit.at < KEEP_MS) return hit.answer;

  const controller = new AbortController();
  const abort = () => controller.abort();
  params.signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, params.part === 'plain' ? PLAIN_TIMEOUT_MS : LOCAL_TIMEOUT_MS);
  const label = params.part === 'plain' ? 'USDA' : 'Open Food Facts';
  try {
    const search = new URLSearchParams({
      category: params.category,
      country,
      part: params.part,
    });
    const res = await apiFetch(`/api/fuel/browse-foods?${search.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Category list answered ${res.status}`);
    const json = (await res.json()) as { items?: LiveFoodRow[]; failed?: string[] };
    const answer: BrowseAnswer = {
      items: (json.items ?? []).map((row) => liveRowToRecord(row, country)),
      failed: json.failed ?? [],
    };
    // A failed part is not remembered, so reopening the sheet tries it again.
    if (answer.failed.length === 0) remembered.set(key, { at: Date.now(), answer });
    return answer;
  } catch (err) {
    if (params.signal?.aborted) throw err;
    console.warn(`[browseFoods] ${label} unavailable:`, errorMessage(err));
    const timedOut = errorName(err) === 'AbortError';
    return { items: [], failed: [timedOut ? `${label} timed out` : label] };
  } finally {
    clearTimeout(timer);
    params.signal?.removeEventListener('abort', abort);
  }
}

/** Merges the lists in order, keeping the first copy of each food. */
export function mergeFoods(...lists: readonly FoodItemRecord[][]): FoodItemRecord[] {
  const seen = new Set<string>();
  const out: FoodItemRecord[] = [];
  for (const list of lists) {
    for (const food of list) {
      if (seen.has(food.id)) continue;
      seen.add(food.id);
      out.push(food);
    }
  }
  return out;
}

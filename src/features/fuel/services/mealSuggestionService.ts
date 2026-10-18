import { apiFetch } from '../../../services/apiBase';
import type { MealSuggestion, MealSuggestionRequest } from '../../../../shared/mealSuggestion';

/** Gemini plus nutrition lookups take a while; this is the longest the screen waits. */
const REQUEST_TIMEOUT_MS = 45_000;
const CACHE_TTL_MS = 15 * 60_000;
/** Targets are rounded so a small change in what is left does not trigger a new request. */
const KCAL_STEP = 50;
const GRAM_STEP = 5;

const cache = new Map<string, { at: number; meals: MealSuggestion[] }>();

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

/** The request as it is sent: targets rounded, lists trimmed. Also the cache key. */
export function normalizeRequest(request: MealSuggestionRequest): MealSuggestionRequest {
  return {
    ...request,
    target: {
      kcal: roundTo(request.target.kcal, KCAL_STEP),
      protein: roundTo(request.target.protein, GRAM_STEP),
      carbs: roundTo(request.target.carbs, GRAM_STEP),
      fats: roundTo(request.target.fats, GRAM_STEP),
    },
    usuals: request.usuals.slice(0, 8),
    exclude: request.exclude.slice(-12),
  };
}

export function clearMealSuggestionCache(): void {
  cache.clear();
}

/** Live meal ideas sized to one meal. Throws an Error whose message is fit to show on screen. */
export async function fetchMealSuggestions(
  request: MealSuggestionRequest,
  signal?: AbortSignal,
  now: () => number = Date.now,
): Promise<MealSuggestion[]> {
  const body = normalizeRequest(request);
  const key = JSON.stringify(body);
  const hit = cache.get(key);
  if (hit && now() - hit.at < CACHE_TTL_MS) return hit.meals;

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, REQUEST_TIMEOUT_MS);
  try {
    const res = await apiFetch('/api/fuel/meal-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => ({}))) as {
      meals?: MealSuggestion[];
      error?: string;
    };
    if (!res.ok || !Array.isArray(json.meals) || json.meals.length === 0) {
      throw new Error(json.error || 'Meal ideas are not available right now.');
    }
    cache.set(key, { at: now(), meals: json.meals });
    return json.meals;
  } catch (err) {
    if (signal?.aborted) throw err;
    if (controller.signal.aborted) throw new Error('Meal ideas took too long. Try again.');
    if (err instanceof Error && err.message) throw err;
    throw new Error('Meal ideas could not be reached. Check your connection.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

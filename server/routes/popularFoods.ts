import type { Express } from 'express';
import { foodBrowseCategory } from '../../shared/foodBrowse';
import { generateContentWithFallback, getGenAI, parseGeminiJson } from '../lib/gemini';
import {
  POPULAR_COUNT,
  buildPopularPrompt,
  parsePopularDrafts,
  type PopularDraft,
} from '../lib/popularFoods';
import { lookupBranded, lookupPer100g, type UsdaFood } from '../lib/usda';
import type { FoodRow } from './liveFoodSearch';

/** What counts as popular changes slowly, so a day-old list is as good as a fresh one. */
const CACHE_MS = 24 * 60 * 60 * 1000;
/** USDA lookups run this many at a time, to stay inside its rate limit. */
const LOOKUP_BATCH = 16;

const cache = new Map<string, { at: number; rows: Promise<FoodRow[]> }>();

async function findFood(draft: PopularDraft, apiKey: string): Promise<UsdaFood | null> {
  try {
    return (
      (await lookupPer100g(draft.usda, apiKey)) ??
      (draft.usda === draft.name ? null : await lookupPer100g(draft.name, apiKey)) ??
      (await lookupBranded(draft.name, apiKey))
    );
  } catch {
    return null;
  }
}

async function buildPopularRows(
  label: string,
  hint: string,
  country: string,
  apiKey: string,
): Promise<FoodRow[]> {
  const genAI = getGenAI();
  if (!genAI) throw new Error('Gemini key missing');
  const response = await generateContentWithFallback(
    genAI,
    [{ role: 'user', parts: [{ text: buildPopularPrompt(label, hint, country) }] }],
    { responseMimeType: 'application/json', temperature: 0.2 },
  );
  const drafts = parsePopularDrafts(parseGeminiJson(response.text || ''));

  const rows: FoodRow[] = [];
  const seen = new Set<string>();
  for (let start = 0; start < drafts.length && rows.length < POPULAR_COUNT; start += LOOKUP_BATCH) {
    const batch = drafts.slice(start, start + LOOKUP_BATCH);
    const found = await Promise.all(batch.map((draft) => findFood(draft, apiKey)));
    batch.forEach((draft, index) => {
      const food = found[index];
      if (!food || seen.has(food.id) || rows.length >= POPULAR_COUNT) return;
      seen.add(food.id);
      rows.push({
        id: food.id,
        name: draft.name,
        brand: food.dataType === 'Branded' ? food.brand : 'USDA',
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        servingSize: '100 g',
        servingGrams: 100,
        country: 'US',
        source: 'usda',
      });
    });
  }
  return rows;
}

/**
 * The most searched foods in one category. The model ranks what people log most; every number
 * is then read from USDA FoodData Central. Remembered for a day so opening the screen is instant.
 */
export function registerPopularFoods(app: Express): void {
  app.get('/api/fuel/popular-foods', async (req, res) => {
    const category = foodBrowseCategory(req.query.category);
    if (!category) return res.status(400).json({ error: 'Unknown food category.' });
    const country = String(req.query.country || 'AU')
      .toUpperCase()
      .slice(0, 2);

    const apiKey = String(process.env.USDA_FDC_API_KEY || '').trim();
    if (!getGenAI() || !apiKey) {
      const missing = [!getGenAI() ? 'Gemini' : '', !apiKey ? 'USDA' : '']
        .filter(Boolean)
        .join(' and ');
      return res
        .status(503)
        .json({ error: `Popular foods are not set up on the server (${missing} key missing).` });
    }

    const key = `${category.id}|${country}`;
    const hit = cache.get(key);
    let rows: Promise<FoodRow[]>;
    if (hit && Date.now() - hit.at < CACHE_MS) {
      rows = hit.rows;
    } else {
      const started = Date.now();
      rows = buildPopularRows(category.label, category.hint, country, apiKey).then((built) => {
        console.log(
          `[popular-foods] ${key}: ${built.length} foods in ${Math.round((Date.now() - started) / 1000)}s`,
        );
        return built;
      });
      cache.set(key, { at: Date.now(), rows });
    }

    try {
      const items = await rows;
      if (items.length === 0) throw new Error('no foods matched');
      return res.json({ success: true, items });
    } catch (err) {
      cache.delete(key);
      console.warn('[popular-foods] failed:', err instanceof Error ? err.message : err);
      return res.status(502).json({ error: 'Popular foods did not load. Try again in a moment.' });
    }
  });
}

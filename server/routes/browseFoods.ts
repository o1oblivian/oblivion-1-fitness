import type { Express } from 'express';
import { isFoodBrowseId } from '../../shared/popularFoods';
import type { FoodBrowseId } from '../../shared/foodBrowse';
import {
  OFF_CATEGORY_TAGS,
  createSearchPacer,
  genericFoodsFor,
  interleave,
  offBrowseUrl,
  offCountryTag,
} from '../lib/browseFoods';
import { loadCatalog } from '../lib/usdaCatalog';
import { USER_AGENT, rowFromOff, type FoodRow, type OffProduct } from './liveFoodSearch';

/** Products a country's own list leads with, taken from each Open Food Facts category in turn. */
const LOCAL_LIMIT = 90;
const OFF_PAGE_SIZE = 50;
const OFF_TIMEOUT_MS = 6_000;
const LOCAL_CACHE_MS = 24 * 60 * 60 * 1000;
/** After every Open Food Facts category fails, skip it briefly instead of waiting out a timeout each time. */
const OFF_PAUSE_MS = 30_000;
/** Local products shown ahead of the plain foods; the rest follow them. */
const LOCAL_FIRST = 30;

const localCache = new Map<string, { at: number; rows: FoodRow[] }>();
let offPausedUntil = 0;

/** Whether the energy fits the macros; packaged-food records often have a typo that breaks this. */
function plausible(row: FoodRow): boolean {
  if (row.name.length > 70 || row.calories > 950) return false;
  const fromMacros = row.protein * 4 + row.carbs * 4 + row.fats * 9;
  return (
    Math.abs(row.calories - fromMacros) <= Math.max(25, 0.5 * Math.max(row.calories, fromMacros))
  );
}

const pace = createSearchPacer(6, 8_000);

async function fetchOffCategory(countryTag: string, tag: string): Promise<OffProduct[]> {
  const wait = pace();
  if (wait === null) throw new Error('Open Food Facts search limit reached, try again shortly');
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  const res = await fetch(offBrowseUrl(countryTag, tag, OFF_PAGE_SIZE), {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(OFF_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Open Food Facts answered ${res.status}`);
  const body = (await res.json()) as { products?: OffProduct[] };
  return body.products ?? [];
}

/** A country's best-scanned packaged products in one category. Throws only when every request failed. */
async function loadLocal(country: string, category: FoodBrowseId): Promise<FoodRow[]> {
  const countryTag = offCountryTag(country);
  if (!countryTag) return [];
  const key = `${country}|${category}`;
  const hit = localCache.get(key);
  if (hit && Date.now() - hit.at < LOCAL_CACHE_MS) return hit.rows;
  if (Date.now() < offPausedUntil) throw new Error('Open Food Facts is busy, skipped for now');

  const answers = await Promise.allSettled(
    OFF_CATEGORY_TAGS[category].map((tag) => fetchOffCategory(countryTag, tag)),
  );
  const answered = answers.filter(
    (a): a is PromiseFulfilledResult<OffProduct[]> => a.status === 'fulfilled',
  );
  if (answered.length === 0) {
    offPausedUntil = Date.now() + OFF_PAUSE_MS;
    const first = answers[0];
    throw first.status === 'rejected' && first.reason instanceof Error
      ? first.reason
      : new Error('Open Food Facts did not answer');
  }
  offPausedUntil = 0;

  const perTag = answered.map((a) =>
    a.value
      .map((product) => rowFromOff(product, country))
      .filter((row): row is FoodRow => row !== null && plausible(row)),
  );
  const seen = new Set<string>();
  const rows = interleave(perTag, LOCAL_LIMIT * 2)
    .filter((row) => {
      const dedupe = `${row.name.toLowerCase()}|${row.brand.toLowerCase()}`;
      if (seen.has(dedupe)) return false;
      seen.add(dedupe);
      return true;
    })
    .slice(0, LOCAL_LIMIT);
  localCache.set(key, { at: Date.now(), rows });
  return rows;
}

/**
 * One Add Food category, live: the country's best-scanned packaged products from Open Food Facts first,
 * then plain foods from the whole USDA SR Legacy catalogue. Either source can be down; the other still answers.
 */
export function registerBrowseFoods(app: Express): void {
  app.get('/api/fuel/browse-foods', async (req, res) => {
    const category = req.query.category;
    if (!isFoodBrowseId(category)) {
      return res.status(400).json({ success: false, error: 'Unknown category' });
    }
    const country = String(req.query.country || 'AU').toUpperCase();
    const apiKey = String(process.env.USDA_FDC_API_KEY || '').trim();
    const failed: string[] = [];

    const generic = async (): Promise<FoodRow[]> => {
      if (!apiKey) {
        failed.push('USDA (no key on the server)');
        return [];
      }
      try {
        return genericFoodsFor(category, await loadCatalog(apiKey));
      } catch (err) {
        console.warn('[browse-foods] USDA failed:', err instanceof Error ? err.message : err);
        failed.push('USDA');
        return [];
      }
    };
    const local = async (): Promise<FoodRow[]> => {
      try {
        return await loadLocal(country, category);
      } catch (err) {
        console.warn(
          '[browse-foods] Open Food Facts failed:',
          err instanceof Error ? err.message : err,
        );
        failed.push('Open Food Facts');
        return [];
      }
    };

    // The app asks for each part on its own so the quick one (plain foods) never waits on the slow one.
    const part = req.query.part === 'plain' || req.query.part === 'local' ? req.query.part : null;
    const [plain, packaged] = await Promise.all([
      part === 'local' ? Promise.resolve([]) : generic(),
      part === 'plain' ? Promise.resolve([]) : local(),
    ]);
    const items = part
      ? [...plain, ...packaged]
      : [...packaged.slice(0, LOCAL_FIRST), ...plain, ...packaged.slice(LOCAL_FIRST)];
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      category,
      country,
      part: part ?? 'both',
      items,
      counts: { plain: plain.length, packaged: packaged.length },
      failed,
    });
  });

  // Reading the whole catalogue takes about ten seconds, so it starts now instead of on the first tap.
  const apiKey = String(process.env.USDA_FDC_API_KEY || '').trim();
  if (apiKey && process.env.NODE_ENV !== 'test') {
    loadCatalog(apiKey).catch((err: unknown) => {
      console.warn(
        '[browse-foods] USDA catalogue warm-up failed:',
        err instanceof Error ? err.message : err,
      );
    });
  }
}

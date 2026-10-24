import type { Express } from 'express';
import type { DietFacts } from '../../shared/foodDiet';
import { dietFactsFromOff, type OffDietTags } from '../lib/offDiet';
import { searchGeneric } from '../lib/browseFoods';
import { searchFdc } from '../lib/usda';
import { peekCatalog } from '../lib/usdaCatalog';

/** One food as the app receives it. All numbers are for 100 g, so the portion dial can scale them directly. */
export interface FoodRow {
  id: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  servingGrams: number;
  country: string;
  source: 'usda' | 'openfoodfacts';
  /** Full-size product photo. The row draws it small so it stays sharp. */
  image?: string;
  /** What the database states about vegan, gluten free and similar. Absent when it states nothing. */
  diet?: DietFacts;
}

const OFF_DOMAINS: Record<string, string> = {
  AU: 'au',
  US: 'us',
  GB: 'uk',
  DE: 'de',
  FR: 'fr',
  IT: 'it',
  ES: 'es',
  NL: 'nl',
  CA: 'ca',
  JP: 'jp',
  IN: 'in',
  BR: 'br',
  MX: 'mx',
  ZA: 'za',
  NZ: 'nz',
};

const OFF_TIMEOUT_MS = 4_000;
/** Only what a food row needs, which keeps each Open Food Facts answer small and quick. */
const OFF_FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'brands',
  'brand_owner',
  'nutriments',
  'labels_tags',
  'allergens_tags',
  'ingredients_analysis_tags',
  'image_front_url',
  'image_url',
].join(',');
export const USER_AGENT = 'Oblivion1Fitness-FuelOS/1.0 (o1oblivionfitness@gmail.com)';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export interface OffProduct extends OffDietTags {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  brand_owner?: string;
  nutriments?: Record<string, number | string | undefined>;
  image_front_url?: string;
  image_url?: string;
}

export function rowFromOff(product: OffProduct, country: string): FoodRow | null {
  const name = String(product.product_name || product.product_name_en || '').trim();
  const n = product.nutriments ?? {};
  if (!name) return null;
  const kj = Number(n['energy-kj_100g']);
  const kcal = Number(n['energy-kcal_100g'] ?? (Number.isFinite(kj) ? kj / 4.184 : 0)) || 0;
  const protein = round1(Number(n.proteins_100g) || 0);
  const carbs = round1(Number(n.carbohydrates_100g) || 0);
  const fats = round1(Number(n.fat_100g) || 0);
  if (kcal <= 0 && protein <= 0 && carbs <= 0 && fats <= 0) return null;
  const image = String(product.image_front_url || product.image_url || '').trim();
  return {
    id: `off-${product.code ?? name.toLowerCase().replace(/\W+/g, '-')}`,
    name,
    brand: String(product.brands || product.brand_owner || 'Open Food Facts')
      .split(',')[0]
      .trim(),
    calories: Math.round(kcal),
    protein,
    carbs,
    fats,
    servingSize: '100 g',
    servingGrams: 100,
    country,
    source: 'openfoodfacts',
    image: image || undefined,
    diet: dietFactsFromOff(product),
  };
}

/** After Open Food Facts fails every host, searches skip it for a short while instead of each waiting out a timeout. */
const OFF_PAUSE_MS = 30_000;
let offPausedUntil = 0;

async function fetchOffProducts(
  domain: string,
  query: string,
  limit: number,
): Promise<OffProduct[]> {
  const url =
    `https://${domain}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=${Math.min(limit * 2, 40)}` +
    `&fields=${OFF_FIELDS}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(OFF_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Open Food Facts answered ${res.status}`);
  const body = (await res.json()) as { products?: OffProduct[] };
  return body.products ?? [];
}

/** The person's country site and the world site are asked together; whichever answers first wins. */
async function searchOff(query: string, country: string, limit: number): Promise<FoodRow[]> {
  if (Date.now() < offPausedUntil) throw new Error('Open Food Facts is busy, skipped for now');
  const local = OFF_DOMAINS[country];
  const domains = local ? [local, 'world'] : ['world'];
  try {
    const products = await Promise.any(
      domains.map((domain) => fetchOffProducts(domain, query, limit)),
    );
    offPausedUntil = 0;
    return products
      .map((p) => rowFromOff(p, country))
      .filter((row): row is FoodRow => row !== null);
  } catch (err) {
    offPausedUntil = Date.now() + OFF_PAUSE_MS;
    const first = err instanceof AggregateError ? err.errors[0] : err;
    throw first instanceof Error ? first : new Error('Open Food Facts did not answer');
  }
}

async function searchUsda(
  query: string,
  country: string,
  apiKey: string,
  limit: number,
): Promise<FoodRow[]> {
  const toRow = (food: Awaited<ReturnType<typeof searchFdc>>[number]): FoodRow => ({
    id: food.id,
    name: food.name,
    brand: food.dataType === 'Branded' ? food.brand : 'Generic',
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fats: food.fats,
    servingSize: '100 g',
    servingGrams: 100,
    country: 'US',
    source: 'usda',
  });
  // Plain foods are the same everywhere; branded products in this database are American.
  const branded: Promise<Awaited<ReturnType<typeof searchFdc>>> =
    country === 'US'
      ? searchFdc(query, apiKey, { pageSize: 10, dataTypes: ['Branded'] }).catch(() => [])
      : Promise.resolve([]);
  // The catalogue is already in memory, so plain foods are answered without a trip to USDA.
  const catalog = peekCatalog();
  const inMemory = catalog ? searchGeneric(catalog, query, Math.min(limit, 40)) : [];
  if (inMemory.length > 0) return [...inMemory, ...(await branded).map(toRow)];
  const generic = await searchFdc(query, apiKey, {
    pageSize: Math.min(limit, 20),
    dataTypes: ['Foundation', 'SR Legacy'],
  });
  return [...generic, ...(await branded)].map(toRow);
}

/** A search repeated within this time is answered from memory, which also spares the free upstream APIs. */
const RESULT_CACHE_MS = 10 * 60 * 1000;
const RESULT_CACHE_MAX = 500;
const resultCache = new Map<string, { at: number; rows: FoodRow[] }>();

function remember(key: string, rows: FoodRow[]): void {
  if (resultCache.size >= RESULT_CACHE_MAX) {
    const oldest = resultCache.keys().next().value;
    if (oldest !== undefined) resultCache.delete(oldest);
  }
  resultCache.set(key, { at: Date.now(), rows });
}

type Source = 'usda' | 'off';

/**
 * Live food search: USDA FoodData Central for plain foods, Open Food Facts for packaged and local ones.
 * The app asks for each source separately (`source=usda`, `source=off`) so USDA results show as soon as
 * they arrive instead of waiting on the slower registry. Without `source`, both are searched together.
 */
export function registerLiveFoodSearch(app: Express): void {
  app.get('/api/fuel/live-food-search', async (req, res) => {
    const query = String(req.query.q || '').trim();
    const country = String(req.query.country || 'AU').toUpperCase();
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const only =
      req.query.source === 'usda' || req.query.source === 'off' ? req.query.source : null;
    if (!query) return res.json({ success: true, items: [], failed: [] });

    const apiKey = String(process.env.USDA_FDC_API_KEY || '').trim();
    const failed: string[] = [];
    const labels: Record<Source, string> = { usda: 'USDA', off: 'Open Food Facts' };

    const run = async (source: Source): Promise<FoodRow[]> => {
      if (source === 'usda' && !apiKey) {
        failed.push('USDA (no key on the server)');
        return [];
      }
      const key = `${source}|${country}|${limit}|${query.toLowerCase()}`;
      const hit = resultCache.get(key);
      if (hit && Date.now() - hit.at < RESULT_CACHE_MS) return hit.rows;
      try {
        const rows =
          source === 'usda'
            ? await searchUsda(query, country, apiKey, limit)
            : await searchOff(query, country, limit);
        remember(key, rows);
        return rows;
      } catch (err) {
        console.warn(
          `[live-food-search] ${labels[source]} failed:`,
          err instanceof Error ? err.message : err,
        );
        failed.push(labels[source]);
        return [];
      }
    };

    const sources: Source[] = only ? [only] : ['usda', 'off'];
    const results = await Promise.all(sources.map(run));

    const seen = new Set<string>();
    const items = results
      .flat()
      .filter((row) => {
        const key = `${row.name.toLowerCase()}|${row.brand.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);

    res.json({ success: true, items, failed });
  });
}

import type { Express } from 'express';
import type { DietFacts } from '../../shared/foodDiet';
import { dietFactsFromOff, type OffDietTags } from '../lib/offDiet';
import { searchFdc } from '../lib/usda';

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

const OFF_TIMEOUT_MS = 8_000;
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
].join(',');
const USER_AGENT = 'Oblivion1Fitness-FuelOS/1.0 (o1oblivionfitness@gmail.com)';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

interface OffProduct extends OffDietTags {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  brand_owner?: string;
  nutriments?: Record<string, number | string | undefined>;
}

function rowFromOff(product: OffProduct, country: string): FoodRow | null {
  const name = String(product.product_name || product.product_name_en || '').trim();
  const n = product.nutriments ?? {};
  if (!name) return null;
  const kj = Number(n['energy-kj_100g']);
  const kcal = Number(n['energy-kcal_100g'] ?? (Number.isFinite(kj) ? kj / 4.184 : 0)) || 0;
  const protein = round1(Number(n.proteins_100g) || 0);
  const carbs = round1(Number(n.carbohydrates_100g) || 0);
  const fats = round1(Number(n.fat_100g) || 0);
  if (kcal <= 0 && protein <= 0 && carbs <= 0 && fats <= 0) return null;
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
    diet: dietFactsFromOff(product),
  };
}

async function searchOff(query: string, country: string, limit: number): Promise<FoodRow[]> {
  const domain = OFF_DOMAINS[country] ?? 'world';
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
  return (body.products ?? [])
    .map((p) => rowFromOff(p, country))
    .filter((row): row is FoodRow => row !== null);
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
  // Plain foods are the same everywhere; branded products in this database are American.
  const [generic, branded] = await Promise.all([
    searchFdc(query, apiKey, {
      pageSize: Math.min(limit, 20),
      dataTypes: ['Foundation', 'SR Legacy'],
    }),
    country === 'US'
      ? searchFdc(query, apiKey, { pageSize: 10, dataTypes: ['Branded'] })
      : Promise.resolve([]),
  ]);
  return [...generic, ...branded].map(toRow);
}

/** Live food search: USDA FoodData Central for plain foods, Open Food Facts for packaged and local ones. */
export function registerLiveFoodSearch(app: Express): void {
  app.get('/api/fuel/live-food-search', async (req, res) => {
    const query = String(req.query.q || '').trim();
    const country = String(req.query.country || 'AU').toUpperCase();
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    if (!query) return res.json({ success: true, items: [], failed: [] });

    const apiKey = String(process.env.USDA_FDC_API_KEY || '').trim();
    const failed: string[] = [];
    const settle = async (label: string, work: Promise<FoodRow[]>): Promise<FoodRow[]> => {
      try {
        return await work;
      } catch (err) {
        console.warn(
          `[live-food-search] ${label} failed:`,
          err instanceof Error ? err.message : err,
        );
        failed.push(label);
        return [];
      }
    };

    const [usda, off] = await Promise.all([
      apiKey ? settle('USDA', searchUsda(query, country, apiKey, limit)) : Promise.resolve([]),
      settle('Open Food Facts', searchOff(query, country, limit)),
    ]);
    if (!apiKey) failed.push('USDA (no key on the server)');

    const seen = new Set<string>();
    const items = [...usda, ...off]
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

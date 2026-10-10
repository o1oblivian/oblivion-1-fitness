import {
  FoodItemRecord,
  FoodCatalogQueryParams,
  FoodCategoryType,
  getRegionalDatabaseInfo,
  getRegionalFallbackFoods,
  RegionalDatabaseInfo,
} from './theFoodDatabase';
import { filterCustomFoods } from './customFoodDatabase';
import { FOOD_CATALOG } from '../features/fuel/data/foodCatalog';
import { matchesFoodQuery } from '../features/fuel/utils/foodSearchMatch';
import { apiUrl } from './apiBase';

export type { FoodItemRecord, FoodCatalogQueryParams, FoodCategoryType, RegionalDatabaseInfo };
export { getRegionalDatabaseInfo, getRegionalFallbackFoods };

function inferCatalogCountry(brand: string, name: string, fallback?: string): string {
  if (fallback) return fallback.toUpperCase();
  const hay = `${brand} ${name}`.toLowerCase();
  if (/gyg|guzman|grill.?d|oporto|red rooster|zambrero|mad mex|schnitz|hungry jack/.test(hay)) return 'AU';
  if (/chipotle|chick-fil-a|wendy|taco bell|in-n-out|five guys|panda express/.test(hay)) return 'US';
  if (/greggs|wagamama/.test(hay)) return 'GB';
  if (/fergburger|hell pizza/.test(hay)) return 'NZ';
  return 'GLOBAL';
}

function itemFitsMarket(itemCountry: string, market: string, searching: boolean): boolean {
  if (searching) return true;
  const c = (itemCountry || 'GLOBAL').toUpperCase();
  const m = (market || 'AU').toUpperCase();
  return c === 'GLOBAL' || c === m;
}

const MAPPED_APP_CATALOG: FoodItemRecord[] = FOOD_CATALOG.map((item) => {
  let servingGrams = 100;
  const match = item.serving.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
  if (match) {
    servingGrams = parseFloat(match[1]) || 100;
  }
  const cat = item.category.toLowerCase() as FoodCategoryType;
  return {
    id: `app-catalog-${item.id}`,
    name: item.name,
    brand: item.brand,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fats: item.fats,
    serving_size: item.serving,
    serving_grams: servingGrams,
    category: cat,
    country: inferCatalogCountry(item.brand, item.name, item.country),
    source: 'catalog',
  };
});

/**
 * Browse: custom + athletic catalog + regional staples (offline).
 * Typed search: same, then live OpenFoodFacts (and USDA FDC when the server has a key).
 */
export async function queryFoodCatalog({
  query = '',
  category,
  country = 'AU',
  limit = 100,
  signal,
}: FoodCatalogQueryParams): Promise<FoodItemRecord[]> {
  const trimmed = query.trim();
  const normCountry = (country || 'AU').toUpperCase();
  const targetCategory: FoodCategoryType = category || 'protein';

  // Retrieve user's permanently saved custom foods matching the criteria
  const customMatches = filterCustomFoods(targetCategory, trimmed);

  const allCats: FoodCategoryType[] = ['protein', 'carbs', 'fats', 'fastfood', 'drinks'];
  const searching = Boolean(trimmed);

  const localMatches = trimmed
    ? Array.from(
        new Map(
          allCats
            .flatMap((cat) => getRegionalFallbackFoods(normCountry, cat, trimmed))
            .map((it) => [it.id, it])
        ).values()
      )
    : getRegionalFallbackFoods(normCountry, targetCategory, trimmed);

  const appCatalogMatches = MAPPED_APP_CATALOG.filter((it) => {
    if (!itemFitsMarket(it.country, normCountry, searching)) return false;
    if (!trimmed) return it.category === targetCategory;
    return matchesFoodQuery(it.name, it.brand, trimmed);
  }).sort(
    (a, b) => Number(b.category === targetCategory) - Number(a.category === targetCategory)
  );

  // If no search query, return custom foods + app catalog + rich verified database immediately
  if (!trimmed) {
    const baseMap = new Map<string, FoodItemRecord>();
    customMatches.forEach((it) => baseMap.set(it.name.toLowerCase(), it));
    appCatalogMatches.forEach((it) => {
      if (!baseMap.has(it.name.toLowerCase())) {
        baseMap.set(it.name.toLowerCase(), it);
      }
    });
    localMatches.forEach((it) => {
      if (!baseMap.has(it.name.toLowerCase())) {
        baseMap.set(it.name.toLowerCase(), it);
      }
    });
    return Array.from(baseMap.values()).slice(0, limit);
  }

  // Attempt live query to proxy endpoint to enrich with OpenFoodFacts/USDA records
  try {
    const liveController = new AbortController();
    const onParentAbort = () => liveController.abort();
    signal?.addEventListener('abort', onParentAbort);
    const hangWatch = setTimeout(() => liveController.abort(), 3000);

    try {
      const params = new URLSearchParams({
        q: trimmed,
        country: normCountry,
        category: targetCategory,
        limit: String(limit),
      });

      const res = await fetch(apiUrl(`/api/fuel/live-food-search?${params.toString()}`), {
        signal: liveController.signal,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.items) && json.items.length > 0) {
          const liveItems: FoodItemRecord[] = json.items.map((it: any) => ({
            id: it.id,
            name: it.name,
            brand: it.brand || 'Verified Food',
            calories: Number(it.calories) || 0,
            protein: Number(it.protein) || 0,
            carbs: Number(it.carbs) || 0,
            fats: Number(it.fats) || 0,
            serving_size: it.servingSize || it.serving_size || `${it.servingGrams || 100}g`,
            serving_grams: Number(it.servingGrams || it.serving_grams) || 100,
            category: targetCategory,
            country: it.country || normCountry,
            source: it.source === 'usda' ? 'usda' : 'openfoodfacts',
          }));

          const map = new Map<string, FoodItemRecord>();
          customMatches.forEach((it) => map.set(it.name.toLowerCase(), it));
          appCatalogMatches.forEach((it) => {
            if (!map.has(it.name.toLowerCase())) map.set(it.name.toLowerCase(), it);
          });
          localMatches.forEach((it) => {
            if (!map.has(it.name.toLowerCase())) map.set(it.name.toLowerCase(), it);
          });
          liveItems.forEach((it) => {
            if (!map.has(it.name.toLowerCase())) map.set(it.name.toLowerCase(), it);
          });
          return Array.from(map.values()).slice(0, limit);
        }
      }
    } finally {
      clearTimeout(hangWatch);
      signal?.removeEventListener('abort', onParentAbort);
    }
  } catch (proxyErr: any) {
    if (proxyErr?.name === 'AbortError' && signal?.aborted) throw proxyErr;
    console.debug('[queryFoodCatalog] Live search proxy note:', proxyErr?.message);
  }

  // Return verified local matches with app catalog and custom foods
  const fallbackMap = new Map<string, FoodItemRecord>();
  customMatches.forEach((it) => fallbackMap.set(it.name.toLowerCase(), it));
  appCatalogMatches.forEach((it) => {
    if (!fallbackMap.has(it.name.toLowerCase())) {
      fallbackMap.set(it.name.toLowerCase(), it);
    }
  });
  localMatches.forEach((it) => {
    if (!fallbackMap.has(it.name.toLowerCase())) {
      fallbackMap.set(it.name.toLowerCase(), it);
    }
  });
  return Array.from(fallbackMap.values()).slice(0, limit);
}

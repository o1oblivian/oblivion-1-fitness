/**
 * Fuel OS food pipeline (honest sources):
 * - Browse: O1FC athletic catalog + regional staples (offline, instant)
 * - Typed search: live OpenFoodFacts for the selected market
 * - Barcode: OpenFoodFacts product lookup
 * - Optional US overlay: USDA FoodData Central when USDA_FDC_API_KEY is set on the server
 */

import { FoodCategoryType, FoodItemRecord, RegionalFoodMap } from './foodData/types';
import { OCEANIA_FOODS } from './foodData/oceania';
import { AMERICAS_FOODS } from './foodData/americas';
import { EUROPE_FOODS } from './foodData/europe';
import { ASIA_FOODS } from './foodData/asia';
import { AFRICA_GLOBAL_FOODS } from './foodData/africa_global';
import { matchesFoodQuery } from '../features/fuel/utils/foodSearchMatch';

export type { FoodCategoryType, FoodItemRecord, RegionalFoodMap };

export interface RegionalDatabaseConfig {
  countryCode: string;
  countryName: string;
  authorityShortName: string;
  authorityFullName: string;
  isOfficial: boolean;
  searchPlaceholder: string;
}

export interface RegionalDatabaseInfo extends RegionalDatabaseConfig {
  name: string;
  shortName: string;
  fullName: string;
}

export interface FoodCatalogQueryParams {
  query?: string;
  category?: FoodCategoryType;
  country?: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

function catalogMarket(
  countryCode: string,
  countryName: string,
  examples: string
): RegionalDatabaseConfig {
  return {
    countryCode,
    countryName,
    authorityShortName: 'O1FC Catalog',
    authorityFullName: `O1FC Athletic Catalog · ${countryName}`,
    isOfficial: false,
    searchPlaceholder: `Type to search live OpenFoodFacts (${examples})`,
  };
}

export const REGIONAL_DATABASE_INFO: Record<string, RegionalDatabaseConfig> = {
  AU: catalogMarket('AU', 'Australia', 'Bulk Nutrients, Up & Go, GYG'),
  US: catalogMarket('US', 'United States', 'Fairlife, Quest, Chipotle'),
  GB: catalogMarket('GB', 'United Kingdom', 'Myprotein, Greggs, Nando\'s'),
  IN: catalogMarket('IN', 'India', 'Amul, Paneer, MuscleBlaze'),
  CA: catalogMarket('CA', 'Canada', 'Tim Hortons, Maple Leaf'),
  DE: catalogMarket('DE', 'Germany', 'Quark, ESN, Döner'),
  FR: catalogMarket('FR', 'France', 'Fromage blanc, Poulet'),
  NZ: catalogMarket('NZ', 'New Zealand', 'Anchor, Tegel, Kumara'),
  SG: catalogMarket('SG', 'Singapore', 'Chicken rice, Tofu, Pokka'),
  JP: catalogMarket('JP', 'Japan', 'Tofu, Sashimi, Savas'),
  AE: catalogMarket('AE', 'UAE / Middle East', 'Shawarma, Laban, Almarai'),
  BR: catalogMarket('BR', 'Brazil', 'Picanha, Açaí'),
  MX: catalogMarket('MX', 'Mexico', 'Pollo, Frijoles, Aguacate'),
  ZA: catalogMarket('ZA', 'South Africa', 'Biltong, Nando\'s, USN'),
  IT: catalogMarket('IT', 'Italy', 'Bresaola, Parmigiano'),
  ES: catalogMarket('ES', 'Spain', 'Jamón, HSN'),
  NL: catalogMarket('NL', 'Netherlands', 'Kwark, XXL Nutrition'),
  MY: catalogMarket('MY', 'Malaysia', 'Nasi lemak, Milo'),
  TH: catalogMarket('TH', 'Thailand', 'Gai yang, Riceberry'),
  PH: catalogMarket('PH', 'Philippines', 'Bangus, Inasal'),
  GLOBAL: catalogMarket('GLOBAL', 'All markets', 'Whey, chicken, oats, avocado'),
};

export function getRegionalDatabaseInfo(countryCode: string = 'AU'): RegionalDatabaseInfo {
  const norm = (countryCode || 'AU').toUpperCase();
  const raw = REGIONAL_DATABASE_INFO[norm] || REGIONAL_DATABASE_INFO.GLOBAL || REGIONAL_DATABASE_INFO.AU;
  return {
    ...raw,
    name: raw.countryName,
    shortName: raw.authorityShortName,
    fullName: raw.authorityFullName,
  };
}

/**
 * Master multi-market fallback database across all 21 countries.
 */
export const REGIONAL_FALLBACK_FOODS: Record<string, Record<FoodCategoryType, FoodItemRecord[]>> = {
  ...OCEANIA_FOODS,
  ...AMERICAS_FOODS,
  ...EUROPE_FOODS,
  ...ASIA_FOODS,
  ...AFRICA_GLOBAL_FOODS,
};

/**
 * Returns authentic items for any country code and category.
 * Fast food stays in Fast Food — never remapped into protein/carbs/fats.
 * Browse is country-first; typed search can pull matching menus from other markets.
 */
export function getRegionalFallbackFoods(
  countryCode: string = 'AU',
  category: FoodCategoryType,
  searchQuery: string = ''
): FoodItemRecord[] {
  const normCountry = (countryCode || 'AU').toUpperCase();
  const dataset = REGIONAL_FALLBACK_FOODS[normCountry] || REGIONAL_FALLBACK_FOODS.GLOBAL || REGIONAL_FALLBACK_FOODS.AU;
  const q = searchQuery.trim();

  const localItems = dataset[category] || REGIONAL_FALLBACK_FOODS.AU[category] || [];
  const globalStaples =
    category !== 'fastfood' && normCountry !== 'GLOBAL'
      ? REGIONAL_FALLBACK_FOODS.GLOBAL?.[category] || []
      : [];

  const baseMap = new Map<string, FoodItemRecord>();
  [...localItems, ...globalStaples].forEach((item) => {
    if (!baseMap.has(item.id)) {
      baseMap.set(item.id, { ...item, category, source: item.source || 'regional' });
    }
  });

  const baseItems = Array.from(baseMap.values());

  if (!q) {
    return baseItems;
  }

  const directMatches = baseItems.filter((item) =>
    matchesFoodQuery(item.name, `${item.brand} ${item.country}`, q)
  );

  if (directMatches.length >= 15) {
    return directMatches;
  }

  const additionalMatches: FoodItemRecord[] = [];
  const seenIds = new Set(directMatches.map((m) => m.id));

  for (const [cCode, catData] of Object.entries(REGIONAL_FALLBACK_FOODS)) {
    if (cCode === normCountry) continue;
    const itemsInCat = catData[category] || [];
    for (const item of itemsInCat) {
      if (seenIds.has(item.id)) continue;
      if (matchesFoodQuery(item.name, `${item.brand} ${item.country}`, q)) {
        seenIds.add(item.id);
        additionalMatches.push({ ...item, category, source: item.source || 'regional' });
      }
    }
  }

  return [...directMatches, ...additionalMatches];
}

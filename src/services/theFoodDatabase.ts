/**
 * Oblivion 1 Fitness Club - Comprehensive Multi-Market Nutritional Database
 *
 * Official Food Data Authorities integrated:
 * - AU: FSANZ (Food Standards Australia New Zealand)
 * - US: USDA FoodData Central (Agricultural Research Service)
 * - GB: UK CoFID (McCance & Widdowson's / UKHSA)
 * - IN: ICMR-NIN Indian Food Composition Tables (IFCT)
 * - CA: Health Canada Canadian Nutrient File (CNF)
 * - DE: Bundeslebensmittelschlüssel (BLS / Max Rubner-Institut)
 * - FR: ANSES Table CIQUAL (Agence nationale de sécurité sanitaire)
 * - NZ: NZ Food Composition Database (NZFCD / Plant & Food Research)
 * - SG: Singapore Health Promotion Board (HPB Food Composition Guide)
 * - JP: Standard Tables of Food Composition in Japan (MEXT)
 * - AE: Dubai Municipality / Arab Food Composition Database
 * - BR: Tabela Brasileira de Composição de Alimentos (TBCA / USP)
 * - MX: Tablas de Composición de Alimentos Mexicanos (INCMNSZ)
 * - ZA: South African Medical Research Council (SAFOODS)
 * - IT: Banca Dati di Composizione degli Alimenti (BDA / CREA)
 * - ES: Base de Datos Española de Composición de Alimentos (BEDCA)
 * - NL: Nederlands Voedingsstoffenbestand (NEVO / RIVM)
 * - MY: Malaysian Food Composition Database (MyFCD / IMR)
 * - TH: Thai Food Composition Database (INMU / Mahidol University)
 * - PH: Food and Nutrition Research Institute (FNRI / DOST)
 * - GLOBAL: Global Multi-Market Nutrition Database (OpenFoodFacts / FAO INFOODS)
 */

import { FoodCategoryType, FoodItemRecord, RegionalFoodMap } from './foodData/types';
import { OCEANIA_FOODS } from './foodData/oceania';
import { AMERICAS_FOODS } from './foodData/americas';
import { EUROPE_FOODS } from './foodData/europe';
import { ASIA_FOODS } from './foodData/asia';
import { AFRICA_GLOBAL_FOODS } from './foodData/africa_global';

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

export const REGIONAL_DATABASE_INFO: Record<string, RegionalDatabaseConfig> = {
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    authorityShortName: 'FSANZ AU',
    authorityFullName: 'Australian Food Composition Database (FSANZ)',
    isOfficial: true,
    searchPlaceholder: 'Search AU foods, brands (e.g. Bulk Nutrients, Up & Go, GYG, Kangaroo)...',
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    authorityShortName: 'USDA FoodData',
    authorityFullName: 'USDA FoodData Central / US National Database',
    isOfficial: true,
    searchPlaceholder: 'Search US foods, brands (e.g. Fairlife, In-N-Out, Chipotle, Quest)...',
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    authorityShortName: 'UK CoFID',
    authorityFullName: 'UK CoFID / British Nutritional Database',
    isOfficial: true,
    searchPlaceholder: 'Search UK foods, brands (e.g. Myprotein, Greggs, Nando\'s, M&S)...',
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    authorityShortName: 'ICMR IFCT',
    authorityFullName: 'ICMR-NIN Indian Food Composition Tables (IFCT)',
    isOfficial: true,
    searchPlaceholder: 'Search Indian foods, brands (e.g. Amul, Paneer, Dahi, MuscleBlaze, Biryani)...',
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    authorityShortName: 'Health Canada CNF',
    authorityFullName: 'Canadian Nutrient File (CNF)',
    isOfficial: true,
    searchPlaceholder: 'Search Canadian foods, brands (e.g. Tim Hortons, Maple Leaf, Poutine)...',
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    authorityShortName: 'German BLS',
    authorityFullName: 'German BLS / European Nutritional Database',
    isOfficial: true,
    searchPlaceholder: 'Search German foods, brands (e.g. Quark, ESN, Döner, Alpro)...',
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    authorityShortName: 'ANSES CIQUAL',
    authorityFullName: 'French ANSES / CIQUAL Database',
    isOfficial: true,
    searchPlaceholder: 'Search French foods, brands (e.g. Baguette, Fromage Blanc, Poulet)...',
  },
  NZ: {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    authorityShortName: 'NZFCD',
    authorityFullName: 'NZ Food Composition Database (NZFCD)',
    isOfficial: true,
    searchPlaceholder: 'Search NZ foods, brands (e.g. Anchor, Tegel, Kumara, Fergburger)...',
  },
  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    authorityShortName: 'HPB Singapore',
    authorityFullName: 'Singapore HPB Food Composition Guide',
    isOfficial: true,
    searchPlaceholder: 'Search Singaporean foods (e.g. Chicken Rice, Kaya Toast, Pokka, Tofu)...',
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    authorityShortName: 'MEXT JP Tables',
    authorityFullName: 'Standard Tables of Food Composition Japan (MEXT)',
    isOfficial: true,
    searchPlaceholder: 'Search Japanese foods, brands (e.g. Meiji, Savas, Sashimi, Tofu, Gyudon)...',
  },
  AE: {
    countryCode: 'AE',
    countryName: 'UAE / Middle East',
    authorityShortName: 'Arab Food Comp',
    authorityFullName: 'Arab Food Composition Database (Dubai Municipality)',
    isOfficial: true,
    searchPlaceholder: 'Search Middle Eastern foods (e.g. Shawarma, Tawook, Laban, Almarai)...',
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    authorityShortName: 'TBCA Brasil',
    authorityFullName: 'Tabela Brasileira de Composição de Alimentos (TBCA)',
    isOfficial: true,
    searchPlaceholder: 'Search Brazilian foods (e.g. Picanha, Mandioca, Açaí, Max Titanium)...',
  },
  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    authorityShortName: 'INCMNSZ México',
    authorityFullName: 'Tablas de Composición de Alimentos Mexicanos (INCMNSZ)',
    isOfficial: true,
    searchPlaceholder: 'Search Mexican foods (e.g. Tacos, Frijoles, Tortilla, Pollo, Aguacate)...',
  },
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    authorityShortName: 'SAFOODS',
    authorityFullName: 'South African Food Composition Database (SAFOODS)',
    isOfficial: true,
    searchPlaceholder: 'Search South African foods (e.g. Biltong, Ostrich, Pap, Nando\'s, USN)...',
  },
  IT: {
    countryCode: 'IT',
    countryName: 'Italy',
    authorityShortName: 'BDA CREA Italia',
    authorityFullName: 'Banca Dati di Composizione degli Alimenti (BDA / CREA)',
    isOfficial: true,
    searchPlaceholder: 'Search Italian foods (e.g. Bresaola, Parmigiano, Pasta Integrale, Focaccia)...',
  },
  ES: {
    countryCode: 'ES',
    countryName: 'Spain',
    authorityShortName: 'BEDCA España',
    authorityFullName: 'Base de Datos Española de Composición de Alimentos (BEDCA)',
    isOfficial: true,
    searchPlaceholder: 'Search Spanish foods (e.g. Jamón Ibérico, Tortilla, HSN, Gazpacho)...',
  },
  NL: {
    countryCode: 'NL',
    countryName: 'Netherlands',
    authorityShortName: 'NEVO RIVM',
    authorityFullName: 'Nederlands Voedingsstoffenbestand (NEVO / RIVM)',
    isOfficial: true,
    searchPlaceholder: 'Search Dutch foods (e.g. Kwark, Frikandel, Haring, XXL Nutrition)...',
  },
  MY: {
    countryCode: 'MY',
    countryName: 'Malaysia',
    authorityShortName: 'MyFCD Malaysia',
    authorityFullName: 'Malaysian Food Composition Database (MyFCD)',
    isOfficial: true,
    searchPlaceholder: 'Search Malaysian foods (e.g. Nasi Lemak, Ayam Bakar, Roti Canai, Milo)...',
  },
  TH: {
    countryCode: 'TH',
    countryName: 'Thailand',
    authorityShortName: 'INMU Thailand',
    authorityFullName: 'Thai Food Composition Database (INMU / Mahidol)',
    isOfficial: true,
    searchPlaceholder: 'Search Thai foods (e.g. Gai Yang, Som Tum, Pad Krapow, Riceberry)...',
  },
  PH: {
    countryCode: 'PH',
    countryName: 'Philippines',
    authorityShortName: 'FNRI DOST',
    authorityFullName: 'Philippine Food Composition Tables (FNRI / DOST)',
    isOfficial: true,
    searchPlaceholder: 'Search Filipino foods (e.g. Chickenjoy, Bangus, Inasal, Tocino, Kamote)...',
  },
  GLOBAL: {
    countryCode: 'GLOBAL',
    countryName: 'Global / All Markets',
    authorityShortName: 'Global Multi-Market DB',
    authorityFullName: 'Global Multi-Market Athletic Nutrition Database (OpenFoodFacts)',
    isOfficial: true,
    searchPlaceholder: 'Search 1,000s of global foods, brands (e.g. Whey, Chicken, Oats, Avocado)...',
  },
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

function getMacroCategoryForFood(item: FoodItemRecord): FoodCategoryType {
  if (item.category !== ('fastfood' as any)) return item.category;
  if (item.fats > item.protein && item.fats > item.carbs) return 'fats';
  if (item.protein >= item.carbs) return 'protein';
  return 'carbs';
}

/**
 * Returns authentic items for any country code and category.
 * Intelligently merges local market items with universal global athletic staples,
 * and executes comprehensive multi-country fuzzy search when searching.
 */
export function getRegionalFallbackFoods(
  countryCode: string = 'AU',
  category: FoodCategoryType,
  searchQuery: string = ''
): FoodItemRecord[] {
  const normCountry = (countryCode || 'AU').toUpperCase();
  const dataset = REGIONAL_FALLBACK_FOODS[normCountry] || REGIONAL_FALLBACK_FOODS.GLOBAL || REGIONAL_FALLBACK_FOODS.AU;
  
  const localItems = dataset[category] || REGIONAL_FALLBACK_FOODS.AU[category] || [];
  const localFastFoods = ((dataset as any)['fastfood'] || []).filter(
    (it: FoodItemRecord) => getMacroCategoryForFood(it) === category
  );

  const globalItems = normCountry !== 'GLOBAL' ? (REGIONAL_FALLBACK_FOODS.GLOBAL?.[category] || []) : [];
  const globalFastFoods = normCountry !== 'GLOBAL' ? (((REGIONAL_FALLBACK_FOODS.GLOBAL as any)?.['fastfood'] || []).filter(
    (it: FoodItemRecord) => getMacroCategoryForFood(it) === category
  )) : [];

  // Deduplicated base list combining local market and global athletic staples
  const baseMap = new Map<string, FoodItemRecord>();
  [...localItems, ...localFastFoods, ...globalItems, ...globalFastFoods].forEach((item) => {
    if (!baseMap.has(item.id)) baseMap.set(item.id, { ...item, category });
  });

  const baseItems = Array.from(baseMap.values());

  if (!searchQuery.trim()) {
    return baseItems;
  }

  const queryLower = searchQuery.toLowerCase().trim();
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);

  // 1. Direct search in current market + global
  const directMatches = baseItems.filter((item) => {
    const searchSpace = `${item.name} ${item.brand} ${item.country}`.toLowerCase();
    return queryTokens.every((token) => searchSpace.includes(token));
  });

  // If sufficient matches found, return immediately
  if (directMatches.length >= 15) {
    return directMatches;
  }

  // 2. Comprehensive multi-country search across all 21 regional markets
  const additionalMatches: FoodItemRecord[] = [];
  const seenIds = new Set(directMatches.map((m) => m.id));

  for (const [cCode, catData] of Object.entries(REGIONAL_FALLBACK_FOODS)) {
    if (cCode === normCountry || cCode === 'GLOBAL') continue;
    const itemsInCat = catData[category] || [];
    const fastFoodInCat = ((catData as any)['fastfood'] || []).filter(
      (it: FoodItemRecord) => getMacroCategoryForFood(it) === category
    );
    for (const item of [...itemsInCat, ...fastFoodInCat]) {
      if (seenIds.has(item.id)) continue;
      const searchSpace = `${item.name} ${item.brand} ${item.country}`.toLowerCase();
      if (queryTokens.every((token) => searchSpace.includes(token))) {
        seenIds.add(item.id);
        additionalMatches.push({ ...item, category });
      }
    }
  }

  return [...directMatches, ...additionalMatches];
}

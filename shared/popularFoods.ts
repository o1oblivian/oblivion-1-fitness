import { FOOD_BROWSE_CATEGORIES, type FoodBrowseId } from './foodBrowse';

/** How many foods each country's bundled list holds. */
export const POPULAR_COUNT = 100;

/** The list used for a country that has none of its own. */
export const GLOBAL_MARKET = 'GLOBAL';

/** One food in a country's list. Every number is per 100 g and was read from USDA FoodData Central. */
export interface PopularFood {
  /** `usda-<fdcId>`. */
  id: string;
  name: string;
  cat: FoodBrowseId;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
}

const CATEGORY_IDS = new Set<string>(FOOD_BROWSE_CATEGORIES.map((category) => category.id));

export function isFoodBrowseId(value: unknown): value is FoodBrowseId {
  return typeof value === 'string' && CATEGORY_IDS.has(value);
}

export function isPopularFood(value: unknown): value is PopularFood {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  const numeric = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  return (
    typeof row.id === 'string' &&
    typeof row.name === 'string' &&
    row.name.length > 0 &&
    isFoodBrowseId(row.cat) &&
    numeric(row.kcal) &&
    numeric(row.protein) &&
    numeric(row.carbs) &&
    numeric(row.fats)
  );
}

import type { DietFacts } from '../../shared/foodDiet';

export type FoodCategoryType = 'protein' | 'carbs' | 'fats' | 'fastfood' | 'drinks';

/** A food the person can log. Calories and macros are for one `serving_grams` serving. */
export interface FoodItemRecord {
  id: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_size?: string;
  serving_grams?: number;
  /** Set on foods the person saved themselves; live results carry none. */
  category?: FoodCategoryType;
  country: string;
  is_custom?: boolean;
  source?: 'openfoodfacts' | 'custom' | 'usda';
  /** Full-size product photo. Rows draw it small so it stays sharp. */
  image?: string;
  /** What the food database states about vegan, gluten free and similar. */
  diet?: DietFacts;
}

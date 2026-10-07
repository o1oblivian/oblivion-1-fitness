export type FoodCategoryType = 'protein' | 'carbs' | 'fats' | 'fastfood' | 'drinks';

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
  category: FoodCategoryType;
  country: string;
  is_custom?: boolean;
  source?: 'catalog' | 'openfoodfacts' | 'custom' | 'regional' | 'usda';
}

export type RegionalFoodMap = Record<string, Record<FoodCategoryType, FoodItemRecord[]>>;

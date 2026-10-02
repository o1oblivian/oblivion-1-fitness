// FUEL OS Types
export interface MacroTarget {
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  caloriesPerGram: number;
}

export interface MealFoodItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp: string;
  logged: boolean;
}

export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Drinks' | 'Supplements';

export interface MealSectionData {
  category: MealCategory;
  recommendedKcal: number;
  items: MealFoodItem[];
}

export type FoodCategory = 'protein' | 'carbs' | 'fats' | 'beverage' | 'supplements';
export type FoodRegional = 'US' | 'AU' | 'UK' | 'GLOBAL';

export interface AthleteFoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  isRegional: FoodRegional;
  subLabel?: string;
  brand?: string;
}

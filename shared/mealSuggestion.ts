/** Shapes shared by the meal-suggestion route on the server and the Fuel tab in the app. */

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Calories and macros for one meal, in kcal and grams. */
export interface MacroBudget {
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealSuggestionRequest {
  slot: MealSlot;
  /** What this one meal should add up to. */
  target: MacroBudget;
  diet: string;
  country: string;
  /** Foods the person already logs often, so the ideas feel familiar. */
  usuals: string[];
  /** Names already shown, so a refresh brings different meals. */
  exclude: string[];
}

export interface SuggestedIngredient {
  label: string;
  grams: number;
  display: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealSuggestion {
  id: string;
  name: string;
  prepTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: SuggestedIngredient[];
  /** 0 to 100: how closely the meal lands on the target. */
  fit: number;
}

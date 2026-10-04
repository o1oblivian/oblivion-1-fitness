import { FoodCatalogItem } from './foodCatalogTypes';
import { PROTEIN_FOODS } from './foodsProtein';
import { CARBS_FOODS } from './foodsCarbs';
import { FATS_FOODS } from './foodsFats';
import { FASTFOOD_FOODS } from './foodsFastFood';
import { DRINKS_FOODS } from './foodsDrinks';

export type { FoodCatalogItem };

export const FOOD_CATALOG: FoodCatalogItem[] = [
  ...PROTEIN_FOODS,
  ...CARBS_FOODS,
  ...FATS_FOODS,
  ...FASTFOOD_FOODS,
  ...DRINKS_FOODS,
];

export const FOOD_CATEGORY_OPTIONS = [
  'ALL',
  'PROTEIN',
  'CARBS',
  'FATS',
  'DRINKS',
] as const;

export type FoodFilterCategory = typeof FOOD_CATEGORY_OPTIONS[number];

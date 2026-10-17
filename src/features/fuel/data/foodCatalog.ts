import { FoodCatalogItem } from './foodCatalogTypes';
import { PROTEIN_FOODS } from './foodsProtein';
import { CARBS_FOODS } from './foodsCarbs';
import { FATS_FOODS } from './foodsFats';
import { FASTFOOD_FOODS } from './foodsFastFood';
import { DRINKS_FOODS } from './foodsDrinks';
import { GRILLD_FOODS } from './foodsGrilld';

export type { FoodCatalogItem };

export const FOOD_CATALOG: FoodCatalogItem[] = [
  ...PROTEIN_FOODS,
  ...CARBS_FOODS,
  ...FATS_FOODS,
  ...FASTFOOD_FOODS,
  ...GRILLD_FOODS,
  ...DRINKS_FOODS,
];


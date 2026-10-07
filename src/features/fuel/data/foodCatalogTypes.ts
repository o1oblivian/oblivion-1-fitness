export interface FoodCatalogItem {
  id: string;
  name: string;
  brand: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category: 'PROTEIN' | 'CARBS' | 'FATS' | 'FASTFOOD' | 'DRINKS';
  country?: string;
}

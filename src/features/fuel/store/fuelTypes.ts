import type { Electrolytes, FuelDayTotals, FuelSlot, SupplementItem } from '../services/fuelCloud';

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export type FuelMeals = Record<FuelSlot, MealItem[]>;

export type BiologicalSex = 'male' | 'female';

export interface FuelBody {
  heightCm: number | null;
  ageYears: number | null;
  sex: BiologicalSex | null;
}

/** What belongs to the athlete, whatever the day. */
export interface FuelProfileFields {
  calorieTarget: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatsG: number | null;
  hydrationTargetL: number | null;
  weightKg: number | null;
  body: FuelBody;
  countryMarket: string;
  dietPreference: string;
  supplementStack: SupplementItem[];
}

/** What is logged for one calendar day. */
export interface FuelDayFields {
  dateKey: string;
  meals: FuelMeals;
  hydrationCurrentL: number;
  burnedKcal: number;
  supplementsTaken: string[];
  electrolytes: Electrolytes;
}

export interface FuelState extends FuelProfileFields, FuelDayFields {
  cloudReady: boolean;
  /** Cloud totals for the six days before today; today always comes from live meals. */
  weekTotals: Record<string, FuelDayTotals>;

  hydrate: () => Promise<void>;
  setEnergyTargets: (cal: number, p: number, c: number, f: number, weight?: number | null) => void;
  setWeightKg: (kg: number) => void;
  setBody: (patch: Partial<FuelBody>) => void;
  setCountryMarket: (country: string) => void;
  setDietPreference: (diet: string) => void;
  logHydration: (liters: number) => void;
  setHydrationLiters: (liters: number) => void;
  logBurned: (kcal: number) => void;
  addMealItem: (slot: FuelSlot, item: MealItem) => void;
  addFoodItem: (category: string, item: Partial<MealItem> & { name: string }) => void;
  removeMealItem: (slot: FuelSlot, itemId: string) => void;
  clearDailyMeals: () => void;
  setSupplementStack: (stack: SupplementItem[]) => void;
  toggleSupplementTaken: (id: string) => void;
  setSupplementsTaken: (ids: string[]) => void;
  setElectrolytes: (next: Electrolytes) => void;
}

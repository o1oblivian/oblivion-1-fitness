import {
  FuelDayLog,
  MacroTarget,
  MealCategory,
} from '../types';

export const VALID_CATEGORIES: readonly MealCategory[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Drinks',
  'Supplements',
];

export const DEFAULT_MACROS: {
  readonly protein: MacroTarget;
  readonly carbs: MacroTarget;
  readonly fats: MacroTarget;
} = {
  protein: {
    name: 'Protein',
    current: 142,
    target: 190,
    unit: 'g',
    color: '#C4121A',
    caloriesPerGram: 4,
  },
  carbs: {
    name: 'Carbs',
    current: 185,
    target: 260,
    unit: 'g',
    color: '#D4A017',
    caloriesPerGram: 4,
  },
  fats: {
    name: 'Fats',
    current: 48,
    target: 70,
    unit: 'g',
    color: '#6B8F5E',
    caloriesPerGram: 9,
  },
};

export const DEFAULT_FUEL_DAY_LOG: FuelDayLog = {
  caloriesBudget: 2800,
  eaten: 1740,
  burned: 420,
  macros: DEFAULT_MACROS,
  meals: VALID_CATEGORIES.map((cat) => ({
    category: cat,
    recommendedKcal:
      cat === 'Breakfast' ? 750 : cat === 'Lunch' ? 950 : cat === 'Dinner' ? 850 : 250,
    items: [],
  })),
  hydrationLogs: [
    { id: 'hyd-1', amountLiters: 0.75, timestamp: '08:30' },
    { id: 'hyd-2', amountLiters: 0.5, timestamp: '11:15' },
    { id: 'hyd-3', amountLiters: 0.75, timestamp: '14:00' },
  ],
};

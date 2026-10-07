import { foodMatchesDietSafe } from '../utils/dietFoodFilter';

export interface IntelMealSuggestion {
  id: string;
  name: string;
  description: string;
  prepTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  source: 'desk' | 'live';
}

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface Template {
  name: string;
  description: string;
  prepTime: string;
  diets: string[];
  protein: string;
  carb: string;
  fat: string;
}

const TEMPLATES: Record<MealSlot, Template[]> = {
  breakfast: [
    {
      name: 'Egg-white oats and berries',
      description: 'Morning protein with slow carbs.',
      prepTime: '10 min',
      diets: ['Omnivore', 'Vegetarian', 'Pescatarian', 'Gluten-Free', 'Halal', 'Kosher', 'Mediterranean'],
      protein: 'liquid egg whites',
      carb: 'rolled oats',
      fat: 'almond butter',
    },
    {
      name: 'Greek yogurt bowl',
      description: 'High-protein dairy breakfast.',
      prepTime: '5 min',
      diets: ['Omnivore', 'Vegetarian', 'Pescatarian', 'Halal', 'Kosher', 'Mediterranean', 'Keto'],
      protein: '0% Greek yogurt',
      carb: 'blueberries',
      fat: 'chia seeds',
    },
    {
      name: 'Tofu scramble and toast',
      description: 'Plant breakfast that still hits protein.',
      prepTime: '12 min',
      diets: ['Vegan', 'Vegetarian', 'Dairy-Free', 'Halal', 'Kosher'],
      protein: 'extra-firm tofu',
      carb: 'sourdough',
      fat: 'olive oil',
    },
    {
      name: 'Steak and eggs',
      description: 'Animal-only morning plate.',
      prepTime: '12 min',
      diets: ['Carnivore', 'Paleo', 'Keto', 'Omnivore'],
      protein: 'sirloin + eggs',
      carb: '—',
      fat: 'pasture butter',
    },
    {
      name: 'Smoked salmon bagel plate',
      description: 'Pescatarian morning with slow carbs.',
      prepTime: '8 min',
      diets: ['Pescatarian', 'Omnivore', 'Mediterranean', 'Halal', 'Kosher'],
      protein: 'smoked salmon',
      carb: 'rye bagel',
      fat: 'cream cheese',
    },
    {
      name: 'Protein pancakes',
      description: 'Whey batter with berries.',
      prepTime: '15 min',
      diets: ['Omnivore', 'Vegetarian', 'Pescatarian', 'Halal', 'Kosher'],
      protein: 'whey isolate',
      carb: 'oat flour',
      fat: 'egg yolk',
    },
  ],
  lunch: [
    {
      name: 'Chicken, rice and greens',
      description: 'Standard athlete plate scaled to remaining macros.',
      prepTime: '15 min',
      diets: ['Omnivore', 'Halal', 'Kosher', 'Dairy-Free', 'Gluten-Free', 'Mediterranean', 'Paleo'],
      protein: 'grilled chicken breast',
      carb: 'jasmine rice',
      fat: 'olive oil',
    },
    {
      name: 'GYG-style chicken burrito bowl',
      description: 'Australian bowl pattern: chicken, rice, salsa, avocado.',
      prepTime: '8 min',
      diets: ['Omnivore', 'Halal', 'Dairy-Free', 'Gluten-Free'],
      protein: 'GYG grilled chicken',
      carb: 'brown rice',
      fat: 'avocado',
    },
    {
      name: 'Salmon poke bowl',
      description: 'Pescatarian lunch with rice and sesame.',
      prepTime: '12 min',
      diets: ['Pescatarian', 'Omnivore', 'Mediterranean', 'Dairy-Free', 'Gluten-Free', 'Halal', 'Kosher'],
      protein: 'raw or seared salmon',
      carb: 'sushi rice',
      fat: 'sesame oil',
    },
    {
      name: 'Tempeh grain bowl',
      description: 'Plant lunch with legumes and grains.',
      prepTime: '14 min',
      diets: ['Vegan', 'Vegetarian', 'Dairy-Free', 'Halal', 'Kosher'],
      protein: 'tempeh',
      carb: 'quinoa',
      fat: 'tahini',
    },
    {
      name: 'Ribeye plate',
      description: 'Carnivore lunch, fat from the cut.',
      prepTime: '14 min',
      diets: ['Carnivore', 'Keto', 'Paleo', 'Omnivore'],
      protein: 'ribeye',
      carb: '—',
      fat: 'ribeye fat',
    },
    {
      name: 'Turkey wrap and fruit',
      description: 'Lean midday plate.',
      prepTime: '10 min',
      diets: ['Omnivore', 'Halal', 'Dairy-Free', 'Mediterranean'],
      protein: 'turkey breast',
      carb: 'wholemeal wrap',
      fat: 'hummus',
    },
    {
      name: 'Tuna rice pack',
      description: 'Quick desk lunch.',
      prepTime: '6 min',
      diets: ['Pescatarian', 'Omnivore', 'Halal', 'Kosher', 'Dairy-Free', 'Gluten-Free'],
      protein: 'tuna in spring water',
      carb: 'microwave rice',
      fat: 'olive oil',
    },
  ],
  dinner: [
    {
      name: 'Salmon, potato and broccoli',
      description: 'Evening recovery plate.',
      prepTime: '18 min',
      diets: ['Omnivore', 'Pescatarian', 'Mediterranean', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Kosher', 'Paleo'],
      protein: 'Atlantic salmon',
      carb: 'roasted potato',
      fat: 'olive oil',
    },
    {
      name: 'Lean beef and sweet potato',
      description: 'High-protein dinner.',
      prepTime: '16 min',
      diets: ['Omnivore', 'Halal', 'Kosher', 'Paleo', 'Gluten-Free', 'Dairy-Free'],
      protein: 'lean beef mince',
      carb: 'sweet potato',
      fat: 'olive oil',
    },
    {
      name: 'Lentil and tofu tray bake',
      description: 'Vegan dinner with complete amino acids.',
      prepTime: '20 min',
      diets: ['Vegan', 'Vegetarian', 'Dairy-Free', 'Halal', 'Kosher'],
      protein: 'tofu + lentils',
      carb: 'roasted pumpkin',
      fat: 'olive oil',
    },
    {
      name: 'Eggs and mince skillet',
      description: 'Carnivore dinner.',
      prepTime: '12 min',
      diets: ['Carnivore', 'Keto', 'Paleo', 'Omnivore'],
      protein: 'beef mince + eggs',
      carb: '—',
      fat: 'beef fat',
    },
    {
      name: 'Prawn stir-fry',
      description: 'Light evening protein with veg carbs.',
      prepTime: '14 min',
      diets: ['Pescatarian', 'Omnivore', 'Halal', 'Dairy-Free', 'Gluten-Free', 'Mediterranean'],
      protein: 'prawns',
      carb: 'rice noodles',
      fat: 'sesame oil',
    },
    {
      name: 'Chickpea curry bowl',
      description: 'Plant dinner with rice.',
      prepTime: '18 min',
      diets: ['Vegan', 'Vegetarian', 'Dairy-Free', 'Halal', 'Kosher', 'Gluten-Free'],
      protein: 'chickpeas',
      carb: 'basmati rice',
      fat: 'coconut milk',
    },
  ],
  snack: [
    {
      name: 'Cottage cheese cup',
      description: 'Fast protein snack.',
      prepTime: '2 min',
      diets: ['Omnivore', 'Vegetarian', 'Pescatarian', 'Halal', 'Kosher', 'Keto'],
      protein: 'cottage cheese',
      carb: 'rice cakes',
      fat: '—',
    },
    {
      name: 'Whey isolate shake',
      description: 'Intra or post-session protein.',
      prepTime: '2 min',
      diets: ['Omnivore', 'Vegetarian', 'Pescatarian', 'Gluten-Free', 'Halal', 'Kosher'],
      protein: 'whey isolate',
      carb: 'banana',
      fat: '—',
    },
    {
      name: 'Edamame and almonds',
      description: 'Plant snack.',
      prepTime: '5 min',
      diets: ['Vegan', 'Vegetarian', 'Dairy-Free', 'Gluten-Free', 'Halal', 'Kosher', 'Mediterranean'],
      protein: 'edamame',
      carb: 'edamame carbs',
      fat: 'raw almonds',
    },
    {
      name: 'Beef jerky',
      description: 'Carnivore portable snack.',
      prepTime: '1 min',
      diets: ['Carnivore', 'Paleo', 'Keto', 'Omnivore', 'Dairy-Free', 'Gluten-Free'],
      protein: 'beef jerky',
      carb: '—',
      fat: '—',
    },
    {
      name: 'Skyr and honey',
      description: 'Icelandic yogurt snack.',
      prepTime: '2 min',
      diets: ['Omnivore', 'Vegetarian', 'Pescatarian', 'Halal', 'Kosher'],
      protein: 'skyr',
      carb: 'honey',
      fat: 'walnuts',
    },
    {
      name: 'Rice cakes and peanut butter',
      description: 'Carb-protein bridge snack.',
      prepTime: '3 min',
      diets: ['Omnivore', 'Vegetarian', 'Vegan', 'Dairy-Free', 'Halal', 'Kosher'],
      protein: 'peanut butter',
      carb: 'rice cakes',
      fat: 'peanut butter',
    },
  ],
};

export const MEAL_SLOT_SHARE: Record<MealSlot, number> = {
  breakfast: 0.28,
  lunch: 0.32,
  dinner: 0.3,
  snack: 0.12,
};

function gramsForProtein(targetP: number): number {
  return Math.max(35, Math.round(targetP * 3.3));
}

function gramsForCarb(targetC: number): number {
  return Math.max(0, Math.round(targetC * 2.2));
}

function gramsForFat(targetF: number): number {
  return Math.max(0, Math.round(targetF * 0.9));
}

function rotatePick<T>(items: T[], count: number, rotate: number): T[] {
  if (items.length === 0) return [];
  const start = ((rotate % items.length) + items.length) % items.length;
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, items.length); i++) {
    out.push(items[(start + i) % items.length]);
  }
  return out;
}

export function portionRemaining(
  remaining: number,
  share: number,
  floor: number
): number {
  const raw = Math.round(remaining * share);
  if (remaining <= floor) return Math.max(0, Math.round(remaining));
  return Math.max(floor, Math.min(raw, remaining));
}

export function buildDeskIntelMeals(input: {
  diet: string;
  slot: MealSlot;
  remainingKcal: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFats: number;
  country?: string;
  rotation?: number;
}): IntelMealSuggestion[] {
  const diet = input.diet || 'Omnivore';
  const share = MEAL_SLOT_SHARE[input.slot];
  const kcal = portionRemaining(input.remainingKcal, share, input.slot === 'snack' ? 120 : 280);
  const p = portionRemaining(input.remainingProtein, share, input.slot === 'snack' ? 12 : 28);
  const c = portionRemaining(input.remainingCarbs, share, 0);
  const f = portionRemaining(input.remainingFats, share, 0);

  const pool = TEMPLATES[input.slot].filter((t) => t.diets.some((d) => d.toLowerCase() === diet.toLowerCase()));
  const fallback = TEMPLATES[input.slot].filter((t) => foodMatchesDietSafe(t.protein, '', diet));
  const unique = (pool.length >= 3 ? pool : [...pool, ...fallback, ...TEMPLATES[input.slot]]).filter(
    (t, i, arr) => arr.findIndex((x) => x.name === t.name) === i
  );
  const chosen = rotatePick(unique, 3, input.rotation ?? 0);

  const auNote = (input.country || '').toUpperCase() === 'AU' ? ' AU market portions.' : '';

  return chosen.map((t, idx) => {
    const pG = gramsForProtein(p);
    const cG = t.carb === '—' ? 0 : gramsForCarb(c);
    const fG = t.fat === '—' ? Math.round(f) : gramsForFat(f);
    const mealKcal = t.carb === '—' ? Math.round(p * 4 + f * 9) : kcal;
    const ingredients = [
      `${pG}g ${t.protein}`,
      t.carb !== '—' ? `${cG}g ${t.carb}` : null,
      t.fat !== '—' ? `${fG}g ${t.fat}` : null,
    ].filter(Boolean) as string[];

    return {
      id: `desk-${input.slot}-${input.rotation ?? 0}-${idx}-${t.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: t.name,
      description: `${t.description}${auNote} One ${input.slot} portion — not the full remaining day.`,
      prepTime: t.prepTime,
      calories: mealKcal,
      protein: p,
      carbs: t.carb === '—' ? Math.min(8, c) : c,
      fats: f,
      ingredients,
      source: 'desk',
    };
  });
}

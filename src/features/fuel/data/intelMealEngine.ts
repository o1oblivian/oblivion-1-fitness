export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface Ingredient {
  label: string;
  /** Per 100 g as eaten (cooked where applicable). USDA FoodData Central reference values. */
  kcal: number;
  p: number;
  c: number;
  f: number;
  step: number;
  max: number;
  /** Grams per countable unit, e.g. one large egg. */
  unitG?: number;
  unitName?: string;
}

const I = {
  chicken: { label: 'Grilled chicken breast', kcal: 165, p: 31, c: 0, f: 3.6, step: 10, max: 300 },
  turkey: { label: 'Roast turkey breast', kcal: 135, p: 30, c: 0, f: 1, step: 10, max: 250 },
  beefMince: { label: 'Lean beef mince 5%, cooked', kcal: 164, p: 25.4, c: 0, f: 6.4, step: 10, max: 300 },
  sirloin: { label: 'Sirloin steak, grilled', kcal: 180, p: 30, c: 0, f: 6, step: 10, max: 350 },
  ribeye: { label: 'Ribeye steak, grilled', kcal: 291, p: 24, c: 0, f: 21, step: 10, max: 400 },
  salmon: { label: 'Atlantic salmon, cooked', kcal: 206, p: 22, c: 0, f: 12.4, step: 10, max: 280 },
  smokedSalmon: { label: 'Smoked salmon', kcal: 117, p: 18.3, c: 0, f: 4.3, step: 10, max: 150 },
  prawns: { label: 'Prawns, cooked', kcal: 99, p: 24, c: 0.2, f: 0.3, step: 10, max: 300 },
  tuna: { label: 'Tuna in spring water, drained', kcal: 86, p: 19.4, c: 0, f: 1, step: 5, max: 200 },
  egg: { label: 'Eggs', kcal: 143, p: 12.6, c: 0.7, f: 9.5, step: 50, max: 250, unitG: 50, unitName: 'large' },
  eggWhite: { label: 'Liquid egg whites', kcal: 52, p: 10.9, c: 0.7, f: 0.2, step: 10, max: 300 },
  greekYogurt: { label: 'Greek yogurt 0%', kcal: 59, p: 10.3, c: 3.6, f: 0.4, step: 10, max: 400 },
  skyr: { label: 'Skyr', kcal: 63, p: 11, c: 4, f: 0.2, step: 10, max: 400 },
  cottage: { label: 'Cottage cheese 2%', kcal: 84, p: 11, c: 4.3, f: 2.3, step: 10, max: 300 },
  whey: { label: 'Whey isolate', kcal: 373, p: 90, c: 1.3, f: 1, step: 5, max: 60 },
  tofu: { label: 'Extra-firm tofu', kcal: 144, p: 17, c: 3, f: 8.7, step: 10, max: 350 },
  tempeh: { label: 'Tempeh', kcal: 192, p: 20.3, c: 7.6, f: 10.8, step: 10, max: 250 },
  lentils: { label: 'Lentils, cooked', kcal: 116, p: 9, c: 20, f: 0.4, step: 10, max: 400 },
  chickpeas: { label: 'Chickpeas, cooked', kcal: 164, p: 8.9, c: 27.4, f: 2.6, step: 10, max: 300 },
  edamame: { label: 'Edamame, shelled', kcal: 121, p: 11.9, c: 8.9, f: 5.2, step: 10, max: 250 },
  jerky: { label: 'Beef jerky', kcal: 410, p: 33, c: 11, f: 25.6, step: 5, max: 80 },

  oats: { label: 'Rolled oats, dry', kcal: 379, p: 13.2, c: 67.7, f: 6.5, step: 5, max: 120 },
  whiteRice: { label: 'Jasmine rice, cooked', kcal: 130, p: 2.7, c: 28.2, f: 0.3, step: 10, max: 400 },
  brownRice: { label: 'Brown rice, cooked', kcal: 123, p: 2.7, c: 25.6, f: 1, step: 10, max: 400 },
  basmati: { label: 'Basmati rice, cooked', kcal: 121, p: 3.5, c: 25.2, f: 0.4, step: 10, max: 400 },
  quinoa: { label: 'Quinoa, cooked', kcal: 120, p: 4.4, c: 21.3, f: 1.9, step: 10, max: 350 },
  potato: { label: 'Roast potato', kcal: 93, p: 2.5, c: 21, f: 0.1, step: 10, max: 450 },
  sweetPotato: { label: 'Sweet potato, baked', kcal: 90, p: 2, c: 20.7, f: 0.2, step: 10, max: 450 },
  pumpkin: { label: 'Roast pumpkin', kcal: 40, p: 0.9, c: 10.5, f: 0.1, step: 10, max: 400 },
  sourdough: { label: 'Sourdough', kcal: 270, p: 10.8, c: 51, f: 2.4, step: 10, max: 160 },
  wrap: { label: 'Wholemeal wrap', kcal: 306, p: 8.7, c: 48, f: 7.8, step: 5, max: 130 },
  bagel: { label: 'Bagel', kcal: 257, p: 10, c: 50.5, f: 1.5, step: 5, max: 130 },
  riceNoodles: { label: 'Rice noodles, cooked', kcal: 108, p: 1.8, c: 24, f: 0.2, step: 10, max: 350 },
  blueberries: { label: 'Blueberries', kcal: 57, p: 0.7, c: 14.5, f: 0.3, step: 10, max: 250 },
  banana: { label: 'Banana', kcal: 89, p: 1.1, c: 22.8, f: 0.3, step: 10, max: 240 },
  riceCakes: { label: 'Rice cakes', kcal: 387, p: 8.2, c: 81.5, f: 2.8, step: 5, max: 60 },
  honey: { label: 'Honey', kcal: 304, p: 0.3, c: 82.4, f: 0, step: 5, max: 40 },

  oliveOil: { label: 'Olive oil', kcal: 884, p: 0, c: 0, f: 100, step: 1, max: 30 },
  sesameOil: { label: 'Sesame oil', kcal: 884, p: 0, c: 0, f: 100, step: 1, max: 20 },
  butter: { label: 'Butter', kcal: 717, p: 0.9, c: 0.1, f: 81, step: 1, max: 30 },
  almondButter: { label: 'Almond butter', kcal: 614, p: 21, c: 19, f: 55.5, step: 5, max: 40 },
  peanutButter: { label: 'Peanut butter', kcal: 588, p: 25, c: 20, f: 50, step: 5, max: 40 },
  avocado: { label: 'Avocado', kcal: 160, p: 2, c: 8.5, f: 14.7, step: 10, max: 200 },
  chia: { label: 'Chia seeds', kcal: 486, p: 16.5, c: 42, f: 30.7, step: 5, max: 30 },
  almonds: { label: 'Almonds', kcal: 579, p: 21, c: 21.6, f: 49.9, step: 5, max: 50 },
  walnuts: { label: 'Walnuts', kcal: 654, p: 15.2, c: 13.7, f: 65.2, step: 5, max: 40 },
  tahini: { label: 'Tahini', kcal: 595, p: 17, c: 21, f: 53.8, step: 5, max: 40 },
  cheddar: { label: 'Cheddar', kcal: 403, p: 22.9, c: 3.1, f: 33, step: 5, max: 60 },
  creamCheese: { label: 'Light cream cheese', kcal: 201, p: 8, c: 8, f: 15, step: 5, max: 60 },
  coconutMilk: { label: 'Coconut milk', kcal: 230, p: 2.3, c: 5.5, f: 24, step: 10, max: 150 },
  hummus: { label: 'Hummus', kcal: 166, p: 7.9, c: 14.3, f: 9.6, step: 5, max: 100 },

  broccoli: { label: 'Broccoli, steamed', kcal: 35, p: 2.4, c: 7.2, f: 0.4, step: 10, max: 300 },
  greens: { label: 'Mixed salad greens', kcal: 20, p: 1.5, c: 3.5, f: 0.2, step: 10, max: 200 },
  stirFryVeg: { label: 'Stir-fry vegetables', kcal: 35, p: 2, c: 7, f: 0.3, step: 10, max: 300 },
  salsa: { label: 'Tomato salsa', kcal: 36, p: 1.5, c: 7, f: 0.2, step: 10, max: 150 },
} satisfies Record<string, Ingredient>;

type IngredientKey = keyof typeof I;

interface Template {
  name: string;
  prepTime: string;
  diets: string[];
  /** Up to three ingredients the solver sizes to the budget. */
  scaled: IngredientKey[];
  /** Fixed sides in grams. */
  fixed?: Partial<Record<IngredientKey, number>>;
}

const ALL_FLEX = ['Omnivore', 'Halal', 'Kosher', 'Mediterranean'];

const TEMPLATES: Record<MealSlot, Template[]> = {
  breakfast: [
    { name: 'Egg-white oats & berries', prepTime: '10 min', diets: [...ALL_FLEX, 'Vegetarian', 'Pescatarian', 'Gluten-Free'], scaled: ['eggWhite', 'oats', 'almondButter'], fixed: { blueberries: 80 } },
    { name: 'Greek yogurt power bowl', prepTime: '5 min', diets: [...ALL_FLEX, 'Vegetarian', 'Pescatarian', 'Gluten-Free'], scaled: ['greekYogurt', 'oats', 'chia'], fixed: { blueberries: 80 } },
    { name: 'Tofu scramble on sourdough', prepTime: '12 min', diets: ['Vegan', 'Vegetarian', 'Dairy-Free', ...ALL_FLEX], scaled: ['tofu', 'sourdough', 'oliveOil'], fixed: { greens: 40 } },
    { name: 'Steak & eggs', prepTime: '12 min', diets: ['Carnivore', 'Paleo', 'Keto', 'Omnivore', 'Gluten-Free', 'Dairy-Free'], scaled: ['sirloin', 'butter'], fixed: { egg: 100 } },
    { name: 'Smoked salmon bagel', prepTime: '6 min', diets: ['Pescatarian', ...ALL_FLEX], scaled: ['smokedSalmon', 'bagel', 'creamCheese'] },
    { name: 'Scrambled eggs, avocado & toast', prepTime: '10 min', diets: [...ALL_FLEX, 'Vegetarian', 'Pescatarian', 'Dairy-Free'], scaled: ['egg', 'sourdough', 'avocado'] },
    { name: 'Eggs, smoked salmon & avocado', prepTime: '8 min', diets: ['Keto', 'Paleo', 'Pescatarian', ...ALL_FLEX, 'Gluten-Free', 'Dairy-Free'], scaled: ['egg', 'smokedSalmon', 'avocado'] },
    { name: 'Cheddar & greens omelette', prepTime: '10 min', diets: ['Keto', 'Vegetarian', 'Gluten-Free', ...ALL_FLEX], scaled: ['egg', 'cheddar', 'butter'], fixed: { greens: 40 } },
    { name: 'Whey oats', prepTime: '5 min', diets: [...ALL_FLEX, 'Vegetarian', 'Pescatarian', 'Gluten-Free'], scaled: ['whey', 'oats', 'peanutButter'], fixed: { banana: 60 } },
  ],
  lunch: [
    { name: 'Chicken, rice & greens', prepTime: '15 min', diets: [...ALL_FLEX, 'Dairy-Free', 'Gluten-Free'], scaled: ['chicken', 'whiteRice', 'oliveOil'], fixed: { broccoli: 100 } },
    { name: 'Chicken burrito bowl', prepTime: '10 min', diets: [...ALL_FLEX, 'Dairy-Free', 'Gluten-Free'], scaled: ['chicken', 'brownRice', 'avocado'], fixed: { salsa: 60 } },
    { name: 'Salmon poke bowl', prepTime: '12 min', diets: ['Pescatarian', ...ALL_FLEX, 'Dairy-Free', 'Gluten-Free'], scaled: ['salmon', 'whiteRice', 'sesameOil'], fixed: { edamame: 40 } },
    { name: 'Tempeh quinoa bowl', prepTime: '14 min', diets: ['Vegan', 'Vegetarian', 'Dairy-Free', ...ALL_FLEX, 'Gluten-Free'], scaled: ['tempeh', 'quinoa', 'tahini'], fixed: { greens: 60 } },
    { name: 'Ribeye plate', prepTime: '14 min', diets: ['Carnivore', 'Keto', 'Paleo', 'Omnivore', 'Gluten-Free', 'Dairy-Free'], scaled: ['ribeye', 'butter'] },
    { name: 'Turkey hummus wrap', prepTime: '8 min', diets: ['Omnivore', 'Halal', 'Mediterranean', 'Dairy-Free'], scaled: ['turkey', 'wrap', 'hummus'], fixed: { greens: 40 } },
    { name: 'Tuna rice bowl', prepTime: '6 min', diets: ['Pescatarian', ...ALL_FLEX, 'Dairy-Free', 'Gluten-Free'], scaled: ['tuna', 'whiteRice', 'avocado'] },
    { name: 'Tuna & egg plate', prepTime: '8 min', diets: ['Carnivore', 'Keto', 'Paleo', 'Pescatarian', 'Omnivore', 'Gluten-Free'], scaled: ['tuna', 'egg', 'butter'] },
    { name: 'Chickpea falafel-style bowl', prepTime: '12 min', diets: ['Vegan', 'Vegetarian', 'Dairy-Free', ...ALL_FLEX], scaled: ['tofu', 'chickpeas', 'tahini'], fixed: { greens: 60 } },
  ],
  dinner: [
    { name: 'Salmon, potato & broccoli', prepTime: '20 min', diets: ['Pescatarian', ...ALL_FLEX, 'Gluten-Free', 'Dairy-Free', 'Paleo'], scaled: ['salmon', 'potato', 'oliveOil'], fixed: { broccoli: 120 } },
    { name: 'Lean beef & sweet potato', prepTime: '18 min', diets: [...ALL_FLEX, 'Paleo', 'Gluten-Free', 'Dairy-Free'], scaled: ['beefMince', 'sweetPotato', 'oliveOil'], fixed: { greens: 60 } },
    { name: 'Lentil & tofu tray bake', prepTime: '25 min', diets: ['Vegan', 'Vegetarian', 'Dairy-Free', ...ALL_FLEX, 'Gluten-Free'], scaled: ['tofu', 'lentils', 'oliveOil'], fixed: { pumpkin: 150 } },
    { name: 'Mince & eggs skillet', prepTime: '12 min', diets: ['Carnivore', 'Keto', 'Paleo', 'Omnivore', 'Gluten-Free', 'Dairy-Free'], scaled: ['beefMince', 'butter'], fixed: { egg: 100 } },
    { name: 'Prawn stir-fry noodles', prepTime: '14 min', diets: ['Pescatarian', 'Omnivore', 'Mediterranean', 'Dairy-Free', 'Gluten-Free'], scaled: ['prawns', 'riceNoodles', 'sesameOil'], fixed: { stirFryVeg: 150 } },
    { name: 'Tofu & chickpea coconut curry', prepTime: '20 min', diets: ['Vegan', 'Vegetarian', 'Dairy-Free', ...ALL_FLEX, 'Gluten-Free'], scaled: ['tofu', 'basmati', 'coconutMilk'], fixed: { chickpeas: 100, stirFryVeg: 100 } },
    { name: 'Tempeh stir-fry noodles', prepTime: '15 min', diets: ['Vegan', 'Vegetarian', 'Dairy-Free', ...ALL_FLEX], scaled: ['tempeh', 'riceNoodles', 'sesameOil'], fixed: { stirFryVeg: 150 } },
    { name: 'Butter-basted salmon', prepTime: '15 min', diets: ['Carnivore', 'Keto', 'Paleo', 'Pescatarian', 'Omnivore', 'Gluten-Free'], scaled: ['salmon', 'butter'], fixed: { egg: 50 } },
    { name: 'Chicken & roast veg', prepTime: '25 min', diets: [...ALL_FLEX, 'Paleo', 'Gluten-Free', 'Dairy-Free'], scaled: ['chicken', 'potato', 'oliveOil'], fixed: { pumpkin: 120 } },
  ],
  snack: [
    { name: 'Cottage cheese & rice cakes', prepTime: '2 min', diets: [...ALL_FLEX, 'Vegetarian', 'Pescatarian', 'Gluten-Free'], scaled: ['cottage', 'riceCakes'] },
    { name: 'Whey shake & banana', prepTime: '2 min', diets: [...ALL_FLEX, 'Vegetarian', 'Pescatarian', 'Gluten-Free'], scaled: ['whey', 'banana'] },
    { name: 'Edamame & almonds', prepTime: '5 min', diets: ['Vegan', 'Vegetarian', 'Dairy-Free', ...ALL_FLEX, 'Gluten-Free', 'Paleo'], scaled: ['edamame', 'almonds'] },
    { name: 'Beef jerky', prepTime: '1 min', diets: ['Carnivore', 'Paleo', 'Keto', 'Omnivore', 'Dairy-Free', 'Gluten-Free'], scaled: ['jerky'] },
    { name: 'Skyr, honey & walnuts', prepTime: '2 min', diets: [...ALL_FLEX, 'Vegetarian', 'Pescatarian', 'Gluten-Free'], scaled: ['skyr', 'honey', 'walnuts'] },
    { name: 'Greek yogurt & berries', prepTime: '2 min', diets: [...ALL_FLEX, 'Vegetarian', 'Pescatarian', 'Gluten-Free', 'Keto'], scaled: ['greekYogurt', 'blueberries'] },
    { name: 'Rice cakes & peanut butter', prepTime: '3 min', diets: ['Vegan', 'Vegetarian', 'Dairy-Free', ...ALL_FLEX], scaled: ['riceCakes', 'peanutButter'] },
  ],
};

export const MEAL_SLOT_SHARE: Record<MealSlot, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

const SLOT_FLOOR: Record<MealSlot, { kcal: number; p: number }> = {
  breakfast: { kcal: 300, p: 25 },
  lunch: { kcal: 400, p: 30 },
  dinner: { kcal: 400, p: 30 },
  snack: { kcal: 150, p: 12 },
};

export interface MacroBudget {
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
}

/** Splits what is left of the day across the slots that are still open, weighted by their usual share. */
export function slotBudget(
  slot: MealSlot,
  remaining: MacroBudget,
  loggedSlots: readonly MealSlot[]
): MacroBudget {
  const open = (Object.keys(MEAL_SLOT_SHARE) as MealSlot[]).filter((s) => s === slot || !loggedSlots.includes(s));
  const weight = MEAL_SLOT_SHARE[slot] / open.reduce((acc, s) => acc + MEAL_SLOT_SHARE[s], 0);
  const floor = SLOT_FLOOR[slot];
  const part = (n: number) => Math.max(0, Math.round(n * weight));
  const kcal = Math.max(floor.kcal, part(remaining.kcal));
  const protein = Math.max(floor.p, part(remaining.protein));
  const share = (n: number) => (remaining.kcal > 0 ? part(n) : 0);
  let carbs = share(remaining.carbs);
  let fats = share(remaining.fats);
  const leftover = kcal - protein * 4 - carbs * 4 - fats * 9;
  if (leftover > 0) {
    carbs += Math.round((leftover * 0.6) / 4);
    fats += Math.round((leftover * 0.4) / 9);
  }
  return { kcal, protein, carbs, fats };
}

export interface IntelMealIngredient {
  label: string;
  grams: number;
  display: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface IntelMealSuggestion {
  id: string;
  name: string;
  prepTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: IntelMealIngredient[];
  /** 0–100: how closely the plate lands on the slot budget. */
  fit: number;
}

type Vec3 = [number, number, number];

function solveLinear(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    if (Math.abs(m[pivot][col]) < 1e-9) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const k = m[r][col] / m[col][col];
      for (let c = col; c <= n; c++) m[r][c] -= k * m[col][c];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

function minGrams(ing: Ingredient): number {
  if (ing.unitG) return ing.unitG;
  if (ing.f >= 50) return 5;
  return ing.p >= 15 ? Math.min(80, ing.max / 2) : 30;
}

/** Bounded weighted least squares over every subset of the scaled ingredients; small enough to brute force. */
function solveGrams(ings: Ingredient[], fullTarget: Vec3, weights: Vec3): number[] {
  const n = ings.length;
  const cols = ings.map((ing) => [ing.p / 100, ing.c / 100, ing.f / 100]);
  const mins = ings.map(minGrams);
  const target = fullTarget.map((v, r) => v - mins.reduce((acc, g, i) => acc + g * cols[i][r], 0)) as Vec3;
  let best: number[] = new Array(n).fill(0);
  let bestErr = Infinity;
  for (let mask = 1; mask < 1 << n; mask++) {
    const idx = [...Array(n).keys()].filter((i) => mask & (1 << i));
    const ata = idx.map((i) => idx.map((j) => cols[i].reduce((acc, v, r) => acc + v * cols[j][r] * weights[r], 0)));
    const atb = idx.map((i) => cols[i].reduce((acc, v, r) => acc + v * target[r] * weights[r], 0));
    const sol = solveLinear(ata, atb);
    if (!sol) continue;
    const x = new Array(n).fill(0);
    idx.forEach((i, k) => {
      x[i] = Math.min(ings[i].max - mins[i], Math.max(0, sol[k]));
    });
    const err = [0, 1, 2].reduce((acc, r) => {
      const got = x.reduce((s, g, i) => s + g * cols[i][r], 0);
      return acc + weights[r] * (got - target[r]) ** 2;
    }, 0);
    if (err < bestErr) {
      bestErr = err;
      best = x;
    }
  }
  return best.map((g, i) => g + mins[i]);
}

function roundTo(grams: number, step: number): number {
  return Math.round(grams / step) * step;
}

function displayFor(ing: Ingredient, grams: number): string {
  if (ing.unitG) {
    const n = Math.round(grams / ing.unitG);
    return `${n} ${ing.unitName}`;
  }
  return `${grams} g`;
}

function buildPlate(t: Template, budget: MacroBudget, lowCarbDiet: boolean): Omit<IntelMealSuggestion, 'id'> {
  const fixed = Object.entries(t.fixed ?? {}) as [IngredientKey, number][];
  const base = fixed.reduce<Vec3>(
    (acc, [k, g]) => [acc[0] + (I[k].p * g) / 100, acc[1] + (I[k].c * g) / 100, acc[2] + (I[k].f * g) / 100],
    [0, 0, 0]
  );
  if (lowCarbDiet && t.scaled.every((k) => I[k].c <= 12)) {
    budget = { ...budget, fats: budget.fats + Math.round((budget.carbs * 4) / 9), carbs: Math.round(base[1]) };
  }
  const target: Vec3 = [
    Math.max(0, budget.protein - base[0]),
    Math.max(0, budget.carbs - base[1]),
    Math.max(0, budget.fats - base[2]),
  ];
  const weights: Vec3 = [3 / Math.max(10, budget.protein) ** 2, 1 / Math.max(10, budget.carbs) ** 2, 1 / Math.max(5, budget.fats) ** 2];
  const scaledIngs: Ingredient[] = t.scaled.map((k) => I[k]);
  const raw = solveGrams(scaledIngs, target, weights);

  const parts: { ing: Ingredient; grams: number }[] = [
    ...t.scaled.map((k, i) => ({ ing: I[k] as Ingredient, grams: roundTo(raw[i], I[k].step) })),
    ...fixed.map(([k, g]) => ({ ing: I[k] as Ingredient, grams: g })),
  ].filter((x) => x.grams > 0);

  const tenth = (n: number) => Math.round(n * 10) / 10;
  const ingredients: IntelMealIngredient[] = parts.map(({ ing, grams }) => ({
    label: ing.label,
    grams,
    display: displayFor(ing, grams),
    calories: Math.round((ing.kcal * grams) / 100),
    protein: tenth((ing.p * grams) / 100),
    carbs: tenth((ing.c * grams) / 100),
    fats: tenth((ing.f * grams) / 100),
  }));
  const total = (key: 'calories' | 'protein' | 'carbs' | 'fats') => Math.round(ingredients.reduce((acc, x) => acc + x[key], 0));
  const calories = total('calories');
  const protein = total('protein');
  const carbs = total('carbs');
  const fats = total('fats');
  const miss = (got: number, want: number) => Math.min(1, Math.abs(got - want) / Math.max(want, 1));
  const fit = Math.round(100 * (1 - (0.45 * miss(calories, budget.kcal) + 0.35 * miss(protein, budget.protein) + 0.1 * miss(carbs, budget.carbs) + 0.1 * miss(fats, budget.fats))));

  return {
    name: t.name,
    prepTime: t.prepTime,
    calories,
    protein,
    carbs,
    fats,
    ingredients,
    fit: Math.max(0, fit),
  };
}

export function buildIntelMeals(input: {
  diet: string;
  slot: MealSlot;
  budget: MacroBudget;
  rotation?: number;
}): IntelMealSuggestion[] {
  const diet = (input.diet || 'Omnivore').toLowerCase();
  const all = TEMPLATES[input.slot];
  const matching = all.filter((t) => t.diets.some((d) => d.toLowerCase() === diet));
  const pool = matching.length > 0 ? matching : all.filter((t) => t.diets.includes('Omnivore'));
  const lowCarbDiet = diet === 'keto' || diet === 'carnivore';
  const plates = pool.map((t) => ({ t, plate: buildPlate(t, input.budget, lowCarbDiet) })).sort((a, b) => b.plate.fit - a.plate.fit);
  const start = pool.length > 0 ? ((input.rotation ?? 0) * 3) % pool.length : 0;
  const ordered = plates.map((_, i) => plates[(start + i) % plates.length]);
  const carbBase = (t: Template) => {
    const k = t.scaled.find((key) => (I[key] as Ingredient).c >= 15);
    if (!k) return null;
    return k === 'basmati' || k.endsWith('Rice') ? 'rice' : k;
  };
  const picked: typeof plates = [];
  const usedBases = new Set<string>();
  for (const p of ordered) {
    if (picked.length === 3) break;
    const base = carbBase(p.t);
    if (base && usedBases.has(base)) continue;
    if (base) usedBases.add(base);
    picked.push(p);
  }
  for (const p of ordered) {
    if (picked.length === 3) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked
    .sort((a, b) => b.plate.fit - a.plate.fit)
    .map(({ t, plate }) => ({ id: `${input.slot}-${t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, ...plate }));
}

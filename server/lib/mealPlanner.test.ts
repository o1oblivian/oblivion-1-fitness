import { describe, expect, it } from 'vitest';
import {
  buildMeal,
  buildPrompt,
  fitScore,
  parseDraftMeals,
  parseRequest,
  rankMeals,
  type DraftMeal,
  type ResolvedIngredient,
} from './mealPlanner';

const target = { kcal: 600, protein: 45, carbs: 60, fats: 18 };

const chicken: ResolvedIngredient = {
  draft: { food: 'Chicken, breast, cooked', grams: 150 },
  per100g: { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
};
const rice: ResolvedIngredient = {
  draft: { food: 'Rice, white, cooked', grams: 200 },
  per100g: { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
};
const draft: DraftMeal = {
  name: 'Chicken and rice',
  prepTime: '15 min',
  ingredients: [chicken.draft, rice.draft],
};

describe('parseDraftMeals', () => {
  it('keeps well-formed meals and clamps weights', () => {
    const meals = parseDraftMeals({
      meals: [
        {
          name: 'Bowl',
          prepTime: '5 min',
          ingredients: [
            { food: 'Oats', grams: 5000 },
            { food: 'Milk', grams: 1 },
          ],
        },
      ],
    });
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients.map((i) => i.grams)).toEqual([600, 5]);
  });

  it('drops meals with fewer than two usable ingredients', () => {
    expect(
      parseDraftMeals({ meals: [{ name: 'Lonely', ingredients: [{ food: 'Egg', grams: 100 }] }] }),
    ).toEqual([]);
    expect(
      parseDraftMeals({ meals: [{ name: 'Bad', ingredients: [{ food: '', grams: 0 }, 7] }] }),
    ).toEqual([]);
  });

  it('copes with garbage', () => {
    expect(parseDraftMeals(null)).toEqual([]);
    expect(parseDraftMeals({ meals: 'no' })).toEqual([]);
  });

  it('returns at most three meals', () => {
    const entry = {
      name: 'M',
      ingredients: [
        { food: 'A', grams: 10 },
        { food: 'B', grams: 10 },
      ],
    };
    expect(parseDraftMeals({ meals: [entry, entry, entry, entry, entry] })).toHaveLength(3);
  });
});

describe('buildMeal', () => {
  it('rescales the plate so calories land on the target', () => {
    const meal = buildMeal(draft, [chicken, rice], target, 'id-1');
    expect(meal).not.toBeNull();
    expect(Math.abs((meal?.calories ?? 0) - target.kcal)).toBeLessThanOrEqual(25);
    // Calories land on target; the macro split of chicken and rice is what costs the last points.
    expect(meal?.fit).toBeGreaterThan(70);
  });

  it('computes every number from the database values, not from the draft', () => {
    const meal = buildMeal(draft, [chicken, rice], target, 'id-1');
    const sum = meal?.ingredients.reduce((total, i) => total + i.calories, 0) ?? 0;
    expect(Math.abs(sum - (meal?.calories ?? 0))).toBeLessThanOrEqual(2);
    expect(meal?.ingredients.every((i) => i.grams % 5 === 0)).toBe(true);
  });

  it('refuses a meal with fewer than two resolved ingredients', () => {
    expect(buildMeal(draft, [chicken], target, 'id-1')).toBeNull();
  });

  it('does not stretch a tiny plate past the scaling limit', () => {
    const small: ResolvedIngredient[] = [
      {
        draft: { food: 'Lettuce', grams: 20 },
        per100g: { calories: 15, protein: 1, carbs: 3, fats: 0 },
      },
      {
        draft: { food: 'Cucumber', grams: 20 },
        per100g: { calories: 15, protein: 1, carbs: 3, fats: 0 },
      },
    ];
    const meal = buildMeal(draft, small, target, 'id-2');
    expect(meal && meal.calories < target.kcal / 2).toBe(true);
    expect(meal && meal.fit < 60).toBe(true);
  });
});

describe('fitScore and rankMeals', () => {
  it('is 100 on target and falls as the meal drifts', () => {
    expect(fitScore(target, target)).toBe(100);
    expect(fitScore({ ...target, kcal: 300 }, target)).toBeLessThan(
      fitScore({ ...target, kcal: 540 }, target),
    );
  });

  it('hides weak fits and orders the rest best first', () => {
    const base = buildMeal(draft, [chicken, rice], target, 'a');
    if (!base) throw new Error('meal expected');
    const ranked = rankMeals([
      { ...base, id: 'low', fit: 40 },
      { ...base, id: 'mid', fit: 75 },
      { ...base, id: 'top', fit: 95 },
    ]);
    expect(ranked.map((m) => m.id)).toEqual(['top', 'mid']);
  });
});

describe('parseRequest', () => {
  const good = {
    slot: 'lunch',
    target,
    diet: 'Vegan',
    country: 'AU',
    usuals: ['Oats'],
    exclude: [],
  };

  it('accepts a valid request', () => {
    expect(parseRequest(good)).toMatchObject({ slot: 'lunch', diet: 'Vegan' });
  });

  it('rejects unknown slots and unreasonable targets', () => {
    expect(parseRequest({ ...good, slot: 'brunch' })).toBeNull();
    expect(parseRequest({ ...good, target: { ...target, kcal: 20 } })).toBeNull();
    expect(parseRequest({ ...good, target: { ...target, kcal: 99999 } })).toBeNull();
    expect(parseRequest(undefined)).toBeNull();
  });

  it('puts the target, diet and exclusions into the prompt', () => {
    const request = parseRequest({ ...good, exclude: ['Tuna salad'] });
    const prompt = request ? buildPrompt(request) : '';
    expect(prompt).toContain('600 kcal');
    expect(prompt).toContain('Vegan');
    expect(prompt).toContain('Tuna salad');
  });
});

import { describe, expect, it } from 'vitest';
import { normalizeFdcFood, pickBestFood, searchFdc, type UsdaFood } from './usda';

const food = (name: string, calories = 150): UsdaFood => ({
  id: `usda-${name}`,
  name,
  brand: 'USDA',
  calories,
  protein: 20,
  carbs: 0,
  fats: 5,
  dataType: 'SR Legacy',
});

describe('normalizeFdcFood', () => {
  it('takes energy from the kcal row, not the kJ row', () => {
    const row = normalizeFdcFood({
      fdcId: 1,
      description: 'Chicken, roasted',
      foodNutrients: [
        { nutrientNumber: '268', nutrientName: 'Energy', unitName: 'KJ', value: 824 },
        { nutrientNumber: '208', nutrientName: 'Energy', unitName: 'KCAL', value: 197 },
        { nutrientNumber: '203', value: 29.8 },
        { nutrientNumber: '204', value: 7.78 },
        { nutrientNumber: '205', value: 0 },
      ],
    });
    expect(row).toMatchObject({ calories: 197, protein: 29.8, fats: 7.8, carbs: 0 });
  });

  it('falls back to the energy row labelled kcal when numbers are missing', () => {
    const row = normalizeFdcFood({
      fdcId: 2,
      description: 'Oats',
      foodNutrients: [
        { nutrientName: 'Energy', unitName: 'KJ', value: 1600 },
        { nutrientName: 'Energy', unitName: 'KCAL', value: 380 },
      ],
    });
    expect(row?.calories).toBe(380);
  });

  it('drops foods with no nutrition and foods with no id', () => {
    expect(normalizeFdcFood({ fdcId: 3, description: 'Mystery', foodNutrients: [] })).toBeNull();
    expect(
      normalizeFdcFood({
        description: 'No id',
        foodNutrients: [{ nutrientNumber: '203', value: 5 }],
      }),
    ).toBeNull();
  });
});

describe('pickBestFood', () => {
  it('prefers the plain food over a breaded variant', () => {
    const picked = pickBestFood('chicken breast cooked', [
      food('Chicken breast tenders, breaded, cooked, microwaved'),
      food('Chicken, broilers or fryers, breast, meat only, cooked, roasted'),
    ]);
    expect(picked?.name).toContain('meat only');
  });

  it('keeps a prepared variant when the query asks for it', () => {
    const picked = pickBestFood('fried chicken breast', [
      food('Chicken breast, fried'),
      food('Chicken breast, roasted'),
    ]);
    expect(picked?.name).toBe('Chicken breast, fried');
  });

  it('returns null when nothing resembles the query', () => {
    expect(pickBestFood('quinoa', [food('Beef, ground'), food('Milk, whole')])).toBeNull();
    expect(pickBestFood('', [food('Beef')])).toBeNull();
  });
});

describe('searchFdc', () => {
  it('reads foods from the response and skips unusable ones', async () => {
    const result = await searchFdc('rice', 'key', {}, async () => ({
      ok: true,
      json: async () => ({
        foods: [
          {
            fdcId: 9,
            description: 'Rice, white, cooked',
            foodNutrients: [{ nutrientNumber: '208', value: 130 }],
          },
          { fdcId: 10, description: 'Empty', foodNutrients: [] },
        ],
      }),
    }));
    expect(result.map((f) => f.name)).toEqual(['Rice, white, cooked']);
  });

  it('throws when the service answers with an error', async () => {
    await expect(
      searchFdc('rice', 'key', {}, async () => ({ ok: false, json: async () => ({}) })),
    ).rejects.toThrow();
  });
});

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GLOBAL_MARKET, isPopularFood } from '../../shared/popularFoods';
import { COUNTRIES } from '../features/fuel/components/ClientCountryMarketModal';
import { loadPopularFoods, popularMarketFor } from './popularFoodsService';

const DIR = resolve(__dirname, '../data/popularFoods');
const files = readdirSync(DIR).filter((name) => name.endsWith('.json'));

describe('bundled popular food lists', () => {
  it('ships a world list and a list for most countries', () => {
    expect(files).toContain(`${GLOBAL_MARKET}.json`);
    const covered = COUNTRIES.filter((c) => files.includes(`${c.code}.json`));
    expect(covered.length).toBeGreaterThanOrEqual(COUNTRIES.length * 0.9);
  });

  it.each(files)('%s is a clean list of real foods', (name) => {
    const foods: unknown = JSON.parse(readFileSync(resolve(DIR, name), 'utf8'));
    expect(Array.isArray(foods)).toBe(true);
    const list = foods as unknown[];
    expect(list.length).toBeGreaterThanOrEqual(80);
    expect(list.length).toBeLessThanOrEqual(100);
    expect(list.every(isPopularFood)).toBe(true);
    const valid = list.filter(isPopularFood);
    expect(new Set(valid.map((f) => f.id)).size).toBe(valid.length);
    expect(new Set(valid.map((f) => f.name.toLowerCase())).size).toBe(valid.length);
    for (const food of valid) {
      // Loose sanity band only: carbs include fibre (cocoa) and wine or spirits carry energy as alcohol, so
      // the macros never add up exactly. This catches a row whose numbers belong to a different food.
      const atwater = food.protein * 4 + food.carbs * 4 + food.fats * 9;
      expect(atwater, `${food.name}`).toBeLessThanOrEqual(food.kcal * 2 + 20);
      expect(food.kcal, `${food.name}`).toBeLessThanOrEqual(910);
      expect(food.protein + food.carbs + food.fats, `${food.name}`).toBeLessThanOrEqual(101);
    }
  });
});

describe('loadPopularFoods', () => {
  it('serves a country its own list', async () => {
    const list = await loadPopularFoods('au');
    expect(list.market).toBe('AU');
    expect(list.foods.length).toBeGreaterThanOrEqual(80);
    expect(list.foods[0]).toMatchObject({ source: 'usda', serving_grams: 100, country: 'AU' });
  });

  it('falls back to the world list for a country without one', async () => {
    expect(popularMarketFor('ZZ')).toBe(GLOBAL_MARKET);
    const list = await loadPopularFoods('ZZ');
    expect(list.market).toBe(GLOBAL_MARKET);
    expect(list.foods.length).toBeGreaterThanOrEqual(80);
  });
});

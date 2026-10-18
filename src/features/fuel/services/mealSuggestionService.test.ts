import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock('../../../services/apiBase', () => ({ apiFetch }));

import {
  clearMealSuggestionCache,
  fetchMealSuggestions,
  normalizeRequest,
} from './mealSuggestionService';
import type { MealSuggestion, MealSuggestionRequest } from '../../../../shared/mealSuggestion';

const request: MealSuggestionRequest = {
  slot: 'lunch',
  target: { kcal: 612, protein: 43, carbs: 58, fats: 17 },
  diet: 'Omnivore',
  country: 'AU',
  usuals: [],
  exclude: [],
};

const meal: MealSuggestion = {
  id: 'm1',
  name: 'Chicken and rice',
  prepTime: '15 min',
  calories: 600,
  protein: 45,
  carbs: 60,
  fats: 18,
  fit: 90,
  ingredients: [],
};

const answer = (ok: boolean, json: unknown) => ({ ok, json: async () => json });

describe('mealSuggestionService', () => {
  beforeEach(() => {
    apiFetch.mockReset();
    clearMealSuggestionCache();
  });

  it('rounds the target so tiny changes share one request', () => {
    expect(normalizeRequest(request).target).toEqual({
      kcal: 600,
      protein: 45,
      carbs: 60,
      fats: 15,
    });
  });

  it('returns the meals the server sends', async () => {
    apiFetch.mockResolvedValue(answer(true, { meals: [meal] }));
    await expect(fetchMealSuggestions(request)).resolves.toEqual([meal]);
    const [, init] = apiFetch.mock.calls[0];
    expect(JSON.parse(init.body).target.kcal).toBe(600);
  });

  it('reuses a recent answer instead of asking again', async () => {
    apiFetch.mockResolvedValue(answer(true, { meals: [meal] }));
    await fetchMealSuggestions(request);
    await fetchMealSuggestions({ ...request, target: { ...request.target, kcal: 620 } });
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('asks again once the answer is old', async () => {
    apiFetch.mockResolvedValue(answer(true, { meals: [meal] }));
    let clock = 0;
    await fetchMealSuggestions(request, undefined, () => clock);
    clock = 16 * 60_000;
    await fetchMealSuggestions(request, undefined, () => clock);
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('asks again when the excluded names change, so refresh brings new meals', async () => {
    apiFetch.mockResolvedValue(answer(true, { meals: [meal] }));
    await fetchMealSuggestions(request);
    await fetchMealSuggestions({ ...request, exclude: ['Chicken and rice'] });
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('shows the server message when it refuses', async () => {
    apiFetch.mockResolvedValue(
      answer(false, { error: 'Meal ideas are not set up on the server (USDA key missing).' }),
    );
    await expect(fetchMealSuggestions(request)).rejects.toThrow('USDA key missing');
  });

  it('says so when nothing can be reached', async () => {
    apiFetch.mockRejectedValue(new Error(''));
    await expect(fetchMealSuggestions(request)).rejects.toThrow('could not be reached');
  });
});

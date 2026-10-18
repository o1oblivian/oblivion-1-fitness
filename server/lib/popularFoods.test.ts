import { describe, expect, it } from 'vitest';
import { buildPopularPrompt, parsePopularDrafts } from './popularFoods';

describe('parsePopularDrafts', () => {
  it('keeps the model order and pairs each name with its USDA wording, category and estimate', () => {
    const drafts = parsePopularDrafts({
      foods: [
        {
          name: 'Chicken breast, grilled',
          usda: 'Chicken, broilers or fryers, breast, cooked',
          cat: 'protein',
          kcal: 165,
        },
        { name: 'Boiled egg', usda: 'Egg, whole, cooked, hard-boiled', cat: 'protein', kcal: 155 },
      ],
    });
    expect(drafts.map((d) => d.name)).toEqual(['Chicken breast, grilled', 'Boiled egg']);
    expect(drafts[1]).toEqual({
      name: 'Boiled egg',
      usda: 'Egg, whole, cooked, hard-boiled',
      cat: 'protein',
      kcal: 155,
    });
  });

  it('drops duplicates, blanks, unknown categories and non-objects', () => {
    const drafts = parsePopularDrafts({
      foods: [
        { name: 'Tuna', cat: 'protein' },
        { name: 'tuna', usda: 'Fish, tuna', cat: 'protein' },
        { name: '  ', cat: 'protein' },
        { name: 'Mystery', cat: 'not-a-category' },
        'Tofu',
        5,
      ],
    });
    expect(drafts).toEqual([{ name: 'Tuna', usda: 'Tuna', cat: 'protein', kcal: null }]);
  });

  it('treats a missing or non-numeric estimate as unknown, never as zero', () => {
    const drafts = parsePopularDrafts({
      foods: [
        { name: 'A', cat: 'veg', kcal: null },
        { name: 'B', cat: 'veg', kcal: 'lots' },
        { name: 'C', cat: 'drinks', kcal: 0 },
      ],
    });
    expect(drafts.map((d) => d.kcal)).toEqual([null, null, 0]);
  });

  it('returns nothing for an answer that is not a food list', () => {
    expect(parsePopularDrafts(null)).toEqual([]);
    expect(parsePopularDrafts({ foods: 'chicken' })).toEqual([]);
  });
});

describe('buildPopularPrompt', () => {
  it('names the country and every category', () => {
    const prompt = buildPopularPrompt({ code: 'AU', name: 'Australia' });
    expect(prompt).toContain('Australia (AU)');
    expect(prompt).toContain('protein:');
    expect(prompt).toContain('fastfood:');
  });

  it('asks about the whole world when no country is given', () => {
    expect(buildPopularPrompt(null)).toContain('anywhere in the world');
  });

  it('lists foods that must not be repeated', () => {
    expect(buildPopularPrompt(null, ['Rice', 'Egg'])).toContain('Rice; Egg');
  });
});

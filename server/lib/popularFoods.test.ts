import { describe, expect, it } from 'vitest';
import { buildPopularPrompt, parsePopularDrafts } from './popularFoods';

describe('parsePopularDrafts', () => {
  it('keeps the model order and pairs each name with its USDA wording', () => {
    const drafts = parsePopularDrafts({
      foods: [
        { name: 'Chicken breast, grilled', usda: 'Chicken, broilers or fryers, breast, cooked' },
        { name: 'Boiled egg', usda: 'Egg, whole, cooked, hard-boiled' },
      ],
    });
    expect(drafts.map((d) => d.name)).toEqual(['Chicken breast, grilled', 'Boiled egg']);
    expect(drafts[1].usda).toBe('Egg, whole, cooked, hard-boiled');
  });

  it('drops duplicates and blanks, and reuses the name when no USDA wording is given', () => {
    const drafts = parsePopularDrafts({
      foods: [{ name: 'Tuna' }, { name: 'tuna', usda: 'Fish, tuna' }, { name: '  ' }, 'Tofu', 5],
    });
    expect(drafts).toEqual([
      { name: 'Tuna', usda: 'Tuna' },
      { name: 'Tofu', usda: 'Tofu' },
    ]);
  });

  it('returns nothing for an answer that is not a food list', () => {
    expect(parsePopularDrafts(null)).toEqual([]);
    expect(parsePopularDrafts({ foods: 'chicken' })).toEqual([]);
  });
});

describe('buildPopularPrompt', () => {
  it('names the category, its hint and the country', () => {
    const prompt = buildPopularPrompt('Carbs', 'rice, pasta and bread', 'AU');
    expect(prompt).toContain('"Carbs"');
    expect(prompt).toContain('rice, pasta and bread');
    expect(prompt).toContain('AU');
  });
});

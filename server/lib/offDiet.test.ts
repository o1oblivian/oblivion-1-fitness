import { describe, expect, it } from 'vitest';
import { dietFactsFromOff } from './offDiet';

describe('dietFactsFromOff', () => {
  it('reads a vegan product as vegan, vegetarian and dairy free', () => {
    expect(dietFactsFromOff({ ingredients_analysis_tags: ['en:vegan', 'en:vegetarian'] })).toEqual({
      vegan: true,
      vegetarian: true,
      dairyFree: true,
    });
  });

  it('rules out what the analysis says is not suitable', () => {
    expect(dietFactsFromOff({ ingredients_analysis_tags: ['en:non-vegetarian'] })).toEqual({
      vegetarian: false,
      vegan: false,
    });
    expect(dietFactsFromOff({ ingredients_analysis_tags: ['en:non-vegan'] })).toEqual({
      vegan: false,
    });
  });

  it('uses the allergen list for gluten and milk, and labels for gluten free', () => {
    expect(dietFactsFromOff({ allergens_tags: ['en:gluten', 'en:milk'] })).toEqual({
      glutenFree: false,
      dairyFree: false,
    });
    expect(dietFactsFromOff({ labels_tags: ['en:gluten-free', 'en:halal'] })).toEqual({
      glutenFree: true,
      halal: true,
    });
  });

  it('never calls a product gluten free because its allergen list is missing', () => {
    expect(dietFactsFromOff({ allergens_tags: [] })).toBeUndefined();
    expect(dietFactsFromOff({})).toBeUndefined();
  });

  it('lets an allergen warning win over a label', () => {
    expect(
      dietFactsFromOff({ labels_tags: ['en:gluten-free'], allergens_tags: ['en:gluten'] }),
    ).toEqual({ glutenFree: false });
  });
});

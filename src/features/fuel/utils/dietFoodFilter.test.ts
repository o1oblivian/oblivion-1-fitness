import { describe, expect, it } from 'vitest';
import { foodMatchesDiet } from './dietFoodFilter';

describe('foodMatchesDiet', () => {
  it('lets everything through for an omnivore', () => {
    expect(foodMatchesDiet({ name: 'Beef mince' }, 'Omnivore')).toBe(true);
    expect(foodMatchesDiet({ name: 'Beef mince' })).toBe(true);
  });

  it('trusts what the database states over the name', () => {
    const vegan = { name: 'Plant-based burger', diet: { vegan: true } };
    const notVegan = { name: 'Garden salad', diet: { vegan: false } };
    expect(foodMatchesDiet(vegan, 'Vegan')).toBe(true);
    expect(foodMatchesDiet(notVegan, 'Vegan')).toBe(false);
  });

  it('keeps gluten out of a gluten-free diet when the allergen list says so', () => {
    expect(
      foodMatchesDiet({ name: 'Rice crackers', diet: { glutenFree: false } }, 'Gluten-free'),
    ).toBe(false);
    expect(foodMatchesDiet({ name: 'Sourdough', diet: { glutenFree: true } }, 'Gluten-free')).toBe(
      true,
    );
  });

  it('falls back to the name when the database states nothing', () => {
    expect(foodMatchesDiet({ name: 'Chicken breast' }, 'Vegan')).toBe(false);
    expect(foodMatchesDiet({ name: 'Banana' }, 'Vegan')).toBe(true);
    expect(foodMatchesDiet({ name: 'Wheat bread' }, 'Gluten-free')).toBe(false);
  });

  it('accepts a vegetarian product for a pescatarian', () => {
    expect(
      foodMatchesDiet({ name: 'Cheese toastie', diet: { vegetarian: true } }, 'Pescatarian'),
    ).toBe(true);
    expect(foodMatchesDiet({ name: 'Beef steak' }, 'Pescatarian')).toBe(false);
  });

  it('keeps carnivore to animal foods', () => {
    expect(foodMatchesDiet({ name: 'Ribeye steak' }, 'Carnivore')).toBe(true);
    expect(foodMatchesDiet({ name: 'Oats' }, 'Carnivore')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { buildUsuals, slotForHour, type MealHistory } from './fuelUsuals';

const meal = (name: string, slot: 'breakfast' | 'lunch' | 'dinner' | 'snack', calories = 300) => ({
  name,
  slot,
  calories,
  proteinG: 20,
  carbsG: 30,
  fatsG: 10,
});

const day = (...meals: ReturnType<typeof meal>[]) => ({ nutrition: { meals } });

describe('slotForHour', () => {
  it('maps the clock to a meal', () => {
    expect(slotForHour(7)).toBe('breakfast');
    expect(slotForHour(12)).toBe('lunch');
    expect(slotForHour(16)).toBe('snack');
    expect(slotForHour(19)).toBe('dinner');
    expect(slotForHour(23)).toBe('snack');
    expect(slotForHour(2)).toBe('snack');
  });
});

describe('buildUsuals', () => {
  const history: MealHistory = {
    '2026-10-14': day(meal('Oats', 'breakfast'), meal('Chicken rice', 'lunch')),
    '2026-10-15': day(meal('Oats', 'breakfast'), meal('Chicken rice', 'lunch')),
    '2026-10-16': day(meal('Oats', 'breakfast'), meal('Protein bar', 'snack')),
    '2026-10-17': day(meal('chicken rice', 'dinner', 650), meal('Pizza', 'dinner')),
  };

  it('ranks foods logged in the current slot first', () => {
    const [first] = buildUsuals(history, '2026-10-18', 'breakfast');
    expect(first.name).toBe('Oats');
    expect(first.slot).toBe('breakfast');
    expect(first.days).toBe(3);
  });

  it('ignores a food seen on only one day', () => {
    const names = buildUsuals(history, '2026-10-18', 'dinner').map((u) => u.name);
    expect(names).not.toContain('Pizza');
    expect(names).not.toContain('Protein bar');
  });

  it('merges names that differ only by case and uses the latest portion', () => {
    const chicken = buildUsuals(history, '2026-10-18', 'lunch').find(
      (u) => u.name.toLowerCase() === 'chicken rice',
    );
    expect(chicken?.days).toBe(3);
    expect(chicken?.calories).toBe(650);
  });

  it('does not let today vouch for itself', () => {
    const withToday: MealHistory = {
      ...history,
      '2026-10-18': day(meal('Pizza', 'dinner'), meal('Pizza', 'dinner')),
    };
    expect(buildUsuals(withToday, '2026-10-18', 'dinner').map((u) => u.name)).not.toContain(
      'Pizza',
    );
  });

  it('returns nothing for a new user', () => {
    expect(buildUsuals({}, '2026-10-18', 'lunch')).toEqual([]);
  });

  it('skips supplements, empty names and zero-calorie rows', () => {
    const odd: MealHistory = {
      '2026-10-15': {
        nutrition: {
          meals: [
            {
              name: 'Creatine',
              calories: 5,
              proteinG: 0,
              carbsG: 0,
              fatsG: 0,
              slot: 'supplements',
            },
            { name: '  ', calories: 100, proteinG: 0, carbsG: 0, fatsG: 0, slot: 'snack' },
            { name: 'Water', calories: 0, proteinG: 0, carbsG: 0, fatsG: 0, slot: 'drinks' },
          ],
        },
      },
      '2026-10-16': {
        nutrition: {
          meals: [
            {
              name: 'Creatine',
              calories: 5,
              proteinG: 0,
              carbsG: 0,
              fatsG: 0,
              slot: 'supplements',
            },
            { name: 'Water', calories: 0, proteinG: 0, carbsG: 0, fatsG: 0, slot: 'drinks' },
          ],
        },
      },
    };
    expect(buildUsuals(odd, '2026-10-18', 'snack')).toEqual([]);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const cloud = vi.hoisted(() => ({
  insertMealRow: vi.fn(),
  deleteMealRow: vi.fn(),
  upsertFuelProfile: vi.fn(),
  upsertFuelDay: vi.fn(),
}));

vi.mock('../services/fuelCloud', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/fuelCloud')>()),
  ...cloud,
  toMealRow: (userId: string, dateKey: string, meal: { id: string }) => ({
    userId,
    dateKey,
    id: meal.id,
  }),
}));

import type { SupplementItem } from '../services/fuelCloud';
import {
  blankDay,
  historyCategory,
  mealsFromCloud,
  normalizeMeal,
  positiveOrNull,
  slotFromCategory,
} from './fuelDefaults';
import { adoptableSupplements, nutritionHistoryRecord, stateFromSnapshot } from './fuelDerive';
import { clearOutbox, emptyOutbox, flushOutbox, outboxPending } from './fuelOutbox';
import type { FuelState } from './fuelTypes';

describe('positiveOrNull', () => {
  it('keeps positive finite numbers and drops everything else', () => {
    expect(positiveOrNull(12.5)).toBe(12.5);
    expect(positiveOrNull('80')).toBe(80);
    expect(positiveOrNull(0)).toBeNull();
    expect(positiveOrNull(-3)).toBeNull();
    expect(positiveOrNull(NaN)).toBeNull();
    expect(positiveOrNull(undefined)).toBeNull();
  });
});

describe('slotFromCategory', () => {
  it('maps free-text categories to slots', () => {
    expect(slotFromCategory('Breakfast')).toBe('breakfast');
    expect(slotFromCategory('late LUNCH')).toBe('lunch');
    expect(slotFromCategory('Dinner')).toBe('dinner');
    expect(slotFromCategory('Pre-workout drink')).toBe('drinks');
    expect(slotFromCategory('Electrolyte mix')).toBe('supplements');
    expect(slotFromCategory('anything else')).toBe('snack');
  });
});

describe('historyCategory', () => {
  it('groups drinks and supplements with snacks', () => {
    expect(historyCategory('breakfast')).toBe('Breakfast');
    expect(historyCategory('lunch')).toBe('Lunch');
    expect(historyCategory('dinner')).toBe('Dinner');
    expect(historyCategory('drinks')).toBe('Snacks');
    expect(historyCategory('supplements')).toBe('Snacks');
    expect(historyCategory('snack')).toBe('Snacks');
  });
});

describe('normalizeMeal', () => {
  it('fills in a missing id and name and clamps bad macros to zero', () => {
    const meal = normalizeMeal({
      id: '',
      name: '',
      calories: -50,
      protein: NaN,
      carbs: 12,
      fats: 3,
    });
    expect(meal.id).toMatch(/^meal-/);
    expect(meal).toMatchObject({ name: 'Food', calories: 0, protein: 0, carbs: 12, fats: 3 });
  });

  it('keeps an id that was given', () => {
    expect(
      normalizeMeal({ id: 'x', name: 'Eggs', calories: 1, protein: 1, carbs: 1, fats: 1 }).id,
    ).toBe('x');
  });
});

describe('mealsFromCloud', () => {
  it('sorts rows into their slots', () => {
    const meals = mealsFromCloud([
      { id: 'a', slot: 'lunch', name: 'Rice', calories: 200, protein: 4, carbs: 40, fats: 1 },
      { id: 'b', slot: 'snack', name: 'Nuts', calories: 150, protein: 5, carbs: 5, fats: 12 },
    ]);
    expect(meals.lunch.map((m) => m.id)).toEqual(['a']);
    expect(meals.snack.map((m) => m.id)).toEqual(['b']);
    expect(meals.dinner).toEqual([]);
  });
});

describe('adoptableSupplements', () => {
  const stack: SupplementItem[] = [
    { id: 'k1', name: 'Creatine', dosage: '5 g', timing: 'Morning', category: 'Custom' },
  ];
  const legacy = {
    items: [
      { id: 'o1', name: 'creatine ', dose: '5g', timing: 'Morning' as const },
      { id: 'o2', name: ' Fish oil', dose: '', timing: 'Evening' as const },
    ],
    takenByDay: { '2026-01-02': ['o2'] },
  };

  it('skips supplements the stack already has and reports which were taken that day', () => {
    const out = adoptableSupplements(legacy, stack, '2026-01-02');
    expect(out.adopted).toEqual([
      { id: 'o2', name: 'Fish oil', dosage: '1 serving', timing: 'Evening', category: 'Custom' },
    ]);
    expect(out.takenIds).toEqual(['o2']);
  });

  it('adopts nothing when there is no old list', () => {
    expect(adoptableSupplements(null, stack, '2026-01-02')).toEqual({ adopted: [], takenIds: [] });
  });
});

describe('nutritionHistoryRecord', () => {
  it('totals the meals and carries the targets', () => {
    const day = blankDay('2026-01-02');
    day.meals.lunch.push({ id: 'a', name: 'Rice', calories: 200, protein: 4, carbs: 40, fats: 1 });
    day.meals.drinks.push({ id: 'b', name: 'Milk', calories: 100, protein: 8, carbs: 10, fats: 4 });
    const record = nutritionHistoryRecord({
      ...day,
      calorieTarget: 2400,
      targetProteinG: null,
    } as unknown as FuelState);
    expect(record.hasData).toBe(true);
    expect(record.calories).toBe(300);
    expect(record.calorieTarget).toBe(2400);
    expect(record.proteinTargetG).toBe(0);
    expect(record.meals.map((m) => [m.name, m.category])).toEqual([
      ['Rice', 'Lunch'],
      ['Milk', 'Snacks'],
    ]);
  });

  it('is empty for a day with no meals', () => {
    const record = nutritionHistoryRecord(blankDay('2026-01-02') as unknown as FuelState);
    expect(record.hasData).toBe(false);
    expect(record.meals).toEqual([]);
  });
});

describe('stateFromSnapshot', () => {
  const local = { calorieTarget: 2000, weightKg: 70, countryMarket: 'AU' } as unknown as FuelState;

  it('keeps local values when the account has no profile', () => {
    const state = stateFromSnapshot(
      { profile: null, day: null, meals: [] },
      blankDay().meals,
      local,
    );
    expect(state.calorieTarget).toBe(2000);
    expect(state.weightKg).toBe(70);
    expect(state.hydrationCurrentL).toBe(0);
    expect(state.cloudReady).toBe(true);
  });

  it('uses the account profile and day when present', () => {
    const state = stateFromSnapshot(
      {
        profile: { user_id: 'u', calorie_target: 2600, weight_kg: 82, hydration_target_ml: 3000 },
        day: { water_ml: 1250, burned_kcal: 400, calories: 0, protein: 0, carbs: 0, fats: 0 },
        meals: [],
      },
      blankDay().meals,
      local,
    );
    expect(state.calorieTarget).toBe(2600);
    expect(state.weightKg).toBe(82);
    expect(state.hydrationTargetL).toBe(3);
    expect(state.hydrationCurrentL).toBe(1.25);
    expect(state.burnedKcal).toBe(400);
  });
});

describe('outbox', () => {
  const meal = {
    id: 'm1',
    slot: 'lunch' as const,
    name: 'Rice',
    calories: 1,
    protein: 1,
    carbs: 1,
    fats: 1,
  };

  beforeEach(() => {
    Object.values(cloud).forEach((fn) => fn.mockReset());
  });

  it('counts each waiting change, with the profile as one', () => {
    const outbox = emptyOutbox();
    expect(outboxPending(outbox)).toBe(0);
    outbox.inserts.push({ dateKey: 'd', meal });
    outbox.deletes.push('x');
    outbox.profile = { weight_kg: 80, diet: 'Omnivore' };
    outbox.days = { d: { water_ml: 500 } };
    expect(outboxPending(outbox)).toBe(4);
  });

  it('clears in place', () => {
    const outbox = emptyOutbox();
    outbox.deletes.push('x');
    const same = outbox;
    clearOutbox(outbox);
    expect(same.deletes).toEqual([]);
  });

  it('drops each change once it is sent', async () => {
    cloud.insertMealRow.mockResolvedValue(true);
    cloud.deleteMealRow.mockResolvedValue(true);
    cloud.upsertFuelProfile.mockResolvedValue(true);
    cloud.upsertFuelDay.mockResolvedValue(true);
    const outbox = emptyOutbox();
    outbox.inserts.push({ dateKey: 'd', meal });
    outbox.deletes.push('x');
    outbox.profile = { weight_kg: 80 };
    outbox.days = { d: { water_ml: 500 } };
    await flushOutbox(outbox, 'u1');
    expect(outbox).toEqual(emptyOutbox());
  });

  it('stops at the first failure and keeps the rest queued', async () => {
    cloud.insertMealRow.mockResolvedValue(false);
    const outbox = emptyOutbox();
    outbox.inserts.push({ dateKey: 'd', meal });
    outbox.deletes.push('x');
    await flushOutbox(outbox, 'u1');
    expect(outbox.inserts).toHaveLength(1);
    expect(outbox.deletes).toEqual(['x']);
    expect(cloud.deleteMealRow).not.toHaveBeenCalled();
  });

  it('keeps profile edits made while the request was in flight', async () => {
    const outbox = emptyOutbox();
    outbox.profile = { weight_kg: 80 };
    cloud.upsertFuelProfile.mockImplementation(async () => {
      outbox.profile = { ...outbox.profile, diet: 'Vegan' };
      return true;
    });
    await flushOutbox(outbox, 'u1');
    expect(outbox.profile).toEqual({ weight_kg: 80, diet: 'Vegan' });
  });
});

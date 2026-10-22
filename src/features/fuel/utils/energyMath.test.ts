import { describe, expect, it } from 'vitest';
import {
  CALORIE_FLOOR,
  dailyBurn,
  macroGrams,
  paceKcalPerDay,
  planForPace,
  restingBurn,
  sensiblePaces,
} from './energyMath';

describe('restingBurn', () => {
  it('uses Mifflin-St Jeor for each sex', () => {
    expect(restingBurn(80, 180, 30, 'male')).toBe(1780);
    expect(restingBurn(60, 165, 30, 'female')).toBe(1320);
  });

  it('waits for every detail', () => {
    expect(restingBurn(80, null, 30, 'male')).toBeNull();
    expect(restingBurn(80, 180, 30, null)).toBeNull();
    expect(restingBurn(null, 180, 30, 'male')).toBeNull();
  });
});

describe('daily burn and pace', () => {
  it('scales the resting burn by activity', () => {
    expect(dailyBurn(1780)).toBe(2759);
    expect(dailyBurn(1780, 1.2)).toBe(2136);
  });

  it('turns kilos a week into calories a day', () => {
    expect(paceKcalPerDay(0.5)).toBe(550);
    expect(paceKcalPerDay(1)).toBe(1100);
  });
});

describe('planForPace', () => {
  it('eats under the burn when the goal is below the weight', () => {
    expect(planForPace(2500, 80, 74, 0.5)).toEqual({
      kcal: 1950,
      gapKcal: 550,
      atFloor: false,
      weeks: 12,
    });
  });

  it('eats over the burn when the goal is above the weight', () => {
    expect(planForPace(2500, 70, 75, 0.25)).toEqual({
      kcal: 2775,
      gapKcal: 275,
      atFloor: false,
      weeks: 20,
    });
  });

  it('never plans below the calorie floor, and says so', () => {
    const plan = planForPace(1700, 90, 80, 1);
    expect(plan?.kcal).toBe(CALORIE_FLOOR);
    expect(plan?.atFloor).toBe(true);
    expect(plan?.gapKcal).toBe(500);
  });

  it('has no plan without a goal or at the goal', () => {
    expect(planForPace(2500, 80, 0, 0.5)).toBeNull();
    expect(planForPace(2500, 80, 80, 0.5)).toBeNull();
    expect(planForPace(0, 80, 70, 0.5)).toBeNull();
  });
});

describe('sensiblePaces', () => {
  it('drops paces above 1% of bodyweight a week', () => {
    expect(sensiblePaces(100)).toEqual([0.25, 0.5, 0.75, 1]);
    expect(sensiblePaces(60)).toEqual([0.25, 0.5]);
    expect(sensiblePaces(40)).toEqual([0.25]);
  });
});

describe('macroGrams', () => {
  it('fixes protein and fat by bodyweight and gives carbohydrate the rest', () => {
    expect(macroGrams(80, 2500)).toEqual({ proteinG: 160, fatsG: 64, carbsG: 321 });
  });

  it('never goes negative', () => {
    expect(macroGrams(80, 800).carbsG).toBe(0);
  });

  it('accepts other ratios', () => {
    expect(macroGrams(80, 2500, 1.8, 1.3)).toEqual({ proteinG: 144, fatsG: 104, carbsG: 247 });
  });
});

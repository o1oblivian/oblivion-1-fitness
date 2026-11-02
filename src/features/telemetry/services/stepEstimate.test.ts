import { describe, expect, it } from 'vitest';
import { estimateKcalFromSteps, estimateKmFromSteps, estimateStepsFromKm } from './stepEstimate';

describe('estimateKmFromSteps', () => {
  it('turns steps into a walking distance', () => {
    expect(estimateKmFromSteps(14000)).toBe(10);
    expect(estimateKmFromSteps(12619)).toBe(9.01);
  });

  it('guesses nothing without steps', () => {
    expect(estimateKmFromSteps(0)).toBeNull();
    expect(estimateKmFromSteps(undefined)).toBeNull();
  });
});

describe('estimateStepsFromKm', () => {
  it('uses the walking stride for a slow treadmill walk', () => {
    // Life Fitness console: 1.36 km in 32:18, about 2.5 km/h.
    expect(estimateStepsFromKm(1.36, 32.3)).toBe(1904);
  });

  it('uses the running stride at running pace', () => {
    expect(estimateStepsFromKm(5, 25)).toBe(5000);
  });

  it('assumes walking when the time is unknown', () => {
    expect(estimateStepsFromKm(2)).toBe(2800);
  });

  it('guesses nothing without a distance', () => {
    expect(estimateStepsFromKm(0, 30)).toBeNull();
    expect(estimateStepsFromKm(null, 30)).toBeNull();
  });
});

describe('estimateKcalFromSteps', () => {
  it('works out net walking burn from steps and bodyweight', () => {
    // 5,600 steps is 4 km; 4 km x 70 kg x 0.5 kcal.
    expect(estimateKcalFromSteps(5600, 70)).toBe(140);
    expect(estimateKcalFromSteps(5016, 70)).toBe(125);
  });

  it('scales with bodyweight', () => {
    expect(estimateKcalFromSteps(7000, 100)).toBe(250);
  });

  it('guesses nothing without steps or a bodyweight', () => {
    expect(estimateKcalFromSteps(0, 70)).toBeNull();
    expect(estimateKcalFromSteps(5000, null)).toBeNull();
    expect(estimateKcalFromSteps(5000, 0)).toBeNull();
    expect(estimateKcalFromSteps(undefined, 70)).toBeNull();
  });
});

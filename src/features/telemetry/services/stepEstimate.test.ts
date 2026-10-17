import { describe, expect, it } from 'vitest';
import { estimateKcalFromSteps, estimateKmFromSteps, estimateStepsFromCardio } from './stepEstimate';

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

describe('estimateStepsFromCardio', () => {
  it('stays null without a distance', () => {
    expect(estimateStepsFromCardio(0, 30)).toBeNull();
  });
});

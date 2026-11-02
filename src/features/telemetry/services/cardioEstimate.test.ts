import { describe, expect, it } from 'vitest';
import { fillCardioGaps, type CardioReadout } from './cardioEstimate';

const blank: CardioReadout = {
  steps: null,
  distanceKm: null,
  elapsedMinutes: null,
  caloriesBurned: null,
  speedKmh: null,
};

describe('fillCardioGaps', () => {
  it('turns a steps-only screen into distance and calories', () => {
    const est = fillCardioGaps({ ...blank, steps: 7000 }, 80);
    expect(est.steps).toBeNull();
    expect(est.distanceKm).toBe(5);
    expect(est.caloriesBurned).toBe(200);
  });

  it('uses the running stride and running cost for a fast cadence', () => {
    const est = fillCardioGaps({ ...blank, steps: 5000, elapsedMinutes: 30 }, 80);
    expect(est.distanceKm).toBe(5);
    expect(est.speedKmh).toBe(10);
    expect(est.caloriesBurned).toBe(400);
  });

  it('turns a distance-only console into steps and calories', () => {
    const est = fillCardioGaps({ ...blank, distanceKm: 1.36, elapsedMinutes: 32.3 }, 80);
    expect(est.steps).toBe(1904);
    expect(est.caloriesBurned).toBe(54);
    expect(est.speedKmh).toBe(2.5);
  });

  it('works out time and distance from speed', () => {
    const est = fillCardioGaps({ ...blank, distanceKm: 3, speedKmh: 6 }, 80);
    expect(est.elapsedMinutes).toBe(30);
    expect(fillCardioGaps({ ...blank, speedKmh: 6, elapsedMinutes: 30 }).distanceKm).toBe(3);
  });

  it('gives a time-only machine a calorie burn', () => {
    expect(fillCardioGaps({ ...blank, elapsedMinutes: 30 }, 80).caloriesBurned).toBe(200);
  });

  it('keeps every number the screen showed', () => {
    const read = {
      steps: 7000,
      distanceKm: 4.8,
      elapsedMinutes: 50,
      caloriesBurned: 310,
      speedKmh: 5.8,
    };
    expect(fillCardioGaps(read, 80)).toEqual(blank);
  });

  it('works out nothing from an empty screen', () => {
    expect(fillCardioGaps(blank, 80)).toEqual(blank);
  });
});

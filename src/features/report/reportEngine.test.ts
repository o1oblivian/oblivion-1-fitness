import { describe, expect, it } from 'vitest';
import { analyseAllLifts, toDayKey } from './reportEngine';
import type { LoggedSet } from './types';

const NOW = new Date(2026, 9, 14, 12).getTime();
const daysAgo = (n: number) => toDayKey(NOW - n * 86_400_000);
const set = (exercise: string, weightKg: number, reps: number, ago: number): LoggedSet => ({
  exercise,
  weightKg,
  reps,
  rpe: null,
  day: daysAgo(ago),
});

describe('analyseAllLifts', () => {
  it('lists single-session and unclassified lifts, most recent first', () => {
    const lifts = analyseAllLifts(
      [set('Bench Press', 80, 5, 10), set('Zercher Carry Thing', 40, 8, 2)],
      NOW,
    );
    expect(lifts.map((l) => l.name)).toEqual(['Zercher Carry Thing', 'Bench Press']);
    expect(lifts[1].sessions).toBe(1);
  });

  it('keeps the set behind the all-time best', () => {
    const [lift] = analyseAllLifts(
      [set('Squat', 100, 5, 30), set('Squat', 110, 3, 20), set('Squat', 90, 8, 5)],
      NOW,
    );
    expect(lift.bestWeightKg).toBe(110);
    expect(lift.bestReps).toBe(3);
    expect(lift.bestDay).toBe(daysAgo(20));
    expect(lift.series.map((s) => [s.weightKg, s.reps])).toEqual([
      [100, 5],
      [110, 3],
      [90, 8],
    ]);
  });

  it('skips bodyweight sets and sets above 12 reps', () => {
    expect(analyseAllLifts([set('Push Up', 0, 20, 1), set('Curl', 10, 15, 1)], NOW)).toEqual([]);
  });

  it('flags a lift with no new best in over four weeks as a plateau', () => {
    const [lift] = analyseAllLifts(
      [
        set('Deadlift', 150, 3, 40),
        set('Deadlift', 140, 3, 30),
        set('Deadlift', 145, 3, 15),
        set('Deadlift', 145, 3, 3),
      ],
      NOW,
    );
    expect(lift.trend).toBe('plateau');
  });
});

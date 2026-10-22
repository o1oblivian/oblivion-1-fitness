import { describe, expect, it } from 'vitest';
import type { WeighIn } from '../report/types';
import { goalProgress, trendChangeKg, trendSeries, weeklyRateKg } from './weightTrend';

/** A weigh-in `offset` days after 1 March 2026. */
function entry(offset: number, kg: number): WeighIn {
  const d = new Date(Date.UTC(2026, 2, 1 + offset));
  const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return { day, kg };
}

/** One weigh-in a day, dropping by `perDay` from `start`. */
function steady(days: number, start: number, perDay: number): WeighIn[] {
  return Array.from({ length: days }, (_, i) =>
    entry(i, Math.round((start + perDay * i) * 100) / 100),
  );
}

describe('trendSeries', () => {
  it('starts at the first reading and ignores bad or duplicate entries', () => {
    const series = trendSeries([entry(0, 80), entry(0, 81), { day: '2026-03-02', kg: -3 }]);
    expect(series).toEqual([{ day: '2026-03-01', kg: 81, trendKg: 81 }]);
  });

  it('moves slowly: a single heavy day barely shifts the trend', () => {
    const series = trendSeries([entry(0, 80), entry(1, 80), entry(2, 82)]);
    expect(series[2].trendKg).toBeGreaterThan(80);
    expect(series[2].trendKg).toBeLessThan(80.5);
  });

  it('gives a reading more weight after a gap in weighing', () => {
    const daily = trendSeries([entry(0, 80), entry(1, 78)])[1].trendKg;
    const afterGap = trendSeries([entry(0, 80), entry(10, 78)])[1].trendKg;
    expect(afterGap).toBeLessThan(daily);
  });

  it('sorts entries given out of order', () => {
    const series = trendSeries([entry(2, 79), entry(0, 80), entry(1, 80)]);
    expect(series.map((p) => p.day)).toEqual(['2026-03-01', '2026-03-02', '2026-03-03']);
  });
});

describe('weeklyRateKg', () => {
  it('is null without three readings across five days', () => {
    expect(weeklyRateKg(trendSeries([entry(0, 80), entry(1, 79.9)]))).toBeNull();
    expect(weeklyRateKg(trendSeries([entry(0, 80), entry(1, 79.9), entry(2, 79.8)]))).toBeNull();
  });

  it('reads a steady loss as kilograms per week', () => {
    const rate = weeklyRateKg(trendSeries(steady(14, 90, -0.07)));
    expect(rate).toBeCloseTo(-0.49, 1);
  });

  it('reads a steady gain as positive', () => {
    const rate = weeklyRateKg(trendSeries(steady(10, 70, 0.05)));
    expect(rate).toBeGreaterThan(0.3);
  });

  it('only looks at the last two weeks', () => {
    const old = steady(20, 100, -1);
    const recent = Array.from({ length: 14 }, (_, i) => entry(20 + i, 80));
    expect(weeklyRateKg(trendSeries([...old, ...recent]))).toBeCloseTo(0, 1);
  });
});

describe('trendChangeKg', () => {
  it('is null until there is some history', () => {
    expect(trendChangeKg(trendSeries([entry(0, 80)]))).toBeNull();
    expect(trendChangeKg(trendSeries([entry(0, 80), entry(1, 79)]))).toBeNull();
  });

  it('compares against the trend a week earlier', () => {
    const change = trendChangeKg(trendSeries(steady(15, 90, -0.1)), 7);
    expect(change).toBeLessThan(0);
    expect(change).toBeGreaterThan(-0.8);
  });

  it('falls back to the first reading while the history is under a week', () => {
    expect(trendChangeKg(trendSeries(steady(5, 90, -0.2)), 7)).toBeLessThan(0);
  });
});

describe('goalProgress', () => {
  it('needs both a weight and a goal', () => {
    expect(goalProgress(0, 75, null)).toBeNull();
    expect(goalProgress(80, 0, null)).toBeNull();
  });

  it('counts the goal as reached when within 300 g', () => {
    expect(goalProgress(75.2, 75, -0.4)).toEqual({
      remainingKg: -0.2,
      reached: true,
      etaWeeks: null,
      verdict: 'steady',
    });
  });

  it('gives no verdict before the weekly rate is known', () => {
    expect(goalProgress(80, 75, null)).toEqual({
      remainingKg: -5,
      reached: false,
      etaWeeks: null,
      verdict: null,
    });
  });

  it('projects weeks to go when moving the right way at a sustainable pace', () => {
    expect(goalProgress(80, 75, -0.5)).toMatchObject({ etaWeeks: 10, verdict: 'on-track' });
    expect(goalProgress(70, 75, 0.25)).toMatchObject({ etaWeeks: 20, verdict: 'on-track' });
  });

  it('flags a pace above 1% of bodyweight a week', () => {
    expect(goalProgress(80, 70, -1)).toMatchObject({ verdict: 'too-fast' });
  });

  it('flags drifting the wrong way and standing still', () => {
    expect(goalProgress(80, 75, 0.4)).toMatchObject({ verdict: 'wrong-way', etaWeeks: null });
    expect(goalProgress(80, 75, 0.02)).toMatchObject({ verdict: 'too-slow', etaWeeks: null });
  });

  it('shows no estimate when it is more than two years out', () => {
    expect(goalProgress(120, 60, -0.2)).toMatchObject({ etaWeeks: null, verdict: 'on-track' });
  });
});

import { describe, expect, it } from 'vitest';
import { buildTodayIntel } from './todayIntel';
import { toDayKey } from './reportEngine';
import type { BodyStatusState } from '../bodyStatus/bodyStatus';
import type { OblivionReport, SleepSample } from './types';

const NOW = new Date(2026, 2, 10, 9).getTime();
const today = toDayKey(NOW);

/** Only the parts the call for today reads. */
const report = {
  stats: { acwr: 1, acwrLabel: 'Optimal' },
  muscles: [],
  lifts: [
    {
      name: 'Bench Press',
      lastWeightKg: 100,
      lastReps: 5,
      lastDay: today,
      currentE1rm: 115,
      trend: 'rising',
    },
  ],
} as unknown as OblivionReport;

const wellRested: SleepSample[] = [{ day: today, hours: 8, recoveryPct: 90 }];

const ready: BodyStatusState = { status: 'ready', since: null, area: null };

describe('buildTodayIntel with how the athlete feels', () => {
  it('follows the numbers when the athlete feels good', () => {
    const intel = buildTodayIntel(report, [], wellRested, NOW, ready);
    expect(intel.decision).toBe('PUSH');
    expect(intel.prescriptions).toHaveLength(1);
  });

  it('holds training on a rest day and offers no load targets', () => {
    const intel = buildTodayIntel(report, [], wellRested, NOW, {
      status: 'rest',
      since: today,
      area: null,
    });
    expect(intel.decision).toBe('REST');
    expect(intel.prescriptions).toEqual([]);
    expect(intel.readiness).not.toBeNull();
  });

  it('holds training while sick, and talks about easing back after the first days', () => {
    const early = buildTodayIntel(report, [], wellRested, NOW, {
      status: 'sick',
      since: today,
      area: null,
    });
    expect(early.decision).toBe('REST');
    expect(early.detail).toMatch(/skip training/i);

    const later = buildTodayIntel(report, [], wellRested, NOW, {
      status: 'sick',
      since: toDayKey(NOW - 4 * 86_400_000),
      area: null,
    });
    expect(later.detail).toMatch(/ease back/i);
  });

  it('trains around an injury at 10% less, naming the area', () => {
    const intel = buildTodayIntel(report, [], wellRested, NOW, {
      status: 'injured',
      since: today,
      area: 'Knee',
    });
    expect(intel.decision).toBe('PROTECT');
    expect(intel.headline).toBe('Train around your knee');
    expect(intel.prescriptions[0].targetWeightKg).toBe(90);
    expect(intel.prescriptions[0].rpeCap).toBe(7);
  });
});

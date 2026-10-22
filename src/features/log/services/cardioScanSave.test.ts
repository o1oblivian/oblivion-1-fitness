import { describe, expect, it } from 'vitest';
import type { CardioDayRecord } from '../store/useTelemetryHistoryStore';
import { defaultScanMerge, hasAnyNumber, planCardioScan, type ScanToSave } from './cardioScanSave';

const logged: CardioDayRecord = {
  hasData: true,
  distanceKm: 2,
  durationMinutes: 30,
  burnedKcal: 200,
  avgHeartRateBpm: 0,
  zone2Minutes: 0,
  activityType: 'Watch',
  steps: 6000,
};

const watchScan: ScanToSave = {
  device: 'watch',
  activityType: 'Watch',
  steps: 8000,
  readSteps: 8000,
  distanceKm: 0,
  durationMinutes: 0,
  burnedKcal: 260,
  avgHeartRateBpm: 0,
};

const consoleScan: ScanToSave = {
  device: 'console',
  activityType: 'Console',
  steps: 1500,
  readSteps: 0,
  distanceKm: 1.5,
  durationMinutes: 20,
  burnedKcal: 150,
  avgHeartRateBpm: 0,
};

describe('planCardioScan', () => {
  it('logs the first scan of the day as it is read', () => {
    const plan = planCardioScan(undefined, watchScan, 'add');
    expect(plan.record.steps).toBe(8000);
    expect(plan.kcalDelta).toBe(260);
    expect(plan.stepChange).toEqual({ kind: 'set', total: 8000 });
  });

  it('adds a second scan on top of what is logged', () => {
    const plan = planCardioScan(logged, consoleScan, 'add');
    expect(plan.record.steps).toBe(7500);
    expect(plan.record.distanceKm).toBe(3.5);
    expect(plan.record.burnedKcal).toBe(350);
    expect(plan.kcalDelta).toBe(150);
    expect(plan.stepChange).toEqual({ kind: 'session', remove: 0, steps: 1500 });
  });

  it('adds a watch reading to the steps already counted', () => {
    const plan = planCardioScan(logged, watchScan, 'add');
    expect(plan.record.steps).toBe(14000);
    expect(plan.stepChange).toEqual({ kind: 'add', steps: 8000 });
  });

  it('replaces the logged day, so numbers are not counted twice', () => {
    const plan = planCardioScan(logged, watchScan, 'replace');
    expect(plan.record.steps).toBe(8000);
    expect(plan.record.burnedKcal).toBe(260);
    expect(plan.record.durationMinutes).toBe(0);
    expect(plan.kcalDelta).toBe(60);
    expect(plan.stepChange).toEqual({ kind: 'set', total: 8000 });
  });

  it('takes the replaced steps off before a console session is counted', () => {
    const plan = planCardioScan(logged, consoleScan, 'replace');
    expect(plan.record.steps).toBe(1500);
    expect(plan.kcalDelta).toBe(-50);
    expect(plan.stepChange).toEqual({ kind: 'session', remove: 6000, steps: 1500 });
  });

  it('treats replace as add when nothing is logged yet', () => {
    const plan = planCardioScan(undefined, consoleScan, 'replace');
    expect(plan.record.steps).toBe(1500);
    expect(plan.kcalDelta).toBe(150);
    expect(plan.stepChange).toEqual({ kind: 'session', remove: 0, steps: 1500 });
  });
});

describe('scan helpers', () => {
  it('defaults a watch to replace and a console to add', () => {
    expect(defaultScanMerge('watch')).toBe('replace');
    expect(defaultScanMerge('console')).toBe('add');
    expect(defaultScanMerge(undefined)).toBe('add');
  });

  it('knows when a scan has nothing to save', () => {
    expect(
      hasAnyNumber({
        steps: 0,
        distanceKm: 0,
        durationMinutes: 0,
        burnedKcal: 0,
        avgHeartRateBpm: 0,
      }),
    ).toBe(false);
    expect(hasAnyNumber({ ...consoleScan, steps: 0, distanceKm: 0, durationMinutes: 0 })).toBe(
      true,
    );
  });
});

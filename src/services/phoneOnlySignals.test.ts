import { describe, expect, it, vi } from 'vitest';

vi.mock('../utils/athleteSettingsSnapshot', () => ({ readAthleteSettingsSnapshot: () => ({}) }));
vi.mock('./supabaseClient', () => ({ supabase: {} }));
vi.mock('./syncOutbox', () => ({
  enqueueSync: vi.fn(),
  flushSync: vi.fn(),
  registerSyncHandler: vi.fn(),
  rewriteSyncOps: vi.fn(),
  scheduleSync: vi.fn(),
}));

import { DEFAULT_REMINDERS, planReminders } from './athleteReminderScheduler';
import { parseBeatIntervalsMs } from './ble/bleTypes';
import { HrvCollector } from './ble/hrv';
import { withoutSteps } from '../features/log/services/dayLogCloud';

const on = { osPushEnabled: true, preWorkoutReminder: true };

describe('planReminders', () => {
  it('plans nothing while reminders are off', () => {
    expect(
      planReminders(
        { osPushEnabled: false, preWorkoutReminder: true },
        { ...DEFAULT_REMINDERS, hydrationOn: true },
      ),
    ).toEqual([]);
  });

  it('fires 30 minutes before training on each chosen day', () => {
    const plan = planReminders(on, {
      ...DEFAULT_REMINDERS,
      workoutTime: '18:00',
      selectedDays: ['Mon'],
      recoveryOn: false,
    });
    expect(plan).toEqual([expect.objectContaining({ weekday: 1, hour: 17, minute: 30 })]);
  });

  it('moves a just-after-midnight workout reminder to the day before', () => {
    const plan = planReminders(on, {
      ...DEFAULT_REMINDERS,
      workoutTime: '00:15',
      selectedDays: ['Sun'],
      recoveryOn: false,
    });
    expect(plan).toEqual([expect.objectContaining({ weekday: 6, hour: 23, minute: 45 })]);
  });

  it('spreads water reminders from 8am to 8pm with unique ids', () => {
    const plan = planReminders(
      { osPushEnabled: true, preWorkoutReminder: false },
      { ...DEFAULT_REMINDERS, recoveryOn: false, hydrationOn: true, hydrationHours: 3 },
    );
    expect(plan.map((p) => p.hour)).toEqual([8, 11, 14, 17, 20]);
    expect(new Set(plan.map((p) => p.id)).size).toBe(plan.length);
  });
});

function hrPacket(rr1024: number[], flags = 0x10): DataView {
  const bytes = new Uint8Array(2 + rr1024.length * 2);
  bytes[0] = flags;
  bytes[1] = 60;
  rr1024.forEach((v, i) => {
    bytes[2 + i * 2] = v & 0xff;
    bytes[3 + i * 2] = v >> 8;
  });
  return new DataView(bytes.buffer);
}

describe('parseBeatIntervalsMs', () => {
  it('reads beat intervals in 1/1024 s', () => {
    expect(parseBeatIntervalsMs(hrPacket([1024, 512]))).toEqual([1000, 500]);
  });

  it('returns null when the sensor sends no intervals', () => {
    expect(parseBeatIntervalsMs(hrPacket([], 0x00))).toBeNull();
  });
});

describe('HrvCollector', () => {
  it('waits for enough clean beats, then gives RMSSD', () => {
    const c = new HrvCollector();
    expect(c.push(Array(30).fill(800))).toBeNull();
    const alternating = Array.from({ length: 60 }, (_, i) => (i % 2 ? 820 : 780));
    expect(c.push(alternating)).toBeGreaterThan(0);
  });

  it('drops missed-beat artifacts instead of counting them', () => {
    const clean = new HrvCollector();
    const noisy = new HrvCollector();
    const beats = Array(80).fill(800);
    clean.push(beats);
    noisy.push([...beats.slice(0, 40), 1600, ...beats.slice(40)]);
    expect(noisy.rmssd()).toBe(clean.rmssd());
  });
});

describe('withoutSteps', () => {
  it('never lets a step-only day leave the phone', () => {
    expect(
      withoutSteps('cardio', { hasData: true, activityType: 'Steps', steps: 9000, distanceKm: 0 }),
    ).toBeNull();
  });

  it('keeps the burn worked out from steps on the phone too', () => {
    expect(
      withoutSteps('cardio', {
        hasData: true,
        activityType: 'Steps',
        steps: 9000,
        stepKcal: 220,
        burnedKcal: 0,
      }),
    ).toBeNull();
    const out = withoutSteps('cardio', {
      hasData: true,
      activityType: 'Running',
      steps: 6000,
      stepKcal: 150,
      distanceKm: 5,
    });
    expect(out).toEqual({ hasData: true, activityType: 'Running', distanceKm: 5 });
  });

  it('keeps a real cardio session but strips its step count', () => {
    const out = withoutSteps('cardio', {
      hasData: true,
      activityType: 'Running',
      steps: 6000,
      distanceKm: 5,
    });
    expect(out).toEqual({ hasData: true, activityType: 'Running', distanceKm: 5 });
  });

  it('leaves other categories untouched', () => {
    const sleep = { hasData: true, durationHours: 7 };
    expect(withoutSteps('sleep', sleep)).toBe(sleep);
  });
});

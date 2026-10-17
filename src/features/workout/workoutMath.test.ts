import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExerciseItem } from '../../types';

const storage = new Map<string, unknown>();
const userState = { weightKg: 0 };
const fuelState = { weightKg: 0 };
const historyState: { historyByDate: Record<string, unknown> } = { historyByDate: {} };

vi.mock('../../utils/safeStorage', () => {
  const safeStorage = {
    getItem: (key: string, fallback?: unknown) => (storage.has(key) ? storage.get(key) : fallback),
    setItem: (key: string, value: unknown) => {
      storage.set(key, value);
      return true;
    },
    removeItem: (key: string) => storage.delete(key),
  };
  return { safeStorage, default: safeStorage };
});
vi.mock('../../stores/useUserStore', () => ({ useUserStore: { getState: () => userState } }));
vi.mock('../fuel/store/useFuelStore', () => ({ useFuelStore: { getState: () => fuelState } }));
vi.mock('../log/store/useTelemetryHistoryStore', () => ({
  getTelemetryHistoryState: () => historyState,
}));

const {
  resistanceMet,
  resistanceKcal,
  sessionMinutes,
  trackSessionClock,
  resetSessionClock,
  estimateSessionEnergy,
} = await import('./utils/sessionEnergy');
const { estimatedMaxKg, priorBestKg, priorBestSet, setIsPr } = await import('./services/sessionPr');

const MIN = 60_000;
const T0 = Date.UTC(2026, 9, 12, 8, 0);

function lift(sets: Array<{ rpe: number; completed: boolean }>): ExerciseItem {
  return {
    id: 'ex',
    name: 'Bench',
    targetMuscle: 'Chest',
    restSecs: 90,
    sets: sets.map((s, i) => ({ setNumber: i + 1, weightKg: 80, reps: 8, ...s })),
  };
}

beforeEach(() => {
  storage.clear();
  userState.weightKg = 0;
  fuelState.weightKg = 0;
  historyState.historyByDate = {};
});

describe('resistanceMet', () => {
  it('uses 3.5 MET when no RPE was logged', () => expect(resistanceMet(null)).toBe(3.5));
  it('maps RPE 6 to 9 linearly onto 3.5 to 6.0 MET', () => {
    expect(resistanceMet(6)).toBe(3.5);
    expect(resistanceMet(7.5)).toBeCloseTo(4.75);
    expect(resistanceMet(9)).toBe(6);
  });
  it('clamps outside that range', () => {
    expect(resistanceMet(4)).toBe(3.5);
    expect(resistanceMet(10)).toBe(6);
  });
});

describe('resistanceKcal', () => {
  it('counts net active kcal only', () => expect(resistanceKcal(50, 80, 8)).toBe(292));
  it('returns null without a bodyweight instead of guessing', () =>
    expect(resistanceKcal(50, null, 8)).toBeNull());
  it('returns null for a zero-minute session', () => expect(resistanceKcal(0, 80, 8)).toBeNull());
});

describe('sessionMinutes', () => {
  it('falls back to 2.5 min per set with no clock', () => expect(sessionMinutes(12, T0)).toBe(30));

  it('measures live ticking from first to last tick plus the first set', () => {
    trackSessionClock(1, T0);
    trackSessionClock(12, T0 + 45.5 * MIN);
    expect(sessionMinutes(12, T0 + 45.5 * MIN)).toBe(48);
  });

  it('counts at most 5 idle minutes after the last tick', () => {
    trackSessionClock(1, T0);
    trackSessionClock(12, T0 + 45.5 * MIN);
    expect(sessionMinutes(12, T0 + 105.5 * MIN)).toBe(53);
  });

  it('ignores an un-tick when moving the last tick time', () => {
    trackSessionClock(1, T0);
    trackSessionClock(5, T0 + 20 * MIN);
    trackSessionClock(4, T0 + 30 * MIN);
    expect(sessionMinutes(4, T0 + 20 * MIN)).toBe(23);
  });

  it('uses the per-set estimate when every set was ticked at once', () => {
    trackSessionClock(12, T0);
    expect(sessionMinutes(12, T0 + MIN)).toBe(30);
  });

  it('caps a forgotten session at 180 minutes', () => expect(sessionMinutes(200, T0)).toBe(180));

  it('resets cleanly', () => {
    trackSessionClock(1, T0);
    resetSessionClock();
    expect(sessionMinutes(4, T0 + 90 * MIN)).toBe(10);
  });
});

describe('estimateSessionEnergy', () => {
  it('averages RPE over ticked sets only and ignores out-of-range values', () => {
    userState.weightKg = 80;
    const energy = estimateSessionEnergy(
      [
        lift([
          { rpe: 8, completed: true },
          { rpe: 9, completed: true },
          { rpe: 6, completed: false },
          { rpe: 14, completed: true },
        ]),
      ],
      3,
      T0,
    );
    expect(energy.avgRpe).toBe(8.5);
    expect(energy.durationMinutes).toBe(8);
    expect(energy.burnedKcal).not.toBeNull();
  });

  it('falls back to the Fuel bodyweight when the profile has none', () => {
    fuelState.weightKg = 70;
    expect(
      estimateSessionEnergy([lift([{ rpe: 0, completed: true }])], 1, T0).burnedKcal,
    ).toBeGreaterThan(0);
  });

  it('returns null burn when no plausible bodyweight is known', () => {
    fuelState.weightKg = 25;
    const energy = estimateSessionEnergy([lift([{ rpe: 0, completed: true }])], 1, T0);
    expect(energy.avgRpe).toBeNull();
    expect(energy.burnedKcal).toBeNull();
  });
});

describe('PR detection', () => {
  beforeEach(() => {
    historyState.historyByDate = {
      '2026-10-05': {
        workout: { exercises: [{ name: 'Bench Press', setLog: [{ weightKg: 100, reps: 5 }] }] },
      },
      '2026-10-08': { workout: { exercises: [{ name: 'bench press ', weightKg: 90, reps: 1 }] } },
      '2026-10-12': {
        workout: { exercises: [{ name: 'Bench Press', setLog: [{ weightKg: 120, reps: 3 }] }] },
      },
    };
  });

  it('uses the Epley estimate, and a single is its own max', () => {
    expect(estimatedMaxKg(100, 1)).toBe(100);
    expect(estimatedMaxKg(100, 5)).toBeCloseTo(116.67, 1);
    expect(estimatedMaxKg(0, 5)).toBe(0);
    expect(estimatedMaxKg(100, 0)).toBe(0);
  });

  it('excludes today so live ticks cannot be their own prior best', () => {
    expect(priorBestKg('Bench Press', '2026-10-12')).toBeCloseTo(116.67, 1);
    expect(priorBestKg('Bench Press')).toBeCloseTo(132, 1);
  });

  it('matches names case-insensitively and trims spaces', () =>
    expect(priorBestKg('  BENCH PRESS', '2026-10-06')).toBeCloseTo(116.67, 1));

  it('needs to beat the prior, not equal it', () => {
    const prior = priorBestKg('Bench Press', '2026-10-12');
    expect(setIsPr('Bench Press', 100, 5, prior)).toBe(false);
    expect(setIsPr('Bench Press', 102.5, 5, prior)).toBe(true);
  });

  it('has no prior for a lift never logged', () => {
    expect(priorBestKg('Zercher Squat')).toBe(0);
    expect(priorBestSet('Zercher Squat')).toBeNull();
  });

  it('returns the actual set behind the best, not just the estimate', () => {
    expect(priorBestSet('Bench Press', '2026-10-12')).toMatchObject({
      weightKg: 100,
      reps: 5,
      dateKey: '2026-10-05',
    });
    expect(priorBestSet('Bench Press')).toMatchObject({
      weightKg: 120,
      reps: 3,
      dateKey: '2026-10-12',
    });
  });

  it('reports the real set behind the best estimate', () => {
    expect(priorBestSet('Bench Press', '2026-10-12')).toMatchObject({
      weightKg: 100,
      reps: 5,
      dateKey: '2026-10-05',
    });
    expect(priorBestSet('Bench Press')).toMatchObject({
      weightKg: 120,
      reps: 3,
      dateKey: '2026-10-12',
    });
    expect(priorBestSet('Zercher Squat')).toBeNull();
  });
});

describe('mergeWorkoutDay', async () => {
  const { mergeWorkoutDay } = await import('./store/workoutSetOperations');
  const ledger = { tonnageKg: 500, completedSets: 5, totalReps: 40, exercises: [] };

  it('adds a second session on top of the first', () => {
    const merged = mergeWorkoutDay(
      {
        hasData: true,
        tonnageKg: 1000,
        completedSets: 10,
        durationMinutes: 30,
        intensityRpe: 8,
        burnedKcal: 200,
        routineName: 'Push A',
        exercises: [],
      },
      ledger,
      'Arms',
      { durationMinutes: 20, avgRpe: 6, burnedKcal: 100 },
    );
    expect(merged).toMatchObject({
      tonnageKg: 1500,
      completedSets: 15,
      durationMinutes: 50,
      intensityRpe: 7.2,
      burnedKcal: 300,
      routineName: 'Push A + Arms',
    });
  });

  it('does not write a zero burn', () => {
    expect(
      mergeWorkoutDay(undefined, ledger, 'Push A', {
        durationMinutes: 20,
        avgRpe: null,
        burnedKcal: null,
      }),
    ).not.toHaveProperty('burnedKcal');
  });

  it('does not repeat the routine name when the same session is logged twice', () => {
    expect(
      mergeWorkoutDay({ hasData: true, routineName: 'Push A', exercises: [] }, ledger, 'Push A')
        .routineName,
    ).toBe('Push A');
  });
});

describe('completeSetsBefore', async () => {
  const { completeSetsBefore } = await import('./store/workoutSetOperations');
  const ticks = (exs: ExerciseItem[]) => exs[0].sets.map((s) => Boolean(s.completed));

  it('ticks filled sets before the one being worked on', () => {
    const exs = [
      lift([
        { rpe: 0, completed: false },
        { rpe: 0, completed: false },
        { rpe: 0, completed: false },
      ]),
    ];
    expect(ticks(completeSetsBefore(exs, 'ex', 3))).toEqual([true, true, false]);
  });

  it('leaves sets without reps unticked', () => {
    const exs = [
      lift([
        { rpe: 0, completed: false },
        { rpe: 0, completed: false },
      ]),
    ];
    exs[0].sets[0].reps = 0;
    expect(ticks(completeSetsBefore(exs, 'ex', 2))).toEqual([false, false]);
  });

  it('returns the same array when nothing changes', () => {
    const exs = [
      lift([
        { rpe: 0, completed: true },
        { rpe: 0, completed: false },
      ]),
    ];
    expect(completeSetsBefore(exs, 'ex', 2)).toBe(exs);
  });
});

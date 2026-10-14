import { describe, expect, it, vi } from 'vitest';

vi.mock('../../log/store/useTelemetryHistoryStore', () => ({
  getTelemetryHistoryState: () => ({ historyByDate: {} }),
}));

import { feelWord, lastSessionSets, nextSetAdvice, prefillFromHistory, summariseLifts, topSet } from './setCoach';

const history = {
  '2026-10-01': { workout: { exercises: [{ name: 'Bench Press', sets: 2, reps: 8, weightKg: 50, setLog: [{ weightKg: 50, reps: 8 }, { weightKg: 50, reps: 8 }] }] } },
  '2026-10-08': { workout: { exercises: [{ name: 'bench press', sets: 3, reps: 0, weightKg: 0, setLog: [{ weightKg: 60, reps: 8 }, { weightKg: 60, reps: 7 }, { weightKg: 57.5, reps: 6 }] }] } },
  '2026-10-14': { workout: { exercises: [{ name: 'Bench Press', sets: 1, reps: 5, weightKg: 70, setLog: [{ weightKg: 70, reps: 5 }] }] } },
};

const blank = (n: number, extra: Record<string, unknown> = {}) =>
  Array.from({ length: n }, (_, i) => ({ id: `s${i}`, setNumber: i + 1, weightKg: 20, weight: 20, reps: 0, rpe: 0, completed: false, ...extra }));

describe('lastSessionSets', () => {
  it('returns the most recent earlier day, case-insensitive', () => {
    expect(lastSessionSets('Bench Press', '2026-10-14', history)).toEqual({
      dateKey: '2026-10-08',
      sets: [{ weightKg: 60, reps: 8 }, { weightKg: 60, reps: 7 }, { weightKg: 57.5, reps: 6 }],
    });
  });

  it('is null for a lift never logged', () => {
    expect(lastSessionSets('Squat', '2026-10-14', history)).toBeNull();
  });
});

describe('prefillFromHistory', () => {
  it('fills blank sets set-for-set and repeats the last one when there are more', () => {
    const [ex] = prefillFromHistory([{ name: 'Bench Press', sets: blank(4) }], history, '2026-10-14');
    expect(ex.sets.map((s) => [s.weightKg, s.reps])).toEqual([[60, 8], [60, 7], [57.5, 6], [57.5, 6]]);
  });

  it('leaves prescribed and ticked sets alone', () => {
    const sets = [
      { id: 'a', setNumber: 1, weightKg: 40, reps: 10, rpe: 0, completed: false },
      { id: 'b', setNumber: 2, weightKg: 0, reps: 0, rpe: 0, completed: true },
    ];
    const [ex] = prefillFromHistory([{ name: 'Bench Press', sets }], history, '2026-10-14');
    expect(ex.sets).toEqual(sets);
  });

  it('keeps a new lift as it is', () => {
    const input = [{ name: 'Squat', sets: blank(2) }];
    expect(prefillFromHistory(input, history, '2026-10-14')).toEqual(input);
  });
});

describe('topSet', () => {
  it('picks the heaviest estimated max', () => {
    expect(topSet([{ weightKg: 60, reps: 8 }, { weightKg: 70, reps: 2 }, { weightKg: 50, reps: 12 }])).toEqual({ weightKg: 60, reps: 8 });
  });

  it('picks the most reps for bodyweight work', () => {
    expect(topSet([{ weightKg: 0, reps: 8 }, { weightKg: 0, reps: 12 }])).toEqual({ weightKg: 0, reps: 12 });
  });
});

describe('summariseLifts', () => {
  const ticked = (name: string, sets: Array<[number, number]>, extraUnticked = false) => ({
    name,
    sets: [
      ...sets.map(([weightKg, reps], i) => ({ id: `${name}${i}`, setNumber: i + 1, weightKg, reps, rpe: 0, completed: true })),
      ...(extraUnticked ? [{ id: 'x', setNumber: 99, weightKg: 200, reps: 10, rpe: 0, completed: false }] : []),
    ],
  });

  it('compares the top ticked set with last session and the all-time best', () => {
    const [bench] = summariseLifts([ticked('Bench Press', [[62.5, 8], [60, 8]], true)], '2026-10-14', history);
    expect(bench).toMatchObject({ top: { weightKg: 62.5, reps: 8 }, lastTop: { weightKg: 60, reps: 8 }, trend: 'up', best: true });
  });

  it('marks a lighter day as down and not a best', () => {
    const [bench] = summariseLifts([ticked('Bench Press', [[50, 5]])], '2026-10-14', history);
    expect(bench).toMatchObject({ trend: 'down', best: false });
  });

  it('marks a lift never logged as first', () => {
    const [squat] = summariseLifts([ticked('Squat', [[80, 5]])], '2026-10-14', history);
    expect(squat).toMatchObject({ trend: 'first', lastTop: null, best: false });
  });

  it('skips lifts with nothing ticked', () => {
    expect(summariseLifts([{ name: 'Row', sets: [{ id: 'a', setNumber: 1, weightKg: 50, reps: 8, rpe: 0, completed: false }] }], '2026-10-14', history)).toEqual([]);
  });
});

describe('feelWord', () => {
  it('maps averages to the four answers', () => {
    expect([6, 7, 8.5, 10].map(feelWord)).toEqual(['Easy', 'Good', 'Hard', 'Max']);
  });
});

describe('nextSetAdvice', () => {
  const base = { weightKg: 60, reps: 8, stepKg: 2.5, rpeCap: 9 };

  it('waits for a feel', () => {
    expect(nextSetAdvice({ ...base, rpe: 0 })).toBeNull();
  });

  it('adds one step when it felt easy', () => {
    expect(nextSetAdvice({ ...base, rpe: 6 })).toEqual({ kind: 'up', weightKg: 62.5, reps: 8 });
  });

  it('repeats when it felt right', () => {
    expect(nextSetAdvice({ ...base, rpe: 7 })).toMatchObject({ kind: 'same', weightKg: 60 });
  });

  it('holds when hard but within the cap', () => {
    expect(nextSetAdvice({ ...base, rpe: 8.5 })).toMatchObject({ kind: 'hold', weightKg: 60 });
  });

  it('backs off past the athlete cap', () => {
    expect(nextSetAdvice({ ...base, rpeCap: 7, rpe: 8.5 })).toEqual({ kind: 'down', weightKg: 57.5, reps: 8 });
  });

  it('drops weight after a max set', () => {
    expect(nextSetAdvice({ ...base, weightKg: 100, rpe: 10 })).toEqual({ kind: 'down', weightKg: 95, reps: 8 });
  });

  it('tells careful athletes to stop pushing after a max set', () => {
    expect(nextSetAdvice({ ...base, weightKg: 100, rpe: 10, careful: true })).toEqual({ kind: 'stop', weightKg: 90, reps: 8 });
  });

  it('moves reps for bodyweight work', () => {
    expect(nextSetAdvice({ ...base, weightKg: 0, rpe: 6 })).toEqual({ kind: 'up', weightKg: 0, reps: 10 });
    expect(nextSetAdvice({ ...base, weightKg: 0, rpe: 10 })).toEqual({ kind: 'down', weightKg: 0, reps: 6 });
  });
});

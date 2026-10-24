import { describe, expect, it } from 'vitest';
import type { ExerciseItem, ExerciseSet } from '../../../../types';
import { countUntickedFilledSets, sessionFeel, tickFilledSets } from './sessionSummary';
import { applyDialValue, dialDisplayValue, nextDialStep } from './useSetDial';

const set = (n: number, over: Partial<ExerciseSet> = {}): ExerciseSet => ({
  id: `s${n}`,
  setNumber: n,
  weightKg: 50,
  reps: 0,
  rpe: 0,
  completed: false,
  ...over,
});

const exercise = (id: string, sets: ExerciseSet[]): ExerciseItem => ({
  id,
  name: id,
  targetMuscle: 'chest',
  sets,
  restSecs: 90,
});

describe('tickFilledSets', () => {
  it('ticks sets that have reps and leaves empty ones alone', () => {
    const [ex] = tickFilledSets([exercise('a', [set(1, { reps: 8 }), set(2, { reps: 0 })])]);
    expect(ex.sets.map((s) => s.completed)).toEqual([true, false]);
  });

  it('does not change its input', () => {
    const input = [exercise('a', [set(1, { reps: 8 })])];
    tickFilledSets(input);
    expect(input[0].sets[0].completed).toBe(false);
  });
});

describe('countUntickedFilledSets', () => {
  it('counts sets with reps that are not ticked', () => {
    const list = [
      exercise('a', [set(1, { reps: 8 }), set(2, { reps: 8, completed: true }), set(3)]),
      exercise('b', [set(1, { reps: 5 })]),
    ];
    expect(countUntickedFilledSets(list)).toBe(2);
  });
});

describe('sessionFeel', () => {
  it('is null when no ticked set has an effort rating', () => {
    expect(sessionFeel([exercise('a', [set(1, { completed: true })])], false)).toBeNull();
    expect(sessionFeel([exercise('a', [set(1, { rpe: 8 })])], false)).toBeNull();
  });

  it('averages the effort of ticked sets', () => {
    const list = [
      exercise('a', [
        set(1, { completed: true, rpe: 7 }),
        set(2, { completed: true, rpe: 8 }),
        set(3, { rpe: 10 }),
      ]),
    ];
    expect(sessionFeel(list, false)).toBe('Average effort RPE 7.5');
  });
});

describe('nextDialStep', () => {
  it('walks reps into weight, then effort, then closes', () => {
    const afterReps = nextDialStep(
      [
        { field: 'weight', value: 80 },
        { field: 'rpe', value: 0 },
      ],
      'kg',
    );
    expect(afterReps).toEqual({
      field: 'weight',
      initialValue: 80,
      follow: [{ field: 'rpe', value: 0 }],
    });
    const afterWeight = nextDialStep(afterReps?.follow ?? [], 'kg');
    expect(afterWeight).toEqual({ field: 'rpe', initialValue: 8, follow: [] });
    expect(nextDialStep(afterWeight?.follow ?? [], 'kg')).toBeNull();
  });

  it('shows an empty rep dial at 10', () => {
    expect(dialDisplayValue('reps', 0, 'kg')).toBe(10);
    expect(dialDisplayValue('reps', 6, 'kg')).toBe(6);
  });
});

describe('applyDialValue', () => {
  const list = [exercise('a', [set(1), set(2)]), exercise('b', [set(1)])];

  it('writes weight in both weight fields on the matching set only', () => {
    const out = applyDialValue(list, { exerciseId: 'a', setNumber: 2 }, 'weight', 82.5);
    expect(out[0].sets[1]).toMatchObject({ weight: 82.5, weightKg: 82.5 });
    expect(out[0].sets[0].weightKg).toBe(50);
    expect(out[1]).toBe(list[1]);
  });

  it('writes reps and effort', () => {
    const reps = applyDialValue(list, { exerciseId: 'a', setNumber: 1 }, 'reps', 12);
    expect(reps[0].sets[0].reps).toBe(12);
    const rpe = applyDialValue(list, { exerciseId: 'a', setNumber: 1 }, 'rpe', 9);
    expect(rpe[0].sets[0].rpe).toBe(9);
  });

  it('finds the set by id when given', () => {
    const out = applyDialValue(list, { exerciseId: 'a', setNumber: 99, setId: 's1' }, 'reps', 5);
    expect(out[0].sets[0].reps).toBe(5);
  });
});

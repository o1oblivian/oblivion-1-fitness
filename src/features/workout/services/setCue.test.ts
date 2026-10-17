import { describe, expect, it } from 'vitest';
import { nextSetCue, type SetCueInput } from './setCue';

const base: SetCueInput = {
  isActive: true,
  isDone: false,
  hasReps: true,
  hasWeight: true,
  hasRpe: false,
  touchedReps: false,
  touchedWeight: false,
};

describe('nextSetCue', () => {
  it('points at reps and weight first', () => {
    expect(nextSetCue(base)).toBe('values');
  });

  it('keeps pointing at the values until both are confirmed', () => {
    expect(nextSetCue({ ...base, touchedReps: true })).toBe('values');
    expect(nextSetCue({ ...base, touchedWeight: true })).toBe('values');
  });

  it('asks for effort once reps and weight are confirmed', () => {
    expect(nextSetCue({ ...base, touchedReps: true, touchedWeight: true })).toBe('effort');
  });

  it('points at the tick once effort is in', () => {
    expect(nextSetCue({ ...base, touchedReps: true, touchedWeight: true, hasRpe: true })).toBe(
      'tick',
    );
  });

  it('does not wait on a weight for bodyweight sets', () => {
    expect(nextSetCue({ ...base, hasWeight: false, touchedReps: true })).toBe('effort');
  });

  it('still asks for reps when none are set', () => {
    expect(nextSetCue({ ...base, hasReps: false, touchedReps: true, touchedWeight: true })).toBe(
      'values',
    );
  });

  it('is quiet on sets that are done or not up next', () => {
    expect(nextSetCue({ ...base, isDone: true })).toBeNull();
    expect(nextSetCue({ ...base, isActive: false })).toBeNull();
  });
});

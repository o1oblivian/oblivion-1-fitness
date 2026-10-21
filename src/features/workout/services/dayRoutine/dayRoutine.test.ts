import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkoutExercise } from '../../store/workoutStoreTypes';
import { nearDuplicate, planMinutes } from './movementPicker';
import { findSavedRoutine, resetForReuse, storeSavedRoutine } from './savedDayRoutines';
import { formatConciseSplitName } from './splitNames';

describe('formatConciseSplitName', () => {
  it('shortens known splits', () => {
    expect(formatConciseSplitName('PUSH A')).toBe('Push A');
    expect(formatConciseSplitName('legs b (heavy)')).toBe('Legs B');
    expect(formatConciseSplitName('PULL')).toBe('Pull');
    expect(formatConciseSplitName('HYROX prep')).toBe('Hyper');
    expect(formatConciseSplitName('Active recovery')).toBe('Rest');
  });

  it('is Rest for an empty name and clips long custom names to the first word', () => {
    expect(formatConciseSplitName('')).toBe('Rest');
    expect(formatConciseSplitName('Upper body strength')).toBe('Upper');
    expect(formatConciseSplitName('Arms')).toBe('Arms');
  });
});

describe('nearDuplicate', () => {
  it('spots the same lift under different names', () => {
    expect(
      nearDuplicate('Standing Overhead Military Press', 'Standing Barbell Overhead Press'),
    ).toBe(true);
  });

  it('keeps different lifts apart', () => {
    expect(nearDuplicate('Barbell Flat Bench Press', 'Conventional Barbell Deadlift')).toBe(false);
  });
});

describe('planMinutes', () => {
  it('adds each set’s work time and rest', () => {
    const move = {
      name: 'x',
      muscle: 'm',
      equipment: 'e',
      tier: 't',
      restSecs: 80,
      sets: 3,
      reps: 5,
    };
    expect(planMinutes([move])).toBe(6);
    expect(planMinutes([])).toBe(0);
  });
});

describe('saved day routines', () => {
  const exercise: WorkoutExercise = {
    id: 'old',
    name: 'Squat',
    targetMuscle: 'Quadriceps',
    restSecs: 120,
    sets: [
      { id: 'a', setNumber: 1, weightKg: 100, reps: 5, rpe: 8, completed: true },
      { id: 'b', setNumber: 2, weightKg: 100, reps: 5, rpe: 8, completed: true },
    ],
  };

  beforeEach(() => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, String(v)),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('resets sets to not done and renews the ids', () => {
    const [ex] = resetForReuse('Mon', [exercise]);
    expect(ex.id).toMatch(/^saved-mon-/);
    expect(ex.id).not.toBe('old');
    expect(ex.sets.every((s) => !s.completed)).toBe(true);
    expect(ex.sets[0].weightKg).toBe(100);
  });

  it('stores one workout per weekday and reads it back', () => {
    expect(findSavedRoutine('Mon')).toBeNull();
    storeSavedRoutine('Mon', '', [exercise]);
    storeSavedRoutine('Tue', 'Arms', [exercise]);
    expect(findSavedRoutine('Mon')?.splitName).toBe('PUSH A');
    expect(findSavedRoutine('Tue')?.splitName).toBe('Arms');
    expect(findSavedRoutine('Wed')).toBeNull();
  });

  it('treats unreadable storage as no saved workout', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('o1fc_athlete_saved_day_routines', '{nope');
    expect(findSavedRoutine('Mon')).toBeNull();
    storeSavedRoutine('Mon', 'Mine', [exercise]);
    expect(findSavedRoutine('Mon')?.splitName).toBe('Mine');
  });
});

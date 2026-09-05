import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculate1RM,
  calculateRepMaxTable,
  evaluateSetProgression,
  recordPersonalRecord,
  getExerciseHistoryStats,
} from '@/utils/prIntelligence';

describe('Training OS Pro - PR Intelligence & Progressive Overload Engine', () => {
  const TEST_EMAIL = 'pr_test_athlete@o1fc.app';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('1RM & Rep Max Formula Calculations', () => {
    it('returns exact weight for a single rep (1RM = weight)', () => {
      expect(calculate1RM(100, 1)).toBe(100);
      expect(calculate1RM(142.5, 1)).toBe(142.5);
    });

    it('calculates standard Epley 1RM accurately for low-to-moderate rep ranges', () => {
      // 100kg for 5 reps: 100 * (1 + 5/30) = 116.666... -> 116.7
      expect(calculate1RM(100, 5)).toBe(116.7);
      // 120kg for 10 reps: 120 * (1 + 10/30) = 160.0
      expect(calculate1RM(120, 10)).toBe(160);
    });

    it('safely handles zero or negative inputs', () => {
      expect(calculate1RM(0, 10)).toBe(0);
      expect(calculate1RM(100, 0)).toBe(0);
      expect(calculate1RM(-50, 5)).toBe(0);
      expect(calculate1RM(100, -2)).toBe(0);
    });

    it('dampens extreme endurance rep counts (>20 reps) to avoid distorted 1RM', () => {
      const damped25 = calculate1RM(50, 25);
      const linear25 = Math.round(50 * (1 + 25 / 30) * 10) / 10;
      expect(damped25).toBeLessThan(linear25);
    });

    it('calculates full rep max table snapped to 0.5kg increments', () => {
      const table = calculateRepMaxTable(100);
      expect(table[1]).toBe(100);
      expect(table[5]).toBeDefined();
      expect(table[10]).toBeDefined();
      // Snap to 0.5kg
      Object.values(table).forEach((weight) => {
        expect(weight % 0.5).toBe(0);
      });
    });
  });

  describe('Real-time Set Progression Evaluation & Badges', () => {
    it('evaluates an all-time PR breakthrough with celebration badge', () => {
      // Set baseline PR of 100kg 1RM
      recordPersonalRecord('Barbell Bench Press', 100, 1, TEST_EMAIL);

      // Athlete pushes 105kg for 1 rep (1RM = 105kg)
      const evaluation = evaluateSetProgression(
        'Barbell Bench Press',
        105,
        1,
        [{ weight: 105, reps: 1 }],
        TEST_EMAIL
      );

      expect(evaluation.isNewPR).toBe(true);
      expect(evaluation.prDiff).toBe(5);
      expect(evaluation.statusBadge.variant).toBe('pr');
      expect(evaluation.statusBadge.isCelebration).toBe(true);
      expect(evaluation.statusBadge.text).toContain('+5 kg PR');
    });

    it('evaluates a match with the existing all-time PR', () => {
      recordPersonalRecord('Barbell Back Squat', 140, 1, TEST_EMAIL);

      const evaluation = evaluateSetProgression(
        'Barbell Back Squat',
        140,
        1,
        [{ weight: 140, reps: 1 }],
        TEST_EMAIL
      );

      expect(evaluation.isNewPR).toBe(false);
      expect(evaluation.statusBadge.variant).toBe('match');
      expect(evaluation.statusBadge.text).toContain('Matches PR');
    });

    it('evaluates bodyweight max reps PRs for zero-weight movements (Pull-ups, Push-ups)', () => {
      // Set bodyweight baseline of 12 reps
      recordPersonalRecord('Pull-up', 0, 12, TEST_EMAIL);

      // Athlete performs 16 bodyweight pull-ups
      const evaluation = evaluateSetProgression(
        'Pull-up',
        0,
        16,
        [{ weight: 0, reps: 16 }],
        TEST_EMAIL
      );

      expect(evaluation.isNewPR).toBe(true);
      expect(evaluation.statusBadge.variant).toBe('pr');
      expect(evaluation.statusBadge.isCelebration).toBe(true);
      expect(evaluation.statusBadge.text).toContain('+4 Reps PR');
    });

    it('returns empty/neutral evaluation when reps are 0', () => {
      const evaluation = evaluateSetProgression(
        'Barbell Bench Press',
        100,
        0,
        [],
        TEST_EMAIL
      );
      expect(evaluation.isNewPR).toBe(false);
      expect(evaluation.statusBadge.variant).toBe('empty');
    });
  });

  describe('PR Memory Persistence', () => {
    it('records and updates personal records in local storage', () => {
      const saved1 = recordPersonalRecord('Deadlift', 180, 1, TEST_EMAIL);
      expect(saved1).toBe(true);

      const stats1 = getExerciseHistoryStats('Deadlift', TEST_EMAIL);
      expect(stats1.allTimePR1RM).toBe(180);

      // Lower lift shouldn't overwrite PR
      const saved2 = recordPersonalRecord('Deadlift', 160, 1, TEST_EMAIL);
      expect(saved2).toBe(false);
      const stats2 = getExerciseHistoryStats('Deadlift', TEST_EMAIL);
      expect(stats2.allTimePR1RM).toBe(180);

      // Higher lift overwrites PR
      const saved3 = recordPersonalRecord('Deadlift', 200, 1, TEST_EMAIL);
      expect(saved3).toBe(true);
      const stats3 = getExerciseHistoryStats('Deadlift', TEST_EMAIL);
      expect(stats3.allTimePR1RM).toBe(200);
    });
  });
});

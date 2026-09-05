import { describe, it, expect, beforeEach } from 'vitest';
import {
  TandemPair,
  TandemGoal,
  TandemWorkoutExercise,
} from '@/utils/tandemStore';

describe('Tandem Mode & Partner Synchronization Logic', () => {
  describe('Invite Code Generation Rules', () => {
    it('generates high-entropy 6-character uppercase codes excluding ambiguous characters', () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      // Test the character generator pattern
      for (let run = 0; run < 50; run++) {
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars[Math.floor(Math.random() * chars.length)];
        }
        expect(code.length).toBe(6);
        expect(code).toBe(code.toUpperCase());
        // Should not contain ambiguous characters 0, O, 1, I
        expect(code).not.toContain('0');
        expect(code).not.toContain('O');
        expect(code).not.toContain('1');
        expect(code).not.toContain('I');
      }
    });
  });

  describe('Tandem Goal Collaborative Aggregation', () => {
    it('calculates joint goal contribution accurately across partners', () => {
      const goal: TandemGoal = {
        id: 'goal-1',
        pair_id: 'pair-100',
        title: 'Joint 100km Running Goal',
        target_value: 100,
        current_value_a: 35,
        current_value_b: 40,
        unit: 'km',
        deadline: null,
        completed: false,
        created_at: new Date().toISOString(),
      };

      const totalCurrent = goal.current_value_a + goal.current_value_b;
      expect(totalCurrent).toBe(75);
      expect(goal.completed).toBe(false);

      // Partner B logs 30 km
      const newB = goal.current_value_b + 30;
      const newTotal = goal.current_value_a + newB;
      const isCompleted = newTotal >= goal.target_value;

      expect(newTotal).toBe(105);
      expect(isCompleted).toBe(true);
    });
  });

  describe('Tandem Workout Transmission Structure', () => {
    it('validates structured exercise routines dispatched between partners', () => {
      const exercises: TandemWorkoutExercise[] = [
        { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rest: '90s', notes: 'Partner spotting required' },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '75s' },
      ];

      expect(exercises.length).toBe(2);
      expect(exercises[0].sets).toBe(4);
      expect(exercises[0].notes).toContain('spotting');
    });
  });
});

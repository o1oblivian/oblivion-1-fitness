import { describe, it, expect } from 'vitest';
import {
  FOCUS_CATEGORY_MAPPING,
  CATEGORY_FOCUS_OPTIONS,
  CATEGORY_DEFAULT_SPLITS,
  getDefaultFocusForCategory,
  getIntelligentExercises,
  generateSmartBlueprint,
  applyDifficultyModifier,
  BlueprintSlot,
} from '@/utils/intelligentWorkoutEngine';

describe('Training OS Pro - Intelligent Workout Engine', () => {
  describe('Focus Category Mapping & Splits', () => {
    it('defines comprehensive category mappings for all athletic disciplines', () => {
      expect(FOCUS_CATEGORY_MAPPING.Push).toBeDefined();
      expect(FOCUS_CATEGORY_MAPPING.Pull).toBeDefined();
      expect(FOCUS_CATEGORY_MAPPING.Legs).toBeDefined();
      expect(FOCUS_CATEGORY_MAPPING.Powerlifting || FOCUS_CATEGORY_MAPPING['Squat Priority']).toBeDefined();
      expect(FOCUS_CATEGORY_MAPPING.Hyrox).toBeDefined();
      expect(FOCUS_CATEGORY_MAPPING.Endurance).toBeDefined();
      expect(FOCUS_CATEGORY_MAPPING.Mobility).toBeDefined();
      expect(FOCUS_CATEGORY_MAPPING.Combat).toBeDefined();
      expect(FOCUS_CATEGORY_MAPPING.Calisthenics).toBeDefined();
      expect(FOCUS_CATEGORY_MAPPING.Sports).toBeDefined();
    });

    it('returns valid default focus for categories across 7 days', () => {
      const categories = ['Hypertrophy', 'Push Pull Legs', 'Strength', 'HYROX', 'Endurance', 'Mobility', 'Calisthenics'];
      categories.forEach((cat) => {
        for (let day = 0; day < 7; day++) {
          const focus = getDefaultFocusForCategory(cat, day);
          expect(typeof focus).toBe('string');
          expect(focus.length).toBeGreaterThan(0);
        }
      });
    });

    it('provides tailored focus options for routine builder pills', () => {
      expect(CATEGORY_FOCUS_OPTIONS.Hypertrophy).toContain('Push');
      expect(CATEGORY_FOCUS_OPTIONS.HYROX).toContain('HYROX Simulation');
      expect(CATEGORY_FOCUS_OPTIONS.Endurance).toContain('Zone 2 Aerobic Base');
      expect(CATEGORY_FOCUS_OPTIONS.Mobility).toContain('Hip & Pelvic Flow');
      expect(CATEGORY_FOCUS_OPTIONS.Calisthenics).toContain('Straight Arm & Lever');
    });
  });

  describe('Intelligent Exercise Filtering & Compound Detection', () => {
    it('returns exercises matching Push focus', () => {
      const exercises = getIntelligentExercises('Push');
      expect(exercises.length).toBeGreaterThan(0);
      expect(exercises.some((e) => e.isCompound)).toBe(true);
    });

    it('accurately identifies compound exercises using biomechanical keyword rules', () => {
      const exercises = getIntelligentExercises('Powerlifting');
      const compoundExercises = exercises.filter((e) => e.isCompound);
      expect(compoundExercises.length).toBeGreaterThan(0);
      expect(compoundExercises.some((e) => /press|squat|deadlift|pull-up/i.test(e.name))).toBe(true);
    });

    it('filters exercises by query string gracefully', () => {
      const allPush = getIntelligentExercises('Push');
      const dumbbellOnly = getIntelligentExercises('Push', 'dumbbell');
      expect(dumbbellOnly.length).toBeLessThanOrEqual(allPush.length);
      dumbbellOnly.forEach((e) => {
        expect(e.name.toLowerCase().includes('dumbbell') || e.category.toLowerCase().includes('dumbbell')).toBe(true);
      });
    });
  });

  describe('Smart Blueprint Generation across Disciplines', () => {
    it('generates Mobility flow blueprints with joint mobility notes', () => {
      const hipBlueprint = generateSmartBlueprint('Hip & Pelvic Flow', 'Mobility');
      expect(hipBlueprint.length).toBeGreaterThanOrEqual(4);
      expect(hipBlueprint[0].name).toContain('Hip');
      expect(hipBlueprint.every((s) => s.sets >= 2 && s.restSec >= 0)).toBe(true);
    });

    it('generates HYROX race simulation blueprints with high-output stations', () => {
      const hyroxBlueprint = generateSmartBlueprint('HYROX Simulation', 'HYROX');
      expect(hyroxBlueprint.length).toBeGreaterThanOrEqual(4);
      const names = hyroxBlueprint.map((s) => s.name.toLowerCase());
      expect(names.some((n) => n.includes('skierg') || n.includes('sled') || n.includes('run'))).toBe(true);
    });

    it('generates Endurance blueprints with Zone 2 & tempo pace targets', () => {
      const enduranceBlueprint = generateSmartBlueprint('Zone 2 Aerobic Base', 'Endurance');
      expect(enduranceBlueprint.length).toBeGreaterThanOrEqual(3);
      expect(enduranceBlueprint[0].name).toContain('Zone 2');
    });

    it('generates Powerlifting Squat Priority with heavy pause & competition lifts', () => {
      const squatBlueprint = generateSmartBlueprint('Squat Priority', 'Powerlifting');
      expect(squatBlueprint.length).toBeGreaterThanOrEqual(4);
      expect(squatBlueprint[0].name).toContain('Squat');
      expect(squatBlueprint[0].restSec).toBeGreaterThanOrEqual(120);
    });

    it('generates Calisthenics blueprints with bodyweight levers & strict pull-ups', () => {
      const calisthenicsBlueprint = generateSmartBlueprint('Straight Arm & Lever', 'Calisthenics');
      expect(calisthenicsBlueprint.length).toBeGreaterThanOrEqual(4);
      expect(calisthenicsBlueprint.some((s) => s.name.includes('Pull-up') || s.name.includes('Dips'))).toBe(true);
    });

    it('generates Combat blueprints with rotational power & heavy bag rounds', () => {
      const combatBlueprint = generateSmartBlueprint('Striking & Speed', 'Combat');
      expect(combatBlueprint.length).toBeGreaterThanOrEqual(4);
      expect(combatBlueprint.some((s) => s.name.includes('Heavy Bag') || s.name.includes('Punch'))).toBe(true);
    });
  });

  describe('Difficulty Scaling Modifiers', () => {
    const baseSlots: BlueprintSlot[] = [
      { name: 'Barbell Back Squat', sets: 4, reps: '6-8', restSec: 120, notes: 'Primary compound' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8-10', restSec: 90, notes: 'Posterior chain' },
    ];

    it('scales down volume and increases rest for Beginner athletes', () => {
      const beginner = applyDifficultyModifier(baseSlots, 'Beginner');
      expect(beginner[0].sets).toBe(3); // 4 - 1
      expect(beginner[1].sets).toBe(2); // 3 - 1 (min 2)
      expect(beginner[0].restSec).toBe(150); // 120 * 1.25
      expect(beginner[0].notes).toContain('Form priority');
    });

    it('scales up volume and maintains standard rest for Advanced athletes', () => {
      const advanced = applyDifficultyModifier(baseSlots, 'Advanced');
      expect(advanced[0].sets).toBe(5); // 4 + 1
      expect(advanced[1].sets).toBe(4); // 3 + 1
      expect(advanced[0].notes).toContain('RPE 8.5');
    });

    it('scales volume and optimizes density rest for Elite athletes', () => {
      const elite = applyDifficultyModifier(baseSlots, 'Elite');
      expect(elite[0].sets).toBe(5);
      expect(elite[0].restSec).toBe(108); // 120 * 0.9
      expect(elite[0].notes).toContain('RPE 9.0+');
    });
  });
});

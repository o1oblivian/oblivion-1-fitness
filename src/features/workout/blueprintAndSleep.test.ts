import { describe, expect, it } from 'vitest';
import type { BlueprintExercise, WorkoutBlueprint } from '../../data/workoutBlueprints';
import { scrubLegacySleepDefaults } from '../log/store/legacySleep';
import { blueprintExerciseToItem, blueprintMatchesTag, targetReps, tierMovements, tierSpecs } from './utils/blueprintTiers';

const move = (over: Partial<BlueprintExercise> = {}): BlueprintExercise => ({
  id: 'm1',
  name: 'Back Squat',
  category: 'Compound' as BlueprintExercise['category'],
  sets: 3,
  reps: '8-10',
  rest: '120s',
  tempo: '3-1-1',
  cues: 'Brace',
  targetMuscle: 'Quads',
  defaultWeightKg: 100,
  ...over,
});

const blueprint = (over: Partial<WorkoutBlueprint> = {}): WorkoutBlueprint => ({
  id: 'bp1',
  title: 'Leg Day',
  subtitle: '',
  badge: 'HYPERTROPHY',
  image: '',
  phase: '',
  focus: 'Volume',
  estimatedTime: '60 min',
  description: '',
  targetMuscles: ['Quads'],
  exercises: Array.from({ length: 7 }, (_, i) => move({ id: `m${i}` })),
  ...over,
});

describe('legacy sleep scrub', () => {
  const legacy = {
    hasData: true,
    durationHours: 7.5,
    recoveryPercent: 92,
    restingHeartRate: 50,
    bedtime: '22:30',
    wakeTime: '06:30',
    deepSleepMinutes: 0,
    remSleepMinutes: 0,
    sleepEfficiencyPercent: 0,
  };

  it('clears the placeholder quality and default heart rate but keeps the logged hours', () => {
    const out = scrubLegacySleepDefaults(legacy);
    expect(out.recoveryPercent).toBe(0);
    expect(out.restingHeartRate).toBe(0);
    expect(out.durationHours).toBe(7.5);
  });

  it('keeps a heart rate the athlete actually typed', () => {
    expect(scrubLegacySleepDefaults({ ...legacy, restingHeartRate: 47 }).restingHeartRate).toBe(47);
  });

  it('leaves Log-editor records alone (no bedtime) even at 92%', () => {
    const typed = { ...legacy, bedtime: '' };
    expect(scrubLegacySleepDefaults(typed)).toBe(typed);
  });

  it('leaves current-form records alone', () => {
    const current = { ...legacy, recoveryPercent: 95 };
    expect(scrubLegacySleepDefaults(current)).toBe(current);
  });
});

describe('blueprint tiers', () => {
  it('caps beginners at five movements', () => {
    expect(tierMovements(blueprint(), 'BEGINNER')).toHaveLength(5);
    expect(tierMovements(blueprint(), 'ADVANCED')).toHaveLength(7);
  });

  it('scales load and volume by tier', () => {
    expect(tierSpecs(move(), 'BEGINNER')).toMatchObject({ sets: 2, weightKg: 60, restSecs: 145, rpe: 7 });
    expect(tierSpecs(move(), 'INTERMEDIATE')).toMatchObject({ sets: 3, weightKg: 100, restSecs: 120, rpe: 8 });
    expect(tierSpecs(move(), 'ADVANCED')).toMatchObject({ sets: 4, weightKg: 115, restSecs: 105, rpe: 9 });
  });

  it('keeps bodyweight movements unloaded', () => {
    expect(tierSpecs(move({ defaultWeightKg: 0 }), 'ADVANCED').weightKg).toBe(0);
  });

  it('targets the top of a rep range', () => {
    expect(targetReps('8-10')).toBe(10);
    expect(targetReps('10–12 Controlled')).toBe(10);
    expect(targetReps('5')).toBe(5);
    expect(targetReps('AMRAP')).toBe(10);
  });

  it('builds unticked sets with a readable tier label', () => {
    const item = blueprintExerciseToItem(move(), 'bp1', 'ADVANCED');
    expect(item.tier).toBe('Advanced');
    expect(item.sets).toHaveLength(4);
    expect(item.sets.every((s) => !s.completed && s.reps === 10 && s.weightKg === 115)).toBe(true);
    expect(new Set(item.sets.map((s) => s.id)).size).toBe(4);
  });

  it('matches calisthenics titles case-insensitively', () => {
    const bp = blueprint({ title: 'Weighted Push Ladder', badge: 'SKILL', focus: 'Upper' });
    expect(blueprintMatchesTag(bp, 'CALISTHENICS')).toBe(true);
    expect(blueprintMatchesTag(bp, 'OLYMPIC')).toBe(false);
  });

  it('matches core work through target muscles', () => {
    const bp = blueprint({ title: 'Finisher', badge: 'CONDITIONING', focus: 'Engine', targetMuscles: ['Obliques'] });
    expect(blueprintMatchesTag(bp, 'CORE')).toBe(true);
  });
});

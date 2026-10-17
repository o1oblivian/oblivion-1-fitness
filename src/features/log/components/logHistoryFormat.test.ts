import { describe, expect, it } from 'vitest';
import type {
  CardioDayRecord,
  MeditationDayRecord,
  NutritionDayRecord,
  SleepDayRecord,
  WorkoutDayRecord,
} from '../store/useTelemetryHistoryStore';
import { cardioHeadline, dayHeading, foodHeadline, mindfulHeadline, sleepHeadline, workoutHeadline } from './logHistoryFormat';

describe('dayHeading', () => {
  const today = new Date(2026, 9, 17, 15, 30);
  it('names recent days plainly', () => {
    expect(dayHeading(new Date(2026, 9, 17), today)).toBe('Today');
    expect(dayHeading(new Date(2026, 9, 16), today)).toBe('Yesterday');
    expect(dayHeading(new Date(2026, 9, 15), today)).toBe('Thursday');
  });
  it('spells out the date for older and future days', () => {
    expect(dayHeading(new Date(2026, 9, 10), today)).toBe('Sat, Oct 10');
    expect(dayHeading(new Date(2026, 9, 18), today)).toBe('Sun, Oct 18');
  });
});

const record = <T>(fields: Partial<T>): T => ({ hasData: true, ...fields }) as T;

describe('workoutHeadline', () => {
  it('leads with weight lifted and keeps the rest as the caption', () => {
    const rec = record<WorkoutDayRecord>({ tonnageKg: 49485, completedSets: 12, durationMinutes: 45, burnedKcal: 310, exercises: [] });
    expect(workoutHeadline(rec)).toEqual({ value: '49,485', unit: 'kg', caption: '12 sets · 45 min · 310 kcal active' });
  });

  it('leads with sets when no weight was recorded', () => {
    const rec = record<WorkoutDayRecord>({ tonnageKg: 0, completedSets: 8, durationMinutes: 30, exercises: [] });
    expect(workoutHeadline(rec)).toEqual({ value: '8', unit: 'sets', caption: '30 min' });
  });

  it('is null with no readings, never a zero', () => {
    expect(workoutHeadline(record<WorkoutDayRecord>({ tonnageKg: 0, completedSets: 0, exercises: [] }))).toBeNull();
    expect(workoutHeadline(undefined)).toBeNull();
    expect(workoutHeadline({ hasData: false } as WorkoutDayRecord)).toBeNull();
  });
});

describe('cardioHeadline', () => {
  it('leads with distance, then lists time and calories', () => {
    const rec = record<CardioDayRecord>({ distanceKm: 5.234, durationMinutes: 28, burnedKcal: 240 });
    expect(cardioHeadline(rec)).toEqual({ value: '5.2', unit: 'km', caption: '28 min · 240 kcal' });
  });

  it('falls back to steps and ignores a lone placeholder step', () => {
    expect(cardioHeadline(undefined, 5016)).toEqual({ value: '5,016', unit: 'steps', caption: '' });
    expect(cardioHeadline(undefined, 1)).toBeNull();
  });

  it('adds steps to the caption when a session leads', () => {
    const rec = record<CardioDayRecord>({ durationMinutes: 20, steps: 4000 });
    expect(cardioHeadline(rec)).toEqual({ value: '20', unit: 'min', caption: '4,000 steps' });
  });
});

describe('foodHeadline', () => {
  it('leads with calories and lists the macros', () => {
    const rec = record<NutritionDayRecord>({ calories: 2150, proteinG: 142.4, carbsG: 230, fatsG: 61 });
    expect(foodHeadline(rec)).toEqual({ value: '2,150', unit: 'kcal', caption: '142g protein · 230g carbs · 61g fat' });
  });

  it('is null with no calories', () => {
    expect(foodHeadline(record<NutritionDayRecord>({ calories: 0 }))).toBeNull();
  });
});

describe('sleepHeadline', () => {
  it('leads with hours and lists recovery', () => {
    expect(sleepHeadline(record<SleepDayRecord>({ durationHours: 8, recoveryPercent: 82 }))).toEqual({ value: '8', unit: 'h', caption: '82% recovery' });
  });

  it('leads with recovery when no hours were read', () => {
    expect(sleepHeadline(record<SleepDayRecord>({ durationHours: 0, recoveryPercent: 74 }))).toEqual({ value: '74', unit: '% recovery', caption: '' });
  });

  it('is null with neither', () => {
    expect(sleepHeadline(record<SleepDayRecord>({ durationHours: 0, recoveryPercent: 0 }))).toBeNull();
  });
});

describe('mindfulHeadline', () => {
  it('leads with minutes and names the protocol', () => {
    const rec = record<MeditationDayRecord>({ minutes: 12, protocol: 'Box breathing', coherence: 'High' });
    expect(mindfulHeadline(rec)).toEqual({ value: '12', unit: 'min', caption: 'Box breathing · High' });
  });

  it('is null with no minutes', () => {
    expect(mindfulHeadline(record<MeditationDayRecord>({ minutes: 0, protocol: 'Box breathing' }))).toBeNull();
  });
});

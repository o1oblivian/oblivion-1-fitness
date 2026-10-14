import { describe, expect, it } from 'vitest';
import { athleteDose, availableKit, canPerform, dosedSets, isSafeFor, isUnloaded, kitNeeds, trainingAgeDose } from './equipmentAccess';
import { parseFacilities } from '../../induction/consultationTypes';
import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';

describe('kitNeeds', () => {
  it('reads the movement name when the library tag is vague', () => {
    expect(kitNeeds('Heavy Sled Push (Turf 50m)', 'Turf')).toEqual(['sled']);
    expect(kitNeeds('Concept2 Rowing 1000m Race Pace', 'Turf')).toEqual(['erg']);
    expect(kitNeeds('Farmers Carry (2x32kg Kettlebells 200m)', 'Turf')).toEqual(['free_weights']);
  });

  it('combines needs for loaded bodyweight work', () => {
    expect(kitNeeds('Weighted Neutral Grip Pull-Up', 'Bodyweight / Belt').sort()).toEqual(['bar', 'free_weights']);
  });

  it('treats plain bodyweight and mat work as needing nothing', () => {
    expect(kitNeeds('Push-Up', 'Bodyweight')).toEqual(['none']);
    expect(kitNeeds('Dead Bug', 'Mat')).toEqual(['none']);
  });
});

describe('availableKit', () => {
  it('does not restrict when nothing is chosen or a full gym is in the list', () => {
    expect(availableKit([])).toBeNull();
    expect(availableKit(['outdoor', 'commercial'])).toBeNull();
    expect(availableKit(['other'])).toBeNull();
  });

  it('unions every place the athlete trains', () => {
    const kit = availableKit(['outdoor', 'garage_minimal']);
    expect(canPerform('Olympic Barbell Back Squat', 'Barbell', kit)).toBe(true);
    expect(canPerform('Neutral Grip Pull-Up', 'Pull-Up Bar', kit)).toBe(true);
    expect(canPerform('Cable Overhead Triceps Extension', 'Cable Tower', kit)).toBe(false);
    expect(canPerform('Heavy Sled Push', 'Turf', kit)).toBe(false);
  });

  it('keeps travel athletes to bodyweight', () => {
    const kit = availableKit(['bodyweight']);
    expect(canPerform('Push-Up', 'Bodyweight', kit)).toBe(true);
    expect(canPerform('Dumbbell Bench Press', 'Dumbbell', kit)).toBe(false);
    expect(canPerform('Neutral Grip Pull-Up', 'Pull-Up Bar', kit)).toBe(false);
  });

  it('gives a functional box everything except machines', () => {
    const kit = availableKit(['functional_box']);
    expect(canPerform('SkiErg Max Calorie Intervals', 'erg', kit)).toBe(true);
    expect(canPerform('Heavy Sled Push', 'Turf', kit)).toBe(true);
    expect(canPerform('Seated Leg Press', 'Machine', kit)).toBe(false);
  });
});

describe('exercise library coverage', () => {
  it('leaves every training place a real pool of movements', () => {
    for (const place of ['functional_box', 'garage_minimal', 'outdoor', 'bodyweight'] as const) {
      const kit = availableKit([place]);
      const reachable = EXERCISE_DATABASE.filter((ex) => canPerform(ex.name, ex.equipment, kit));
      expect(reachable.length, place).toBeGreaterThanOrEqual(20);
    }
  });
});

describe('isUnloaded', () => {
  it('never prescribes a load for bodyweight, bar or erg work', () => {
    expect(isUnloaded('Push-Up', 'Bodyweight')).toBe(true);
    expect(isUnloaded('Neutral Grip Pull-Up', 'Pull-Up Bar')).toBe(true);
    expect(isUnloaded('SkiErg 500m Sprint Intervals', 'Concept2 SkiErg')).toBe(true);
    expect(isUnloaded('Dumbbell Bench Press', 'Dumbbell')).toBe(false);
    expect(isUnloaded('Weighted Neutral Grip Pull-Up', 'Bodyweight / Belt')).toBe(false);
  });
});

describe('trainingAgeDose', () => {
  it('starts new lifters lighter with fewer sets', () => {
    const dose = trainingAgeDose('<1yr');
    expect(dose.loadFactor).toBeLessThan(1);
    expect(dosedSets(3, dose)).toBe(2);
    expect(dose.rpeCap).toBeLessThanOrEqual(8);
  });

  it('adds a set for veterans and clamps to five', () => {
    const dose = trainingAgeDose('5+yrs');
    expect(dosedSets(3, dose)).toBe(4);
    expect(dosedSets(5, dose)).toBe(5);
  });

  it('is neutral when unanswered', () => {
    expect(trainingAgeDose('')).toEqual({ setDelta: 0, loadFactor: 1, rpeCap: 10 });
  });

  it('covers every experience answer, including first-timers and competitors', () => {
    expect(trainingAgeDose('new').loadFactor).toBeLessThan(trainingAgeDose('<1yr').loadFactor);
    expect(dosedSets(3, trainingAgeDose('competitor'))).toBe(4);
  });
});

describe('athleteDose', () => {
  it('keeps teenagers and over-60s short of max effort, even when experienced', () => {
    for (const band of ['under18', '60+'] as const) {
      const dose = athleteDose('competitor', band);
      expect(dose.rpeCap).toBeLessThanOrEqual(8);
      expect(dose.setDelta).toBeLessThanOrEqual(0);
      expect(dose.loadFactor).toBeLessThan(trainingAgeDose('competitor').loadFactor);
    }
  });

  it('leaves adults on their experience dose', () => {
    expect(athleteDose('1-3yrs', '40-59')).toEqual(trainingAgeDose('1-3yrs'));
  });
});

describe('isSafeFor', () => {
  const open = { injuries: [], ageBand: '' } as const;

  it('skips moves that load a protected area', () => {
    expect(isSafeFor('Box Jump', { ...open, injuries: ['knees'] })).toBe(false);
    expect(isSafeFor('Conventional Deadlift', { ...open, injuries: ['lower_back'] })).toBe(false);
    expect(isSafeFor('Standing Overhead Military Press', { ...open, injuries: ['shoulders'] })).toBe(false);
    expect(isSafeFor('Push-Up', { ...open, injuries: ['wrists'] })).toBe(false);
    expect(isSafeFor('Seated Leg Press', { ...open, injuries: ['lower_back', 'shoulders'] })).toBe(true);
  });

  it('removes high-impact work for over-60s only', () => {
    expect(isSafeFor('Box Jump', { ...open, ageBand: '60+' })).toBe(false);
    expect(isSafeFor('Box Jump', { ...open, ageBand: '18-39' })).toBe(true);
    expect(isSafeFor('Turf Pro-Agility 5-10-5 Shuttles', { ...open, ageBand: '60+' })).toBe(false);
    expect(isSafeFor('Goblet Squat', { ...open, ageBand: '60+' })).toBe(true);
  });

  it('allows everything when nothing needs protecting', () => {
    expect(isSafeFor('Barbell Snatch', { ...open, injuries: ['none'] })).toBe(true);
  });

  it('still leaves a full library for someone protecting every area at 60+', () => {
    const profile = { injuries: ['knees', 'lower_back', 'shoulders', 'wrists'], ageBand: '60+' } as const;
    expect(EXERCISE_DATABASE.filter((ex) => isSafeFor(ex.name, profile)).length).toBeGreaterThanOrEqual(40);
  });
});

describe('parseFacilities', () => {
  it('reads the stored comma list and legacy single values', () => {
    expect(parseFacilities('outdoor,garage_minimal')).toEqual(['outdoor', 'garage_minimal']);
    expect(parseFacilities('commercial')).toEqual(['commercial']);
    expect(parseFacilities(null)).toEqual([]);
    expect(parseFacilities('outdoor,unknown,outdoor')).toEqual(['outdoor']);
  });
});

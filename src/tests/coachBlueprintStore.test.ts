import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCoachSavedBlueprints,
  saveCoachBlueprint,
  updateCoachBlueprintTitle,
  deleteCoachBlueprint,
} from '@/utils/coachBlueprintStore';

describe('Coach Blueprint Store Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with an empty blueprint list when storage is empty', () => {
    const list = getCoachSavedBlueprints();
    expect(list).toEqual([]);
  });

  it('saves and retrieves a new coach blueprint', () => {
    const saved = saveCoachBlueprint({
      title: 'O1FC Push Alpha • Heavy Bench',
      split: 'PUSH',
      focus: 'Chest & Delts Hypertrophy',
      estimatedMinutes: 45,
      equipment: 'Full Gym',
      intensity: 'Progressive RPE 8',
      exercises: [
        {
          id: 'ex_1',
          name: 'Barbell Flat Bench Press',
          category: 'Push',
          primaryMuscle: 'Chest',
          movementType: 'Compound',
          restSec: 120,
          tempo: '3-1-1-0',
          progressionScheme: 'Straight',
          notes: 'Competition bench',
          sets: [{ setNum: 1, type: 'working', reps: 6, weight: 80, rpe: 8 }],
        },
      ],
    });

    expect(saved.id).toBeDefined();
    expect(saved.title).toBe('O1FC Push Alpha • Heavy Bench');

    const retrieved = getCoachSavedBlueprints();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].title).toBe('O1FC Push Alpha • Heavy Bench');
    expect(retrieved[0].exercises.length).toBe(1);
  });

  it('updates a blueprint title', () => {
    const saved = saveCoachBlueprint({
      title: 'Initial Title',
      split: 'PULL',
      focus: 'Lat Density',
      estimatedMinutes: 45,
      exercises: [],
    });

    const updated = updateCoachBlueprintTitle(saved.id, 'Renamed Pull Alpha');
    expect(updated[0].title).toBe('Renamed Pull Alpha');
  });

  it('deletes a blueprint by id', () => {
    const saved = saveCoachBlueprint({
      title: 'To Delete',
      split: 'LEGS',
      focus: 'Quads',
      estimatedMinutes: 40,
      exercises: [],
    });

    expect(getCoachSavedBlueprints().length).toBe(1);
    deleteCoachBlueprint(saved.id);
    expect(getCoachSavedBlueprints().length).toBe(0);
  });
});

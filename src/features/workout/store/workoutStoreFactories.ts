import { ExerciseItem } from '../../../types';
import { MobilityExercise } from '../../../data/recoveryRoutines';
import { defaultEmptyLoadKg } from '../../../utils/defaultEmptyLoad';

const MOVEMENT_SLOTS: Array<{ title: string; targetMuscle: string; restSecs: number; sets: number }> = [
  { title: 'Primary Compound Foundation', targetMuscle: 'Target Chain', restSecs: 90, sets: 3 },
  { title: 'Unilateral Deficit Bias', targetMuscle: 'Eccentric & Stabilizers', restSecs: 75, sets: 2 },
  { title: 'Peak Isometric Lockout', targetMuscle: 'Peak Tension', restSecs: 60, sets: 2 },
  { title: 'Mechanical Tension Finisher', targetMuscle: 'Metabolic Flush', restSecs: 60, sets: 1 },
];

/** Empty bar, no reps, no RPE: the athlete fills in what they actually lift. */
export const createSevenWorkouts = (programTitle: string): ExerciseItem[] => {
  const bar = defaultEmptyLoadKg('barbell');
  const stamp = Date.now();
  return MOVEMENT_SLOTS.map((slot, i) => ({
    id: `prog-${stamp}-${i + 1}`,
    name: `${programTitle} #${i + 1}: ${slot.title}`,
    targetMuscle: slot.targetMuscle,
    restSecs: slot.restSecs,
    sets: Array.from({ length: slot.sets }, (_, s) => ({
      setNumber: s + 1,
      weightKg: bar,
      weight: bar,
      reps: 0,
      rpe: 0,
      completed: false,
    })),
  }));
};

export const createRecoveryExercise = (drill: MobilityExercise): ExerciseItem => {
  return {
    id: `rec-${Date.now()}-${drill.id}`,
    name: drill.title,
    targetMuscle: drill.tierDescription,
    notes: `Focus: ${drill.anatomicalFocus.join(', ')} • Equipment: ${drill.equipment}`,
    restSecs: drill.restSecs || 30,
    sets: Array.from({ length: drill.targetSetsCount }).map((_, idx) => ({
      setNumber: idx + 1,
      weightKg: 0,
      reps: drill.targetRepsCount,
      rpe: 0,
      completed: false,
    })),
  };
};

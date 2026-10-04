import {
  MobilityCategory,
  MobilityExercise,
  MOBILITY_EXERCISES,
} from './mobilityExercises';

export type { MobilityCategory, MobilityExercise };
export { MOBILITY_EXERCISES };

export interface RecoveryRoutine {
  id: string;
  title: string;
  description: string;
  category: MobilityCategory;
  durationMins: number;
  exerciseIds: string[];
  exercises: MobilityExercise[];
}

export const FULL_MOBILITY_RECOVERY_ROUTINE: RecoveryRoutine = {
  id: 'rtn-full-mobility',
  title: 'Full Kinetic Chain Mobility & Alignment',
  description:
    'Comprehensive 20-minute head-to-toe mobility protocol addressing spinal traction, pelvic tilt, and shoulder capsule mobility.',
  category: 'Full Mobility',
  durationMins: 20,
  exerciseIds: MOBILITY_EXERCISES.map((e) => e.id),
  exercises: MOBILITY_EXERCISES,
};

export const HIP_PELVIC_DECOMPRESSION_ROUTINE: RecoveryRoutine = {
  id: 'rtn-hip-pelvic',
  title: 'Pelvic Girdle & Deep Hip Decompression',
  description:
    'Focused relief for tight hip flexors, anterior pelvic tilt, deep adductors, and femoral rotation restrictions.',
  category: 'Hips & Pelvic',
  durationMins: 14,
  exerciseIds: ['mob-1', 'mob-5', 'mob-7', 'mob-2'],
  exercises: MOBILITY_EXERCISES.filter((e) =>
    ['mob-1', 'mob-5', 'mob-7', 'mob-2'].includes(e.id)
  ),
};

export const SPINE_THORACIC_DECOMPRESSION_ROUTINE: RecoveryRoutine = {
  id: 'rtn-spine-thoracic',
  title: 'Axial Spine & Thoracic Matrix Decompression',
  description:
    'Spinal decompression, T-spine rotation, and scapular glide protocol to eliminate lumbar compression and posture fatigue.',
  category: 'Spine & Decompress',
  durationMins: 16,
  exerciseIds: ['mob-6', 'mob-2', 'mob-3', 'mob-4', 'mob-8'],
  exercises: MOBILITY_EXERCISES.filter((e) =>
    ['mob-6', 'mob-2', 'mob-3', 'mob-4', 'mob-8'].includes(e.id)
  ),
};

export const PARASYMPATHETIC_DOWNREGULATION_ROUTINE: RecoveryRoutine = {
  id: 'rtn-parasympathetic',
  title: 'Parasympathetic Downregulation & Autonomic Flush',
  description:
    'CNS calming sequence synchronizing slow diaphragmatic breath waves, gentle spinal traction, and vagal tone enhancement.',
  category: 'Parasympathetic',
  durationMins: 12,
  exerciseIds: ['mob-9', 'mob-4', 'mob-6', 'mob-1'],
  exercises: MOBILITY_EXERCISES.filter((e) =>
    ['mob-9', 'mob-4', 'mob-6', 'mob-1'].includes(e.id)
  ),
};

export const RECOVERY_ROUTINES: RecoveryRoutine[] = [
  FULL_MOBILITY_RECOVERY_ROUTINE,
  HIP_PELVIC_DECOMPRESSION_ROUTINE,
  SPINE_THORACIC_DECOMPRESSION_ROUTINE,
  PARASYMPATHETIC_DOWNREGULATION_ROUTINE,
];

export function getRecoveryRoutineById(id: string): RecoveryRoutine | undefined {
  return RECOVERY_ROUTINES.find((r) => r.id === id);
}

export function getAllRecoveryExercises(): MobilityExercise[] {
  return MOBILITY_EXERCISES;
}

export function getExercisesByCategory(category: MobilityCategory | string): MobilityExercise[] {
  if (!category || category === 'Full Mobility' || category === 'ALL') {
    return MOBILITY_EXERCISES;
  }
  const target = category.toLowerCase().trim();
  return MOBILITY_EXERCISES.filter((ex) => {
    if (ex.category.toLowerCase().includes(target)) return true;
    if (ex.secondaryCategories.some((c) => c.toLowerCase().includes(target))) return true;
    if (
      target.includes('hip') &&
      (ex.category === 'Hips & Pelvic' || ex.secondaryCategories.includes('Hips & Pelvic'))
    ) {
      return true;
    }
    if (
      target.includes('spine') &&
      (ex.category === 'Spine & Decompress' || ex.secondaryCategories.includes('Spine & Decompress'))
    ) {
      return true;
    }
    if (
      target.includes('hamstring') &&
      (ex.secondaryCategories.includes('Hamstring') ||
        ex.anatomicalFocus.some((f) => f.toLowerCase().includes('hamstring')))
    ) {
      return true;
    }
    return false;
  });
}

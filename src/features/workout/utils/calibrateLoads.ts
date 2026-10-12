import { ExerciseItem } from '../../../types';
import { workingLoadKg } from '../services/dayRoutineService';

/** Template movements keep their sets and reps; load comes from the athlete's own max, never the template. */
export function calibrateTemplate<T extends Pick<ExerciseItem, 'name' | 'sets'> & { exerciseName?: string }>(exercises: T[]): T[] {
  return exercises.map((ex) => {
    const name = ex.exerciseName || ex.name;
    return {
      ...ex,
      sets: (ex.sets || []).map((s) => {
        const load = workingLoadKg(name, Number(s.reps) || 0);
        return { ...s, weightKg: load, weight: load, rpe: 0, completed: false };
      }),
    };
  });
}

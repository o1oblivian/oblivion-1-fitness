import { ExerciseSet } from '../../../types';
import { defaultEmptyLoadKg } from '../../../utils/defaultEmptyLoad';

export const isSetBlank = (s: Partial<ExerciseSet> | undefined | null): boolean => {
  if (!s) return true;
  const weight = Number(s.weightKg ?? s.weight) || 0;
  const reps = Number(s.reps) || 0;
  return weight <= 0 && reps <= 0;
};

/** Copy a filled previous set. Blank new sets get the default barbell when the movement is a bar lift. */
export const buildNextSet = (
  setNumber: number,
  lastInSession?: ExerciseSet,
  equipment?: string
): ExerciseSet => {
  const copy = lastInSession && !isSetBlank(lastInSession);
  const load = copy
    ? Number(lastInSession.weightKg ?? lastInSession.weight) || 0
    : defaultEmptyLoadKg(equipment);
  return {
    id: `set-${Date.now()}-${setNumber}-${Math.random().toString(36).slice(2, 6)}`,
    setNumber,
    weightKg: load,
    weight: load,
    reps: copy ? Number(lastInSession.reps) || 0 : 0,
    rpe: copy && Number(lastInSession.rpe) > 0 ? Number(lastInSession.rpe) : 0,
    completed: false,
  };
};

/**
 * What the athlete trains on each weekday: their own saved workout if they made one, otherwise
 * the plan built from their consultation answers. The pieces live in `./dayRoutine/`.
 */
import type { WorkoutExercise } from '../store/workoutStoreTypes';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { DAY_PLANS, type DayCode, planForDay } from './dayRoutine/dayPlans';
import { bumpDayRoutines } from './dayRoutine/dayRoutineRevision';
import { buildDefaultRoutine } from './dayRoutine/defaultRoutine';
import { findSavedRoutine, storeSavedRoutine } from './dayRoutine/savedDayRoutines';
import { formatConciseSplitName } from './dayRoutine/splitNames';

export { bumpDayRoutines, useDayRoutineRevision } from './dayRoutine/dayRoutineRevision';
export { getSystemTodayCode } from './dayRoutine/dayPlans';
export { formatConciseSplitName } from './dayRoutine/splitNames';
export { estimateSessionMinutes } from './dayRoutine/movementPicker';
export { planFirstWeek, workingLoadKg, type PlannedDay } from './dayRoutine/defaultRoutine';

/**
 * Retrieve saved routine for a specific day from localStorage
 */
export const getAthleteDayRoutine = (
  day: DayCode,
): { splitName: string; exercises: WorkoutExercise[]; isCustom: boolean } => {
  const saved = findSavedRoutine(day);
  if (saved) {
    return {
      splitName: formatConciseSplitName(saved.splitName || DAY_PLANS[day].splitName),
      exercises: saved.exercises,
      isCustom: true,
    };
  }

  if (!DAY_PLANS[day]) return { splitName: 'Rest', exercises: [], isCustom: false };
  if (!readAthleteSettingsSnapshot().autoDispatch)
    return { splitName: 'Your own', exercises: [], isCustom: false };
  return {
    splitName: formatConciseSplitName(planForDay(day).splitName),
    exercises: buildDefaultRoutine(day),
    isCustom: false,
  };
};

/**
 * Save an athlete's workout to repeat on a specific day of the week
 */
export const saveAthleteDayRoutine = (
  day: DayCode,
  splitName: string,
  exercises: WorkoutExercise[],
): boolean => {
  try {
    storeSavedRoutine(day, splitName, exercises);
    bumpDayRoutines();
    return true;
  } catch (e) {
    console.error('Error saving routine to day', e);
    return false;
  }
};

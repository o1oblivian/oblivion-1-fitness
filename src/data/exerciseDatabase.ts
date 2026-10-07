import { ExerciseDefinition } from '../types/workout';
import { LIFT_EXERCISES } from './exercises/liftExercises';
import { SPORTS_EXERCISES } from './exercises/sportsExercises';
import { RECOVERY_EXERCISES } from './exercises/recoveryExercises';
import { EXERCISE_REPOSITORY } from './exerciseRepository';
import {
  EXPANDED_LIFT_EXERCISES,
  EXPANDED_SPORTS_EXERCISES,
  EXPANDED_RECOVERY_EXERCISES,
} from './exercises/expandedExercises';

export { LIFT_EXERCISES, SPORTS_EXERCISES, RECOVERY_EXERCISES, EXERCISE_REPOSITORY };

function notDuplicate(ex: ExerciseDefinition, seen: ExerciseDefinition[]): boolean {
  const name = ex.name.toLowerCase();
  return !seen.some((r) => r.id === ex.id || r.name.toLowerCase() === name);
}

const merged: ExerciseDefinition[] = [...EXERCISE_REPOSITORY];
for (const group of [
  LIFT_EXERCISES,
  SPORTS_EXERCISES,
  RECOVERY_EXERCISES,
  EXPANDED_LIFT_EXERCISES,
  EXPANDED_SPORTS_EXERCISES,
  EXPANDED_RECOVERY_EXERCISES,
]) {
  for (const ex of group) {
    if (notDuplicate(ex, merged)) merged.push(ex);
  }
}

export const EXERCISE_DATABASE: ExerciseDefinition[] = merged;

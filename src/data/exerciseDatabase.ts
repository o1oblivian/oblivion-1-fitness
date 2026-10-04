import { ExerciseDefinition } from '../types/workout';
import { LIFT_EXERCISES } from './exercises/liftExercises';
import { SPORTS_EXERCISES } from './exercises/sportsExercises';
import { RECOVERY_EXERCISES } from './exercises/recoveryExercises';
import { EXERCISE_REPOSITORY } from './exerciseRepository';

export { LIFT_EXERCISES, SPORTS_EXERCISES, RECOVERY_EXERCISES, EXERCISE_REPOSITORY };

// Verified standardized exercises from repository take precedence
export const EXERCISE_DATABASE: ExerciseDefinition[] = [
  ...EXERCISE_REPOSITORY,
  ...LIFT_EXERCISES.filter((l) => !EXERCISE_REPOSITORY.some((r) => r.id === l.id || r.name.toLowerCase() === l.name.toLowerCase())),
  ...SPORTS_EXERCISES.filter((s) => !EXERCISE_REPOSITORY.some((r) => r.id === s.id || r.name.toLowerCase() === s.name.toLowerCase())),
  ...RECOVERY_EXERCISES.filter((rec) => !EXERCISE_REPOSITORY.some((r) => r.id === rec.id || r.name.toLowerCase() === rec.name.toLowerCase())),
];


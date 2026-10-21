import type { WorkoutExercise } from '../../store/workoutStoreTypes';
import {
  type Kit,
  type SafetyProfile,
  type TrainingAgeDose,
  canPerform,
  dosedSets,
  isSafeFor,
} from '../../utils/equipmentAccess';
import { type TrainingGoal, queryExercisesForGoal } from '../../utils/intelPrescriptionGenerator';
import type { ExerciseDefinition } from '../../../../types/workout';
import type { MovementPlan, MovementSlot } from './dayPlans';

export const WORK_SECS_PER_SET = 40;
export const DEFAULT_SESSION_MINUTES = 45;
const MAX_EXERCISES = 8;

const SPLIT_FOCUS: [RegExp, TrainingGoal, string][] = [
  [/PUSH/, 'muscle', 'Push (Chest/Delts)'],
  [/PULL/, 'muscle', 'Pull (Back/Bis)'],
  [/LEGS/, 'muscle', 'Legs & Calves'],
  [/HYPER|HYROX/, 'athletic', 'Full Body'],
];

const GENERIC_WORDS = new Set([
  'barbell',
  'dumbbell',
  'kettlebell',
  'cable',
  'machine',
  'standing',
  'seated',
  'weighted',
]);

/** The first option the athlete can do where they train and that spares what they protect; null when none fits. */
export function pickMovement(
  slot: MovementSlot,
  kit: Set<Kit> | null,
  safety: SafetyProfile,
): MovementPlan | null {
  const { alternatives, ...primary } = slot;
  const fits = (name: string, equipment: string) =>
    isSafeFor(name, safety) && canPerform(name, equipment, kit);
  if (fits(primary.name, primary.equipment)) return primary;
  const option = alternatives.find((alt) => fits(alt.name, alt.equipment));
  if (option) return { ...primary, ...option };
  const safeFallback = [...alternatives].reverse().find((alt) => isSafeFor(alt.name, safety));
  return safeFallback ? { ...primary, ...safeFallback } : null;
}

function keyWords(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 3 && !GENERIC_WORDS.has(word)),
  );
}

/** "Standing Overhead Military Press" and "Standing Barbell Overhead Press" train the same thing. */
export function nearDuplicate(a: string, b: string): boolean {
  const words = keyWords(a);
  return [...keyWords(b)].filter((word) => words.has(word)).length >= 2;
}

/** Minutes a list of planned movements takes: each set's work plus the rest after it. */
export function planMinutes(list: readonly MovementPlan[]): number {
  return Math.round(
    list.reduce((sum, m) => sum + m.sets * (WORK_SECS_PER_SET + m.restSecs), 0) / 60,
  );
}

/**
 * Tops a short day up to the athlete's session length with library moves for the same split.
 * The library query already drops moves they can't do where they train or that load a protected area.
 */
export function fillSession(
  picked: MovementPlan[],
  splitName: string,
  targetMinutes: number,
  dose: TrainingAgeDose,
): void {
  const focus = SPLIT_FOCUS.find(([pattern]) => pattern.test(splitName.toUpperCase()));
  if (!focus) return;
  const pool = queryExercisesForGoal(focus[1], focus[2]);
  const taken = new Set(picked.map((m) => m.name.toLowerCase()));
  const toPlan = (ex: ExerciseDefinition): MovementPlan => ({
    name: ex.name,
    muscle: ex.primaryMuscleGroup || ex.primaryMuscle || ex.category,
    equipment: String(ex.equipment),
    tier: ex.tier || 'Accessory',
    restSecs: ex.defaultRestSeconds || ex.restSecs || 75,
    sets: dosedSets(ex.defaultSets || 3, dose),
    reps: ex.defaultReps || 10,
  });
  const add = (requireNewMuscle: boolean) => {
    for (const ex of pool) {
      if (picked.length >= MAX_EXERCISES) return;
      if (taken.has(ex.name.toLowerCase()) || picked.some((m) => nearDuplicate(m.name, ex.name)))
        continue;
      const next = toPlan(ex);
      if (requireNewMuscle && picked.some((m) => m.muscle === next.muscle)) continue;
      if (planMinutes([...picked, next]) > targetMinutes) continue;
      picked.push(next);
      taken.add(ex.name.toLowerCase());
    }
  };
  add(true);
  add(false);
}

/** Minutes a session takes: each set's work plus the rest after it. */
export function estimateSessionMinutes(
  exercises: readonly Pick<WorkoutExercise, 'sets' | 'restSecs'>[],
): number {
  const secs = exercises.reduce(
    (sum, ex) => sum + (ex.sets?.length || 0) * (WORK_SECS_PER_SET + (ex.restSecs || 60)),
    0,
  );
  return Math.round(secs / 60);
}

import type { WorkoutExercise } from '../../store/workoutStoreTypes';
import { priorBestKg } from '../sessionPr';
import { useConsultationStore } from '../../../induction/useConsultationStore';
import { WEEK } from '../../../induction/consultationTypes';
import { athleteDose, availableKit, dosedSets, isUnloaded } from '../../utils/equipmentAccess';
import { DAY_PLANS, type DayCode, type MovementPlan, planForDay } from './dayPlans';
import { DEFAULT_SESSION_MINUTES, fillSession, pickMovement, planMinutes } from './movementPicker';
import { formatConciseSplitName } from './splitNames';

/** Working load that leaves about two reps in reserve, from the athlete's best estimated max. 0 when uncalibrated. */
export function workingLoadKg(exerciseName: string, reps: number): number {
  const max = priorBestKg(exerciseName);
  if (max <= 0 || reps <= 0 || reps > 30) return 0;
  return Math.floor(max / (1 + (reps + 2) / 30) / 2.5) * 2.5;
}

/**
 * The workout planned for a weekday, fitted to the athlete's equipment, injuries and session
 * length. Loads come from their own history.
 */
export function buildDefaultRoutine(day: DayCode, preview = false): WorkoutExercise[] {
  const prefix = day.toLowerCase();
  const { facilities, trainingAge, ageBand, injuries, sessionMinutes } =
    useConsultationStore.getState();
  const kit = availableKit(facilities);
  const dose = athleteDose(trainingAge, ageBand);
  const plan = planForDay(day, preview);
  const picked = plan.movements
    .map((slot) => pickMovement(slot, kit, { injuries, ageBand }))
    .filter((m): m is MovementPlan => m !== null)
    .map((m) => ({ ...m, sets: dosedSets(m.sets, dose) }));
  if (preview || useConsultationStore.getState().locked) {
    const target = sessionMinutes || DEFAULT_SESSION_MINUTES;
    while (picked.length > 2 && planMinutes(picked) > target) picked.pop();
    fillSession(picked, plan.splitName, target, dose);
  }
  return picked.map((m, i) => {
    const load = isUnloaded(m.name, m.equipment) ? 0 : workingLoadKg(m.name, m.reps);
    return {
      id: `${prefix}-ex-${i + 1}`,
      name: m.name,
      exerciseName: m.name,
      targetMuscle: m.muscle,
      equipment: m.equipment,
      tier: m.tier,
      restSecs: m.restSecs,
      sets: Array.from({ length: m.sets }, (_, s) => ({
        id: `${prefix}-${i + 1}-s${s + 1}`,
        setNumber: s + 1,
        reps: m.reps,
        weight: load,
        weightKg: load,
        rpe: 0,
        completed: false,
      })),
    };
  });
}

export interface PlannedDay {
  day: DayCode;
  splitName: string;
  exercises: WorkoutExercise[];
}

/** The week the current consultation answers produce, before they are locked in. Rest days have no exercises. */
export function planFirstWeek(): PlannedDay[] {
  return WEEK.map((day) => {
    const plan = planForDay(day, true);
    const rest = plan === DAY_PLANS.Sun;
    return {
      day,
      splitName: rest ? 'Rest' : formatConciseSplitName(plan.splitName),
      exercises: rest ? [] : buildDefaultRoutine(day, true),
    };
  });
}

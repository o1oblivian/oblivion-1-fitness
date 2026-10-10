import { supabase } from '../../services/supabaseClient';
import { useCoachStore } from '../../stores/useCoachStore';
import { useActiveProgramStore, ProgramDaySchedule } from '../../stores/useActiveProgramStore';
import { useWorkoutStore } from '../workout/store/useWorkoutStore';
import { getAthleteDayRoutine, getSystemTodayCode } from '../workout/services/dayRoutineService';
import { CoachDispatchedWorkout, DispatchedExercise } from '../../types/coach';
import { titleCase } from '../../utils/displayCase';

export type SessionOrigin = 'coach' | 'saved' | 'program' | 'none';

const ORIGIN_KEY = 'o1_session_origin';
const ASSIGNED_KEY = 'o1_session_assigned_id';

const DAY_NAME: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export interface TodaySession {
  origin: SessionOrigin;
  title: string;
  detail: string;
  button: string;
  exercises: any[];
  assignedId?: string;
}

function freshSets(count: number, reps: number, weightKg: number, rpe: number) {
  const n = Math.max(1, count || 1);
  return Array.from({ length: n }, (_, index) => ({
    id: `set-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    setNumber: index + 1,
    reps: reps || 0,
    weightKg: weightKg || 0,
    weight: weightKg || 0,
    rpe: rpe || 0,
    completed: false,
  }));
}

function asLogExercise(name: string, sets: any[], muscle?: string, equipment?: string) {
  return {
    id: `today-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    exerciseName: name,
    targetMuscle: muscle || 'Compound',
    equipment: equipment || 'barbell',
    tier: 'Today',
    restSecs: 90,
    sets,
  };
}

function fromCoachExercise(exercise: DispatchedExercise) {
  const reps = typeof exercise.reps === 'number' ? exercise.reps : parseInt(String(exercise.reps), 10) || 0;
  return asLogExercise(
    exercise.name,
    freshSets(exercise.sets, reps, exercise.weightKg || 0, exercise.rpe || 0),
    exercise.targetMuscle,
  );
}

function fromProgramExercise(exercise: ProgramDaySchedule['exercises'][number]) {
  return asLogExercise(
    exercise.name,
    freshSets(exercise.sets, exercise.reps, exercise.weightKg || 0, exercise.rpe || 0),
    exercise.targetMuscle,
    exercise.equipment,
  );
}

function fromSavedExercise(exercise: any) {
  const sets = (exercise.sets || []).map((set: any, index: number) => ({
    ...set,
    id: `set-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    setNumber: set.setNumber || index + 1,
    reps: set.reps || set.targetReps || 0,
    weightKg: set.weightKg || set.weight || set.targetWeightKg || 0,
    weight: set.weightKg || set.weight || set.targetWeightKg || 0,
    completed: false,
  }));
  return asLogExercise(
    exercise.name || exercise.exerciseName || 'Exercise',
    sets.length > 0 ? sets : freshSets(3, 0, 0, 0),
    exercise.targetMuscle,
    exercise.equipment,
  );
}

export function mapAssignedRow(row: any): CoachDispatchedWorkout {
  const raw = row?.exercises || row?.workout_data?.exercises || [];
  const exercises: DispatchedExercise[] = (Array.isArray(raw) ? raw : []).map((exercise: any, index: number) => {
    const setList = Array.isArray(exercise.sets) ? exercise.sets : null;
    const first = setList?.[0];
    return {
      id: String(exercise.id || `ex-${index}`),
      name: exercise.name || 'Exercise',
      sets: setList ? setList.length : Number(exercise.sets || exercise.setsCount || 3),
      reps: first?.reps || first?.targetReps || exercise.reps || 8,
      rpe: first?.rpe || exercise.rpe,
      targetMuscle: exercise.targetMuscle || exercise.muscle,
      restSecs: exercise.restSecs,
      notes: exercise.notes || exercise.cue,
      weightKg: Number(first?.weightKg || first?.weight || first?.targetWeightKg || exercise.weightKg || 0),
    };
  });
  return {
    id: String(row.id || `assigned-${Date.now()}`),
    title: row.title || 'Coach workout',
    coachName: row.coach_name || 'Coach',
    category: row.parameters?.focus || 'Coach',
    totalSets: exercises.reduce((sum, exercise) => sum + Number(exercise.sets || 0), 0),
    durationMins: 45,
    status: 'pending',
    dispatchedAt: row.assigned_date || new Date().toISOString(),
    exercises,
  };
}

export function resolveTodaySession(): TodaySession {
  const coach = useCoachStore.getState().assignedWorkouts.find((row) => row.status !== 'completed');
  if (coach && coach.exercises?.length) {
    const title = titleCase(coach.title || 'Coach workout');
    return {
      origin: 'coach',
      title,
      detail: 'From your coach',
      button: `Start · ${title}`,
      exercises: coach.exercises.map(fromCoachExercise),
      assignedId: coach.id,
    };
  }

  const saved = getAthleteDayRoutine(getSystemTodayCode());
  if (saved.isCustom && saved.exercises.length > 0) {
    const title = titleCase(saved.splitName || 'Saved workout');
    const day = DAY_NAME[getSystemTodayCode()] || 'today';
    return {
      origin: 'saved',
      title,
      detail: `Your ${day} workout`,
      button: `Start · ${title}`,
      exercises: saved.exercises.map(fromSavedExercise),
    };
  }

  const program = useActiveProgramStore.getState();
  const day = program.getCurrentDayWorkout();
  if (program.hasActiveProgram && day && !day.isRestDay && day.exercises?.length) {
    const title = titleCase(day.title || day.dayName || 'Program day');
    const dayNumber = (program.currentDayIndex % Math.max(program.totalDays, 1)) + 1;
    return {
      origin: 'program',
      title,
      detail: `Day ${dayNumber} of ${program.programTitle || 'your program'}`,
      button: `Start · ${title}`,
      exercises: day.exercises.map(fromProgramExercise),
    };
  }

  if (program.hasActiveProgram && day?.isRestDay) {
    return {
      origin: 'none',
      title: 'Rest day',
      detail: program.programTitle ? `Day off · ${program.programTitle}` : 'Day off',
      button: 'Choose a workout',
      exercises: [],
    };
  }

  return {
    origin: 'none',
    title: 'Ready to train',
    detail: 'Choose a workout to store on this day',
    button: 'Choose a workout',
    exercises: [],
  };
}

export function rememberSession(origin: SessionOrigin, assignedId?: string) {
  try {
    sessionStorage.setItem(ORIGIN_KEY, origin);
    if (assignedId) sessionStorage.setItem(ASSIGNED_KEY, assignedId);
    else sessionStorage.removeItem(ASSIGNED_KEY);
  } catch {
    /* private mode */
  }
}

export function readSessionOrigin(): { origin: SessionOrigin; assignedId: string } {
  try {
    const origin = sessionStorage.getItem(ORIGIN_KEY) as SessionOrigin | null;
    return {
      origin: origin || 'none',
      assignedId: sessionStorage.getItem(ASSIGNED_KEY) || '',
    };
  } catch {
    return { origin: 'none', assignedId: '' };
  }
}

export function clearSessionOrigin() {
  try {
    sessionStorage.removeItem(ORIGIN_KEY);
    sessionStorage.removeItem(ASSIGNED_KEY);
  } catch {
    /* private mode */
  }
}

export function startTodaySession(session: TodaySession) {
  if (!session.exercises.length) return;
  useWorkoutStore.getState().setActiveLogs(session.exercises);
  useWorkoutStore.getState().setActiveRoutine(session.title);
  useWorkoutStore.getState().setActiveSession(true);
  useWorkoutStore.getState().setMode('Lift');
  rememberSession(session.origin, session.assignedId);
  if (session.assignedId) {
    void supabase
      .from('assigned_workouts')
      .update({ status: 'active' })
      .eq('id', session.assignedId);
  }
}

/** After a finished session: clear a coach send, and advance a program only if this session was that program day. */
export function settleFinishedSession() {
  const { origin, assignedId } = readSessionOrigin();
  if (origin === 'coach' && assignedId) {
    useCoachStore.getState().completeAssigned(assignedId);
    void supabase
      .from('assigned_workouts')
      .update({ status: 'completed' })
      .eq('id', assignedId);
  }

  let nextTitle = '';
  const shouldAdvance = origin === 'program' || origin === 'coach';
  if (shouldAdvance && useActiveProgramStore.getState().hasActiveProgram) {
    const next = useActiveProgramStore.getState().completeTodayAndAdvance();
    nextTitle = next?.nextDay?.title || '';
  }
  clearSessionOrigin();
  return { origin, nextTitle };
}

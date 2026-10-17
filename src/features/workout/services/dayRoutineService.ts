import { useEffect, useState } from 'react';
import { WorkoutExercise, WorkoutSet } from '../store/workoutStoreTypes';
import { priorBestKg } from './sessionPr';
import { useConsultationStore } from '../../induction/useConsultationStore';
import { WEEK } from '../../induction/consultationTypes';
import { Kit, SafetyProfile, TrainingAgeDose, athleteDose, availableKit, canPerform, dosedSets, isSafeFor, isUnloaded } from '../utils/equipmentAccess';
import { TrainingGoal, queryExercisesForGoal } from '../utils/intelPrescriptionGenerator';
import { ExerciseDefinition } from '../../../types/workout';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';

let dayRoutineRevision = 0;
const dayRoutineListeners = new Set<() => void>();

export function bumpDayRoutines() {
  dayRoutineRevision += 1;
  dayRoutineListeners.forEach((listener) => listener());
}

/** Re-render when a weekday workout is stored. */
export function useDayRoutineRevision(): number {
  const [revision, setRevision] = useState(dayRoutineRevision);
  useEffect(() => {
    const listener = () => setRevision(dayRoutineRevision);
    dayRoutineListeners.add(listener);
    return () => {
      dayRoutineListeners.delete(listener);
    };
  }, []);
  return revision;
}

export const USER_SAVED_WORKOUTS_KEY = 'o1fc_athlete_saved_day_routines';

type DayCode = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface SavedDayRoutine {
  day: DayCode;
  splitName: string;
  exercises: WorkoutExercise[];
  savedAt: string;
}

export const getSystemTodayCode = (): DayCode => {
  const map: DayCode[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return map[new Date().getDay()] || 'Thu';
};

/**
 * Format split name into a short title-case pill (e.g. "Push A", "Hyper", "Legs").
 */
export const formatConciseSplitName = (name: string): string => {
  if (!name) return 'Rest';
  const clean = name.replace(/\s*\(.*?\)/g, '').trim();
  const upper = clean.toUpperCase();
  if (upper.includes('HYROX') || upper.includes('HYPER')) return 'Hyper';
  if (upper.includes('REST') || upper.includes('RECOVERY') || upper.includes('RESTORATION')) return 'Rest';
  if (upper.includes('PUSH A')) return 'Push A';
  if (upper.includes('PULL A')) return 'Pull A';
  if (upper.includes('LEGS A')) return 'Legs A';
  if (upper.includes('PUSH B')) return 'Push B';
  if (upper.includes('PULL B')) return 'Pull B';
  if (upper.includes('LEGS B')) return 'Legs B';
  if (upper === 'PUSH') return 'Push';
  if (upper === 'PULL') return 'Pull';
  if (upper === 'LEGS') return 'Legs';
  if (clean.length > 8) {
    const firstWord = clean.split(' ')[0];
    const clipped = firstWord.length <= 8 ? firstWord : firstWord.substring(0, 8);
    return clipped.charAt(0).toUpperCase() + clipped.slice(1).toLowerCase();
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

interface MovementPlan {
  name: string;
  muscle: string;
  equipment: string;
  tier: string;
  restSecs: number;
  sets: number;
  reps: number;
}

type MovementOption = Pick<MovementPlan, 'name' | 'equipment'> & Partial<Pick<MovementPlan, 'sets' | 'reps' | 'restSecs'>>;

/** First option is the full-gym movement; the rest are ordered substitutes for less equipment. */
interface MovementSlot extends MovementPlan {
  alternatives: MovementOption[];
}

/** Movement plan only. Loads come from the athlete's own history, never from this table. */
const DAY_PLANS: Record<DayCode, { splitName: string; movements: MovementSlot[] }> = {
  Mon: {
    splitName: 'PUSH A',
    movements: [
      {
        name: 'Barbell Flat Bench Press', muscle: 'Chest', equipment: 'Barbell', tier: 'Compound Prime', restSecs: 120, sets: 3, reps: 5,
        alternatives: [
          { name: 'Dumbbell Bench Press', equipment: 'Dumbbell', reps: 8 },
          { name: 'Push-Up', equipment: 'Bodyweight', reps: 12 },
        ],
      },
      {
        name: 'Standing Overhead Military Press', muscle: 'Deltoids', equipment: 'Barbell', tier: 'Compound Secondary', restSecs: 90, sets: 3, reps: 8,
        alternatives: [
          { name: 'Seated Dumbbell Shoulder Press', equipment: 'Dumbbell', reps: 10 },
          { name: 'Pike Push-Up', equipment: 'Bodyweight', reps: 10 },
        ],
      },
    ],
  },
  Tue: {
    splitName: 'PULL A',
    movements: [
      {
        name: 'Conventional Barbell Deadlift', muscle: 'Posterior Chain', equipment: 'Barbell', tier: 'Compound Prime', restSecs: 180, sets: 3, reps: 5,
        alternatives: [
          { name: 'Kettlebell Deadlift', equipment: 'Kettlebell', reps: 10 },
          { name: 'Single-Leg Glute Bridge', equipment: 'Bodyweight', reps: 12 },
        ],
      },
      {
        name: 'Weighted Neutral Grip Pull-Up', muscle: 'Lats', equipment: 'Bodyweight / Belt', tier: 'Compound Secondary', restSecs: 90, sets: 3, reps: 6,
        alternatives: [
          { name: 'Neutral Grip Pull-Up', equipment: 'Pull-Up Bar', reps: 8 },
          { name: 'Prone Y-T-W Raise', equipment: 'Bodyweight', reps: 10 },
        ],
      },
    ],
  },
  Wed: {
    splitName: 'LEGS A',
    movements: [
      {
        name: 'Olympic Barbell Back Squat', muscle: 'Quadriceps', equipment: 'Barbell', tier: 'Compound Prime', restSecs: 150, sets: 3, reps: 5,
        alternatives: [
          { name: 'Dumbbell Goblet Squat', equipment: 'Dumbbell', reps: 10 },
          { name: 'Bulgarian Split Squat', equipment: 'Bodyweight', reps: 10 },
        ],
      },
      {
        name: 'Romanian Deadlift (RDL)', muscle: 'Hamstrings', equipment: 'Barbell', tier: 'Accessory', restSecs: 90, sets: 3, reps: 10,
        alternatives: [
          { name: 'Dumbbell Romanian Deadlift', equipment: 'Dumbbell', reps: 10 },
          { name: 'Single-Leg Romanian Deadlift', equipment: 'Bodyweight', reps: 10 },
        ],
      },
    ],
  },
  Thu: {
    splitName: 'HYPER',
    movements: [
      {
        name: 'SkiErg 500m Sprint Intervals', muscle: 'Cardio Engine', equipment: 'Concept2 SkiErg', tier: 'Conditioning', restSecs: 60, sets: 2, reps: 500,
        alternatives: [{ name: '400m Run Intervals', equipment: 'Bodyweight', sets: 4, reps: 400 }],
      },
      {
        name: 'Sled Push Heavy Drive', muscle: 'Lower Body Drive', equipment: 'Turf Sled', tier: 'Conditioning', restSecs: 90, sets: 2, reps: 50,
        alternatives: [
          { name: 'Kettlebell Swing', equipment: 'Kettlebell', sets: 3, reps: 20 },
          { name: 'Burpee Broad Jumps', equipment: 'Bodyweight', sets: 3, reps: 10 },
        ],
      },
    ],
  },
  Fri: {
    splitName: 'PUSH B',
    movements: [
      {
        name: 'Incline Dumbbell Chest Press', muscle: 'Upper Chest', equipment: 'Dumbbells', tier: 'Compound Prime', restSecs: 90, sets: 3, reps: 8,
        alternatives: [{ name: 'Decline Push-Up', equipment: 'Bodyweight', reps: 12 }],
      },
      {
        name: 'Cable Overhead Triceps Extension', muscle: 'Triceps Long Head', equipment: 'Cable Tower', tier: 'Accessory', restSecs: 60, sets: 3, reps: 12,
        alternatives: [
          { name: 'Overhead Dumbbell Triceps Extension', equipment: 'Dumbbell', reps: 12 },
          { name: 'Diamond Push-Up', equipment: 'Bodyweight', reps: 10 },
        ],
      },
    ],
  },
  Sat: {
    splitName: 'PULL B',
    movements: [
      {
        name: 'Barbell Chest Supported T-Bar Row', muscle: 'Upper Back & Lats', equipment: 'Barbell / Rig', tier: 'Compound Prime', restSecs: 90, sets: 3, reps: 8,
        alternatives: [
          { name: 'One-Arm Dumbbell Row', equipment: 'Dumbbell', reps: 10 },
          { name: 'Inverted Row', equipment: 'Pull-Up Bar', reps: 10 },
          { name: 'Superman Hold', equipment: 'Bodyweight', reps: 12 },
        ],
      },
      {
        name: 'Incline Dumbbell Biceps Curl', muscle: 'Biceps Long Head', equipment: 'Dumbbells', tier: 'Accessory', restSecs: 60, sets: 3, reps: 10,
        alternatives: [
          { name: 'Chin-Up', equipment: 'Pull-Up Bar', reps: 8 },
          { name: 'Isometric Towel Curl', equipment: 'Bodyweight', reps: 8 },
        ],
      },
    ],
  },
  Sun: {
    splitName: 'REST',
    movements: [
      {
        name: 'Thoracic Extension & Foam Roller Release', muscle: 'Spine & Fascia', equipment: 'Foam Roller', tier: 'Restoration', restSecs: 45, sets: 2, reps: 15,
        alternatives: [],
      },
    ],
  },
};

const SESSION_ORDER: DayCode[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TRAINING_SLOTS: Record<number, DayCode[]> = {
  3: ['Mon', 'Wed', 'Fri'],
  4: ['Mon', 'Tue', 'Thu', 'Fri'],
  5: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  6: SESSION_ORDER,
};

/** The session planned for a weekday: the athlete's chosen days first, otherwise spread by days a week. */
function planForDay(day: DayCode, preview = false): { splitName: string; movements: MovementSlot[] } {
  const consultation = useConsultationStore.getState();
  if (!consultation.locked && !preview) return DAY_PLANS[day];
  const slots = consultation.trainingDays.length > 0
    ? consultation.trainingDays
    : TRAINING_SLOTS[consultation.frequencyDays] || SESSION_ORDER;
  const index = slots.indexOf(day);
  return index >= 0 && index < SESSION_ORDER.length ? DAY_PLANS[SESSION_ORDER[index]] : DAY_PLANS.Sun;
}

/** The first option the athlete can do where they train and that spares what they protect; null when none fits. */
function pickMovement(slot: MovementSlot, kit: Set<Kit> | null, safety: SafetyProfile): MovementPlan | null {
  const { alternatives, ...primary } = slot;
  const fits = (name: string, equipment: string) => isSafeFor(name, safety) && canPerform(name, equipment, kit);
  if (fits(primary.name, primary.equipment)) return primary;
  const option = alternatives.find((alt) => fits(alt.name, alt.equipment));
  if (option) return { ...primary, ...option };
  const safeFallback = [...alternatives].reverse().find((alt) => isSafeFor(alt.name, safety));
  return safeFallback ? { ...primary, ...safeFallback } : null;
}

const WORK_SECS_PER_SET = 40;
const DEFAULT_SESSION_MINUTES = 45;
const MAX_EXERCISES = 8;

const SPLIT_FOCUS: [RegExp, TrainingGoal, string][] = [
  [/PUSH/, 'muscle', 'Push (Chest/Delts)'],
  [/PULL/, 'muscle', 'Pull (Back/Bis)'],
  [/LEGS/, 'muscle', 'Legs & Calves'],
  [/HYPER|HYROX/, 'athletic', 'Full Body'],
];

const GENERIC_WORDS = new Set(['barbell', 'dumbbell', 'kettlebell', 'cable', 'machine', 'standing', 'seated', 'weighted']);

function keyWords(name: string): Set<string> {
  return new Set(name.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 3 && !GENERIC_WORDS.has(word)));
}

/** "Standing Overhead Military Press" and "Standing Barbell Overhead Press" train the same thing. */
function nearDuplicate(a: string, b: string): boolean {
  const words = keyWords(a);
  return [...keyWords(b)].filter((word) => words.has(word)).length >= 2;
}

function planMinutes(list: readonly MovementPlan[]): number {
  return Math.round(list.reduce((sum, m) => sum + m.sets * (WORK_SECS_PER_SET + m.restSecs), 0) / 60);
}

/**
 * Tops a short day up to the athlete's session length with library moves for the same split.
 * The library query already drops moves they can't do where they train or that load a protected area.
 */
function fillSession(picked: MovementPlan[], splitName: string, targetMinutes: number, dose: TrainingAgeDose): void {
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
      if (taken.has(ex.name.toLowerCase()) || picked.some((m) => nearDuplicate(m.name, ex.name))) continue;
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
export function estimateSessionMinutes(exercises: readonly Pick<WorkoutExercise, 'sets' | 'restSecs'>[]): number {
  const secs = exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0) * (WORK_SECS_PER_SET + (ex.restSecs || 60)), 0);
  return Math.round(secs / 60);
}

useConsultationStore.subscribe((next, prev) => {
  if (
    next.locked !== prev.locked ||
    next.frequencyDays !== prev.frequencyDays ||
    next.trainingAge !== prev.trainingAge ||
    next.facilities !== prev.facilities ||
    next.trainingDays !== prev.trainingDays ||
    next.sessionMinutes !== prev.sessionMinutes ||
    next.injuries !== prev.injuries ||
    next.ageBand !== prev.ageBand
  ) {
    bumpDayRoutines();
  }
});

/** Working load that leaves about two reps in reserve, from the athlete's best estimated max. 0 when uncalibrated. */
export function workingLoadKg(exerciseName: string, reps: number): number {
  const max = priorBestKg(exerciseName);
  if (max <= 0 || reps <= 0 || reps > 30) return 0;
  return Math.floor(max / (1 + (reps + 2) / 30) / 2.5) * 2.5;
}

function buildDefaultRoutine(day: DayCode, preview = false): WorkoutExercise[] {
  const prefix = day.toLowerCase();
  const { facilities, trainingAge, ageBand, injuries, sessionMinutes } = useConsultationStore.getState();
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

/**
 * Retrieve saved routine for a specific day from localStorage
 */
export const getAthleteDayRoutine = (
  day: DayCode
): { splitName: string; exercises: WorkoutExercise[]; isCustom: boolean } => {
  try {
    const raw = localStorage.getItem(USER_SAVED_WORKOUTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed[day] && Array.isArray(parsed[day].exercises)) {
        return {
          splitName: formatConciseSplitName(parsed[day].splitName || DAY_PLANS[day].splitName),
          exercises: parsed[day].exercises,
          isCustom: true,
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse athlete saved day routines', e);
  }

  if (!DAY_PLANS[day]) return { splitName: 'Rest', exercises: [], isCustom: false };
  if (!readAthleteSettingsSnapshot().autoDispatch) return { splitName: 'Your own', exercises: [], isCustom: false };
  return {
    splitName: formatConciseSplitName(planForDay(day).splitName),
    exercises: buildDefaultRoutine(day),
    isCustom: false,
  };
};

type SavedDayRoutines = Partial<Record<DayCode, SavedDayRoutine>>;

/**
 * Save an athlete's workout to repeat on a specific day of the week
 */
export const saveAthleteDayRoutine = (
  day: DayCode,
  splitName: string,
  exercises: WorkoutExercise[]
): boolean => {
  try {
    let saved: SavedDayRoutines = {};
    const raw = localStorage.getItem(USER_SAVED_WORKOUTS_KEY);
    if (raw) {
      try {
        saved = (JSON.parse(raw) as SavedDayRoutines | null) || {};
      } catch {
        saved = {};
      }
    }

    // Reset completion states so next time they load it, sets are ready to be completed
    const cleanExercises: WorkoutExercise[] = exercises.map((ex: WorkoutExercise, exIdx: number) => ({
      ...ex,
      id: `saved-${day.toLowerCase()}-${Date.now()}-${exIdx}`,
      sets: (ex.sets || []).map((s: WorkoutSet, sIdx: number) => ({
        ...s,
        id: `s-${Date.now()}-${exIdx}-${sIdx}`,
        completed: false,
      })),
    }));

    saved[day] = {
      day,
      splitName: splitName || DAY_PLANS[day]?.splitName || `${day} Routine`,
      exercises: cleanExercises,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(USER_SAVED_WORKOUTS_KEY, JSON.stringify(saved));
    bumpDayRoutines();
    return true;
  } catch (e) {
    console.error('Error saving routine to day', e);
    return false;
  }
};

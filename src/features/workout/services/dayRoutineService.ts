import { useEffect, useState } from 'react';
import { WorkoutExercise, WorkoutSet } from '../store/workoutStoreTypes';
import { priorBestKg } from './sessionPr';

let dayRoutineRevision = 0;
const dayRoutineListeners = new Set<() => void>();

function bumpDayRoutines() {
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

/** Movement plan only. Loads come from the athlete's own history, never from this table. */
const DAY_PLANS: Record<DayCode, { splitName: string; movements: MovementPlan[] }> = {
  Mon: {
    splitName: 'PUSH A',
    movements: [
      { name: 'Barbell Flat Bench Press', muscle: 'Chest', equipment: 'Barbell', tier: 'Compound Prime', restSecs: 120, sets: 3, reps: 5 },
      { name: 'Standing Overhead Military Press', muscle: 'Deltoids', equipment: 'Barbell', tier: 'Compound Secondary', restSecs: 90, sets: 3, reps: 8 },
    ],
  },
  Tue: {
    splitName: 'PULL A',
    movements: [
      { name: 'Conventional Barbell Deadlift', muscle: 'Posterior Chain', equipment: 'Barbell', tier: 'Compound Prime', restSecs: 180, sets: 3, reps: 5 },
      { name: 'Weighted Neutral Grip Pull-Up', muscle: 'Lats', equipment: 'Bodyweight / Belt', tier: 'Compound Secondary', restSecs: 90, sets: 3, reps: 6 },
    ],
  },
  Wed: {
    splitName: 'LEGS A',
    movements: [
      { name: 'Olympic Barbell Back Squat', muscle: 'Quadriceps', equipment: 'Barbell', tier: 'Compound Prime', restSecs: 150, sets: 3, reps: 5 },
      { name: 'Romanian Deadlift (RDL)', muscle: 'Hamstrings', equipment: 'Barbell', tier: 'Accessory', restSecs: 90, sets: 3, reps: 10 },
    ],
  },
  Thu: {
    splitName: 'HYPER',
    movements: [
      { name: 'SkiErg 500m Sprint Intervals', muscle: 'Cardio Engine', equipment: 'Concept2 SkiErg', tier: 'Conditioning', restSecs: 60, sets: 2, reps: 500 },
      { name: 'Sled Push Heavy Drive', muscle: 'Lower Body Drive', equipment: 'Turf Sled', tier: 'Conditioning', restSecs: 90, sets: 2, reps: 50 },
    ],
  },
  Fri: {
    splitName: 'PUSH B',
    movements: [
      { name: 'Incline Dumbbell Chest Press', muscle: 'Upper Chest', equipment: 'Dumbbells', tier: 'Compound Prime', restSecs: 90, sets: 3, reps: 8 },
      { name: 'Cable Overhead Triceps Extension', muscle: 'Triceps Long Head', equipment: 'Cable Tower', tier: 'Accessory', restSecs: 60, sets: 3, reps: 12 },
    ],
  },
  Sat: {
    splitName: 'PULL B',
    movements: [
      { name: 'Barbell Chest Supported T-Bar Row', muscle: 'Upper Back & Lats', equipment: 'Barbell / Rig', tier: 'Compound Prime', restSecs: 90, sets: 3, reps: 8 },
      { name: 'Incline Dumbbell Biceps Curl', muscle: 'Biceps Long Head', equipment: 'Dumbbells', tier: 'Accessory', restSecs: 60, sets: 3, reps: 10 },
    ],
  },
  Sun: {
    splitName: 'REST',
    movements: [
      { name: 'Thoracic Extension & Foam Roller Release', muscle: 'Spine & Fascia', equipment: 'Foam Roller', tier: 'Restoration', restSecs: 45, sets: 2, reps: 15 },
    ],
  },
};

/** Working load that leaves about two reps in reserve, from the athlete's best estimated max. 0 when uncalibrated. */
export function workingLoadKg(exerciseName: string, reps: number): number {
  const max = priorBestKg(exerciseName);
  if (max <= 0 || reps <= 0 || reps > 30) return 0;
  return Math.floor(max / (1 + (reps + 2) / 30) / 2.5) * 2.5;
}

function buildDefaultRoutine(day: DayCode): WorkoutExercise[] {
  const prefix = day.toLowerCase();
  return DAY_PLANS[day].movements.map((m, i) => {
    const load = workingLoadKg(m.name, m.reps);
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

  return {
    splitName: formatConciseSplitName(DAY_PLANS[day]?.splitName || 'REST'),
    exercises: DAY_PLANS[day] ? buildDefaultRoutine(day) : [],
    isCustom: false,
  };
};

/**
 * Save an athlete's workout to repeat on a specific day of the week
 */
export const saveAthleteDayRoutine = (
  day: DayCode,
  splitName: string,
  exercises: WorkoutExercise[]
): boolean => {
  try {
    let saved: Record<string, any> = {};
    const raw = localStorage.getItem(USER_SAVED_WORKOUTS_KEY);
    if (raw) {
      try {
        saved = JSON.parse(raw) || {};
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

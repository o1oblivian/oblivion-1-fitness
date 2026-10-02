import { BlueprintExercise, WORKOUT_BLUEPRINTS } from '../../../data/workoutBlueprints';
import { WorkoutExercise, WorkoutSet } from '../store/workoutStoreTypes';

export const USER_SAVED_WORKOUTS_KEY = 'o1fc_athlete_saved_day_routines';

export interface SavedDayRoutine {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  splitName: string;
  exercises: WorkoutExercise[];
  savedAt: string;
}

export const getSystemTodayCode = (): 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' => {
  const map: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'> = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];
  return map[new Date().getDay()] || 'Thu';
};

/**
 * Format split name into clean, short label (e.g. "PUSH A", "PULL A", "HYPER", "PUSH B", "LEGS")
 * without verbose long subtitles or truncated parentheses.
 */
export const formatConciseSplitName = (name: string): string => {
  if (!name) return 'REST';
  // Strip parentheses and anything inside them: "PUSH B (INCLINE & ARMS)" -> "PUSH B"
  const clean = name.replace(/\s*\(.*?\)/g, '').trim();

  // Standard short tokens
  const upper = clean.toUpperCase();
  if (upper.includes('HYROX') || upper.includes('HYPER')) return 'HYPER';
  if (upper.includes('REST') || upper.includes('RECOVERY') || upper.includes('RESTORATION')) return 'REST';
  if (upper.includes('PUSH A')) return 'PUSH A';
  if (upper.includes('PULL A')) return 'PULL A';
  if (upper.includes('LEGS A')) return 'LEGS A';
  if (upper.includes('PUSH B')) return 'PUSH B';
  if (upper.includes('PULL B')) return 'PULL B';
  if (upper.includes('LEGS B')) return 'LEGS B';
  if (upper === 'PUSH') return 'PUSH';
  if (upper === 'PULL') return 'PULL';
  if (upper === 'LEGS') return 'LEGS';

  // For other names, keep max 8-9 characters so it never overflows the tactile OLED pill
  if (clean.length > 8) {
    const firstWord = clean.split(' ')[0];
    return (firstWord.length <= 8 ? firstWord : firstWord.substring(0, 8)).toUpperCase();
  }
  return clean.toUpperCase();
};

/**
 * Default fallback routines for days if the athlete hasn't saved a custom one yet
 */
export const DEFAULT_DAY_ROUTINES: Record<
  'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun',
  { splitName: string; exercises: WorkoutExercise[] }
> = {
  Mon: {
    splitName: 'PUSH A',
    exercises: [
      {
        id: 'mon-ex-1',
        name: 'Barbell Flat Bench Press',
        exerciseName: 'Barbell Flat Bench Press',
        targetMuscle: 'Chest',
        equipment: 'Barbell',
        tier: 'Compound Prime',
        restSecs: 120,
        sets: [
          { id: 'm-s1', setNumber: 1, reps: 5, weight: 100, weightKg: 100, rpe: 8, completed: false },
          { id: 'm-s2', setNumber: 2, reps: 5, weight: 100, weightKg: 100, rpe: 8.5, completed: false },
          { id: 'm-s3', setNumber: 3, reps: 5, weight: 102.5, weightKg: 102.5, rpe: 9, completed: false },
        ],
      },
      {
        id: 'mon-ex-2',
        name: 'Standing Overhead Military Press',
        exerciseName: 'Standing Overhead Military Press',
        targetMuscle: 'Deltoids',
        equipment: 'Barbell',
        tier: 'Compound Secondary',
        restSecs: 90,
        sets: [
          { id: 'm-s4', setNumber: 1, reps: 8, weight: 60, weightKg: 60, rpe: 8, completed: false },
          { id: 'm-s5', setNumber: 2, reps: 8, weight: 60, weightKg: 60, rpe: 8.5, completed: false },
          { id: 'm-s6', setNumber: 3, reps: 8, weight: 60, weightKg: 60, rpe: 9, completed: false },
        ],
      },
    ],
  },
  Tue: {
    splitName: 'PULL A',
    exercises: [
      {
        id: 'tue-ex-1',
        name: 'Conventional Barbell Deadlift',
        exerciseName: 'Conventional Barbell Deadlift',
        targetMuscle: 'Posterior Chain',
        equipment: 'Barbell',
        tier: 'Compound Prime',
        restSecs: 180,
        sets: [
          { id: 't-s1', setNumber: 1, reps: 5, weight: 140, weightKg: 140, rpe: 8, completed: false },
          { id: 't-s2', setNumber: 2, reps: 5, weight: 145, weightKg: 145, rpe: 8.5, completed: false },
          { id: 't-s3', setNumber: 3, reps: 5, weight: 150, weightKg: 150, rpe: 9, completed: false },
        ],
      },
      {
        id: 'tue-ex-2',
        name: 'Weighted Neutral Grip Pull-Up',
        exerciseName: 'Weighted Neutral Grip Pull-Up',
        targetMuscle: 'Lats',
        equipment: 'Bodyweight / Belt',
        tier: 'Compound Secondary',
        restSecs: 90,
        sets: [
          { id: 't-s4', setNumber: 1, reps: 6, weight: 15, weightKg: 15, rpe: 8, completed: false },
          { id: 't-s5', setNumber: 2, reps: 6, weight: 15, weightKg: 15, rpe: 8.5, completed: false },
          { id: 't-s6', setNumber: 3, reps: 6, weight: 15, weightKg: 15, rpe: 9, completed: false },
        ],
      },
    ],
  },
  Wed: {
    splitName: 'LEGS A',
    exercises: [
      {
        id: 'wed-ex-1',
        name: 'Olympic Barbell Back Squat',
        exerciseName: 'Olympic Barbell Back Squat',
        targetMuscle: 'Quadriceps',
        equipment: 'Barbell',
        tier: 'Compound Prime',
        restSecs: 150,
        sets: [
          { id: 'w-s1', setNumber: 1, reps: 5, weight: 120, weightKg: 120, rpe: 8, completed: false },
          { id: 'w-s2', setNumber: 2, reps: 5, weight: 125, weightKg: 125, rpe: 8.5, completed: false },
          { id: 'w-s3', setNumber: 3, reps: 5, weight: 130, weightKg: 130, rpe: 9, completed: false },
        ],
      },
      {
        id: 'wed-ex-2',
        name: 'Romanian Deadlift (RDL)',
        exerciseName: 'Romanian Deadlift (RDL)',
        targetMuscle: 'Hamstrings',
        equipment: 'Barbell',
        tier: 'Accessory',
        restSecs: 90,
        sets: [
          { id: 'w-s4', setNumber: 1, reps: 10, weight: 90, weightKg: 90, rpe: 8, completed: false },
          { id: 'w-s5', setNumber: 2, reps: 10, weight: 90, weightKg: 90, rpe: 8.5, completed: false },
        ],
      },
    ],
  },
  Thu: {
    splitName: 'HYPER',
    exercises: [
      {
        id: 'thu-ex-1',
        name: 'SkiErg 500m Sprint Intervals',
        exerciseName: 'SkiErg 500m Sprint Intervals',
        targetMuscle: 'Cardio Engine',
        equipment: 'Concept2 SkiErg',
        tier: 'Conditioning',
        restSecs: 60,
        sets: [
          { id: 'th-s1', setNumber: 1, reps: 500, weight: 0, weightKg: 0, rpe: 8, completed: false },
          { id: 'th-s2', setNumber: 2, reps: 500, weight: 0, weightKg: 0, rpe: 8.5, completed: false },
        ],
      },
      {
        id: 'thu-ex-2',
        name: 'Sled Push Heavy Drive',
        exerciseName: 'Sled Push Heavy Drive',
        targetMuscle: 'Lower Body Drive',
        equipment: 'Turf Sled',
        tier: 'Conditioning',
        restSecs: 90,
        sets: [
          { id: 'th-s3', setNumber: 1, reps: 50, weight: 120, weightKg: 120, rpe: 8.5, completed: false },
          { id: 'th-s4', setNumber: 2, reps: 50, weight: 120, weightKg: 120, rpe: 9, completed: false },
        ],
      },
    ],
  },
  Fri: {
    splitName: 'PUSH B',
    exercises: [
      {
        id: 'fri-ex-1',
        name: 'Incline Dumbbell Chest Press',
        exerciseName: 'Incline Dumbbell Chest Press',
        targetMuscle: 'Upper Chest',
        equipment: 'Dumbbells',
        tier: 'Compound Prime',
        restSecs: 90,
        sets: [
          { id: 'f-s1', setNumber: 1, reps: 8, weight: 36, weightKg: 36, rpe: 8, completed: false },
          { id: 'f-s2', setNumber: 2, reps: 8, weight: 38, weightKg: 38, rpe: 8.5, completed: false },
          { id: 'f-s3', setNumber: 3, reps: 8, weight: 40, weightKg: 40, rpe: 9, completed: false },
        ],
      },
      {
        id: 'fri-ex-2',
        name: 'Cable Overhead Triceps Extension',
        exerciseName: 'Cable Overhead Triceps Extension',
        targetMuscle: 'Triceps Long Head',
        equipment: 'Cable Tower',
        tier: 'Accessory',
        restSecs: 60,
        sets: [
          { id: 'f-s4', setNumber: 1, reps: 12, weight: 28, weightKg: 28, rpe: 8, completed: false },
          { id: 'f-s5', setNumber: 2, reps: 12, weight: 32, weightKg: 32, rpe: 8.5, completed: false },
          { id: 'f-s6', setNumber: 3, reps: 10, weight: 35, weightKg: 35, rpe: 9, completed: false },
        ],
      },
    ],
  },
  Sat: {
    splitName: 'PULL B',
    exercises: [
      {
        id: 'sat-ex-1',
        name: 'Barbell Chest Supported T-Bar Row',
        exerciseName: 'Barbell Chest Supported T-Bar Row',
        targetMuscle: 'Upper Back & Lats',
        equipment: 'Barbell / Rig',
        tier: 'Compound Prime',
        restSecs: 90,
        sets: [
          { id: 's-s1', setNumber: 1, reps: 8, weight: 70, weightKg: 70, rpe: 8, completed: false },
          { id: 's-s2', setNumber: 2, reps: 8, weight: 75, weightKg: 75, rpe: 8.5, completed: false },
          { id: 's-s3', setNumber: 3, reps: 8, weight: 80, weightKg: 80, rpe: 9, completed: false },
        ],
      },
      {
        id: 'sat-ex-2',
        name: 'Incline Dumbbell Biceps Curl',
        exerciseName: 'Incline Dumbbell Biceps Curl',
        targetMuscle: 'Biceps Long Head',
        equipment: 'Dumbbells',
        tier: 'Accessory',
        restSecs: 60,
        sets: [
          { id: 's-s4', setNumber: 1, reps: 10, weight: 16, weightKg: 16, rpe: 8, completed: false },
          { id: 's-s5', setNumber: 2, reps: 10, weight: 16, weightKg: 16, rpe: 8.5, completed: false },
        ],
      },
    ],
  },
  Sun: {
    splitName: 'REST',
    exercises: [
      {
        id: 'sun-ex-1',
        name: 'Thoracic Extension & Foam Roller Release',
        exerciseName: 'Thoracic Extension & Foam Roller Release',
        targetMuscle: 'Spine & Fascia',
        equipment: 'Foam Roller',
        tier: 'Restoration',
        restSecs: 45,
        sets: [
          { id: 'su-s1', setNumber: 1, reps: 15, weight: 0, weightKg: 0, rpe: 4, completed: false },
          { id: 'su-s2', setNumber: 2, reps: 15, weight: 0, weightKg: 0, rpe: 4, completed: false },
        ],
      },
    ],
  },
};

/**
 * Retrieve saved routine for a specific day from localStorage
 */
export const getAthleteDayRoutine = (
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
): { splitName: string; exercises: WorkoutExercise[]; isCustom: boolean } => {
  try {
    const raw = localStorage.getItem(USER_SAVED_WORKOUTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed[day] && Array.isArray(parsed[day].exercises)) {
        return {
          splitName: formatConciseSplitName(parsed[day].splitName || DEFAULT_DAY_ROUTINES[day].splitName),
          exercises: parsed[day].exercises,
          isCustom: true,
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse athlete saved day routines', e);
  }

  return {
    splitName: formatConciseSplitName(DEFAULT_DAY_ROUTINES[day]?.splitName || 'REST'),
    exercises: DEFAULT_DAY_ROUTINES[day]?.exercises || [],
    isCustom: false,
  };
};

/**
 * Save an athlete's workout to repeat on a specific day of the week
 */
export const saveAthleteDayRoutine = (
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun',
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
      splitName: splitName || DEFAULT_DAY_ROUTINES[day]?.splitName || `${day} Routine`,
      exercises: cleanExercises,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(USER_SAVED_WORKOUTS_KEY, JSON.stringify(saved));
    return true;
  } catch (e) {
    console.error('Error saving routine to day', e);
    return false;
  }
};

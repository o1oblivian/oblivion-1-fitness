import type { WorkoutExercise, WorkoutSet } from '../../store/workoutStoreTypes';
import { DAY_PLANS, type DayCode } from './dayPlans';

const USER_SAVED_WORKOUTS_KEY = 'o1fc_athlete_saved_day_routines';

export interface SavedDayRoutine {
  day: DayCode;
  splitName: string;
  exercises: WorkoutExercise[];
  savedAt: string;
}

type SavedDayRoutines = Partial<Record<DayCode, SavedDayRoutine>>;

/** The workout the athlete saved for a weekday, or null if none (or the stored data is unreadable). */
export function findSavedRoutine(day: DayCode): SavedDayRoutine | null {
  try {
    const raw = localStorage.getItem(USER_SAVED_WORKOUTS_KEY);
    if (!raw) return null;
    const saved = (JSON.parse(raw) as SavedDayRoutines | null)?.[day];
    return saved && Array.isArray(saved.exercises) ? saved : null;
  } catch (e) {
    console.error('Failed to parse athlete saved day routines', e);
    return null;
  }
}

/** Stored sets and exercises get new ids and every set is reset to not done. */
export function resetForReuse(day: DayCode, exercises: WorkoutExercise[]): WorkoutExercise[] {
  return exercises.map((ex, exIdx) => ({
    ...ex,
    id: `saved-${day.toLowerCase()}-${Date.now()}-${exIdx}`,
    sets: (ex.sets || []).map((s: WorkoutSet, sIdx) => ({
      ...s,
      id: `s-${Date.now()}-${exIdx}-${sIdx}`,
      completed: false,
    })),
  }));
}

/** Saves a workout to repeat on a weekday. Throws if storage is unavailable. */
export function storeSavedRoutine(
  day: DayCode,
  splitName: string,
  exercises: WorkoutExercise[],
): void {
  let saved: SavedDayRoutines = {};
  const raw = localStorage.getItem(USER_SAVED_WORKOUTS_KEY);
  if (raw) {
    try {
      saved = (JSON.parse(raw) as SavedDayRoutines | null) || {};
    } catch {
      saved = {};
    }
  }
  saved[day] = {
    day,
    splitName: splitName || DAY_PLANS[day]?.splitName || `${day} Routine`,
    exercises: resetForReuse(day, exercises),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(USER_SAVED_WORKOUTS_KEY, JSON.stringify(saved));
}

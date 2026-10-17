import { useMemo } from 'react';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { exerciseFromSets, setsFromExercise } from '../liftLedger';
import type { NutritionDayRecord, WorkoutDayRecord } from '../store/useTelemetryHistoryStore';

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack', 'drinks', 'supplements'] as const;

/** The history card groups meals under four headings; drinks and supplements ride with Lunch. */
const MEAL_CATEGORY = {
  breakfast: 'Breakfast',
  dinner: 'Dinner',
  snack: 'Snacks',
} as const;

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Today's workout and food as the day record the history views read, built from the live
 * stores. Both are `undefined` when `enabled` is false or nothing has been logged yet.
 */
export function useLiveToday(enabled: boolean): {
  liveWorkout: WorkoutDayRecord | undefined;
  liveFood: NutritionDayRecord | undefined;
} {
  const workoutExercises = useWorkoutStore((s) => s.exercises);
  const sessionTonnageKg = useWorkoutStore((s) => s.sessionTonnageKg);
  const completedSetsCount = useWorkoutStore((s) => s.completedSetsCount);
  const activeRoutineTitle = useWorkoutStore((s) => s.activeRoutine);
  const meals = useFuelStore((s) => s.meals);
  const calorieTarget = useFuelStore((s) => s.calorieTarget);

  const liveWorkout = useMemo<WorkoutDayRecord | undefined>(() => {
    if (!enabled) return undefined;
    const lifts = workoutExercises.filter((exercise) => {
      const name = (exercise.name || exercise.exerciseName || '').toLowerCase();
      return !name.startsWith('cardio:') && !name.includes('telemetry');
    });
    const exercises = lifts
      .map((exercise) =>
        exerciseFromSets(
          exercise.name || exercise.exerciseName || 'Exercise',
          setsFromExercise(exercise, true),
          true,
        ),
      )
      .filter((entry) => (entry.setLog?.length || 0) > 0);
    if (exercises.length === 0 && sessionTonnageKg <= 0 && completedSetsCount <= 0) {
      return undefined;
    }
    return {
      hasData: true,
      tonnageKg: sessionTonnageKg,
      completedSets: completedSetsCount,
      durationMinutes: 0,
      routineName: activeRoutineTitle || '',
      intensityRpe: 0,
      exercises,
    };
  }, [enabled, workoutExercises, sessionTonnageKg, completedSetsCount, activeRoutineTitle]);

  const liveFood = useMemo<NutritionDayRecord | undefined>(() => {
    if (!enabled) return undefined;
    const allMeals = meals ? Object.values(meals).flat() : [];
    const calories = Math.round(allMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0));
    if (calories <= 0 && allMeals.length === 0) return undefined;
    const total = (pick: (meal: (typeof allMeals)[number]) => number | undefined) =>
      round1(allMeals.reduce((sum, meal) => sum + (pick(meal) || 0), 0));
    return {
      hasData: true,
      calories,
      calorieTarget: calorieTarget || 0,
      proteinG: total((meal) => meal.protein),
      proteinTargetG: 0,
      carbsG: total((meal) => meal.carbs),
      carbsTargetG: 0,
      fatsG: total((meal) => meal.fats),
      fatsTargetG: 0,
      meals: MEAL_SLOTS.flatMap((slot) =>
        (meals?.[slot] || []).map((meal) => ({
          name: meal.name,
          category:
            slot === 'breakfast' || slot === 'dinner' || slot === 'snack'
              ? MEAL_CATEGORY[slot]
              : ('Lunch' as const),
          slot,
          calories: Math.round(meal.calories || 0),
          proteinG: meal.protein || 0,
          carbsG: meal.carbs || 0,
          fatsG: meal.fats || 0,
        })),
      ),
    };
  }, [enabled, meals, calorieTarget]);

  return { liveWorkout, liveFood };
}

import { tactileEngine } from '../../../services/tactileEngine';
import { forgetPendingArchives } from '../../../services/sessionArchive';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { knownSets, setWorkKg } from '../liftLedger';
import {
  deleteDayLog,
  markForgotten,
  purgeArchivedDay,
  purgeArchivedLift,
} from '../services/dayLogService';
import {
  useTelemetryHistoryStore,
  type DayTelemetryRecord,
  type NutritionDayRecord,
  type TelemetryCategory,
  type WorkoutDayRecord,
} from '../store/useTelemetryHistoryStore';

/** The day being edited. `isToday` means live stores (workout, fuel, steps) must be cleared too. */
export interface DayTarget {
  dateKey: string;
  isToday: boolean;
  historyByDate: Record<string, Partial<DayTelemetryRecord>>;
}

/** Wipes one channel of the day: live state for today, saved history, cloud copy and archives. */
export function removeDayEntry(category: TelemetryCategory, day: DayTarget): void {
  tactileEngine.triggerSelectionBuzz();
  const saved = day.historyByDate[day.dateKey];

  if (day.isToday) {
    if (category === 'nutrition') {
      const fuel = useFuelStore.getState();
      (Object.keys(fuel.meals) as Array<keyof typeof fuel.meals>).forEach((slot) => {
        [...fuel.meals[slot]].forEach((item) =>
          useFuelStore.getState().removeMealItem(slot, item.id),
        );
      });
    }
    if (category === 'workout') {
      const loggedKcal = saved?.workout?.burnedKcal ?? 0;
      if (loggedKcal > 0) useFuelStore.getState().logBurned(-loggedKcal);
      useWorkoutStore.getState().clearActiveLog();
      useWorkoutStore.getState().setActiveSession(false);
    }
    if (category === 'cardio') {
      const cardioKcal = (saved?.cardio?.burnedKcal ?? 0) + (saved?.cardio?.stepKcal ?? 0);
      if (cardioKcal > 0) useFuelStore.getState().logBurned(-cardioKcal);
      useTelemetryStore.getState().setStepCount(0);
    }
  }

  markForgotten(day.dateKey, category);
  useTelemetryHistoryStore.getState().clearDayRecord(day.dateKey, category);
  void deleteDayLog(day.dateKey, category);
  if (category === 'workout' || category === 'cardio') {
    forgetPendingArchives(day.dateKey, category);
  }
  void purgeArchivedDay(day.dateKey, category);
}

/** Removes one lift from the day's workout; removing the last lift removes the whole workout. */
export function removeDayLift(
  name: string,
  day: DayTarget,
  workout: WorkoutDayRecord | undefined,
): void {
  const remaining = (workout?.exercises || []).filter((exercise) => exercise.name !== name);
  if (remaining.length === 0) {
    removeDayEntry('workout', day);
    return;
  }
  tactileEngine.triggerSelectionBuzz();

  if (day.isToday) {
    const store = useWorkoutStore.getState();
    const kept = store.exercises.filter(
      (exercise) => (exercise.name || exercise.exerciseName || '') !== name,
    );
    if (kept.length !== store.exercises.length) store.setExercises(kept);
  }

  const saved = day.historyByDate[day.dateKey]?.workout;
  if (saved?.hasData) {
    const exercises = (saved.exercises || []).filter((exercise) => exercise.name !== name);
    useTelemetryHistoryStore.getState().updateDayRecord(day.dateKey, 'workout', {
      ...saved,
      exercises,
      tonnageKg: exercises.reduce((sum, lift) => sum + setWorkKg(knownSets(lift)), 0),
      completedSets: exercises.reduce(
        (sum, lift) => sum + (knownSets(lift).length || lift.sets || 0),
        0,
      ),
    });
  }
  forgetPendingArchives(day.dateKey, 'workout', name);
  void purgeArchivedLift(day.dateKey, name);
}

/** Removes one meal (by its position in the day's list) and re-totals the saved macros. */
export function removeDayMeal(
  index: number,
  day: DayTarget,
  food: NutritionDayRecord | undefined,
): void {
  const target = food?.meals?.[index];
  if (!target) return;
  tactileEngine.triggerSelectionBuzz();

  if (day.isToday && target.slot) {
    const slot = target.slot;
    const item = useFuelStore.getState().meals[slot]?.find((meal) => meal.name === target.name);
    if (item) useFuelStore.getState().removeMealItem(slot, item.id);
  }

  const saved = day.historyByDate[day.dateKey]?.nutrition;
  if (!saved?.hasData || !saved.meals?.length) return;
  const savedIndex = saved.meals.findIndex(
    (meal) => meal.name === target.name && meal.slot === target.slot,
  );
  if (savedIndex < 0) return;

  const remainingMeals = saved.meals.filter((_, i) => i !== savedIndex);
  const total = (pick: (meal: (typeof remainingMeals)[number]) => number) =>
    Math.round(remainingMeals.reduce((sum, meal) => sum + (pick(meal) || 0), 0) * 10) / 10;
  useTelemetryHistoryStore.getState().updateDayRecord(day.dateKey, 'nutrition', {
    ...saved,
    meals: remainingMeals,
    calories: Math.round(total((meal) => meal.calories)),
    proteinG: total((meal) => meal.proteinG),
    carbsG: total((meal) => meal.carbsG),
    fatsG: total((meal) => meal.fatsG),
  });
}

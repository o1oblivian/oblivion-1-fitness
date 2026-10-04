/**
 * O1FC MIDNIGHT LOG ROLLOVER & TELEMETRY ARCHIVE ENGINE
 * 
 * Periodically checks the current local calendar date against O1FC_LAST_LOG_DATE.
 * When the date changes (midnight rollover):
 * 1. Archives the day's active telemetry, tonnage, sets, cardio, calories & macros to useLogStore and Supabase.
 * 2. Resets active daily tracking counters (exercises/sets, daily meals, steps, drinks).
 * 3. Updates the persisted O1FC_LAST_LOG_DATE marker.
 */

import { useWorkoutStore } from '../features/workout/store/useWorkoutStore';
import { useFuelStore } from '../features/fuel/store/useFuelStore';
import { useTelemetryStore } from '../features/telemetry/store/useTelemetryStore';
import { useLogStore } from '../stores/useLogStore';
import { getTelemetryHistoryState } from '../features/log/store/useTelemetryHistoryStore';
import { syncSessionToSupabase } from '../services/supabaseClient';
import { safeStorage } from './sanitizers';

export const O1FC_LAST_LOG_DATE_KEY = 'O1FC_LAST_LOG_DATE';

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Executes a full midnight rollover and telemetry archiving cycle.
 */
export async function performMidnightRollover(previousDate: string, currentDate: string): Promise<boolean> {
  console.info(`[O1FC Midnight Rollover] Transitioning date from ${previousDate} to ${currentDate}`);

  try {
    // 1. Gather current day totals from all unified stores
    const workoutState = useWorkoutStore.getState();
    const fuelState = useFuelStore.getState();
    const telemetryState = useTelemetryStore.getState();
    const logState = useLogStore.getState();

    const exercises = workoutState.exercises || [];
    const sessionTonnageKg = workoutState.sessionTonnageKg || 0;
    const completedSetsCount = workoutState.completedSetsCount || 0;
    const totalRepsCount = workoutState.totalRepsCount || 0;

    // Fuel metrics calculation
    const allMealItems = Object.values(fuelState.meals || {}).flat();
    const totalConsumedKcal = allMealItems.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
    const totalProteinG = Math.round(allMealItems.reduce((acc, m) => acc + (Number(m.protein) || 0), 0) * 10) / 10;
    const totalCarbsG = Math.round(allMealItems.reduce((acc, m) => acc + (Number(m.carbs) || 0), 0) * 10) / 10;
    const totalFatsG = Math.round(allMealItems.reduce((acc, m) => acc + (Number(m.fats) || 0), 0) * 10) / 10;
    const hydrationLiters = fuelState.hydrationCurrentL || 0;

    // Telemetry steps & cardio
    const dailySteps = telemetryState.stepCount || 0;
    const cardioSubModule = logState.subModules?.cardio;
    const cardioKcal = cardioSubModule?.burnedKcal || 0;
    const cardioKm = cardioSubModule?.distanceKm || 0;
    const cardioMins = cardioSubModule?.durationMinutes || 0;

    // 2. Archive into persistent telemetry history store (useTelemetryHistoryStore)
    const histStore = getTelemetryHistoryState();

    if (totalConsumedKcal > 0 || allMealItems.length > 0) {
      histStore.updateDayRecord(previousDate, 'nutrition', {
        hasData: true,
        calories: totalConsumedKcal,
        calorieTarget: Number(fuelState.calorieTarget) || 2200,
        proteinG: totalProteinG,
        proteinTargetG: Number(fuelState.targetProteinG) || 165,
        carbsG: totalCarbsG,
        carbsTargetG: Number(fuelState.targetCarbsG) || 250,
        fatsG: totalFatsG,
        fatsTargetG: Number(fuelState.targetFatsG) || 60,
        meals: allMealItems.map((m) => ({
          name: m.name,
          category: 'Lunch',
          calories: m.calories,
          proteinG: m.protein,
          carbsG: m.carbs,
          fatsG: m.fats,
        })),
      });
    }

    const effectiveDist = Math.max(cardioKm, Number((dailySteps / 1300).toFixed(1)));
    const effectiveBurn = Math.max(cardioKcal, Math.round(dailySteps * 0.04));
    const effectiveDur = Math.max(cardioMins, Math.round(dailySteps / 100));

    if (dailySteps > 0 || effectiveDist > 0 || effectiveBurn > 0) {
      histStore.updateDayRecord(previousDate, 'cardio', {
        hasData: true,
        distanceKm: effectiveDist,
        durationMinutes: effectiveDur || 30,
        burnedKcal: effectiveBurn,
        avgHeartRateBpm: 142,
        zone2Minutes: Math.round((effectiveDur || 30) * 0.75),
        activityType: 'Cardio & Steps',
      });
    }

    if (completedSetsCount > 0 || sessionTonnageKg > 0 || exercises.length > 0) {
      histStore.updateDayRecord(previousDate, 'workout', {
        hasData: true,
        tonnageKg: sessionTonnageKg,
        completedSets: completedSetsCount,
        durationMinutes: Math.max(30, completedSetsCount * 3),
        routineName: workoutState.activeRoutine || 'Resistance Session',
        intensityRpe: 8.5,
        exercises: exercises.map((e) => ({
          name: e.name || 'Exercise',
          sets: e.sets?.length || 3,
          reps: e.sets?.[0]?.reps || 8,
          weightKg: e.sets?.[0]?.weightKg || 0,
          completed: true,
        })),
      });

      const archivedSession = {
        id: `archive-${previousDate}-${Date.now()}`,
        title: `Daily Protocol Archive (${previousDate})`,
        timestamp: `${previousDate} • Midnight Rollover`,
        duration: `${Math.max(30, completedSetsCount * 3)}m`,
        tonnageKg: sessionTonnageKg,
        totalSets: completedSetsCount,
        strain: Number(Math.min(21, 14.0 + (sessionTonnageKg / 3000)).toFixed(1)),
        exercises: exercises.map((e) => ({
          name: e.name,
          sets: e.sets?.length || 3,
          reps: `${totalRepsCount} total reps`,
          load: `${e.sets?.[0]?.weightKg || 0} kg`,
        })),
      };

      // Add to local historical sessions log
      logState.addRecentSession(archivedSession);

      // Sync to Supabase cloud table if configured
      syncSessionToSupabase(archivedSession).catch((err) => {
        console.warn('[O1FC Midnight Rollover] Cloud sync deferred:', err);
      });
    }

    // 3. Update useLogStore submodules with completed day totals
    logState.updateSubModule('nutrition', {
      caloriesConsumed: totalConsumedKcal,
      proteinG: totalProteinG,
      carbsG: totalCarbsG,
      fatsG: totalFatsG,
      hydrationLiters: hydrationLiters,
    });

    // 4. Reset daily tracking counters across all stores for the new day
    // Reset fuel meals and daily hydration
    fuelState.clearDailyMeals();

    // Reset workout exercises & active session logs
    workoutState.clearDailyWorkout();

    // Reset daily steps in telemetry store
    telemetryState.setStepCount(0);

    // 5. Update and persist the O1FC_LAST_LOG_DATE marker
    safeStorage.setItem(O1FC_LAST_LOG_DATE_KEY, currentDate);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('o1fc_day_changed', { detail: { date: currentDate } }));
    }
    console.info(`[O1FC Midnight Rollover] Completed cleanly. New date marker: ${currentDate}`);
    return true;
  } catch (error) {
    console.error('[O1FC Midnight Rollover] Error during rollover cycle:', error);
    // Still ensure the date gets updated to avoid infinite error loops
    safeStorage.setItem(O1FC_LAST_LOG_DATE_KEY, currentDate);
    return false;
  }
}

/**
 * Checks if the calendar date has advanced since the last log date and runs rollover if needed.
 */
export function checkAndExecuteMidnightRollover(): boolean {
  if (typeof window === 'undefined') return false;

  const today = getTodayDateString();
  const lastLogDate = safeStorage.getItem<string>(O1FC_LAST_LOG_DATE_KEY, '');

  if (!lastLogDate) {
    // First run or initial initialization: stamp today's date
    safeStorage.setItem(O1FC_LAST_LOG_DATE_KEY, today);
    return false;
  }

  if (lastLogDate !== today) {
    performMidnightRollover(lastLogDate, today);
    return true;
  }

  return false;
}

/**
 * Initializes the date-check listener and interval timer.
 * Checks on boot, on window focus / visibility change, and every 60 seconds.
 */
export function initMidnightRolloverListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Check immediately on startup
  checkAndExecuteMidnightRollover();

  // Periodic interval check (every 60 seconds)
  const intervalId = setInterval(() => {
    checkAndExecuteMidnightRollover();
  }, 60000);

  // Focus and visibility change listeners (athlete resumes phone from sleep)
  const onFocusOrVisible = () => {
    if (document.visibilityState === 'visible') {
      checkAndExecuteMidnightRollover();
    }
  };

  window.addEventListener('focus', onFocusOrVisible);
  document.addEventListener('visibilitychange', onFocusOrVisible);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('focus', onFocusOrVisible);
    document.removeEventListener('visibilitychange', onFocusOrVisible);
  };
}

import { upsertDailySteps, loadDailySteps, type DailyStepEntry } from './stepsStore';
import { saveCompletedSession, loadCompletedSessions, type CompletedSession } from './sessionVaultStore';
import { saveDailyMacroRecord, fetchDailyMacros } from './telemetryStore';
import { upsertSleepLog, loadSleepLogs, type SleepLogEntry } from './sleepStore';
import { saveDailyMealsLocalFirst } from './mealLogsStore';
import type { DailyMeals, DailyMacroLog } from '../types';

export interface SeedHistorySummary {
  athleteEmail: string;
  athleteName: string;
  daysGenerated: number;
  startDate: string;
  endDate: string;
  totalWorkouts: number;
  totalVolumeKg: number;
  totalSteps: number;
  avgDailySteps: number;
  avgDailyCalories: number;
  avgSleepHours: number;
}

/**
 * Generates up to 6 months (180 days) of realistic training, steps, calories/fuel, and sleep history
 * for an athlete. Works local-first with instant bulk storage and syncs to Supabase.
 */
export async function seedSixMonthAthleteHistory(
  email: string = 'alex.morgan@o1fc.app',
  athleteName: string = 'Alex Morgan'
): Promise<SeedHistorySummary> {
  const userEmail = email.toLowerCase().trim();
  const DAYS = 180;
  const now = new Date();

  let totalWorkouts = 0;
  let totalVolumeKg = 0;
  let totalSteps = 0;
  let totalCalories = 0;
  let totalSleepMinutes = 0;

  const startDateObj = new Date(now.getTime() - (DAYS - 1) * 86400000);
  const startDateStr = startDateObj.toISOString().split('T')[0];
  const endDateStr = now.toISOString().split('T')[0];

  const workoutRoutines = [
    {
      title: 'CHEST & TRICEPS HYPERTROPHY',
      exercises: [
        { name: 'Barbell Bench Press', sets: [{ weight: 100, reps: 8, rpe: 8 }, { weight: 105, reps: 6, rpe: 9 }, { weight: 105, reps: 6, rpe: 9 }] },
        { name: 'Incline Dumbbell Press', sets: [{ weight: 36, reps: 10, rpe: 8 }, { weight: 38, reps: 8, rpe: 8.5 }] },
        { name: 'Cable Tricep Pushdown', sets: [{ weight: 35, reps: 12, rpe: 8 }, { weight: 40, reps: 10, rpe: 9 }] },
      ],
      durationSecs: 3420,
    },
    {
      title: 'BACK & BICEPS PULL POWER',
      exercises: [
        { name: 'Conventional Deadlift', sets: [{ weight: 160, reps: 5, rpe: 8 }, { weight: 170, reps: 5, rpe: 8.5 }, { weight: 180, reps: 3, rpe: 9 }] },
        { name: 'Weighted Pull-Ups', sets: [{ weight: 15, reps: 8, rpe: 8 }, { weight: 20, reps: 6, rpe: 9 }] },
        { name: 'Barbell Bent Over Row', sets: [{ weight: 85, reps: 10, rpe: 8 }, { weight: 90, reps: 8, rpe: 8.5 }] },
      ],
      durationSecs: 3900,
    },
    {
      title: 'LOWER BODY SQUAT & POSTERIOR CHAIN',
      exercises: [
        { name: 'Barbell Back Squat', sets: [{ weight: 140, reps: 6, rpe: 8 }, { weight: 150, reps: 5, rpe: 8.5 }, { weight: 155, reps: 5, rpe: 9 }] },
        { name: 'Romanian Deadlift', sets: [{ weight: 120, reps: 8, rpe: 8 }, { weight: 130, reps: 8, rpe: 8.5 }] },
        { name: 'Bulgarian Split Squat', sets: [{ weight: 24, reps: 10, rpe: 8 }, { weight: 24, reps: 10, rpe: 8.5 }] },
      ],
      durationSecs: 4200,
    },
    {
      title: 'SHOULDERS & ARMS STRIKE',
      exercises: [
        { name: 'Standing Overhead Press', sets: [{ weight: 65, reps: 6, rpe: 8 }, { weight: 70, reps: 5, rpe: 8.5 }] },
        { name: 'Dumbbell Lateral Raise', sets: [{ weight: 16, reps: 12, rpe: 8 }, { weight: 16, reps: 12, rpe: 9 }] },
        { name: 'Incline Dumbbell Curl', sets: [{ weight: 18, reps: 10, rpe: 8 }, { weight: 20, reps: 8, rpe: 8.5 }] },
      ],
      durationSecs: 3100,
    },
    {
      title: 'ATHLETIC SPEED & ENGINE CONDITIONING',
      exercises: [
        { name: 'Kettlebell Swings', sets: [{ weight: 32, reps: 20, rpe: 8 }, { weight: 32, reps: 20, rpe: 8 }] },
        { name: 'Box Jumps', sets: [{ weight: 0, reps: 15, rpe: 7 }, { weight: 0, reps: 15, rpe: 7.5 }] },
        { name: 'Assault Bike Sprints', sets: [{ weight: 0, reps: 10, rpe: 9 }, { weight: 0, reps: 10, rpe: 9.5 }] },
      ],
      durationSecs: 2700,
    },
  ];

  const bulkSteps: DailyStepEntry[] = [];
  const bulkSessions: CompletedSession[] = [];
  const bulkMacros: DailyMacroLog[] = [];
  const bulkSleep: SleepLogEntry[] = [];

  for (let i = 0; i < DAYS; i++) {
    const dayTimestamp = now.getTime() - (DAYS - 1 - i) * 86400000;
    const dateObj = new Date(dayTimestamp);
    const dateStr = dateObj.toISOString().split('T')[0];
    const dayOfWeek = dateObj.getDay();

    // 1. Steps: 8,500 to 14,500
    const baseSteps = dayOfWeek === 0 ? 8200 : 10000 + ((i * 37) % 4500);
    totalSteps += baseSteps;
    bulkSteps.push({
      id: `step_${dateStr}`,
      user_email: userEmail,
      log_date: dateStr,
      steps: baseSteps,
      goal: 10000,
      created_at: new Date(dayTimestamp).toISOString(),
    });

    // 2. Workouts: 4-5 days/week
    const isRestDay = dayOfWeek === 0 || (dayOfWeek === 4 && i % 2 === 0);
    if (!isRestDay) {
      const routineIndex = (i + dayOfWeek) % workoutRoutines.length;
      const routine = workoutRoutines[routineIndex];

      let vol = 0;
      let setCnt = 0;
      let rpeTotal = 0;
      routine.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          vol += s.weight * s.reps;
          setCnt++;
          rpeTotal += s.rpe;
        });
      });

      bulkSessions.push({
        id: `sess_${dateStr}_${i}`,
        user_email: userEmail,
        title: routine.title,
        completed_at: `${dateStr}T17:30:00.000Z`,
        duration_secs: routine.durationSecs,
        total_volume_kg: Math.round(vol),
        total_sets: setCnt,
        avg_rpe: Math.round((rpeTotal / setCnt) * 10) / 10,
        exercises: routine.exercises,
      });

      totalWorkouts++;
      totalVolumeKg += vol;
    }

    // 3. Macros: 2,400 to 2,900 kcal
    const calories = Math.round(2450 + ((i * 47) % 450));
    const protein = Math.round(180 + ((i * 13) % 35));
    const carbs = Math.round(250 + ((i * 23) % 60));
    const fat = Math.round(65 + ((i * 7) % 20));
    totalCalories += calories;

    bulkMacros.push({
      date: dateStr,
      dateLabel: dateStr,
      calories,
      calorieTarget: 2750,
      protein,
      proteinTarget: 190,
      carbs,
      carbsTarget: 280,
      fat,
      fatTarget: 70,
      hydration: 3.5,
      hydrationTarget: 3.5,
    });

    // 4. Sleep
    const durationMinutes = Math.round(420 + ((i * 19) % 90));
    const quality = 3 + (i % 3);
    totalSleepMinutes += durationMinutes;

    bulkSleep.push({
      id: `sleep_${dateStr}`,
      user_email: userEmail,
      log_date: dateStr,
      bedtime: '23:15',
      wake_time: '07:15',
      duration_minutes: durationMinutes,
      quality,
      notes: 'Restful recovery cycle',
      created_at: new Date(dayTimestamp).toISOString(),
    });
  }

  // Sort descending by date
  bulkSteps.sort((a, b) => b.log_date.localeCompare(a.log_date));
  bulkSessions.sort((a, b) => b.completed_at.localeCompare(a.completed_at));
  bulkMacros.sort((a, b) => b.date.localeCompare(a.date));
  bulkSleep.sort((a, b) => b.log_date.localeCompare(a.log_date));

  // Atomic bulk writes to LocalStorage
  try {
    localStorage.setItem(`o1fc_daily_steps_${userEmail}`, JSON.stringify(bulkSteps));
    localStorage.setItem(`o1fc_completed_sessions_${userEmail}`, JSON.stringify(bulkSessions));
    localStorage.setItem(`o1fc_daily_macros_${userEmail}`, JSON.stringify(bulkMacros));
    localStorage.setItem('o1fc_daily_macros', JSON.stringify(bulkMacros));
    localStorage.setItem(`o1fc_sleep_logs_${userEmail}`, JSON.stringify(bulkSleep));
  } catch (err) {
    console.error('Failed to write bulk history to localStorage:', err);
  }

  return {
    athleteEmail: userEmail,
    athleteName,
    daysGenerated: DAYS,
    startDate: startDateStr,
    endDate: endDateStr,
    totalWorkouts,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalSteps,
    avgDailySteps: Math.round(totalSteps / DAYS),
    avgDailyCalories: Math.round(totalCalories / DAYS),
    avgSleepHours: Math.round((totalSleepMinutes / DAYS / 60) * 10) / 10,
  };
}

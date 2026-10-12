import { ExerciseItem, ExerciseSet, DailyVolumePoint } from '../../../types';
import { INITIAL_MICROCYCLE_VOLUME } from './workoutStoreTypes';
import {
  calculateSessionTonnage,
  getAthleteWeightKg,
  calculateFatigueScore,
} from '../../../utils/physiologyEngine';
import { buildNextSet } from '../utils/lastLoggedSet';
import { exerciseFromSets, setsFromExercise } from '../../log/liftLedger';
import type { ExerciseEntry, WorkoutDayRecord } from '../../log/store/useTelemetryHistoryStore';

const isLiftEntry = (e: ExerciseItem) => {
  const name = (e.name || '').toLowerCase();
  return !name.startsWith('cardio:') && !name.includes('telemetry');
};

export interface SessionLedger {
  tonnageKg: number;
  completedSets: number;
  totalReps: number;
  exercises: ExerciseEntry[];
}

/** Ticked sets only, so prescribed numbers that were never lifted stay out of the record. */
export const sessionLedger = (exercises: ExerciseItem[]): SessionLedger => {
  const lifts = exercises.filter(isLiftEntry);
  const ticked = lifts.map((e) => ({ ...e, sets: (e.sets || []).filter((s) => s.completed) }));
  const entries = lifts
    .map((e) => exerciseFromSets(e.name || e.exerciseName || 'Exercise', setsFromExercise(e, true), true))
    .filter((entry) => (entry.setLog?.length || 0) > 0);
  const completedSets = entries.reduce((sum, e) => sum + (e.setLog?.length || 0), 0);
  const totalReps = entries.reduce((sum, e) => sum + (e.setLog || []).reduce((r, s) => r + s.reps, 0), 0);
  return {
    tonnageKg: completedSets > 0 ? calculateSessionTonnage(ticked, getAthleteWeightKg(), true) : 0,
    completedSets,
    totalReps,
    exercises: entries,
  };
};

/** Adds a session on top of what the day already holds instead of replacing it. */
export const mergeWorkoutDay = (
  base: Partial<WorkoutDayRecord> | undefined,
  ledger: SessionLedger,
  routineName: string,
): Partial<WorkoutDayRecord> => {
  const baseHas = Boolean(base?.hasData);
  const names = [baseHas ? base?.routineName : '', routineName]
    .map((n) => (n || '').trim())
    .filter((n, i, all) => n && all.indexOf(n) === i);
  return {
    hasData: baseHas || ledger.completedSets > 0,
    tonnageKg: Math.round(((baseHas ? Number(base?.tonnageKg) || 0 : 0) + ledger.tonnageKg) * 10) / 10,
    completedSets: (baseHas ? Number(base?.completedSets) || 0 : 0) + ledger.completedSets,
    durationMinutes: baseHas ? Number(base?.durationMinutes) || 0 : 0,
    routineName: names.join(' + '),
    intensityRpe: baseHas ? Number(base?.intensityRpe) || 0 : 0,
    exercises: [...(baseHas ? base?.exercises || [] : []), ...ledger.exercises],
  };
};

export interface SessionMetrics {
  sessionTonnageKg: number;
  completedSetsCount: number;
  totalRepsCount: number;
  recoveryEnergyScore: number;
  weeklyVolumeData: DailyVolumePoint[];
}

export const computeSessionMetrics = (
  exercises: ExerciseItem[],
  isRestDayActive = false
): SessionMetrics => {
  const athleteWeightKg = getAthleteWeightKg();

  let completedSetsCount = 0;
  let totalRepsCount = 0;

  for (const ex of exercises) {
    for (const s of ex.sets || []) {
      totalRepsCount += s.reps || 0;
      if (s.completed) {
        completedSetsCount += 1;
      }
    }
  }

  // Calculate live tonnage using validated biomechanical formula
  // including bodyweight movements: (userBodyweight * 0.65 + addedWeight) * reps
  const completedTonnage = calculateSessionTonnage(exercises, athleteWeightKg, true);
  const totalPlannedTonnage = calculateSessionTonnage(exercises, athleteWeightKg, false);

  // If athlete has completed sets, track live accumulated tonnage; otherwise planned volume
  const sessionTonnageKg = completedSetsCount > 0 ? completedTonnage : totalPlannedTonnage;

  const volumeTons = sessionTonnageKg / 1000;
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayShort = daysOfWeek[new Date().getDay()] || 'Thu';

  const weeklyVolumeData = INITIAL_MICROCYCLE_VOLUME.map((d) => {
    const isToday = d.day === todayShort;
    if (isToday) {
      return {
        ...d,
        volumeKg: Number(volumeTons.toFixed(1)),
        strain: completedSetsCount > 0 ? Number(Math.min(21, (completedSetsCount * 0.6) + (volumeTons * 0.4)).toFixed(1)) : 0,
        setsCount: completedSetsCount,
        isToday: true,
      };
    }
    return { ...d, isToday: false };
  });

  const recoveryEnergyScore = isRestDayActive
    ? 99
    : calculateFatigueScore(sessionTonnageKg, completedSetsCount, 45 * 8);

  return {
    sessionTonnageKg,
    completedSetsCount,
    totalRepsCount,
    recoveryEnergyScore,
    weeklyVolumeData,
  };
};

export const addSetToExercises = (
  exercises: ExerciseItem[],
  exerciseId: string
): ExerciseItem[] => {
  return exercises.map((ex) => {
    if (ex.id !== exerciseId) return ex;
    const sets = ex.sets || [];
    const lastSet = sets[sets.length - 1];
    const newSetNumber = sets.length + 1;
    const newSet: ExerciseSet = buildNextSet(newSetNumber, lastSet, String(ex.equipment || ''));
    return {
      ...ex,
      sets: [...sets, newSet],
    };
  });
};

export const removeSetFromExercises = (
  exercises: ExerciseItem[],
  exerciseId: string,
  setNumber: number
): ExerciseItem[] => {
  return exercises
    .map((ex) => {
      if (ex.id !== exerciseId) return ex;
      const filtered = (ex.sets || []).filter(
        (s) => s.setNumber !== setNumber && Number(s.setNumber) !== Number(setNumber)
      );
      return {
        ...ex,
        sets: filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 })),
      };
    })
    .filter((ex) => ex.sets.length > 0);
};

export const toggleSetInExercises = (
  exercises: ExerciseItem[],
  exerciseId: string,
  setNumber: number,
  willComplete: boolean
): ExerciseItem[] => {
  return exercises.map((ex) => {
    if (ex.id !== exerciseId) return ex;
    return {
      ...ex,
      sets: (ex.sets || []).map((s) =>
        s.setNumber === setNumber || Number(s.setNumber) === Number(setNumber)
          ? { ...s, completed: willComplete }
          : s
      ),
    };
  });
};

export const updateSetInExercises = (
  exercises: ExerciseItem[],
  exerciseId: string,
  setNumber: number,
  updates: Partial<ExerciseSet>
): ExerciseItem[] => {
  // Normalize weight and weightKg
  const normalizedUpdates = { ...updates };
  if ('weightKg' in normalizedUpdates && normalizedUpdates.weightKg !== undefined) {
    normalizedUpdates.weight = normalizedUpdates.weightKg;
  } else if ('weight' in normalizedUpdates && normalizedUpdates.weight !== undefined) {
    normalizedUpdates.weightKg = normalizedUpdates.weight;
  }

  return exercises.map((ex) => {
    if (ex.id !== exerciseId) return ex;
    return {
      ...ex,
      sets: (ex.sets || []).map((s) =>
        s.setNumber === setNumber || Number(s.setNumber) === Number(setNumber)
          ? { ...s, ...normalizedUpdates }
          : s
      ),
    };
  });
};

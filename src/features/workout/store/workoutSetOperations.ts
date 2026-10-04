import { ExerciseItem, ExerciseSet, DailyVolumePoint } from '../../../types';
import { INITIAL_MICROCYCLE_VOLUME } from './workoutStoreTypes';
import {
  calculateSessionTonnage,
  getAthleteWeightKg,
  calculateFatigueScore,
} from '../../../utils/physiologyEngine';

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
    for (const s of ex.sets) {
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
    const lastSet = ex.sets[ex.sets.length - 1];
    const newSetNumber = ex.sets.length + 1;
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}-${newSetNumber}-${Math.random().toString(36).slice(2, 6)}`,
      setNumber: newSetNumber,
      weightKg: lastSet ? (lastSet.weightKg ?? lastSet.weight ?? 60) : 60,
      weight: lastSet ? (lastSet.weightKg ?? lastSet.weight ?? 60) : 60,
      reps: lastSet ? (lastSet.reps ?? 10) : 10,
      rpe: lastSet ? (lastSet.rpe ?? 8.0) : 8.0,
      completed: false,
    };
    return {
      ...ex,
      sets: [...ex.sets, newSet],
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
      const filtered = ex.sets.filter(
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
      sets: ex.sets.map((s) =>
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
      sets: ex.sets.map((s) =>
        s.setNumber === setNumber || Number(s.setNumber) === Number(setNumber)
          ? { ...s, ...normalizedUpdates }
          : s
      ),
    };
  });
};

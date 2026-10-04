import { ExerciseItem } from '../../../types';
import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';
import { ExerciseDefinition } from '../../../types/workout';
import {
  getAthleteWeightKg,
  calculateCalorieBurn,
  EnergyCheckIn,
} from '../../../utils/physiologyEngine';
import { useUserStore } from '../../../stores/useUserStore';

export type EnergyLevel = EnergyCheckIn;
export type TrainingGoal = 'burn' | 'muscle' | 'reset' | 'athletic';

/**
 * Calculates dynamic target load based on movement pattern, athlete profile, and energy level.
 */
export const calculateDynamicLoad = (
  pattern: string,
  equipment: string,
  athleteWeightKg: number,
  energyLevel: EnergyLevel,
  calibrationScore: number = 75
): number => {
  const isElite = calibrationScore >= 80;
  const energyMultiplier = energyLevel === 'PRIME' ? 1.1 : energyLevel === 'LOW' ? 0.85 : 1.0;

  if (equipment === 'bodyweight' || equipment === 'mat' || equipment === 'erg' || equipment === 'turf') {
    return 0;
  }

  let baseRatio = 0.75;
  switch (pattern) {
    case 'squat':
      baseRatio = isElite ? 1.25 : 1.0;
      break;
    case 'push':
      baseRatio = isElite ? 1.0 : 0.75;
      break;
    case 'hinge':
      baseRatio = isElite ? 1.3 : 1.0;
      break;
    case 'pull':
      baseRatio = isElite ? 0.9 : 0.7;
      break;
    case 'carry':
      baseRatio = isElite ? 0.85 : 0.65;
      break;
    case 'lunge':
      baseRatio = isElite ? 0.6 : 0.45;
      break;
    default:
      baseRatio = 0.5;
  }

  const rawLoad = athleteWeightKg * baseRatio * energyMultiplier;
  // Round to nearest standard 2.5kg gym increment
  return Math.max(10, Math.round(rawLoad / 2.5) * 2.5);
};

/**
 * Helper to match movement focus against primary/secondary muscles or movement pattern
 */
const matchesMovementFocus = (ex: ExerciseDefinition, focus: string): boolean => {
  const f = focus.toLowerCase();
  const primary = (ex.primaryMuscleGroup || '').toLowerCase();
  const secondary = (ex.secondaryMuscles || []).map((m) => m.toLowerCase());
  const pattern = (ex.movementPattern || '').toLowerCase();
  const name = ex.name.toLowerCase();

  if (f.includes('upper')) {
    return (
      ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'upper chest', 'lats'].some((m) =>
        primary.includes(m) || secondary.some((s) => s.includes(m))
      ) || ['push', 'pull'].includes(pattern)
    );
  }

  if (f.includes('lower')) {
    return (
      ['quads', 'hamstrings', 'glutes', 'calves', 'legs', 'adductors'].some((m) =>
        primary.includes(m) || secondary.some((s) => s.includes(m))
      ) || ['squat', 'hinge', 'lunge'].includes(pattern)
    );
  }

  if (f.includes('push')) {
    return (
      pattern === 'push' ||
      ['chest', 'shoulder', 'deltoid', 'tricep', 'press'].some(
        (m) => primary.includes(m) || name.includes(m)
      )
    );
  }

  if (f.includes('pull')) {
    return (
      pattern === 'pull' ||
      ['back', 'lat', 'bicep', 'row', 'chin', 'pull'].some(
        (m) => primary.includes(m) || name.includes(m)
      )
    );
  }

  if (f.includes('legs') || f.includes('calves')) {
    return (
      ['quads', 'hamstrings', 'calves', 'adductors'].some((m) =>
        primary.includes(m) || secondary.some((s) => s.includes(m))
      ) || ['squat', 'hinge', 'lunge'].includes(pattern)
    );
  }

  if (f.includes('arms') || f.includes('shoulders')) {
    return (
      ['biceps', 'triceps', 'shoulders', 'deltoids'].some((m) =>
        primary.includes(m) || secondary.some((s) => s.includes(m))
      ) || name.includes('curl') || name.includes('tricep') || name.includes('lateral raise')
    );
  }

  if (f.includes('glute')) {
    return (
      primary.includes('glute') ||
      secondary.some((s) => s.includes('glute')) ||
      name.includes('hip thrust') ||
      name.includes('rdl') ||
      name.includes('deadlift')
    );
  }

  return true;
};

/**
 * Queries real exercises from EXERCISE_DATABASE matching goal mode and movement focus.
 */
export const queryExercisesForGoal = (
  goal: TrainingGoal,
  movementFocus?: string
): ExerciseDefinition[] => {
  let pool = EXERCISE_DATABASE;

  if (goal === 'reset') {
    pool = pool.filter(
      (e) =>
        e.discipline === 'recovery' ||
        e.movementPattern === 'mobility' ||
        e.category?.toLowerCase().includes('mobility') ||
        e.category?.toLowerCase().includes('recovery')
    );
    if (pool.length === 0) {
      pool = EXERCISE_DATABASE.filter((e) => e.discipline === 'recovery');
    }
  } else if (goal === 'burn') {
    pool = pool.filter(
      (e) =>
        e.discipline === 'sports' ||
        (e.baseMET && e.baseMET >= 7.0) ||
        (e.discipline === 'lift' && e.mechanic === 'compound')
    );
  } else if (goal === 'athletic') {
    pool = pool.filter(
      (e) =>
        e.discipline === 'sports' ||
        e.tier?.includes('Power') ||
        e.tier?.includes('Engine') ||
        e.tier?.includes('Loaded Carry') ||
        e.tier?.includes('Olympic') ||
        e.movementPattern === 'carry'
    );
  } else {
    // 'muscle' — lifts
    pool = pool.filter((e) => e.discipline === 'lift');
  }

  // Filter by movement focus if specified
  if (movementFocus && movementFocus !== 'Total Power') {
    const focusFiltered = pool.filter((ex) => matchesMovementFocus(ex, movementFocus));
    if (focusFiltered.length >= 3) {
      return focusFiltered;
    }
  }

  return pool;
};

/**
 * Computes estimated calories dynamically for a given duration, energy check-in, and goal mode.
 */
export const computePrescriptionCalories = (
  goal: TrainingGoal,
  durationMinutes: number,
  energyLevel: EnergyLevel,
  athleteWeightKg: number = getAthleteWeightKg(),
  movementFocus?: string
): number => {
  const pool = queryExercisesForGoal(goal, movementFocus);
  if (pool.length === 0 || durationMinutes <= 0) return 0;

  // Selected sample matching the goal
  const sampleCount = Math.min(5, pool.length);
  const sample = pool.slice(0, sampleCount);
  const perExerciseMinutes = durationMinutes / sample.length;

  const totalKcal = sample.reduce((acc, ex) => {
    return acc + calculateCalorieBurn(ex.baseMET || 6.0, athleteWeightKg, perExerciseMinutes, energyLevel);
  }, 0);

  return Math.round(totalKcal);
};

/**
 * Generates an autoregulated training prescription dynamically from EXERCISE_DATABASE
 * balancing movement patterns and computing target loads.
 */
export const generateIntelPrescription = (
  goal: TrainingGoal,
  energyLevel: EnergyLevel = 'STEADY',
  durationMinutes: number = 45,
  movementFocus: string = 'Upper Body'
): ExerciseItem[] => {
  const athleteWeightKg = getAthleteWeightKg();
  const user = useUserStore.getState?.();
  const calibration = user?.calibrationProgress || 78;

  const targetRpe = energyLevel === 'PRIME' ? 9.0 : energyLevel === 'LOW' ? 6.5 : 8.0;
  const setsCount = durationMinutes >= 60 ? 4 : durationMinutes >= 30 ? 3 : 2;

  // Determine target exercise count based on duration
  const targetExerciseCount =
    durationMinutes <= 10 ? 2 : durationMinutes <= 20 ? 3 : durationMinutes <= 30 ? 4 : durationMinutes <= 45 ? 5 : 6;

  // Query genuine exercise candidates from live EXERCISE_DATABASE
  const candidatePool = queryExercisesForGoal(goal, movementFocus);

  // If pool is somehow smaller than needed, fallback to general pool
  const effectivePool = candidatePool.length >= targetExerciseCount ? candidatePool : EXERCISE_DATABASE;

  // Pick unique balanced exercises
  const selectedDefs: ExerciseDefinition[] = [];
  const seenPatterns = new Set<string>();

  for (const ex of effectivePool) {
    if (selectedDefs.length >= targetExerciseCount) break;
    const pat = ex.movementPattern || 'general';
    if (!seenPatterns.has(pat) || selectedDefs.length >= 3) {
      selectedDefs.push(ex);
      seenPatterns.add(pat);
    }
  }

  // Fill up if still under target count
  for (const ex of effectivePool) {
    if (selectedDefs.length >= targetExerciseCount) break;
    if (!selectedDefs.some((s) => s.id === ex.id)) {
      selectedDefs.push(ex);
    }
  }

  // Map to fully hydrated ExerciseItems with sets, calculated weights, and RPE
  return selectedDefs.map((def, idx) => {
    const computedLoad = calculateDynamicLoad(
      def.movementPattern || 'squat',
      def.equipment,
      athleteWeightKg,
      energyLevel,
      calibration
    );

    let reps = def.defaultReps || 10;
    if (goal === 'burn') reps = Math.max(reps, 12);
    if (goal === 'athletic') reps = Math.min(reps, 6);
    if (goal === 'reset') reps = 10;

    return {
      id: `intel-presc-${def.id}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      name: def.name,
      targetMuscle: def.primaryMuscleGroup || 'Target Focus',
      restSecs: def.defaultRestSeconds || (durationMinutes <= 20 ? 60 : 90),
      equipment: def.equipment,
      tier: def.tier,
      baseMET: def.baseMET,
      mechanic: def.mechanic,
      movementPattern: def.movementPattern as any,
      sets: Array.from({ length: setsCount }, (_, s) => ({
        id: `set-${Date.now()}-${s + 1}-${Math.random().toString(36).slice(2, 6)}`,
        setNumber: s + 1,
        weightKg: def.equipment === 'bodyweight' || def.equipment === 'mat' || def.equipment === 'erg' ? 0 : computedLoad,
        reps,
        rpe: Number((targetRpe + (s > 1 ? 0.5 : 0)).toFixed(1)),
        completed: false,
      })),
    };
  });
};

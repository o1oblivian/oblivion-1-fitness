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

const muscleHaystack = (ex: ExerciseDefinition): string =>
  [
    ex.primaryMuscleGroup,
    ex.primaryMuscle,
    ex.category,
    ex.name,
    ex.subLabel,
    ...(ex.secondaryMuscles || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

/**
 * Helper to match movement focus against primary/secondary muscles or movement pattern
 */
const matchesMovementFocus = (ex: ExerciseDefinition, focus: string): boolean => {
  const f = focus.toLowerCase();
  if (!f || f.includes('full body') || f.includes('total power')) return true;

  const primary = (ex.primaryMuscleGroup || ex.primaryMuscle || '').toLowerCase();
  const secondary = (ex.secondaryMuscles || []).map((m) => m.toLowerCase());
  const pattern = (ex.movementPattern || '').toLowerCase();
  const hay = muscleHaystack(ex);
  const hit = (...keys: string[]) => keys.some((k) => hay.includes(k));

  if (f.includes('chest')) return hit('chest', 'pec', 'bench', 'fly');
  if (f.includes('bicep')) return hit('bicep', 'curl');
  if (f.includes('tricep')) return hit('tricep', 'pushdown', 'skull', 'extension');
  if (f.includes('forearm') || f.includes('grip')) return hit('forearm', 'grip', 'wrist', 'hang', 'pinch');
  if (f.includes('trap')) return hit('trap', 'face pull', 'shrug', 'rear delt');
  if (f.includes('hamstring')) return hit('hamstring', 'rdl', 'deadlift', 'nordic');
  if (f.includes('quad')) return hit('quad', 'squat', 'lunge', 'leg press', 'extension');
  if (f.includes('hip') || f.includes('adductor')) return hit('hip', 'adductor', 'abduct', 'copenhagen', 'sumo');
  if (f.includes('glute')) return hit('glute', 'hip thrust', 'bridge', 'kickback');
  if ((f.includes('calf') || f.includes('calves')) && !f.includes('legs')) {
    return hit('calf', 'calves', 'tibialis', 'soleus');
  }
  if (f.includes('abs') || f.includes('core')) return hit('abs', 'core', 'oblique', 'plank', 'raise');
  if (f.includes('olympic')) return hit('olympic', 'snatch', 'clean', 'jerk', 'hang');
  if (f.includes('back') || f.includes('lat')) return hit('back', 'lat', 'row', 'pull', 'chin');
  if (f.includes('shoulder') || f.includes('delt')) {
    return hit('shoulder', 'delt', 'overhead', 'lateral raise', 'press');
  }

  if (f.includes('push')) {
    return pattern === 'push' || hit('chest', 'shoulder', 'deltoid', 'tricep', 'press');
  }
  if (f.includes('pull')) {
    return pattern === 'pull' || hit('back', 'lat', 'bicep', 'row', 'chin', 'pull');
  }
  if (f.includes('upper')) {
    return (
      ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'lats', 'traps'].some(
        (m) => primary.includes(m) || secondary.some((s) => s.includes(m)) || hay.includes(m)
      ) || ['push', 'pull'].includes(pattern)
    );
  }
  if (f.includes('lower') || f.includes('legs')) {
    return (
      ['quads', 'hamstrings', 'glutes', 'calves', 'legs', 'adductors', 'hips'].some(
        (m) => primary.includes(m) || secondary.some((s) => s.includes(m)) || hay.includes(m)
      ) || ['squat', 'hinge', 'lunge'].includes(pattern)
    );
  }
  if (f.includes('arms')) {
    return hit('bicep', 'tricep', 'curl', 'shoulder', 'delt', 'forearm');
  }

  return hit(...f.split(/[^a-z]+/).filter((t) => t.length > 2));
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
  movementFocus: string = 'Full Body'
): ExerciseItem[] => {
  const athleteWeightKg = getAthleteWeightKg();
  const user = useUserStore.getState?.();
  const calibration = user?.calibrationProgress || 78;

  const targetRpe = energyLevel === 'PRIME' ? 9.0 : energyLevel === 'LOW' ? 6.5 : 8.0;
  const setsCount =
    durationMinutes >= 75 ? 5 : durationMinutes >= 60 ? 4 : durationMinutes >= 30 ? 3 : 2;

  const targetExerciseCount =
    durationMinutes <= 10
      ? 2
      : durationMinutes <= 15
        ? 3
        : durationMinutes <= 20
          ? 3
          : durationMinutes <= 30
            ? 4
            : durationMinutes <= 45
              ? 5
              : durationMinutes <= 60
                ? 6
                : durationMinutes <= 75
                  ? 7
                  : 8;

  const candidatePool = queryExercisesForGoal(goal, movementFocus);
  const basePool = candidatePool.length >= targetExerciseCount ? candidatePool : EXERCISE_DATABASE;
  const rotateBy = Date.now() % Math.max(1, basePool.length);
  const effectivePool = [...basePool.slice(rotateBy), ...basePool.slice(0, rotateBy)];

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

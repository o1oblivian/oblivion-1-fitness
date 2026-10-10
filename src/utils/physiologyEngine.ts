import { useUserStore } from '../stores/useUserStore';
import { ExerciseItem } from '../types/workout';

/**
 * SPORTS SCIENCE & PHYSIOLOGY ENGINE (O1FC)
 * Built on validated exercise physiology standards (Compendium of Physical Activities,
 * Borg CR10 Scale, and biomechanical work/tonnage equations).
 */

export type EnergyCheckIn = 'LOW' | 'STEADY' | 'PRIME';

/**
 * Energy check-in intensity multipliers on Base MET
 * LOW: 0.85
 * STEADY: 1.00
 * PRIME: 1.20
 */
export const ENERGY_INTENSITY_MULTIPLIERS: Record<EnergyCheckIn, number> = {
  LOW: 0.85,
  STEADY: 1.0,
  PRIME: 1.2,
};

/**
 * Retrieves the current logged athlete weight from user store.
 * Strictly falls back to 75kg only if unlogged.
 */
export const getAthleteWeightKg = (): number => {
  try {
    const userState = useUserStore.getState?.();
    if (userState && typeof userState.weightKg === 'number' && userState.weightKg > 30) {
      return userState.weightKg;
    }
  } catch {
    // Fallback if accessed outside reactive lifecycle
  }
  return 75;
};

/**
 * 1. Dynamic Calorie Expenditure (Compendium of Physical Activities Formula)
 * formula: Calories = (MET * 3.5 * weightKg / 200) * durationMinutes
 *
 * @param baseMET Base Metabolic Equivalent of Task
 * @param weightKg Athlete weight in kilograms (falls back to profile or 75kg)
 * @param durationMinutes Duration of movement or exercise block in minutes
 * @param energyLevel Energy check-in intensity adjustment ('LOW' | 'STEADY' | 'PRIME')
 */
export const calculateCalorieBurn = (
  baseMET: number,
  weightKg: number = getAthleteWeightKg(),
  durationMinutes: number,
  energyLevel: EnergyCheckIn = 'STEADY'
): number => {
  if (baseMET <= 0 || durationMinutes <= 0) return 0;
  const safeWeight = weightKg > 30 ? weightKg : 75;
  const multiplier = ENERGY_INTENSITY_MULTIPLIERS[energyLevel] || 1.0;
  const adjustedMET = baseMET * multiplier;
  
  // Standard Compendium formula: (MET * 3.5 * weightKg / 200) * durationMinutes
  const kcal = (adjustedMET * 3.5 * safeWeight / 200) * durationMinutes;
  return Math.round(kcal);
};

/**
 * Checks if an exercise item or definition represents a bodyweight movement.
 */
export const isBodyweightMovement = (
  item: { equipment?: string; name?: string; targetMuscle?: string }
): boolean => {
  const eq = (item.equipment || '').toLowerCase();
  const nm = (item.name || '').toLowerCase();
  if (eq === 'bodyweight' || eq === 'calisthenics') return true;
  if (
    nm.includes('pull-up') ||
    nm.includes('chin-up') ||
    nm.includes('push-up') ||
    nm.includes('dip') ||
    nm.includes('muscle-up') ||
    nm.includes('burpee') ||
    nm.includes('handstand') ||
    nm.includes('plank')
  ) {
    return true;
  }
  return false;
};

/**
 * 2. Session Volume & Tonnage
 * formula: Total Tonnage = SUM(sets * reps * weightKg)
 * For bodyweight movements: (userBodyweight * 0.65 + addedWeight) * reps
 *
 * @param exercises List of exercise items
 * @param athleteWeightKg Athlete bodyweight in kg
 * @param completedOnly If true, only completed sets are counted; if false, all scheduled sets
 */
export const calculateSessionTonnage = (
  exercises: ExerciseItem[],
  athleteWeightKg: number = getAthleteWeightKg(),
  completedOnly: boolean = false
): number => {
  let totalTonnage = 0;
  const safeWeight = athleteWeightKg > 30 ? athleteWeightKg : 75;

  for (const ex of exercises) {
    const isBW = isBodyweightMovement(ex);
    for (const set of ex.sets) {
      if (!completedOnly || set.completed) {
        const reps = Number(set.reps) || 0;
        const addedWeight = Number(set.weightKg) || 0;
        const effectiveWeightPerRep = isBW ? safeWeight * 0.65 + addedWeight : addedWeight;
        totalTonnage += reps * effectiveWeightPerRep;
      }
    }
  }

  return Math.round(totalTonnage);
};

/**
 * Calculates tonnage for an individual exercise set.
 */
export const calculateSetTonnage = (
  weightKg: number,
  reps: number,
  isBodyweight: boolean = false,
  athleteWeightKg: number = getAthleteWeightKg()
): number => {
  const safeWeight = athleteWeightKg > 30 ? athleteWeightKg : 75;
  const load = isBodyweight ? safeWeight * 0.65 + weightKg : weightKg;
  return Math.round(load * reps);
};

/**
 * 3. Session Strain / Training Load
 * formula: Training Load (TL) = Duration in Minutes * Session RPE (Borg CR10 Scale)
 *
 * @param durationMinutes Duration of training in minutes
 * @param sessionRpe Borg CR10 Scale (1 - 10)
 */
export const calculateTrainingLoad = (
  durationMinutes: number,
  sessionRpe: number = 7.5
): number => {
  if (durationMinutes <= 0) return 0;
  const clampedRpe = Math.max(1, Math.min(10, sessionRpe));
  return Math.round(durationMinutes * clampedRpe);
};

/**
 * Dynamic Session Calorie Estimation from Exercise Definitions
 * Computes caloric burn by dividing session duration among exercises based on their baseMET and energy check-in.
 */
export const estimateSessionCalorieBurn = (
  exercises: { name: string; baseMET?: number }[],
  durationMinutes: number,
  energyLevel: EnergyCheckIn = 'STEADY',
  athleteWeightKg: number = getAthleteWeightKg()
): number => {
  if (exercises.length === 0 || durationMinutes <= 0) return 0;
  const perExerciseMinutes = durationMinutes / exercises.length;

  let totalCalories = 0;
  for (const ex of exercises) {
    // Look for baseMET or infer from type/discipline
    let met = ex.baseMET;
    if (!met) {
      const nm = ex.name.toLowerCase();
      if (nm.includes('squat') || nm.includes('deadlift') || nm.includes('clean')) met = 8.0;
      else if (nm.includes('bench') || nm.includes('row') || nm.includes('press')) met = 6.0;
      else if (nm.includes('sprint') || nm.includes('skierg') || nm.includes('sled')) met = 11.5;
      else if (nm.includes('mobility') || nm.includes('stretch') || nm.includes('flow')) met = 2.5;
      else met = 5.5;
    }

    totalCalories += calculateCalorieBurn(met, athleteWeightKg, perExerciseMinutes, energyLevel);
  }

  return Math.round(totalCalories);
};

/**
 * Calculate dynamic recovery fatigue score
 */
export const calculateFatigueScore = (
  tonnageKg: number,
  completedSets: number,
  trainingLoad: number
): number => {
  const baseRecovery = 100;
  const tonnageFatigue = tonnageKg / 300;
  const setFatigue = completedSets * 0.5;
  const loadFatigue = trainingLoad * 0.05;
  const totalFatigue = tonnageFatigue + setFatigue + loadFatigue;
  return Math.max(45, Math.min(100, Math.round(baseRecovery - totalFatigue)));
};

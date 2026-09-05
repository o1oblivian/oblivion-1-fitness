import { DailyMeals } from '../types';

export interface DailyCalorieLog {
  date: string; // YYYY-MM-DD
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface AdaptiveTDEEResult {
  calculatedTDEE: number;
  staticBMR: number;
  avgIntake: number;
  weightDeltaKg: number;
  daysAnalyzed: number;
  adaptationRatio: number; // e.g., 0.94 (-6% metabolic adaptation)
  status: 'optimal' | 'adapted_slow' | 'hyper_responsive' | 'calibrating';
  recommendedIntake: {
    maintenance: number;
    surplus: number;
    cut: number;
    macros: {
      proteinGrams: number;
      fatGrams: number;
      carbGrams: number;
    };
  };
}

const TDEE_STORAGE_KEY = 'o1fc_adaptive_tdee_profile_v1';
const WEIGHT_STORAGE_KEY = 'o1fc_athlete_weight_log_v1';

export function getStoredWeightHistory(): WeightEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WEIGHT_STORAGE_KEY);
    if (!raw) {
      // Default initial trend for demo athlete
      const now = new Date();
      const demo: WeightEntry[] = [
        { date: new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0], weightKg: 80.8 },
        { date: new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0], weightKg: 80.3 },
        { date: new Date(now.getTime() - 1 * 86400000).toISOString().split('T')[0], weightKg: 79.9 },
      ];
      localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(demo));
      return demo;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordAthleteWeight(weightKg: number, dateStr?: string): WeightEntry[] {
  const date = dateStr || new Date().toISOString().split('T')[0];
  const list = getStoredWeightHistory().filter((w) => w.date !== date);
  const updated = [...list, { date, weightKg }].sort((a, b) => a.date.localeCompare(b.date));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

/**
 * Calculates adaptive metabolic expenditure based on intake & mass trend.
 */
export function calculateAdaptiveTDEE(
  calorieLogs: DailyCalorieLog[],
  weights: WeightEntry[] = getStoredWeightHistory(),
  athleteWeightKg: number = 80,
  athleteHeightCm: number = 180,
  athleteAge: number = 28
): AdaptiveTDEEResult {
  // Static Mifflin-St Jeor formula baseline
  const staticBMR = Math.round(10 * athleteWeightKg + 6.25 * athleteHeightCm - 5 * athleteAge + 5);
  const baselineTDEE = Math.round(staticBMR * 1.55); // Moderate athletic activity

  if (!calorieLogs || calorieLogs.length < 3 || weights.length < 2) {
    const maintenance = baselineTDEE;
    return {
      calculatedTDEE: baselineTDEE,
      staticBMR,
      avgIntake: 2600,
      weightDeltaKg: -0.3,
      daysAnalyzed: calorieLogs.length || 7,
      adaptationRatio: 1.0,
      status: 'calibrating',
      recommendedIntake: {
        maintenance,
        surplus: maintenance + 300,
        cut: maintenance - 400,
        macros: {
          proteinGrams: Math.round(athleteWeightKg * 2.2), // 2.2g/kg
          fatGrams: Math.round((maintenance * 0.25) / 9),
          carbGrams: Math.round((maintenance - (athleteWeightKg * 2.2 * 4 + ((maintenance * 0.25) / 9) * 9)) / 4),
        },
      },
    };
  }

  // Calculate average intake
  const totalCals = calorieLogs.reduce((acc, c) => acc + c.calories, 0);
  const avgIntake = Math.round(totalCals / calorieLogs.length);

  // Calculate weight change
  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const earliestWeight = sortedWeights[0].weightKg;
  const latestWeight = sortedWeights[sortedWeights.length - 1].weightKg;
  const weightDeltaKg = Number((latestWeight - earliestWeight).toFixed(2));

  // Days between first and last weigh-in
  const d1 = new Date(sortedWeights[0].date).getTime();
  const d2 = new Date(sortedWeights[sortedWeights.length - 1].date).getTime();
  const daysDiff = Math.max(1, Math.round((d2 - d1) / 86400000));

  // 1 kg human tissue ~ 7700 kcal
  const totalEnergyImbalance = weightDeltaKg * 7700;
  const dailyEnergyImbalance = totalEnergyImbalance / daysDiff;

  // Real TDEE = intake - daily storage
  let calculatedTDEE = Math.round(avgIntake - dailyEnergyImbalance);
  // Bounds check (prevent anomalies)
  calculatedTDEE = Math.max(1600, Math.min(4800, calculatedTDEE));

  const adaptationRatio = Number((calculatedTDEE / baselineTDEE).toFixed(2));
  let status: 'optimal' | 'adapted_slow' | 'hyper_responsive' | 'calibrating' = 'optimal';
  if (adaptationRatio < 0.92) {
    status = 'adapted_slow';
  } else if (adaptationRatio > 1.08) {
    status = 'hyper_responsive';
  }

  const targetProtein = Math.round(athleteWeightKg * 2.2);
  const targetFats = Math.round((calculatedTDEE * 0.25) / 9);
  const targetCarbs = Math.max(100, Math.round((calculatedTDEE - (targetProtein * 4 + targetFats * 9)) / 4));

  return {
    calculatedTDEE,
    staticBMR,
    avgIntake,
    weightDeltaKg,
    daysAnalyzed: daysDiff,
    adaptationRatio,
    status,
    recommendedIntake: {
      maintenance: calculatedTDEE,
      surplus: calculatedTDEE + 275,
      cut: calculatedTDEE - 450,
      macros: {
        proteinGrams: targetProtein,
        fatGrams: targetFats,
        carbGrams: targetCarbs,
      },
    },
  };
}

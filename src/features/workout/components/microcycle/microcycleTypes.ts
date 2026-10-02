export interface MuscleGroupStrain {
  name: string;
  pct: number;
  color: string;
}

export interface DayStrainDetail {
  day: string;
  full: string;
  title: string;
  split: string;
  volume: number; // in kg
  sets: number;
  targetVol: number;
  targetSets: number;
  rpeAverage: number;
  strainScore: number;
  stimulus: 'Mechanical Tension' | 'Hypertrophy Overload' | 'Active Aerobic' | 'Metabolic Stress' | 'Neural Power' | 'Restoration';
  accentHex: string;
  anatomy: MuscleGroupStrain[];
}

export const EMPTY_MICROCYCLE_DAYS: DayStrainDetail[] = [
  { day: 'Mon', full: 'Monday', title: 'Upper Push & Delts', split: 'PUSH', volume: 6400, sets: 18, targetVol: 7500, targetSets: 18, rpeAverage: 8.5, strainScore: 7.8, stimulus: 'Mechanical Tension', accentHex: '#dc2626', anatomy: [{ name: 'Chest', pct: 40, color: '#dc2626' }, { name: 'Triceps', pct: 30, color: '#f59e0b' }, { name: 'Delts', pct: 30, color: '#ea580c' }] },
  { day: 'Tue', full: 'Tuesday', title: 'Upper Pull & Lats', split: 'PULL', volume: 7200, sets: 18, targetVol: 7500, targetSets: 18, rpeAverage: 8.5, strainScore: 8.2, stimulus: 'Mechanical Tension', accentHex: '#d97706', anatomy: [{ name: 'Lats', pct: 45, color: '#b45309' }, { name: 'Rhomboids', pct: 30, color: '#d97706' }, { name: 'Biceps', pct: 25, color: '#f59e0b' }] },
  { day: 'Wed', full: 'Wednesday', title: 'Quads & Lower Overload', split: 'LEGS', volume: 9100, sets: 20, targetVol: 7500, targetSets: 20, rpeAverage: 9.5, strainScore: 9.5, stimulus: 'Hypertrophy Overload', accentHex: '#e11d48', anatomy: [{ name: 'Quads', pct: 40, color: '#991b1b' }, { name: 'Glutes', pct: 30, color: '#ef4444' }, { name: 'Core', pct: 30, color: '#fca5a5' }] },
  { day: 'Thu', full: 'Thursday', title: 'Active Aerobic Engine', split: 'CARDIO', volume: 2200, sets: 8, targetVol: 7500, targetSets: 8, rpeAverage: 6.0, strainScore: 4.2, stimulus: 'Active Aerobic', accentHex: '#0284c7', anatomy: [{ name: 'Cardio Engine', pct: 100, color: '#0284c7' }] },
  { day: 'Fri', full: 'Friday', title: 'Upper Hypertrophy', split: 'HYPERTROPHY', volume: 5800, sets: 16, targetVol: 7500, targetSets: 16, rpeAverage: 8.0, strainScore: 7.1, stimulus: 'Metabolic Stress', accentHex: '#ea580c', anatomy: [{ name: 'Upper Body', pct: 50, color: '#ea580c' }, { name: 'Arms', pct: 50, color: '#fb923c' }] },
  { day: 'Sat', full: 'Saturday', title: 'Posterior & Hamstrings', split: 'POSTERIOR', volume: 6600, sets: 18, targetVol: 7500, targetSets: 18, rpeAverage: 8.5, strainScore: 8.0, stimulus: 'Hypertrophy Overload', accentHex: '#10b981', anatomy: [{ name: 'Hamstrings', pct: 50, color: '#059669' }, { name: 'Posterior', pct: 50, color: '#10b981' }] },
  { day: 'Sun', full: 'Sunday', title: 'Active Restoration', split: 'REST', volume: 800, sets: 4, targetVol: 7500, targetSets: 4, rpeAverage: 4.5, strainScore: 2.5, stimulus: 'Restoration', accentHex: '#0ea5e9', anatomy: [{ name: 'Mobility', pct: 100, color: '#0ea5e9' }] },
];

export const getLocalSystemDayIdx = (): number => {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

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
  { day: 'Mon', full: 'Monday', title: 'Rest & Prep', split: 'REST', volume: 0, sets: 0, targetVol: 0, targetSets: 0, rpeAverage: 0, strainScore: 0, stimulus: 'Restoration', accentHex: '#dc2626', anatomy: [{ name: 'Chest', pct: 40, color: '#dc2626' }, { name: 'Triceps', pct: 30, color: '#f59e0b' }, { name: 'Delts', pct: 30, color: '#ea580c' }] },
  { day: 'Tue', full: 'Tuesday', title: 'Rest & Prep', split: 'REST', volume: 0, sets: 0, targetVol: 0, targetSets: 0, rpeAverage: 0, strainScore: 0, stimulus: 'Restoration', accentHex: '#d97706', anatomy: [{ name: 'Lats', pct: 45, color: '#b45309' }, { name: 'Rhomboids', pct: 30, color: '#d97706' }, { name: 'Biceps', pct: 25, color: '#f59e0b' }] },
  { day: 'Wed', full: 'Wednesday', title: 'Rest & Prep', split: 'REST', volume: 0, sets: 0, targetVol: 0, targetSets: 0, rpeAverage: 0, strainScore: 0, stimulus: 'Restoration', accentHex: '#e11d48', anatomy: [{ name: 'Quads', pct: 40, color: '#991b1b' }, { name: 'Glutes', pct: 30, color: '#ef4444' }, { name: 'Core', pct: 30, color: '#fca5a5' }] },
  { day: 'Thu', full: 'Thursday', title: 'Rest & Prep', split: 'REST', volume: 0, sets: 0, targetVol: 0, targetSets: 0, rpeAverage: 0, strainScore: 0, stimulus: 'Active Aerobic', accentHex: '#0284c7', anatomy: [{ name: 'Cardio Engine', pct: 100, color: '#0284c7' }] },
  { day: 'Fri', full: 'Friday', title: 'Rest & Prep', split: 'REST', volume: 0, sets: 0, targetVol: 0, targetSets: 0, rpeAverage: 0, strainScore: 0, stimulus: 'Restoration', accentHex: '#ea580c', anatomy: [{ name: 'Upper Body', pct: 50, color: '#ea580c' }, { name: 'Arms', pct: 50, color: '#fb923c' }] },
  { day: 'Sat', full: 'Saturday', title: 'Rest & Prep', split: 'REST', volume: 0, sets: 0, targetVol: 0, targetSets: 0, rpeAverage: 0, strainScore: 0, stimulus: 'Restoration', accentHex: '#10b981', anatomy: [{ name: 'Hamstrings', pct: 50, color: '#059669' }, { name: 'Posterior', pct: 50, color: '#10b981' }] },
  { day: 'Sun', full: 'Sunday', title: 'Rest & Prep', split: 'REST', volume: 0, sets: 0, targetVol: 0, targetSets: 0, rpeAverage: 0, strainScore: 0, stimulus: 'Restoration', accentHex: '#0ea5e9', anatomy: [{ name: 'Mobility', pct: 100, color: '#0ea5e9' }] },
];

export const getLocalSystemDayIdx = (): number => {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export type FuelPace = 'ahead' | 'on_pace' | 'behind';

export interface EnergyBalance {
  /** Signed: negative once the athlete eats past target + burn. Null without a target. */
  remaining: number | null;
  over: number;
  budget: number | null;
  progress: number;
  pace: FuelPace | null;
}

const EATING_WINDOW_START_H = 7;
const EATING_WINDOW_END_H = 21;
const PACE_TOLERANCE = 0.1;

function finite(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function sumMacros(items: Array<{ calories: number; protein: number; carbs: number; fats: number }>): MacroTotals {
  const totals = items.reduce(
    (acc, it) => ({
      calories: acc.calories + finite(it.calories),
      protein: acc.protein + finite(it.protein),
      carbs: acc.carbs + finite(it.carbs),
      fats: acc.fats + finite(it.fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fats: Math.round(totals.fats * 10) / 10,
  };
}

/** Share of the day's budget an athlete should have eaten by now (linear 07:00 → 21:00). */
export function expectedIntakeShare(now = new Date()): number {
  const hours = now.getHours() + now.getMinutes() / 60;
  const share = (hours - EATING_WINDOW_START_H) / (EATING_WINDOW_END_H - EATING_WINDOW_START_H);
  return Math.min(1, Math.max(0, share));
}

export function energyBalance(target: number | null, eaten: number, burned: number, now = new Date()): EnergyBalance {
  if (target == null || target <= 0) {
    return { remaining: null, over: 0, budget: null, progress: 0, pace: null };
  }
  const budget = target + Math.max(0, finite(burned));
  const remaining = Math.round(budget - finite(eaten));
  const progress = Math.min(1, Math.max(0, finite(eaten) / budget));
  const delta = finite(eaten) / budget - expectedIntakeShare(now);
  const pace: FuelPace = delta > PACE_TOLERANCE ? 'ahead' : delta < -PACE_TOLERANCE ? 'behind' : 'on_pace';
  return { remaining, over: remaining < 0 ? -remaining : 0, budget, progress, pace };
}

export interface MacroTargets {
  protein: number | null;
  carbs: number | null;
  fats: number | null;
}

const PROTEIN_G_PER_KG = 1.8;
const PROTEIN_MAX_SHARE = 0.35;
const PROTEIN_DEFAULT_SHARE = 0.3;
const FAT_SHARE = 0.25;

export function resolveMacroTargets(
  calories: number | null,
  protein: number | null,
  carbs: number | null,
  fats: number | null,
  weightKg: number | null,
): MacroTargets {
  if (protein != null && carbs != null && fats != null) return { protein, carbs, fats };
  if (calories == null || calories <= 0) return { protein, carbs, fats };
  const proteinCap = (calories * PROTEIN_MAX_SHARE) / 4;
  const p =
    protein ??
    Math.round(weightKg && weightKg > 0 ? Math.min(weightKg * PROTEIN_G_PER_KG, proteinCap) : (calories * PROTEIN_DEFAULT_SHARE) / 4);
  const f = fats ?? Math.round((calories * FAT_SHARE) / 9);
  const c = carbs ?? Math.max(0, Math.round((calories - p * 4 - f * 9) / 4));
  return { protein: p, carbs: c, fats: f };
}

export type DayCalorieState = 'on' | 'under' | 'over' | 'empty';
export type ProteinDayState = 'hit' | 'miss' | 'pending' | 'empty';

export interface WeekDayEntry {
  dateKey: string;
  totals: MacroTotals | null;
  isToday: boolean;
}

export interface WeeklyTrajectory {
  /** Completed (pre-today) days with food logged; today is partial and never averaged. */
  loggedDays: number;
  avgCalories: number | null;
  avgProtein: number | null;
  avgCarbs: number | null;
  avgFats: number | null;
  balancePerDay: number | null;
  status: 'on_track' | 'under' | 'over' | null;
  dayStates: DayCalorieState[];
  protein: ProteinDayState[];
  proteinHits: number;
  proteinDays: number;
}

const DAY_TOLERANCE = 0.1;
const PROTEIN_HIT_SHARE = 0.9;

export function dayCalorieState(calories: number | null, target: number | null): DayCalorieState {
  if (calories == null || calories <= 0) return 'empty';
  if (target == null || target <= 0) return 'on';
  const delta = (calories - target) / target;
  return delta > DAY_TOLERANCE ? 'over' : delta < -DAY_TOLERANCE ? 'under' : 'on';
}

function avg(values: number[]): number | null {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export function weeklyTrajectory(days: WeekDayEntry[], targets: { calories: number | null; protein: number | null }): WeeklyTrajectory {
  const logged = (d: WeekDayEntry) => d.totals != null && d.totals.calories > 0;
  const completed = days.filter((d) => !d.isToday && logged(d)).map((d) => d.totals as MacroTotals);
  const avgCalories = avg(completed.map((t) => t.calories));
  const balancePerDay = avgCalories != null && targets.calories ? Math.round(avgCalories - targets.calories) : null;
  const status =
    balancePerDay == null || !targets.calories
      ? null
      : Math.abs(balancePerDay) <= targets.calories * DAY_TOLERANCE
        ? 'on_track'
        : balancePerDay > 0
          ? 'over'
          : 'under';

  const proteinTarget = targets.protein;
  const protein: ProteinDayState[] = days.map((d) => {
    if (!logged(d) || !proteinTarget) return d.isToday && proteinTarget ? 'pending' : 'empty';
    const hit = (d.totals as MacroTotals).protein >= proteinTarget * PROTEIN_HIT_SHARE;
    if (d.isToday) return hit ? 'hit' : 'pending';
    return hit ? 'hit' : 'miss';
  });

  const round1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10);
  return {
    loggedDays: completed.length,
    avgCalories: avgCalories == null ? null : Math.round(avgCalories),
    avgProtein: round1(avg(completed.map((t) => t.protein))),
    avgCarbs: round1(avg(completed.map((t) => t.carbs))),
    avgFats: round1(avg(completed.map((t) => t.fats))),
    balancePerDay,
    status,
    dayStates: days.map((d) => dayCalorieState(d.totals?.calories ?? null, targets.calories)),
    protein,
    proteinHits: protein.filter((p) => p === 'hit').length,
    proteinDays: protein.filter((p) => p === 'hit' || p === 'miss').length,
  };
}

/** The rolling seven local days ending today, oldest first. */
export function lastSevenDateKeys(today: Date = new Date()): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

export function hydrationGoalLiters(explicitL: number | null, weightKg: number | null): number | null {
  if (explicitL != null && explicitL > 0) return explicitL;
  if (weightKg != null && weightKg > 0) return Math.round(weightKg * 0.035 * 10) / 10;
  return null;
}

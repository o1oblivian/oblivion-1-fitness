import { knownSets, setWorkKg } from '../liftLedger';
import type {
  CardioDayRecord,
  MeditationDayRecord,
  NutritionDayRecord,
  SleepDayRecord,
  WorkoutDayRecord,
} from '../store/useTelemetryHistoryStore';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function dateKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function part(value: number | null | undefined, suffix: string, digits = 0): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const shown = digits > 0
    ? String(Math.round(value * 10 ** digits) / 10 ** digits)
    : Math.round(value).toLocaleString();
  return `${shown}${suffix}`;
}

export function line(parts: Array<string | null>): string {
  const real = parts.filter((item): item is string => Boolean(item));
  return real.length > 0 ? real.join(' · ') : '--';
}

export function sheetFig(value: number | null | undefined, digits = 0): string {
  return part(value, '', digits) || '--';
}

export function cleanWorkout(rec?: WorkoutDayRecord): WorkoutDayRecord | undefined {
  if (!rec?.hasData) return undefined;
  const poisoned = rec.durationMinutes === 45 && rec.intensityRpe === 8.5 && !rec.burnedKcal;
  return {
    ...rec,
    durationMinutes: poisoned ? 0 : rec.durationMinutes || 0,
    intensityRpe: poisoned ? 0 : rec.intensityRpe || 0,
  };
}

export function cleanCardio(rec?: CardioDayRecord): CardioDayRecord | undefined {
  if (!rec?.hasData) return undefined;
  const stepShadow = /step/i.test(rec.activityType || '') && (rec.avgHeartRateBpm === 135 || rec.avgHeartRateBpm === 142);
  if (stepShadow) {
    return {
      ...rec,
      distanceKm: 0,
      burnedKcal: 0,
      durationMinutes: 0,
      avgHeartRateBpm: 0,
      zone2Minutes: 0,
      activityType: 'Steps',
    };
  }
  const guessedZone = Math.round((rec.durationMinutes || 0) * 0.75);
  const fillerHr = [135, 138, 142].includes(rec.avgHeartRateBpm) && rec.zone2Minutes === guessedZone && guessedZone > 0;
  return {
    ...rec,
    avgHeartRateBpm: fillerHr ? 0 : rec.avgHeartRateBpm || 0,
    zone2Minutes: fillerHr ? 0 : rec.zone2Minutes || 0,
  };
}

export function cleanNutrition(rec?: NutritionDayRecord): NutritionDayRecord | undefined {
  if (!rec?.hasData) return undefined;
  const poison = rec.calorieTarget === 2200 && rec.proteinTargetG === 165 && rec.carbsTargetG === 250 && rec.fatsTargetG === 60;
  if (!poison) return rec;
  return { ...rec, calorieTarget: 0, proteinTargetG: 0, carbsTargetG: 0, fatsTargetG: 0 };
}

export function sessionKg(rec?: WorkoutDayRecord): number {
  const fromSets = (rec?.exercises || []).reduce((sum, lift) => sum + setWorkKg(knownSets(lift)), 0);
  if (fromSets > 0) return fromSets;
  return rec?.tonnageKg || 0;
}

export function workoutLine(rec?: WorkoutDayRecord): string {
  if (!rec?.hasData) return '--';
  return line([
    part(sessionKg(rec), ' kg'),
    part(rec.completedSets, ' sets'),
    part(rec.durationMinutes, ' min'),
    part(rec.burnedKcal, ' kcal active'),
  ]);
}

/** A lone 1 is the old placeholder, not a sensor or manual reading. */
export function readableSteps(rec?: CardioDayRecord, steps = 0): number {
  const raw = Number(rec?.steps ?? steps);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  const hasSession = (rec?.distanceKm || 0) > 0 || (rec?.durationMinutes || 0) > 0 || (rec?.burnedKcal || 0) > 0;
  if (raw === 1 && !hasSession) return 0;
  return raw;
}

export function cardioLine(rec?: CardioDayRecord, steps = 0): string {
  const logged = line([
    part(rec?.distanceKm, ' km', 1),
    part(rec?.durationMinutes, ' min'),
    part(rec?.burnedKcal, ' kcal'),
  ]);
  if (logged !== '--') return logged;
  return part(readableSteps(rec, steps), ' steps') || '--';
}

export function foodLine(rec?: NutritionDayRecord): string {
  return part(rec?.calories, ' kcal') || '--';
}

export function sleepLine(rec?: SleepDayRecord): string {
  return line([
    part(rec?.durationHours, ' h', 1),
    part(rec?.recoveryPercent, '% recovery'),
  ]);
}

export function mindfulLine(rec?: MeditationDayRecord): string {
  return part(rec?.minutes, ' min') || '--';
}

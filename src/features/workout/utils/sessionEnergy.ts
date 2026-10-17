import { safeStorage } from '../../../utils/safeStorage';
import { useUserStore } from '../../../stores/useUserStore';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import type { ExerciseItem } from '../../../types';

const CLOCK_KEY = 'o1fc_workout_session_clock';
/** Work plus rest for one set at a typical hypertrophy pace. */
const SET_MINUTES = 2.5;
/** Time after the last tick still counted, so a late Finish tap doesn't log idle minutes. */
const TAIL_MINUTES = 5;
const MAX_MINUTES = 180;
const MIN_BODYWEIGHT_KG = 30;

interface SessionClock {
  startedAt: number;
  lastTickAt: number;
  ticked: number;
}

export interface SessionEnergy {
  durationMinutes: number;
  avgRpe: number | null;
  /** Net active kcal. Null when bodyweight is unknown. */
  burnedKcal: number | null;
}

function readClock(): SessionClock | null {
  const clock = safeStorage.getItem<SessionClock | null>(CLOCK_KEY, null);
  return clock && Number.isFinite(clock.startedAt) && Number.isFinite(clock.lastTickAt)
    ? clock
    : null;
}

/** Called whenever the ticked-set count changes. */
export function trackSessionClock(tickedSets: number, now = Date.now()): void {
  if (tickedSets <= 0) {
    safeStorage.removeItem(CLOCK_KEY);
    return;
  }
  const clock = readClock();
  if (!clock) {
    safeStorage.setItem(CLOCK_KEY, { startedAt: now, lastTickAt: now, ticked: tickedSets });
    return;
  }
  if (tickedSets === clock.ticked) return;
  safeStorage.setItem(CLOCK_KEY, {
    ...clock,
    lastTickAt: tickedSets > clock.ticked ? now : clock.lastTickAt,
    ticked: tickedSets,
  });
}

export function resetSessionClock(): void {
  safeStorage.removeItem(CLOCK_KEY);
}

export function sessionMinutes(completedSets: number, now = Date.now()): number {
  if (completedSets <= 0) return 0;
  const typical = completedSets * SET_MINUTES;
  const clock = readClock();
  if (!clock) return Math.round(Math.min(MAX_MINUTES, typical));
  const end = Math.min(now, clock.lastTickAt + TAIL_MINUTES * 60_000);
  // The first tick lands after the first set is done.
  const measured = (end - clock.startedAt) / 60_000 + SET_MINUTES;
  // Ticking everything at the end compresses the clock below a minute per set.
  const minutes = measured < completedSets ? typical : measured;
  return Math.round(Math.min(MAX_MINUTES, minutes));
}

export function athleteBodyweightKg(): number | null {
  const profile = Number(useUserStore.getState().weightKg) || 0;
  if (profile > MIN_BODYWEIGHT_KG) return profile;
  const fuel = Number(useFuelStore.getState().weightKg) || 0;
  return fuel > MIN_BODYWEIGHT_KG ? fuel : null;
}

/** Compendium of Physical Activities: resistance training 3.5 MET (light) to 6.0 MET (vigorous), mapped from RPE 6–9. */
export function resistanceMet(avgRpe: number | null): number {
  if (avgRpe == null) return 3.5;
  return Math.min(6, Math.max(3.5, 3.5 + ((avgRpe - 6) * 2.5) / 3));
}

/** Net of resting metabolism (MET − 1), so it doesn't double count the BMR already in the calorie target. */
export function resistanceKcal(
  minutes: number,
  bodyweightKg: number | null,
  avgRpe: number | null,
): number | null {
  if (bodyweightKg == null || minutes <= 0) return null;
  return Math.round(((resistanceMet(avgRpe) - 1) * 3.5 * bodyweightKg * minutes) / 200);
}

export function estimateSessionEnergy(
  exercises: ExerciseItem[],
  completedSets: number,
  now = Date.now(),
): SessionEnergy {
  const rpes = exercises
    .flatMap((e) => e.sets || [])
    .filter((s) => s.completed)
    .map((s) => Number(s.rpe) || 0)
    .filter((rpe) => rpe > 0 && rpe <= 10);
  const avgRpe =
    rpes.length > 0 ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null;
  const durationMinutes = sessionMinutes(completedSets, now);
  return {
    durationMinutes,
    avgRpe,
    burnedKcal: resistanceKcal(durationMinutes, athleteBodyweightKg(), avgRpe),
  };
}

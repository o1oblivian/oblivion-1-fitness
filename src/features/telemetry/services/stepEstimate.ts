const WALK_STEPS_PER_KM = 1400;
const RUN_STEPS_PER_KM = 1000;
const RUN_THRESHOLD_KMH = 7;

/**
 * Steps implied by a cardio session when the screen shows distance but no step count.
 * Stride is picked from pace (distance / time): walking ~0.71 m, running ~1.0 m.
 * Returns null when there is no distance to convert; the vision result itself stays null.
 */
export function estimateStepsFromCardio(
  distanceKm: number | null | undefined,
  durationMinutes: number | null | undefined,
): number | null {
  const km = Number(distanceKm) || 0;
  if (km <= 0) return null;
  const minutes = Number(durationMinutes) || 0;
  const speedKmh = minutes > 0 ? km / (minutes / 60) : 0;
  const stepsPerKm = speedKmh >= RUN_THRESHOLD_KMH ? RUN_STEPS_PER_KM : WALK_STEPS_PER_KM;
  return Math.round(km * stepsPerKm);
}

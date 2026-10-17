const WALK_STEPS_PER_KM = 1400;
const RUN_STEPS_PER_KM = 1000;
const RUN_THRESHOLD_KMH = 7;
/** Net walking cost (ACSM): about 0.5 kcal per kg per km, on top of resting burn. */
const WALK_NET_KCAL_PER_KG_KM = 0.5;

/**
 * Estimated active kcal for a day's steps, at the walking stride used above.
 * Null without a bodyweight or any steps, so nothing is guessed.
 */
export function estimateKcalFromSteps(steps: number | null | undefined, bodyweightKg: number | null | undefined): number | null {
  const count = Number(steps) || 0;
  const kg = Number(bodyweightKg) || 0;
  if (count <= 0 || kg <= 0) return null;
  return Math.round((count / WALK_STEPS_PER_KM) * WALK_NET_KCAL_PER_KG_KM * kg);
}

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

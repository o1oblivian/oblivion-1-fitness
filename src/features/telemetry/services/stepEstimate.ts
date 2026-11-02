const WALK_STEPS_PER_KM = 1400;
/** Running strides are longer, so a kilometre takes fewer steps. */
const RUN_STEPS_PER_KM = 1000;
/** Above this average speed a session counts as running. */
const RUN_SPEED_KMH = 7;

/**
 * Steps for a cardio distance whose screen showed no step count. Uses the running stride when the
 * distance and time put the average at running pace. Null without a distance.
 */
export function estimateStepsFromKm(
  distanceKm: number | null | undefined,
  durationMinutes?: number | null,
): number | null {
  const km = Number(distanceKm) || 0;
  if (km <= 0) return null;
  const mins = Number(durationMinutes) || 0;
  const running = mins > 0 && km / (mins / 60) >= RUN_SPEED_KMH;
  return Math.round(km * (running ? RUN_STEPS_PER_KM : WALK_STEPS_PER_KM));
}
/** Net walking cost (ACSM): about 0.5 kcal per kg per km, on top of resting burn. */
const WALK_NET_KCAL_PER_KG_KM = 0.5;

/** Walking distance for a day's steps at the stride above. Null without steps, so nothing is guessed. */
export function estimateKmFromSteps(steps: number | null | undefined): number | null {
  const count = Number(steps) || 0;
  if (count <= 0) return null;
  return Math.round((count / WALK_STEPS_PER_KM) * 100) / 100;
}

/**
 * Estimated active kcal for a day's steps, at the walking stride used above.
 * Null without a bodyweight or any steps, so nothing is guessed.
 */
export function estimateKcalFromSteps(
  steps: number | null | undefined,
  bodyweightKg: number | null | undefined,
): number | null {
  const count = Number(steps) || 0;
  const kg = Number(bodyweightKg) || 0;
  if (count <= 0 || kg <= 0) return null;
  return Math.round((count / WALK_STEPS_PER_KM) * WALK_NET_KCAL_PER_KG_KM * kg);
}

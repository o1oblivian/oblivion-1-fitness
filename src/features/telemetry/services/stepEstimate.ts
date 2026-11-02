const WALK_STEPS_PER_KM = 1400;
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

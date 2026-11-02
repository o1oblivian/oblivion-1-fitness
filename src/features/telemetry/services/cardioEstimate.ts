import { estimateStepsFromKm } from './stepEstimate';

const WALK_STEPS_PER_KM = 1400;
const RUN_STEPS_PER_KM = 1000;
/** Steps a minute at or above which the count is a run, so each step covers more ground. */
const RUN_CADENCE_SPM = 140;
const RUN_SPEED_KMH = 7;
/** Net cost per kg per km (ACSM): walking about 0.5 kcal, running about 1 kcal. */
const WALK_KCAL_PER_KG_KM = 0.5;
const RUN_KCAL_PER_KG_KM = 1;
/** Net MET for moderate machine cardio with no distance on screen (bike, stepper, elliptical). */
const MACHINE_NET_MET = 5;
/** Used for calories when the profile has no bodyweight yet. */
const REFERENCE_BODYWEIGHT_KG = 70;

export interface CardioReadout {
  steps: number | null;
  distanceKm: number | null;
  elapsedMinutes: number | null;
  caloriesBurned: number | null;
  speedKmh: number | null;
}

/** Values worked out from the rest of the screen. Each is null when it was read or cannot be worked out. */
export type CardioEstimates = CardioReadout;

const positive = (v: number | null | undefined): number | null =>
  Number(v) > 0 ? Number(v) : null;
const round = (v: number, places: number) => Math.round(v * 10 ** places) / 10 ** places;

function kmFromSteps(steps: number, minutes: number | null): number {
  const running = minutes != null && steps / minutes >= RUN_CADENCE_SPM;
  return steps / (running ? RUN_STEPS_PER_KM : WALK_STEPS_PER_KM);
}

/**
 * Fills whatever a watch, console or typed entry left out from what it did show: steps from
 * distance, distance from steps, time and speed from each other, and calories from distance
 * (or time, when there is no distance) and bodyweight.
 */
export function fillCardioGaps(read: CardioReadout, bodyweightKg?: number | null): CardioEstimates {
  const steps = positive(read.steps);
  const readKm = positive(read.distanceKm);
  const readMins = positive(read.elapsedMinutes);
  const readSpeed = positive(read.speedKmh);

  const mins = readMins ?? (readKm && readSpeed ? (readKm / readSpeed) * 60 : null);
  const km =
    readKm ??
    (steps ? kmFromSteps(steps, mins) : readSpeed && mins ? (readSpeed * mins) / 60 : null);
  const speed = readSpeed ?? (km && mins ? km / (mins / 60) : null);
  const running = speed != null && speed >= RUN_SPEED_KMH;
  const kg = positive(bodyweightKg) ?? REFERENCE_BODYWEIGHT_KG;
  const kcal = km
    ? km * kg * (running ? RUN_KCAL_PER_KG_KM : WALK_KCAL_PER_KG_KM)
    : mins
      ? (mins / 60) * kg * MACHINE_NET_MET
      : null;

  return {
    steps: steps ? null : km ? estimateStepsFromKm(km, mins) : null,
    distanceKm: readKm || km == null ? null : round(km, 2),
    elapsedMinutes: readMins || mins == null ? null : round(mins, 1),
    caloriesBurned: positive(read.caloriesBurned) || kcal == null ? null : Math.round(kcal),
    speedKmh: readSpeed || speed == null ? null : round(speed, 1),
  };
}

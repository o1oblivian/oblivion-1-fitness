/** Which step of logging a set to point at. Only a hint: the tick always works. */
export type SetCue = 'values' | 'effort' | 'tick' | null;

export interface SetCueInput {
  /** First set not yet ticked in the open exercise. */
  isActive: boolean;
  isDone: boolean;
  hasReps: boolean;
  /** A weight is already on the set (bodyweight sets have none). */
  hasWeight: boolean;
  hasRpe: boolean;
  /** The lifter has tapped or nudged reps / weight on this set. */
  touchedReps: boolean;
  touchedWeight: boolean;
}

/** Reps and weight, then effort (RPE), then the tick. */
export function nextSetCue(set: SetCueInput): SetCue {
  if (!set.isActive || set.isDone) return null;
  const repsConfirmed = set.hasReps && set.touchedReps;
  const weightConfirmed = !set.hasWeight || set.touchedWeight;
  if (!repsConfirmed || !weightConfirmed) return 'values';
  if (!set.hasRpe) return 'effort';
  return 'tick';
}

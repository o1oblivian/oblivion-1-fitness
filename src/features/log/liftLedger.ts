import { ExerciseEntry, LoggedSet } from './store/useTelemetryHistoryStore';

/** Sets that were actually logged. Empty planned sets stay out of the book. */
export function setsFromExercise(exercise: {
  sets?: Array<{ completed?: boolean; reps?: number; weightKg?: number; weight?: number }>;
}): LoggedSet[] {
  return (exercise.sets || [])
    .filter((set) => {
      const reps = Number(set?.reps) || 0;
      const weight = Number(set?.weightKg ?? set?.weight) || 0;
      return Boolean(set?.completed) || reps > 0 || weight > 0;
    })
    .map((set) => ({
      reps: Number(set.reps) || 0,
      weightKg: Number(set.weightKg ?? set.weight) || 0,
    }));
}

export function exerciseFromSets(name: string, setLog: LoggedSet[], completed = true): ExerciseEntry {
  const uniformReps = setLog.length > 0 && setLog.every((set) => set.reps === setLog[0].reps);
  const uniformWeight = setLog.length > 0 && setLog.every((set) => set.weightKg === setLog[0].weightKg);
  const totalReps = setLog.reduce((sum, set) => sum + set.reps, 0);
  const volumeKg = setLog.reduce((sum, set) => sum + set.weightKg * set.reps, 0);
  return {
    name,
    sets: setLog.length,
    reps: uniformReps ? setLog[0].reps : totalReps,
    weightKg: uniformWeight ? setLog[0].weightKg : 0,
    volumeKg,
    completed,
    setLog,
  };
}

export function knownSets(entry: ExerciseEntry): LoggedSet[] {
  if (entry.setLog && entry.setLog.length > 0) return entry.setLog;
  const count = Math.max(0, Math.round(entry.sets || 0));
  if (count > 1 && ((entry.reps || 0) > 0 || (entry.weightKg || 0) > 0)) {
    return Array.from({ length: count }, () => ({
      reps: entry.reps || 0,
      weightKg: entry.weightKg || 0,
    }));
  }
  return [];
}

/** Load × reps for these sets. The closed kg cell, and the figure the session total adds. */
export function setWorkKg(sets: LoggedSet[]): number {
  return Math.round(sets.reduce((sum, set) => sum + set.weightKg * set.reps, 0));
}

export function formatLoad(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '--';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
}

/** Closed reps cell. Even sets read as 6×3, which is 18. Mixed sets read as the sum. */
export function collapsedReps(sets: LoggedSet[], fallbackReps = 0): string {
  if (sets.length === 0) return fallbackReps > 0 ? String(fallbackReps) : '--';
  const same = sets.every((set) => set.reps === sets[0].reps);
  if (same && sets[0].reps > 0 && sets.length > 1) return `${sets[0].reps}×${sets.length}`;
  const total = sets.reduce((sum, set) => sum + set.reps, 0);
  return total > 0 ? String(total) : '--';
}

/** Closed kg cell. 82.5 × 6 × 3 = 1,485. Those lift totals add up to the session kg. */
export function collapsedWeight(sets: LoggedSet[], fallbackWeight = 0): string {
  const work = setWorkKg(sets);
  if (work > 0) return work.toLocaleString();
  return fallbackWeight > 0 ? formatLoad(fallbackWeight) : '--';
}

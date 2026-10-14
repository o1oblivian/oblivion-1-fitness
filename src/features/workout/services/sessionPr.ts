import { getTelemetryHistoryState } from '../../log/store/useTelemetryHistoryStore';

export function estimatedMaxKg(weightKg: number, reps: number): number {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps) || weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function localTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export interface BestSet {
  weightKg: number;
  reps: number;
  dateKey: string;
  estimatedMaxKg: number;
}

/** Set with the best estimated 1RM on record. Pass `beforeDateKey` to ignore that day and later, e.g. live ticks already written to today. */
export function priorBestSet(
  exerciseName: string,
  beforeDateKey?: string,
  history = getTelemetryHistoryState().historyByDate
): BestSet | null {
  const key = exerciseName.trim().toLowerCase();
  if (!key) return null;
  let best: BestSet | null = null;
  for (const [dateKey, day] of Object.entries(history)) {
    if (beforeDateKey && dateKey >= beforeDateKey) continue;
    const exercises = day?.workout?.exercises || [];
    for (const exercise of exercises) {
      if ((exercise.name || '').trim().toLowerCase() !== key) continue;
      const sets = exercise.setLog && exercise.setLog.length > 0
        ? exercise.setLog
        : [{ weightKg: exercise.weightKg || 0, reps: exercise.reps || 0 }];
      for (const set of sets) {
        const max = estimatedMaxKg(set.weightKg, set.reps);
        if (max > 0 && (!best || max > best.estimatedMaxKg)) {
          best = { weightKg: set.weightKg, reps: set.reps, dateKey, estimatedMaxKg: max };
        }
      }
    }
  }
  return best;
}

export function priorBestKg(exerciseName: string, beforeDateKey?: string): number {
  return priorBestSet(exerciseName, beforeDateKey)?.estimatedMaxKg ?? 0;
}

export function setIsPr(exerciseName: string, weightKg: number, reps: number, priorKg: number): boolean {
  const next = estimatedMaxKg(weightKg, reps);
  return next > 0 && next > priorKg;
}

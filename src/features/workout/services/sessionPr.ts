import { getTelemetryHistoryState } from '../../log/store/useTelemetryHistoryStore';

export function estimatedMaxKg(weightKg: number, reps: number): number {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps) || weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function priorBestKg(exerciseName: string): number {
  const key = exerciseName.trim().toLowerCase();
  if (!key) return 0;
  const history = getTelemetryHistoryState().historyByDate;
  let best = 0;
  for (const day of Object.values(history)) {
    const exercises = day?.workout?.exercises || [];
    for (const exercise of exercises) {
      if ((exercise.name || '').trim().toLowerCase() !== key) continue;
      const sets = exercise.setLog && exercise.setLog.length > 0
        ? exercise.setLog
        : [{ weightKg: exercise.weightKg || 0, reps: exercise.reps || 0 }];
      for (const set of sets) {
        best = Math.max(best, estimatedMaxKg(set.weightKg, set.reps));
      }
    }
  }
  return best;
}

export function setIsPr(exerciseName: string, weightKg: number, reps: number, priorKg: number): boolean {
  const next = estimatedMaxKg(weightKg, reps);
  return next > 0 && next > priorKg;
}

import { useMemo } from 'react';
import { useTelemetryHistoryStore } from './store/useTelemetryHistoryStore';
import { toDayKey } from '../report/reportEngine';

export interface TrainingSummary {
  /** Total kg moved in the last 7 days (today included). */
  volume7dKg: number;
  /** Days with a logged workout in the last 7 days. */
  sessions7d: number;
  /** Consecutive training days ending today (or yesterday if today isn't logged yet). */
  streakDays: number;
}

const DAY_MS = 86_400_000;

/** Real training numbers computed from logged workout days, not running counters. */
export function computeTrainingSummary(
  history: ReturnType<typeof useTelemetryHistoryStore.getState>['historyByDate'],
  nowMs: number,
): TrainingSummary {
  const trained = (ago: number) => {
    const w = history[toDayKey(nowMs - ago * DAY_MS)]?.workout;
    return w?.hasData ? w : null;
  };

  let volume7dKg = 0;
  let sessions7d = 0;
  for (let ago = 0; ago < 7; ago += 1) {
    const w = trained(ago);
    if (w) {
      sessions7d += 1;
      volume7dKg += w.tonnageKg > 0 ? w.tonnageKg : 0;
    }
  }

  let streakDays = 0;
  let ago = trained(0) ? 0 : 1;
  while (ago < 400 && trained(ago)) {
    streakDays += 1;
    ago += 1;
  }

  return { volume7dKg: Math.round(volume7dKg), sessions7d, streakDays };
}

export function useTrainingSummary(): TrainingSummary {
  const history = useTelemetryHistoryStore((s) => s.historyByDate);
  return useMemo(() => computeTrainingSummary(history, Date.now()), [history]);
}

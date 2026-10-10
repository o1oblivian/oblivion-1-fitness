import type { DayTelemetryRecord, SleepDayRecord } from '../log/store/useTelemetryHistoryStore';
import { toDayKey } from './reportEngine';

/**
 * Most recent logged sleep record within `maxAgeDays` (today counts as 0).
 * Returns null when the user has not logged sleep, so callers can show `--`.
 */
export function latestSleepRecord(
  history: Record<string, Partial<DayTelemetryRecord>>,
  nowMs: number = Date.now(),
  maxAgeDays = 2,
): SleepDayRecord | null {
  for (let ago = 0; ago <= maxAgeDays; ago += 1) {
    const rec = history[toDayKey(nowMs - ago * 86_400_000)]?.sleep;
    if (rec?.hasData && rec.durationHours > 0) return rec;
  }
  return null;
}

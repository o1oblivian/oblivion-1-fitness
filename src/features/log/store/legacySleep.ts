import type { SleepDayRecord } from './useTelemetryHistoryStore';

/**
 * The retired sleep form saved a fixed 92% quality (no control existed) and a 50 BPM resting HR
 * unless edited, always with a bedtime. The Log editor never writes a bedtime and the current form
 * never writes 92, so this fingerprint only matches those placeholder values.
 */
export function scrubLegacySleepDefaults<T extends Partial<SleepDayRecord>>(record: T): T {
  const legacy =
    record.recoveryPercent === 92 &&
    Boolean(record.bedtime) &&
    !record.deepSleepMinutes &&
    !record.remSleepMinutes &&
    !record.sleepEfficiencyPercent;
  if (!legacy) return record;
  return {
    ...record,
    recoveryPercent: 0,
    restingHeartRate: record.restingHeartRate === 50 ? 0 : record.restingHeartRate,
  };
}

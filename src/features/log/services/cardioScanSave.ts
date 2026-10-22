import type { CardioTelemetryResult } from '../../../services/geminiVisionService';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useLogStore } from '../../../stores/useLogStore';
import { telemetryArbitrationService } from '../../telemetry/services/telemetryArbitrationService';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';
import { useTelemetryHistoryStore, type CardioDayRecord } from '../store/useTelemetryHistoryStore';
import { addCardioSession } from './cardioLogService';
import { localDayKey } from './dayLogService';

/** A second scan in one day either adds to what is logged or takes its place. */
export type ScanMerge = 'add' | 'replace';

type ScanDevice = CardioTelemetryResult['deviceType'];

/** What a scan means for today's step count. */
type StepChange =
  | { kind: 'none' }
  /** The watch shows the whole day, so its number becomes the day's total. */
  | { kind: 'set'; total: number }
  /** A console session: take off the steps being replaced, then add this session's. */
  | { kind: 'session'; remove: number; steps: number }
  /** A watch read added on top of what is already logged. */
  | { kind: 'add'; steps: number };

export interface ScanNumbers {
  steps: number;
  distanceKm: number;
  durationMinutes: number;
  burnedKcal: number;
  avgHeartRateBpm: number;
}

export interface ScanToSave extends ScanNumbers {
  activityType: string;
  device: ScanDevice;
  /** Steps printed on the screen, as opposed to steps estimated from distance. */
  readSteps: number;
}

export interface CardioScanPlan {
  record: CardioDayRecord;
  /** Change to today's burned kcal: negative when a replaced log burned more. */
  kcalDelta: number;
  stepChange: StepChange;
}

export function hasAnyNumber(n: ScanNumbers): boolean {
  return (
    n.steps > 0 ||
    n.distanceKm > 0 ||
    n.durationMinutes > 0 ||
    n.burnedKcal > 0 ||
    n.avgHeartRateBpm > 0
  );
}

/** A watch counts the whole day, so a new reading usually replaces; a console session is one workout, so it adds. */
export function defaultScanMerge(device: ScanDevice | undefined): ScanMerge {
  return device === 'watch' ? 'replace' : 'add';
}

/** Today's cardio, or undefined when nothing has been logged yet. */
export function loggedCardioToday(): CardioDayRecord | undefined {
  const today = localDayKey(new Date().toISOString());
  const day = useTelemetryHistoryStore.getState().historyByDate[today]?.cardio;
  return day?.hasData ? day : undefined;
}

/** Works out what saving this scan changes, without touching any store. */
export function planCardioScan(
  logged: CardioDayRecord | undefined,
  scan: ScanToSave,
  merge: ScanMerge,
): CardioScanPlan {
  const replacing = logged !== undefined && merge === 'replace';
  const base = logged !== undefined && merge === 'add' ? logged : undefined;
  const record = addCardioSession(base, {
    activityType: scan.activityType,
    distanceKm: scan.distanceKm,
    durationMinutes: scan.durationMinutes,
    burnedKcal: scan.burnedKcal,
    avgHeartRateBpm: scan.avgHeartRateBpm,
    steps: scan.steps,
  });
  const kcalDelta = replacing ? scan.burnedKcal - (logged?.burnedKcal || 0) : scan.burnedKcal;

  let stepChange: StepChange = { kind: 'none' };
  if (scan.device === 'watch' && scan.readSteps > 0) {
    stepChange =
      logged !== undefined && merge === 'add'
        ? { kind: 'add', steps: scan.readSteps }
        : { kind: 'set', total: scan.readSteps };
  } else if (scan.steps > 0 || replacing) {
    stepChange = { kind: 'session', remove: replacing ? logged?.steps || 0 : 0, steps: scan.steps };
  }
  return { record, kcalDelta, stepChange };
}

/** Saves a scan into today's cardio log, adding to it or replacing it. */
export function saveCardioScan(scan: ScanToSave, merge: ScanMerge): void {
  const today = localDayKey(new Date().toISOString());
  const { record, kcalDelta, stepChange } = planCardioScan(loggedCardioToday(), scan, merge);

  useTelemetryHistoryStore.getState().updateDayRecord(today, 'cardio', record);
  try {
    useLogStore.getState().updateSubModule('cardio', {
      burnedKcal: record.burnedKcal,
      durationMinutes: record.durationMinutes,
      avgHeartRateBpm: record.avgHeartRateBpm,
      distanceKm: record.distanceKm,
    });
    if (kcalDelta !== 0) useFuelStore.getState().logBurned(kcalDelta);

    if (stepChange.kind === 'set') telemetryArbitrationService.setDailyCumulative(stepChange.total);
    else if (stepChange.kind === 'add') useTelemetryStore.getState().addSteps(stepChange.steps);
    else if (stepChange.kind === 'session') {
      if (stepChange.remove > 0) useTelemetryStore.getState().addSteps(-stepChange.remove);
      telemetryArbitrationService.recordConsoleSession({
        distanceKm: scan.distanceKm,
        durationMinutes: scan.durationMinutes,
        steps: stepChange.steps || undefined,
        burnedKcal: scan.burnedKcal,
      });
    }
  } catch {
    /* The log above is saved; the other totals catch up on the next sync. */
  }
}

import { createStore } from '../../utils/createStore';
import { safeStorage } from '../../utils/safeStorage';

/**
 * HRV (RMSSD) from beat-to-beat intervals sent by a Bluetooth heart-rate sensor.
 * Readings are kept on this phone only; nothing here is queued for the account.
 */

const WINDOW_MS = 5 * 60 * 1000;
/** About a minute of beats before a value is trustworthy. */
const MIN_BEATS = 60;
const MIN_RR_MS = 300;
const MAX_RR_MS = 2000;
/** A beat more than 20% away from the previous one is treated as a missed or extra beat. */
const MAX_JUMP = 0.2;
const MAX_REJECT_STREAK = 5;

export class HrvCollector {
  private beats: number[] = [];
  private rejectStreak = 0;

  push(intervalsMs: number[]): number | null {
    for (const ms of intervalsMs) {
      if (ms < MIN_RR_MS || ms > MAX_RR_MS) continue;
      const prev = this.beats[this.beats.length - 1];
      if (prev !== undefined && Math.abs(ms - prev) > prev * MAX_JUMP && this.rejectStreak < MAX_REJECT_STREAK) {
        this.rejectStreak++;
        continue;
      }
      this.rejectStreak = 0;
      this.beats.push(ms);
    }
    let total = 0;
    let start = this.beats.length;
    while (start > 0 && total + this.beats[start - 1] <= WINDOW_MS) {
      total += this.beats[start - 1];
      start--;
    }
    if (start > 0) this.beats = this.beats.slice(start);
    return this.rmssd();
  }

  rmssd(): number | null {
    if (this.beats.length < MIN_BEATS) return null;
    let sum = 0;
    for (let i = 1; i < this.beats.length; i++) {
      const diff = this.beats[i] - this.beats[i - 1];
      sum += diff * diff;
    }
    return Math.round(Math.sqrt(sum / (this.beats.length - 1)));
  }
}

const KEY = 'o1fc_ble_hrv_v1';
const KEEP_DAYS = 30;
const SAVE_EVERY_MS = 30_000;

export interface HrvReading {
  rmssdMs: number;
  at: number;
  device: string;
}

interface HrvState {
  byDate: Record<string, HrvReading>;
}

interface HrvActions {
  record: (reading: HrvReading) => void;
}

export function localDateKey(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readSaved(): Record<string, HrvReading> {
  const saved = safeStorage.getItem<Record<string, HrvReading> | null>(KEY, null);
  if (!saved || typeof saved !== 'object') return {};
  return Object.fromEntries(
    Object.entries(saved).filter(([, r]) => r && Number.isFinite(r.rmssdMs) && r.rmssdMs > 0 && Number.isFinite(r.at)),
  );
}

let lastSaved = 0;

const store = createStore<HrvState, HrvActions>({ byDate: readSaved() }, (set, get) => ({
  record: (reading) => {
    const dateKey = localDateKey(reading.at);
    const kept = Object.keys(get().byDate).sort().slice(-(KEEP_DAYS - 1));
    const byDate: Record<string, HrvReading> = {};
    for (const key of kept) byDate[key] = get().byDate[key];
    byDate[dateKey] = reading;
    set({ byDate });
    if (reading.at - lastSaved >= SAVE_EVERY_MS) {
      lastSaved = reading.at;
      safeStorage.setItem(KEY, byDate);
    }
  },
}));

export const useHrvStore = store.useStore;

/** Writes the latest in-memory reading, e.g. when a sensor disconnects. */
export function flushHrv(): void {
  safeStorage.setItem(KEY, store.getState().byDate);
}

/** Most recent reading on or before `dateKey`, or null when none was recorded. */
export function latestHrv(byDate: Record<string, HrvReading>, dateKey?: string): HrvReading | null {
  const keys = Object.keys(byDate)
    .filter((key) => !dateKey || key <= dateKey)
    .sort();
  const last = keys[keys.length - 1];
  return last ? byDate[last] : null;
}

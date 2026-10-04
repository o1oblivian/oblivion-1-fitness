import { useTelemetryStore } from '../store/useTelemetryStore';
import { syncDailyStepsToSupabase } from '../../log/services/userTelemetryService';
import { bluetoothSensorService } from '../../../services/bluetoothSensorService';

export interface CardioSessionWindow {
  id: string;
  startTime: number;
  endTime: number;
  sessionSteps: number;
  distanceKm: number;
  durationMinutes: number;
}

const STORAGE_KEY = 'o1fc_cardio_sessions_today';

class TelemetryArbitrationService {
  private sessionWindows: CardioSessionWindow[] = [];

  constructor() {
    this.loadSessions();
  }

  private loadSessions() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const todayStart = new Date().setHours(0, 0, 0, 0);
        this.sessionWindows = Array.isArray(parsed)
          ? parsed.filter((s: CardioSessionWindow) => s.endTime >= todayStart)
          : [];
      }
    } catch {}
  }

  private saveSessions() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessionWindows));
    } catch {}
  }

  /**
   * Tier 1: Wearable / BLE (Cumulative Baseline)
   * Directly sets the authoritative all-day cumulative total.
   */
  public getDailyCumulative(): number {
    return useTelemetryStore.getState().stepCount || 0;
  }

  public setDailyCumulative(wearableTotal: number): void {
    const valid = Math.max(0, Math.round(wearableTotal));
    useTelemetryStore.getState().setStepCount(valid);
    syncDailyStepsToSupabase(valid).catch(() => {});
  }

  /**
   * Tier 2: Console Scanner (Session Delta)
   * Appends session steps (or derives distanceKm * 1250) without wiping daily totals,
   * and records session [startTime, endTime] window.
   */
  public recordConsoleSession(params: {
    distanceKm: number;
    durationMinutes: number;
    steps?: number;
    burnedKcal?: number;
    endTime?: number;
  }): { sessionSteps: number; startTime: number; endTime: number } {
    const distanceKm = Math.max(0, Number(params.distanceKm) || 0);
    const durationMinutes = Math.max(1, Number(params.durationMinutes) || 1);
    const sessionSteps = params.steps && params.steps > 0
      ? Math.round(params.steps)
      : Math.round(distanceKm * 1250);

    const endTime = params.endTime || Date.now();
    const startTime = endTime - (durationMinutes * 60 * 1000);

    const session: CardioSessionWindow = {
      id: `cs-${Date.now()}`,
      startTime,
      endTime,
      sessionSteps,
      distanceKm,
      durationMinutes,
    };

    this.sessionWindows.push(session);
    this.saveSessions();

    if (sessionSteps > 0) {
      useTelemetryStore.getState().addSteps(sessionSteps);
      const newTotal = useTelemetryStore.getState().stepCount || 0;
      syncDailyStepsToSupabase(newTotal).catch(() => {});
    }

    return { sessionSteps, startTime, endTime };
  }

  /**
   * Tier 3: Phone Accelerometer (Time-Window Muted)
   * Returns true to mute/suppress phone sensor strides if during a logged session or when BLE wearable is connected.
   */
  public isPhoneSensorMuted(timestamp: number = Date.now()): boolean {
    if (bluetoothSensorService.getConnectedDevice() !== null) {
      return true;
    }
    return this.sessionWindows.some(
      (win) => timestamp >= win.startTime && timestamp <= win.endTime
    );
  }

  public getSessionWindows(): CardioSessionWindow[] {
    return [...this.sessionWindows];
  }
}

export const telemetryArbitrationService = new TelemetryArbitrationService();

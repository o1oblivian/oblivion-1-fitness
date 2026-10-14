/**
 * Oblivion 1 Fitness Club - Mobile Motion & Pedometer Engine
 * Hardware integration: DeviceMotion API + Stride Filter + VBT Barbell Kinematics
 * Strict File Ceiling: < 140 lines
 */

import { useTelemetryStore } from '../features/telemetry/store/useTelemetryStore';
import { telemetryArbitrationService } from '../features/telemetry/services/telemetryArbitrationService';
import { MotionEngineStatus, MotionCallback, MotionFilterState, VbtMotionStatus } from './motion/motionTypes';
import { processMotionSample, GRAVITY_NORMAL } from './motion/motionCalculations';

const OFF_KEY = 'o1fc_motion_steps_off';

function getDeviceMotionCtor(): { requestPermission?: () => Promise<string> } | null {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return null;
  return (window as Window & { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent ?? null;
}

class MotionPedometerService {
  private isActive = false;
  private permissionGranted = false;
  private listeners: Set<MotionCallback> = new Set();
  private lastSampleTime = 0;
  private hasSample = false;

  private filterState: MotionFilterState = {
    smoothedMagnitude: GRAVITY_NORMAL,
    isAbovePeak: false,
    lastStepTime: 0,
    currentVerticalVelocity: 0,
  };

  constructor() {
    const MotionCtor = getDeviceMotionCtor();
    if (MotionCtor && typeof MotionCtor.requestPermission !== 'function') {
      this.permissionGranted = true;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
  }

  public isEnabledByUser(): boolean {
    try {
      return localStorage.getItem(OFF_KEY) !== '1';
    } catch {
      return true;
    }
  }

  private setEnabledByUser(on: boolean) {
    try {
      if (on) localStorage.removeItem(OFF_KEY);
      else localStorage.setItem(OFF_KEY, '1');
    } catch {}
  }

  public subscribe(cb: MotionCallback): () => void {
    this.listeners.add(cb);
    cb(this.getStatus());
    return () => this.listeners.delete(cb);
  }

  public getStatus(): MotionEngineStatus {
    const isHardwareReady = this.isSupported() && this.isActive && this.permissionGranted;
    const reading = isHardwareReady && this.hasSample;
    // Report 0 if permissions are pending or hardware unavailable
    const steps = this.permissionGranted ? (useTelemetryStore.getState().stepCount || 0) : 0;

    // Genuine physical motion check: velocity must exceed stationary threshold (0.05 m/s)
    const rawVel = Math.abs(this.filterState.currentVerticalVelocity);
    const isMoving = reading && rawVel > 0.05;
    const velocity = !reading ? null : isMoving ? Number(rawVel.toFixed(2)) : 0;

    let vbtStatus: VbtMotionStatus = 'Awaiting Barbell Motion';
    if (!this.isSupported() || (!this.permissionGranted && this.isActive)) {
      vbtStatus = 'Hardware Unavailable';
    } else if (isMoving) {
      vbtStatus = 'Tracking Barbell Motion';
    } else {
      vbtStatus = 'Awaiting Barbell Motion';
    }

    return {
      isSupported: this.isSupported(),
      isActive: this.isActive,
      permissionGranted: this.permissionGranted,
      liveMagnitude: reading ? Number(this.filterState.smoothedMagnitude.toFixed(2)) : null,
      stepsToday: steps,
      estimatedVelocityMs: velocity,
      vbtStatus,
      isPeakDetected: reading ? this.filterState.isAbovePeak : false,
    };
  }

  private notify() {
    const s = this.getStatus();
    this.listeners.forEach((cb) => cb(s));
  }

  public async requestPermissionAndStart(): Promise<{ success: boolean; error?: string }> {
    if (!this.isSupported()) {
      return { success: false, error: 'DeviceMotion sensors unavailable.' };
    }
    try {
      const MotionCtor = getDeviceMotionCtor();
      if (!MotionCtor) {
        this.permissionGranted = false;
        this.isActive = false;
        this.notify();
        return { success: false, error: 'DeviceMotion sensors unavailable.' };
      }
      if (typeof MotionCtor.requestPermission === 'function') {
        const res = await MotionCtor.requestPermission();
        if (res !== 'granted') {
          this.permissionGranted = false;
          this.isActive = false;
          this.notify();
          return { success: false, error: 'Sensor permission was denied.' };
        }
      }
      this.permissionGranted = true;
      this.setEnabledByUser(true);
      this.startTracking();
      return { success: true };
    } catch (err: unknown) {
      this.permissionGranted = false;
      this.isActive = false;
      this.notify();
      const message = err instanceof Error ? err.message : 'Sensor access failed';
      return { success: false, error: message };
    }
  }

  public startTracking() {
    if (!this.isSupported() || typeof window === 'undefined') {
      this.isActive = false;
      this.notify();
      return;
    }
    if (this.isActive) return;
    this.isActive = true;
    this.hasSample = false;
    this.lastSampleTime = performance.now();
    window.addEventListener('devicemotion', this.handleMotion, { passive: true });
    this.notify();
  }

  /** User switched step counting off in Settings; stays off across launches. */
  public turnOff() {
    this.setEnabledByUser(false);
    this.stopTracking();
  }

  public stopTracking() {
    if (!this.isActive || typeof window === 'undefined') return;
    this.isActive = false;
    window.removeEventListener('devicemotion', this.handleMotion);
    this.notify();
  }

  private handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const now = performance.now();
    const dt = (now - this.lastSampleTime) / 1000;
    this.lastSampleTime = now;

    const { didStep, updatedState } = processMotionSample(
      { x: acc.x, y: acc.y, z: acc.z },
      dt,
      now,
      this.filterState
    );
    this.filterState = updatedState;
    this.hasSample = true;

    if (didStep && !telemetryArbitrationService.isPhoneSensorMuted(Date.now())) {
      useTelemetryStore.getState().addSteps(1);
    }
    this.notify();
  };
}

export * from './motion/motionTypes';
export const motionPedometerService = new MotionPedometerService();

/**
 * Oblivion 1 Fitness Club - Mobile Motion & Pedometer Engine
 * Hardware integration: DeviceMotion API + Stride Filter + VBT Barbell Kinematics
 * Strict File Ceiling: < 140 lines
 */

import { useTelemetryStore } from '../features/telemetry/store/useTelemetryStore';
import { telemetryArbitrationService } from '../features/telemetry/services/telemetryArbitrationService';
import { tactileEngine } from './tactileEngine';
import { MotionEngineStatus, MotionCallback, MotionFilterState } from './motion/motionTypes';
import { processMotionSample, GRAVITY_NORMAL } from './motion/motionCalculations';

class MotionPedometerService {
  private isActive = false;
  private permissionGranted = false;
  private listeners: Set<MotionCallback> = new Set();
  private lastSampleTime = 0;

  private filterState: MotionFilterState = {
    smoothedMagnitude: GRAVITY_NORMAL,
    isAbovePeak: false,
    lastStepTime: 0,
    currentVerticalVelocity: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      if (typeof (DeviceMotionEvent as any)?.requestPermission !== 'function') {
        this.permissionGranted = true;
      }
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
  }

  public subscribe(cb: MotionCallback): () => void {
    this.listeners.add(cb);
    cb(this.getStatus());
    return () => this.listeners.delete(cb);
  }

  public getStatus(): MotionEngineStatus {
    const steps = useTelemetryStore.getState().stepCount || 0;
    return {
      isSupported: this.isSupported(),
      isActive: this.isActive,
      permissionGranted: this.permissionGranted,
      liveMagnitude: Number(this.filterState.smoothedMagnitude.toFixed(2)),
      stepsToday: steps,
      estimatedVelocityMs: Number(Math.abs(this.filterState.currentVerticalVelocity).toFixed(2)),
      isPeakDetected: this.filterState.isAbovePeak,
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
      if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
        const res = await (DeviceMotionEvent as any).requestPermission();
        if (res !== 'granted') {
          this.permissionGranted = false;
          return { success: false, error: 'Sensor permission was denied.' };
        }
      }
      this.permissionGranted = true;
      this.startTracking();
      tactileEngine.triggerSelectionBuzz();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sensor access failed' };
    }
  }

  public startTracking() {
    if (this.isActive || typeof window === 'undefined') return;
    this.isActive = true;
    this.lastSampleTime = performance.now();
    window.addEventListener('devicemotion', this.handleMotion, { passive: true });
    this.notify();
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

    if (didStep) {
      if (!telemetryArbitrationService.isPhoneSensorMuted(Date.now())) {
        useTelemetryStore.getState().addSteps(1);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(6); } catch {}
        }
      }
    }
    this.notify();
  };
}

export * from './motion/motionTypes';
export const motionPedometerService = new MotionPedometerService();

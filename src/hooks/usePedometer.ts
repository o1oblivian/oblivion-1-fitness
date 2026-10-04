/**
 * Oblivion 1 Fitness Club - Hardware Pedometer Hook
 * Strictly binds to genuine hardware sensor motion events.
 * Reports 0 if permissions are pending or sensor is unstarted. Zero simulated step increments.
 */

import { useState, useEffect } from 'react';
import { motionPedometerService, MotionEngineStatus } from '../services/motionPedometerService';
import { useTelemetryStore } from '../features/telemetry/store/useTelemetryStore';

export interface PedometerResult {
  steps: number;
  isActive: boolean;
  isSupported: boolean;
  permissionGranted: boolean;
  startPedometer: () => Promise<{ success: boolean; error?: string }>;
  stopPedometer: () => void;
}

export function usePedometer(): PedometerResult {
  const [status, setStatus] = useState<MotionEngineStatus>(() =>
    motionPedometerService.getStatus()
  );
  const storeSteps = useTelemetryStore((s) => s.stepCount);

  useEffect(() => {
    const unsubscribe = motionPedometerService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  // If permissions are pending or hardware unavailable, report 0
  const steps = status.permissionGranted ? storeSteps : 0;

  return {
    steps,
    isActive: status.isActive,
    isSupported: status.isSupported,
    permissionGranted: status.permissionGranted,
    startPedometer: () => motionPedometerService.requestPermissionAndStart(),
    stopPedometer: () => motionPedometerService.stopTracking(),
  };
}

export default usePedometer;

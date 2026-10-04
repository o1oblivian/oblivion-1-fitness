/**
 * Oblivion 1 Fitness Club - VBT (Velocity Based Training) Tracker Hook
 * Connects directly to hardware accelerometer telemetry without simulated velocity curves.
 * If hardware is unavailable or stationary, reports 0.0 m/s with status "Awaiting Barbell Motion".
 */

import { useState, useEffect } from 'react';
import { motionPedometerService, MotionEngineStatus, VbtMotionStatus } from '../services/motionPedometerService';

export interface VbtTrackerResult {
  velocity: number;
  status: VbtMotionStatus;
  isActive: boolean;
  isSupported: boolean;
  permissionGranted: boolean;
  startTracking: () => Promise<{ success: boolean; error?: string }>;
  stopTracking: () => void;
}

export function useVbtTracker(): VbtTrackerResult {
  const [motionStatus, setMotionStatus] = useState<MotionEngineStatus>(() =>
    motionPedometerService.getStatus()
  );

  useEffect(() => {
    const unsubscribe = motionPedometerService.subscribe((status) => {
      setMotionStatus(status);
    });
    return unsubscribe;
  }, []);

  const velocity = motionStatus.estimatedVelocityMs;
  const status: VbtMotionStatus = motionStatus.vbtStatus || 'Awaiting Barbell Motion';

  return {
    velocity,
    status,
    isActive: motionStatus.isActive,
    isSupported: motionStatus.isSupported,
    permissionGranted: motionStatus.permissionGranted,
    startTracking: () => motionPedometerService.requestPermissionAndStart(),
    stopTracking: () => motionPedometerService.stopTracking(),
  };
}

export default useVbtTracker;

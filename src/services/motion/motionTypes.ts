/**
 * Oblivion 1 Fitness Club - Motion Sensor & Pedometer Types
 * Strict File Ceiling: < 140 lines
 */

export type VbtMotionStatus =
  'Awaiting Barbell Motion' | 'Tracking Barbell Motion' | 'Hardware Unavailable';

export interface MotionEngineStatus {
  isSupported: boolean;
  isActive: boolean;
  permissionGranted: boolean;
  /** null until the phone has delivered a motion sample. */
  liveMagnitude: number | null;
  stepsToday: number;
  /** null until the phone has delivered a motion sample. */
  estimatedVelocityMs: number | null;
  isPeakDetected: boolean;
  vbtStatus: VbtMotionStatus;
}

export type MotionCallback = (status: MotionEngineStatus) => void;

export interface MotionFilterState {
  smoothedMagnitude: number;
  isAbovePeak: boolean;
  lastStepTime: number;
  currentVerticalVelocity: number;
}

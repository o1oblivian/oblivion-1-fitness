/**
 * Oblivion 1 Fitness Club - Stride Peak Detection & VBT Math
 * Strict File Ceiling: < 140 lines
 */

import { MotionFilterState } from './motionTypes';

export const PEAK_THRESHOLD = 11.8; // m/s^2
export const VALLEY_THRESHOLD = 8.2;
export const MIN_STEP_INTERVAL_MS = 280; // ~3.5 steps/sec cadence cap
export const GRAVITY_NORMAL = 9.81;

export function processMotionSample(
  acc: { x: number; y: number; z: number },
  dt: number,
  now: number,
  state: MotionFilterState
): { didStep: boolean; updatedState: MotionFilterState } {
  // 3-axis Euclidean acceleration magnitude
  const rawMag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);

  // Exponential low-pass filter
  const alpha = 0.25;
  const smoothed = alpha * rawMag + (1 - alpha) * state.smoothedMagnitude;

  let didStep = false;
  let isAbove = state.isAbovePeak;
  let lastTime = state.lastStepTime;

  if (smoothed > PEAK_THRESHOLD && !isAbove) {
    if (now - lastTime > MIN_STEP_INTERVAL_MS) {
      isAbove = true;
      lastTime = now;
      didStep = true;
    }
  } else if (smoothed < VALLEY_THRESHOLD && isAbove) {
    isAbove = false;
  }

  // VBT linear velocity integration
  let velocity = state.currentVerticalVelocity;
  if (dt > 0 && dt < 0.2) {
    const linearY = acc.y - GRAVITY_NORMAL;
    if (Math.abs(linearY) > 0.4) {
      velocity += linearY * dt;
    } else {
      velocity *= 0.85;
    }
  }

  return {
    didStep,
    updatedState: {
      smoothedMagnitude: smoothed,
      isAbovePeak: isAbove,
      lastStepTime: lastTime,
      currentVerticalVelocity: velocity,
    },
  };
}

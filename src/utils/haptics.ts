/**
 * OFC Multi-tiered Web Haptics & Tactile Engine
 * Standardized navigator.vibrate patterns & tactile feedback
 */

import { getFeedbackPreferences } from './feedbackPreferences';

export type HapticTier = 'light' | 'medium' | 'double' | 'success' | 'warning';

const HAPTIC_PATTERNS: Record<HapticTier, number | number[]> = {
  // Light tap (8ms): Snapping workout rotary dials, selecting filter pills, category switching
  light: 8,
  // Medium thump (25ms): Logging a completed set, checking off a routine exercise, locking a barcode scan
  medium: 25,
  // Double pulse (50ms - 30ms - 50ms): Rest timer completion, 1RM personal record breakthrough, coach dispatch alert
  double: [50, 30, 50],
  // Success confirmation
  success: [15, 40, 30],
  // Warning pulse
  warning: [30, 50, 30, 50, 40],
};

/**
 * Triggers hardware vibration using navigator.vibrate with fallback safety and user preference check
 */
export function triggerHaptic(tier: HapticTier | number | number[] = 'light'): boolean {
  try {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) {
      return false;
    }
    const prefs = getFeedbackPreferences();
    if (!prefs.hapticsEnabled) {
      return false;
    }
    const pattern = typeof tier === 'string' ? HAPTIC_PATTERNS[tier] ?? 8 : tier;
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/**
 * Shortcut helpers for semantic clarity
 */
export const haptic = {
  // Rotary dial increments, filter pill taps, tab switches
  tap: () => triggerHaptic('light'),
  // Set completion, exercise checks, barcode locking
  thump: () => triggerHaptic('medium'),
  // 1RM PR breakthrough, timer finished, dispatch alerts
  pulse: () => triggerHaptic('double'),
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
};

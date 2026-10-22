import { Capacitor } from '@capacitor/core';
import { TextZoom } from '@capacitor/text-zoom';

export type SystemTextSize = 'standard' | 'large' | 'xlarge';

/** The phone's multiplier (1 = default) as one of the app's three text sizes. */
export function textSizeForZoom(zoom: number): SystemTextSize {
  if (zoom >= 1.3) return 'xlarge';
  if (zoom >= 1.1) return 'large';
  return 'standard';
}

/**
 * The text size set in the iPhone's Display & Brightness settings (Dynamic Type). Android's
 * WebView already follows the system font size by itself, and the web has no such setting, so
 * both return null and the app's own setting decides.
 */
export async function readSystemTextSize(): Promise<SystemTextSize | null> {
  if (Capacitor.getPlatform() !== 'ios') return null;
  try {
    const { value } = await TextZoom.getPreferred();
    return Number.isFinite(value) && value > 0 ? textSizeForZoom(value) : null;
  } catch {
    return null;
  }
}

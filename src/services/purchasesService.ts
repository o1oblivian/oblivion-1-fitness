/**
 * RevenueCat store keys and native platform detection.
 * The store connection itself lives in revenueCatService.
 */
import { Capacitor } from '@capacitor/core';

/** Public SDK keys from RevenueCat, one per platform. These are the only source; builds do not override them. */
const NATIVE_APPLE_SDK_KEY = 'appl_bVAQIwbQxZzifRbzmyBjdZohETH';
const NATIVE_GOOGLE_SDK_KEY = 'goog_WUkUOSxwelTEdPbjhkcgeIQzqEW';

export function isNativeStorePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const platform = Capacitor.getPlatform();
    return Capacitor.isNativePlatform() && (platform === 'ios' || platform === 'android');
  } catch {
    return false;
  }
}

export function resolveNativeStoreKey(): string {
  try {
    return Capacitor.getPlatform() === 'ios' ? NATIVE_APPLE_SDK_KEY : NATIVE_GOOGLE_SDK_KEY;
  } catch {
    return NATIVE_GOOGLE_SDK_KEY;
  }
}

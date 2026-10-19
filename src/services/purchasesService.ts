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

/** The App Store key only on iOS, the Google Play key only on Android, nothing anywhere else. */
export function resolveNativeStoreKey(): string {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') return NATIVE_APPLE_SDK_KEY;
    if (platform === 'android') return NATIVE_GOOGLE_SDK_KEY;
    return '';
  } catch {
    return '';
  }
}

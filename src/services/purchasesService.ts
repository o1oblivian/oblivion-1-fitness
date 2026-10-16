/**
 * RevenueCat store keys and native platform detection.
 * The store connection itself lives in revenueCatService.
 */
import { Capacitor } from '@capacitor/core';

/** Public SDK keys from RevenueCat (platform-specific). Overridable via env. */
export const NATIVE_APPLE_SDK_KEY = 'appl_bVAQTwbQxZzifRbzmyBjdZohETH';
export const NATIVE_GOOGLE_SDK_KEY = 'goog_WuKUOSxwe1TEDPbjhkcgeIQzqEW';

const env = import.meta.env as Record<string, string | undefined>;

export const appleKey = env.VITE_REVENUECAT_APPLE_KEY || env.REVENUECAT_APPLE_KEY || NATIVE_APPLE_SDK_KEY;
export const googleKey = env.VITE_REVENUECAT_GOOGLE_KEY || env.REVENUECAT_GOOGLE_KEY || NATIVE_GOOGLE_SDK_KEY;

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
    return Capacitor.getPlatform() === 'ios' ? appleKey : googleKey;
  } catch {
    return googleKey;
  }
}

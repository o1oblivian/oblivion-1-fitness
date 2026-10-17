/**
 * RevenueCat store keys and native platform detection.
 * The store connection itself lives in revenueCatService.
 */
import { Capacitor } from '@capacitor/core';

/** Public SDK keys from RevenueCat (platform-specific), used when the build sets none. */
const NATIVE_APPLE_SDK_KEY = 'appl_bVAQIwbQxZzifRbzmyBjdZohETH';
const NATIVE_GOOGLE_SDK_KEY = 'goog_WUkUOSxwelTEdPbjhkcgeIQzqEW';

/**
 * A key set at build time (Codemagic: VITE_REVENUECAT_APPLE_KEY / VITE_REVENUECAT_GOOGLE_KEY)
 * wins over the one in code, so a mistyped key can be fixed without a code change. A value with
 * the wrong prefix (for example the iOS key in the Android slot) is ignored.
 */
export function pickStoreKey(fromBuild: string | undefined, prefix: string, fallback: string) {
  const candidate = fromBuild?.trim();
  return candidate && candidate.startsWith(prefix) ? candidate : fallback;
}

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
  const env = import.meta.env as Record<string, string | undefined>;
  const apple = pickStoreKey(env.VITE_REVENUECAT_APPLE_KEY, 'appl_', NATIVE_APPLE_SDK_KEY);
  const google = pickStoreKey(env.VITE_REVENUECAT_GOOGLE_KEY, 'goog_', NATIVE_GOOGLE_SDK_KEY);
  try {
    return Capacitor.getPlatform() === 'ios' ? apple : google;
  } catch {
    return google;
  }
}

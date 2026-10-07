/**
 * RevenueCat & Native Purchases Configuration Service
 * Handles platform-specific API key resolution and native store initialization.
 */
import { Capacitor } from '@capacitor/core';

export const NATIVE_APPLE_SDK_KEY = 'appl_bVAQIwbQxZzifRbzmyBjdZohETH';
export const NATIVE_GOOGLE_SDK_KEY = 'goog_WUkUOSxwelTEdPbjhkcgeIQzqEW';

export const appleKey =
  import.meta.env.VITE_REVENUECAT_APPLE_KEY ||
  (import.meta.env as any).REVENUECAT_APPLE_KEY ||
  NATIVE_APPLE_SDK_KEY;

export const googleKey =
  import.meta.env.VITE_REVENUECAT_GOOGLE_KEY ||
  (import.meta.env as any).REVENUECAT_GOOGLE_KEY ||
  NATIVE_GOOGLE_SDK_KEY;

export const webBillingKey =
  import.meta.env.VITE_REVENUECAT_WEB_KEY ||
  import.meta.env.VITE_REVENUECAT_API_KEY ||
  (import.meta.env as any).REVENUECAT_WEB_KEY ||
  '';

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
    return Capacitor.getPlatform() === 'ios' ? appleKey || NATIVE_APPLE_SDK_KEY : googleKey || NATIVE_GOOGLE_SDK_KEY;
  } catch {
    return googleKey || NATIVE_GOOGLE_SDK_KEY;
  }
}

export interface PurchasesInitResult {
  configured: boolean;
  platform: 'ios' | 'android' | 'web';
  apiKey?: string;
  nativeInstance?: any;
}

/**
 * Configure and initialize native in-app purchases.
 * Strictly verifies native platform via Capacitor:
 * - On iOS: uses appleKey (appl_...).
 * - On Android: uses googleKey (goog_...).
 * - On web / non-native: skips Purchases.configure() gracefully with a console warning
 *   so the browser preview does not crash.
 */
export async function configurePurchases(appUserId: string = ''): Promise<PurchasesInitResult> {
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

  // Web / LAN / desktop preview: never block the UI on native IAP.
  if (!isNativeStorePlatform()) {
    console.warn(
      `[Purchases] Running on ${platform} (non-native preview). Skipping Purchases.configure() gracefully.`
    );
    return {
      configured: false,
      platform,
    };
  }

  const apiKey = resolveNativeStoreKey();

  if (!appUserId) {
    console.warn('[Purchases] Skipping configure until an authenticated user ID is available.');
    return { configured: false, platform, apiKey };
  }

  if (!apiKey) {
    console.warn(
      `[Purchases] Native platform is ${platform} but no ${platform === 'ios' ? 'Apple' : 'Google'} RevenueCat key configured.`
    );
    return {
      configured: false,
      platform,
    };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    await Purchases.configure({ apiKey, appUserID: appUserId });
    return {
      configured: true,
      platform,
      apiKey,
      nativeInstance: Purchases,
    };
  } catch (err) {
    console.warn('[Purchases] Native Purchases.configure error:', err);
  }

  return {
    configured: false,
    platform,
    apiKey,
  };
}

export const purchasesService = {
  appleKey,
  googleKey,
  webBillingKey,
  configure: configurePurchases,
};

export default purchasesService;

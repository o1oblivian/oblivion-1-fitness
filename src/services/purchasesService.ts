/**
 * RevenueCat & Native Purchases Configuration Service
 * Handles platform-specific API key resolution and native store initialization.
 */
import { Capacitor } from '@capacitor/core';

// 1. REVENUECAT PLATFORM KEY RESOLUTION
export const appleKey =
  import.meta.env.VITE_REVENUECAT_APPLE_KEY ||
  (import.meta.env as any).REVENUECAT_APPLE_KEY ||
  '';

export const googleKey =
  import.meta.env.VITE_REVENUECAT_GOOGLE_KEY ||
  (import.meta.env as any).REVENUECAT_GOOGLE_KEY ||
  '';

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
export async function configurePurchases(appUserId: string = 'default-athlete'): Promise<PurchasesInitResult> {
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

  // 2. NATIVE PLATFORM VERIFICATION
  if (platform !== 'ios' && platform !== 'android') {
    console.warn(
      `[Purchases] Running on ${platform} (non-native preview). Skipping Purchases.configure() gracefully.`
    );
    return {
      configured: false,
      platform,
    };
  }

  const apiKey = platform === 'ios' ? appleKey : googleKey;

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
    const nativePurchases = (window as any)?.Purchases;
    if (nativePurchases && typeof nativePurchases.configure === 'function') {
      await nativePurchases.configure({ apiKey, appUserId });
      return {
        configured: true,
        platform,
        apiKey,
        nativeInstance: nativePurchases,
      };
    }
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
  configure: configurePurchases,
};

export default purchasesService;

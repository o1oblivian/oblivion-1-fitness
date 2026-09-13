import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

const ANDROID_FALLBACK_KEY = 'goog_WUkUOSxwelTEdPbjhkcgeIQzqEW';

// Read RevenueCat API keys directly from environment variables / secrets (import.meta.env and process.env)
const REVENUECAT_APPLE_KEY = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_REVENUECAT_APPLE_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.REVENUECAT_APPLE_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_REVENUECAT_APPLE_API_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.REVENUECAT_APPLE_API_KEY) ||
  (typeof process !== 'undefined' && process?.env?.VITE_REVENUECAT_APPLE_KEY) ||
  (typeof process !== 'undefined' && process?.env?.REVENUECAT_APPLE_KEY) ||
  (typeof process !== 'undefined' && process?.env?.VITE_REVENUECAT_APPLE_API_KEY) ||
  (typeof process !== 'undefined' && process?.env?.REVENUECAT_APPLE_API_KEY) ||
  '';

const REVENUECAT_GOOGLE_KEY = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_REVENUECAT_GOOGLE_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.REVENUECAT_GOOGLE_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_REVENUECAT_GOOGLE_PLAY_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.REVENUECAT_GOOGLE_PLAY_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_REVENUECAT_GOOGLE_API_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.REVENUECAT_GOOGLE_API_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_REVENUECAT_GOOGLE_PLAY_API_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.REVENUECAT_GOOGLE_PLAY_API_KEY) ||
  (typeof process !== 'undefined' && process?.env?.VITE_REVENUECAT_GOOGLE_KEY) ||
  (typeof process !== 'undefined' && process?.env?.REVENUECAT_GOOGLE_KEY) ||
  (typeof process !== 'undefined' && process?.env?.VITE_REVENUECAT_GOOGLE_PLAY_KEY) ||
  (typeof process !== 'undefined' && process?.env?.REVENUECAT_GOOGLE_PLAY_KEY) ||
  (typeof process !== 'undefined' && process?.env?.VITE_REVENUECAT_GOOGLE_API_KEY) ||
  (typeof process !== 'undefined' && process?.env?.REVENUECAT_GOOGLE_API_KEY) ||
  (typeof process !== 'undefined' && process?.env?.VITE_REVENUECAT_GOOGLE_PLAY_API_KEY) ||
  (typeof process !== 'undefined' && process?.env?.REVENUECAT_GOOGLE_PLAY_API_KEY) ||
  ANDROID_FALLBACK_KEY;

let isConfigured = false;
let initPromise: Promise<boolean> | null = null;

export function isIAPConfigured(): boolean {
  return isConfigured;
}

export async function initializeIAP(userId?: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (isConfigured) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const platform = Capacitor.getPlatform();
    let apiKey = platform === 'ios' 
      ? REVENUECAT_APPLE_KEY 
      : REVENUECAT_GOOGLE_KEY;

    // Guarantee Android native fallback is hardcoded so it never initializes with an empty key
    if (platform === 'android' && (!apiKey || apiKey.includes('YOUR_') || apiKey.trim() === '')) {
      apiKey = ANDROID_FALLBACK_KEY;
    }

    if (
      !apiKey ||
      apiKey === 'appl_YOUR_ACTUAL_KEY' || 
      apiKey === 'goog_YOUR_ACTUAL_KEY' || 
      apiKey === 'appl_YOUR_APPLE_API_KEY' || 
      apiKey === 'goog_YOUR_GOOGLE_PLAY_API_KEY'
    ) {
      alert('Please configure your RevenueCat API keys in the project environment or iapService.ts');
      return false;
    }

    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      await Purchases.configure({
        apiKey,
        appUserID: userId || null
      });
      isConfigured = true;
      console.log(`RevenueCat Purchases successfully initialized on ${platform}`);
      return true;
    } catch (err) {
      console.error('Failed to initialize In-App Purchases:', err);
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function getOfferings() {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  if (!isConfigured) {
    await initializeIAP();
  }

  if (!isConfigured) {
    console.warn('RevenueCat not configured when fetching offerings');
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (err) {
    console.error('Failed to get offerings from RevenueCat:', err);
    return null;
  }
}

export async function purchaseSubscription(productId: string = 'com.o1fc.fitness.plus_monthly') {
  if (!Capacitor.isNativePlatform()) {
    alert('Native Store checkout is only available when running on an iOS or Android device.');
    return { success: false, message: 'Web environment' };
  }

  if (!isConfigured) {
    await initializeIAP();
  }

  if (!isConfigured) {
    return { success: false, message: 'RevenueCat not configured' };
  }

  try {
    const { products } = await Purchases.getProducts({ productIdentifiers: [productId] });
    if (!products || products.length === 0) {
      alert(`Product ${productId} not found in store.`);
      return { success: false, message: 'Product not found' };
    }

    const { customerInfo } = await Purchases.purchaseStoreProduct({
      product: products[0]
    });

    const isSubscribed = typeof customerInfo.entitlements.active['pro'] !== 'undefined' ||
                         typeof customerInfo.entitlements.active['O1FC Plus (50km Radius)'] !== 'undefined';

    return { success: isSubscribed, customerInfo };
  } catch (error: any) {
    if (error.code === '1' || error.userCancelled) {
      return { success: false, message: 'User cancelled transaction.' };
    }
    alert('Purchase Failed: ' + (error.message || JSON.stringify(error)));
    return { success: false, message: error.message };
  }
}

export async function restorePurchases() {
  if (!Capacitor.isNativePlatform()) {
    alert('Purchase restoration is only supported on native mobile devices.');
    return { success: false };
  }

  if (!isConfigured) {
    await initializeIAP();
  }

  if (!isConfigured) {
    return { success: false, message: 'RevenueCat not configured' };
  }

  try {
    const { customerInfo } = await Purchases.restorePurchases();
    alert('Purchases restored successfully.');
    return { success: true, customerInfo };
  } catch (error: any) {
    alert('Failed to restore: ' + error.message);
    return { success: false, message: error.message };
  }
}

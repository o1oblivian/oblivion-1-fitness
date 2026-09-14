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

export async function purchaseSubscription(productId: string = 'com.o1fc.fitness.plus_monthly'): Promise<any> {
  if (!Capacitor.isNativePlatform()) {
    alert('Native Store checkout is only available when running on an iOS or Android device.');
    return { success: false, message: 'Web environment' };
  }

  if (!isConfigured) {
    await initializeIAP();
  }

  if (!isConfigured) {
    throw new Error('RevenueCat not configured');
  }

  const offerings = await Purchases.getOfferings();
  const currentOffering = offerings.current;
  if (!currentOffering) throw new Error("No current offering configured in RevenueCat");

  // Find package matching packageType or identifier
  const pkg = currentOffering.availablePackages.find(
    p => p.product.identifier === productId || p.identifier === productId || p.packageType?.toLowerCase()?.includes('monthly')
  );
  if (!pkg) throw new Error("Package not found: " + productId);

  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return customerInfo;
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

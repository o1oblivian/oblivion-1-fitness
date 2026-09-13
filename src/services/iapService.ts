import { Capacitor } from '@capacitor/core';
import { Purchases, PurchasesOfferings, CustomerInfo, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

export interface IAPProduct {
  id: string;
  appleProductId: string;
  googleProductId: string;
  name: string;
  price: string;
  amountCents: number;
  interval: 'month' | 'year' | 'one_time';
  description: string;
}

export const IAP_PRODUCTS: Record<string, IAPProduct> = {
  premium: {
    id: 'premium',
    appleProductId: 'com.o1fc.fitness.plus_monthly',
    googleProductId: 'com.o1fc.fitness.plus_monthly',
    name: 'O1FC Plus (50km Radius)',
    price: '$9.99/mo',
    amountCents: 999,
    interval: 'month',
    description: 'Full workout OS, Fuel macro intelligence & 50km Buddy radar',
  },
  premium_50k: {
    id: 'premium_50k',
    appleProductId: 'com.o1fc.fitness.plus_monthly',
    googleProductId: 'com.o1fc.fitness.plus_monthly',
    name: 'O1FC Plus (50km Radius)',
    price: '$9.99/mo',
    amountCents: 999,
    interval: 'month',
    description: 'Full workout OS, Fuel macro intelligence & 50km Buddy radar',
  },
  premium_50km: {
    id: 'premium_50km',
    appleProductId: 'com.o1fc.fitness.plus_monthly',
    googleProductId: 'com.o1fc.fitness.plus_monthly',
    name: 'O1FC Plus (50km Radius)',
    price: '$9.99/mo',
    amountCents: 999,
    interval: 'month',
    description: 'Full workout OS, Fuel macro intelligence & 50km Buddy radar',
  },
  premium_travel: {
    id: 'premium_travel',
    appleProductId: 'com.o1fc.fitness.travel_monthly',
    googleProductId: 'com.o1fc.fitness.travel_monthly',
    name: 'O1FC Global VIP (Travel Pass)',
    price: '$15.99/mo',
    amountCents: 1599,
    interval: 'month',
    description: 'Unlimited worldwide Buddy Radar, PostGIS global matching & AI Coach Insights',
  },
  coach_pro: {
    id: 'coach_pro',
    appleProductId: 'com.o1fc.fitness.coach_pro_monthly',
    googleProductId: 'com.o1fc.fitness.coach_pro_monthly',
    name: 'O1FC Coach Pro (Unlimited)',
    price: '$29.99/mo',
    amountCents: 2999,
    interval: 'month',
    description: 'Unlimited athlete roster, automated workout dispatch, transformation studio & video monetization',
  },
  founder_pass: {
    id: 'founder_pass',
    appleProductId: 'com.o1fc.fitness.founder_lifetime',
    googleProductId: 'com.o1fc.fitness.founder_lifetime',
    name: 'O1FC Early-Bird Founder Pass',
    price: '$24.00',
    amountCents: 2400,
    interval: 'one_time',
    description: 'Lifetime Training OS Pro, Unlimited Buddy Radar & PostGIS Proximity',
  },
};

// Backwards compatibility alias
export const APPLE_PRODUCTS = IAP_PRODUCTS;

export const TERMS_OF_SERVICE_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const APPLE_EULA_URL = TERMS_OF_SERVICE_URL;
export const PRIVACY_POLICY_URL = 'https://o1fc-official-1.ai.studio';

export type PlatformType = 'ios' | 'android' | 'web';

/**
 * Returns the active platform: 'ios', 'android', or 'web'
 */
export function getAppPlatform(): PlatformType {
  try {
    if (Capacitor.isNativePlatform()) {
      const p = Capacitor.getPlatform();
      if (p === 'ios') return 'ios';
      if (p === 'android') return 'android';
    }
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        return 'ios';
      }
      if (/Android/i.test(ua)) {
        return 'android';
      }
    }
  } catch {}
  return 'web';
}

export function isIosPlatform(): boolean {
  return getAppPlatform() === 'ios';
}

export function isAndroidPlatform(): boolean {
  return getAppPlatform() === 'android';
}

export function isNativePlatform(): boolean {
  return isIosPlatform() || isAndroidPlatform();
}

let isInitialized = false;

/**
 * Safely initialize RevenueCat / native unified In-App Purchases on iOS and Android.
 */
export async function initUnifiedIAP(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  if (isInitialized) return true;

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    const isIos = isIosPlatform();
    const apiKey = isIos
      ? (typeof process !== 'undefined' && process.env?.REVENUECAT_APPLE_KEY) || 'appl_O1FCFitnessClubDefaultKey'
      : (typeof process !== 'undefined' && process.env?.REVENUECAT_GOOGLE_KEY) || 'goog_O1FCFitnessClubDefaultKey';

    await Purchases.configure({ apiKey });
    isInitialized = true;
    console.log(`[IAP] Unified In-App Purchase initialized for ${isIos ? 'iOS (StoreKit)' : 'Android (Google Play)'}`);
    return true;
  } catch (err) {
    console.warn('[IAP] In-App Purchase configuration notice:', err);
    isInitialized = true;
    return false;
  }
}

export const initAppleIAP = initUnifiedIAP;

/**
 * Execute native In-App Purchase transaction for iOS or Android
 */
export async function purchaseNativeSubscription(planId: string): Promise<{ success: boolean; tier: string; error?: string; cancelled?: boolean }> {
  const plan = IAP_PRODUCTS[planId] || IAP_PRODUCTS.premium;
  const targetTier = plan.id;
  const platform = getAppPlatform();

  if (platform === 'web' || !Capacitor.isNativePlatform()) {
    return {
      success: false,
      tier: targetTier,
      error: 'Native In-App Purchase can only be executed on a physical device or emulator',
    };
  }

  const productId = platform === 'android' ? plan.googleProductId : plan.appleProductId;

  try {
    await initUnifiedIAP();

    // 1. Try purchasing package via offerings
    try {
      const offerings: PurchasesOfferings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.product.identifier === productId || p.packageType.toLowerCase().includes('monthly')
      );

      if (pkg) {
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
        if (customerInfo && Object.keys(customerInfo.entitlements.active).length > 0) {
          applyLocalSubscription(targetTier, platform === 'android' ? 'google_play' : 'apple_iap');
          return { success: true, tier: targetTier };
        }
      }
    } catch (offerErr: any) {
      if (offerErr?.userCancelled || offerErr?.code === 1 || offerErr?.message?.toLowerCase().includes('cancel')) {
        return { success: false, tier: targetTier, cancelled: true, error: 'Purchase cancelled.' };
      }
      console.warn('[IAP] Package purchase fallback to direct store product:', offerErr);
    }

    // 2. Direct store product purchase attempt
    try {
      const { customerInfo } = await Purchases.purchaseStoreProduct({
        product: {
          identifier: productId,
          description: plan.description,
          title: plan.name,
          price: plan.amountCents / 100,
          priceString: plan.price,
          currencyCode: 'USD',
        } as any,
      });

      if (customerInfo) {
        applyLocalSubscription(targetTier, platform === 'android' ? 'google_play' : 'apple_iap');
        return { success: true, tier: targetTier };
      }
    } catch (storeErr: any) {
      if (storeErr?.userCancelled || storeErr?.code === 1 || storeErr?.message?.toLowerCase().includes('cancel')) {
        return { success: false, tier: targetTier, cancelled: true, error: 'Purchase cancelled.' };
      }
      return { success: false, tier: targetTier, error: storeErr?.message || 'Store purchase failed.' };
    }

    return {
      success: false,
      tier: targetTier,
      error: 'Unable to verify in-app purchase transaction with the store.',
    };
  } catch (err: any) {
    console.error('[IAP] Purchase error:', err);
    return { success: false, tier: targetTier, error: err?.message || 'Unable to complete in-app purchase.' };
  }
}

export const purchaseAppleSubscription = purchaseNativeSubscription;

/**
 * Restore active In-App Purchases on iOS or Android
 */
export async function restoreNativePurchases(): Promise<{ success: boolean; tier?: string; error?: string }> {
  const platform = getAppPlatform();
  if (platform === 'web') {
    return { success: false, error: 'Restore purchases is available for mobile apps.' };
  }

  try {
    await initUnifiedIAP();
    let restoredTier: string | null = null;

    try {
      const { customerInfo }: { customerInfo: CustomerInfo } = await Purchases.restorePurchases();
      if (customerInfo && customerInfo.entitlements && customerInfo.entitlements.active) {
        const activeKeys = Object.keys(customerInfo.entitlements.active);
        if (activeKeys.length > 0) {
          restoredTier = activeKeys[0].includes('travel')
            ? 'premium_travel'
            : activeKeys[0].includes('coach')
            ? 'coach_pro'
            : 'premium';
        }
      }
    } catch (restoreErr) {
      console.warn('[IAP] Native restore fallback:', restoreErr);
    }

    if (!restoredTier && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('o1fc_active_subscription');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.tier && parsed.tier !== 'free' && parsed.tier !== 'freemium') {
            restoredTier = parsed.tier;
          }
        }
      } catch {}
    }

    if (restoredTier) {
      applyLocalSubscription(restoredTier, platform === 'android' ? 'google_play' : 'apple_iap');
      return { success: true, tier: restoredTier };
    }

    return { success: true, tier: 'freemium' };
  } catch (err: any) {
    console.error('[IAP] Restore error:', err);
    return { success: false, error: err?.message || 'Failed to restore purchases.' };
  }
}

export const restoreApplePurchases = restoreNativePurchases;

/**
 * Store active subscription tier locally and dispatch cross-app notification events
 */
export function applyLocalSubscription(tier: string, provider: 'apple_iap' | 'google_play' | 'stripe' = 'apple_iap'): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'o1fc_active_subscription',
        JSON.stringify({
          tier,
          activatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          provider,
          status: 'active',
        })
      );
      localStorage.setItem('o1fc_cached_tier', tier);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('o1fc-subscription-updated', { detail: { tier, provider } }));
      window.dispatchEvent(new CustomEvent('user_profile_updated', { detail: { subscription_tier: tier } }));
    }
  } catch (e) {
    console.warn('[IAP] Local subscription update warning:', e);
  }
}

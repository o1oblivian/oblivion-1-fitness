import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { type CustomerInfo } from '@revenuecat/purchases-js';
import { supabase } from './supabaseClient';
import { getAuthenticatedUserId } from './authUser';
import { appleKey, googleKey, webBillingKey, isNativeStorePlatform, resolveNativeStoreKey } from './purchasesService';

export { appleKey, googleKey, webBillingKey };
export const REVENUECAT_WEB_BILLING_KEY = webBillingKey;
export const REVENUECAT_ENTITLEMENT_PRO = 'o1fc_pro';
export const REVENUECAT_TIER_MONTHLY = 'o1fc_pro_monthly';
export const REVENUECAT_TIER_TRAVEL = 'o1fc_pro_travel_monthly';
export const REVENUECAT_TIER_FOUNDER = 'o1fc_founder_pass';
const STORAGE_KEY = 'o1fc_revenuecat_entitlements';

export type PlanKind = 'lifetime' | 'monthly' | 'travel' | 'coach';

export function planKind(planId: string): PlanKind {
  const id = planId.toLowerCase();
  if (/founder|lifetime/.test(id)) return 'lifetime';
  if (id.includes('coach')) return 'coach';
  if (id.includes('travel')) return 'travel';
  return 'monthly';
}

const PLAN_NAMES: Record<PlanKind, string> = {
  lifetime: 'O1 Founder Pass (Lifetime)',
  monthly: 'O1 Pass Pro (Monthly)',
  travel: 'O1 Pass Pro + Travel (Monthly)',
  coach: 'O1 Coach Pro (Monthly)',
};

export const REVENUECAT_FALLBACK_MONTHLY_PACKAGE = {
  identifier: '$rc_monthly',
  packageType: 'MONTHLY',
  isFallback: true,
  product: {
    identifier: 'o1fc_monthly_pro',
    title: 'Monthly Pro Access',
    priceString: '$9.99',
    price: 9.99,
  },
  webCheckoutProduct: {
    identifier: 'o1fc_monthly_pro',
    title: 'Monthly Pro Access',
    priceString: '$9.99',
    price: 9.99,
  },
};

function isWebOrLocalPreview(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.endsWith('.local');
  try {
    return isLocal || !Capacitor.isNativePlatform();
  } catch {
    return true;
  }
}

export interface EntitlementInfo {
  isActive: boolean;
  tierId: string;
  tierName: string;
  platform: 'ios' | 'android' | 'web';
  expiresAt: string | null;
  willRenew: boolean;
}

async function resolveAppUserId(preferred?: string): Promise<string | null> {
  if (preferred && preferred !== 'default-athlete' && preferred !== 'athlete-c1') return preferred;
  return getAuthenticatedUserId();
}

class RevenueCatManager {
  private purchasesInstance: any | null = null;
  private configuredUserId: string | null = null;

  isNative = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  };

  async init(appUserId: string = ''): Promise<any | null> {
    if (typeof window === 'undefined') return null;
    const userId = await resolveAppUserId(appUserId);
    if (!userId) return null;

    if (this.isNative()) {
      try {
        const apiKey = resolveNativeStoreKey();
        if (!apiKey) {
          console.warn('[RevenueCat] Native store key missing for', Capacitor.getPlatform());
          return null;
        }
        await Purchases.configure({ apiKey, appUserID: userId });
        this.purchasesInstance = Purchases;
        this.configuredUserId = userId;
        return Purchases;
      } catch (e) {
        console.warn('[RevenueCat] Native initialization fallback:', e);
        return null;
      }
    }

    // Web / localhost / browser: never call purchases-js with store keys (credentials errors).
    return null;
  }

  hasProEntitlement = (info?: CustomerInfo | null): boolean => {
    const a = info?.entitlements?.active as Record<string, unknown> | undefined;
    return Boolean(
      a &&
        (a[REVENUECAT_ENTITLEMENT_PRO] ||
          a[REVENUECAT_TIER_MONTHLY] ||
          a[REVENUECAT_TIER_TRAVEL] ||
          a[REVENUECAT_TIER_FOUNDER])
    );
  };

  private collectRawPackages(offerings: any): any[] {
    const fromCurrent = offerings?.current?.availablePackages;
    if (Array.isArray(fromCurrent) && fromCurrent.length) return fromCurrent;
    const all = offerings?.all && typeof offerings.all === 'object' ? Object.values(offerings.all) : [];
    const nested = all.flatMap((offering: any) =>
      Array.isArray(offering?.availablePackages) ? offering.availablePackages : []
    );
    return nested;
  }

  private collectPackages(offerings: any): any[] {
    return this.collectRawPackages(this.withFallbackOfferings(offerings));
  }

  withFallbackOfferings(offerings: any) {
    const existing = this.collectRawPackages(offerings);
    const packages =
      existing.length === 0 || isWebOrLocalPreview()
        ? existing.length > 0
          ? existing
          : [REVENUECAT_FALLBACK_MONTHLY_PACKAGE]
        : existing;

    return {
      ...(offerings || {}),
      current: {
        ...(offerings?.current || {}),
        identifier: offerings?.current?.identifier || 'default',
        availablePackages: packages,
      },
      all: {
        ...(offerings?.all || {}),
        default: {
          ...(offerings?.all?.default || offerings?.current || {}),
          availablePackages: packages,
        },
      },
    };
  }

  listPackages(offerings?: any): any[] {
    return this.collectPackages(offerings);
  }

  /** The store package for one plan. Each plan only ever resolves to its own kind of product, never a sibling plan. */
  packageForPlan(offerings: any, planId: string): any | null {
    const packages: any[] = this.collectPackages(offerings).filter((pkg) => !pkg?.isFallback);
    const label = (pkg: any) =>
      `${pkg?.identifier || ''} ${pkg?.packageType || ''} ${pkg?.product?.identifier || ''} ${pkg?.webCheckoutProduct?.identifier || ''}`.toLowerCase();
    const exact = packages.find((pkg) =>
      [pkg?.identifier, pkg?.product?.identifier, pkg?.webCheckoutProduct?.identifier].includes(planId),
    );
    if (exact) return exact;
    const kind = planKind(planId);
    return (
      packages.find((pkg) => {
        const l = label(pkg);
        if (kind === 'lifetime') return /founder|lifetime/.test(l);
        if (kind === 'coach') return l.includes('coach');
        if (kind === 'travel') return l.includes('travel');
        return /month/.test(l) && !/travel|coach/.test(l);
      }) || null
    );
  }

  /** True when the purchase result shows this specific plan as owned. */
  ownsPlan(info: any, planId: string): boolean {
    const active = Object.keys((info?.entitlements?.active as Record<string, unknown>) || {});
    const products: string[] = [...(info?.activeSubscriptions || []), ...(info?.allPurchasedProductIdentifiers || [])];
    if (products.some((id) => id === planId || id.startsWith(`${planId}:`))) return true;
    if (planKind(planId) === 'coach') return active.some((id) => id.includes('coach'));
    return this.hasProEntitlement(info);
  }

  async getOfferings(appUserId?: string) {
    try {
      const p = await this.init(appUserId);
      const offerings = p ? await p.getOfferings() : null;
      return this.withFallbackOfferings(offerings?.offerings || offerings);
    } catch {
      return this.withFallbackOfferings(null);
    }
  }

  async purchasePackage(
    planId: string = REVENUECAT_TIER_MONTHLY,
    athleteId: string = ''
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await resolveAppUserId(athleteId);
      if (!userId) {
        return { success: false, error: 'Sign in to subscribe.' };
      }

      if (!isNativeStorePlatform()) {
        return {
          success: false,
          error: 'Subscribe in the iOS or Android app to complete checkout.',
        };
      }

      const client = await this.init(userId);
      if (!client) {
        return { success: false, error: 'Store billing is unavailable on this device.' };
      }

      const offeringsResult = await client.getOfferings?.();
      const offerings = this.withFallbackOfferings(offeringsResult?.offerings || offeringsResult);
      const pkg = this.packageForPlan(offerings, planId);
      if (!pkg) {
        return { success: false, error: 'No store product is available for this plan yet.' };
      }

      let customerInfo: CustomerInfo | null = null;
      if (typeof client.purchasePackage === 'function') {
        const result = await client.purchasePackage({ aPackage: pkg });
        customerInfo = result?.customerInfo || result || null;
      } else {
        return { success: false, error: 'Store billing is unavailable on this device.' };
      }

      const owned = this.ownsPlan(customerInfo, planId);
      if (owned) {
        const platform = Capacitor.getPlatform() === 'android' ? 'android' : 'ios';
        await this.persistSuccess(planId, userId, platform);
      }
      return owned
        ? { success: true }
        : { success: false, error: 'Purchase completed but the plan was not found on this account yet. Try Restore Purchases.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[RevenueCat] Store billing error:', err);
      if (
        message.toLowerCase().includes('cancel') ||
        (err as { errorCode?: number })?.errorCode === 1
      ) {
        return { success: false, error: 'Checkout cancelled.' };
      }
      if (/credential|invalid api key/i.test(message)) {
        return { success: false, error: 'Store billing is unavailable on this device.' };
      }
      return { success: false, error: message || 'Store billing error.' };
    }
  }

  async persistSuccess(planId: string, athleteId: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    if (!athleteId) return;
    const info: EntitlementInfo = {
      isActive: true,
      tierId: planId,
      tierName: PLAN_NAMES[planKind(planId)],
      platform,
      expiresAt: planKind(planId) === 'lifetime' ? null : '2099-12-31T23:59:59Z',
      willRenew: planKind(planId) !== 'lifetime',
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
        localStorage.setItem(
          'o1fc_subscription_status',
          JSON.stringify({
            isActive: true,
            tierId: planId,
            tierName: info.tierName,
            platform,
            expirationDate: null,
            willRenew: info.willRenew,
          })
        );
      } catch {}
    }
    try {
      await supabase.from('user_entitlements').upsert({
        user_id: athleteId,
        tier: planId,
        status: 'active',
        platform,
        updated_at: new Date().toISOString(),
      });
      await supabase
        .from('athlete_profiles')
        .update({ membership_tier: planId, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', athleteId);
    } catch {}
  }

  async getCustomerEntitlements(userId: string = ''): Promise<EntitlementInfo> {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.isActive === 'boolean') return parsed;
        }
      } catch {}
    }
    try {
      const p = await this.init(userId);
      const info = await p?.getCustomerInfo?.();
      if (this.hasProEntitlement(info)) {
        const platform = this.isNative() ? (Capacitor.getPlatform() === 'android' ? 'android' : 'ios') : 'web';
        await this.persistSuccess(REVENUECAT_TIER_MONTHLY, (await resolveAppUserId(userId)) || '', platform);
        return {
          isActive: true,
          tierId: REVENUECAT_TIER_MONTHLY,
          tierName: 'O1 Pass Pro (Verified)',
          platform,
          expiresAt: null,
          willRenew: true,
        };
      }
    } catch {}
    return {
      isActive: false,
      tierId: 'o1fc_core_free',
      tierName: 'Core Athlete',
      platform: this.isNative() ? 'ios' : 'web',
      expiresAt: null,
      willRenew: false,
    };
  }

  async restore(userId: string = ''): Promise<{ success: boolean; info: EntitlementInfo }> {
    try {
      await this.init(userId);
      const nativeP = (window as any)?.Purchases;
      if (this.isNative() && nativeP?.restorePurchases) {
        const res = await nativeP.restorePurchases();
        if (this.hasProEntitlement(res?.customerInfo || res)) {
          const platform = Capacitor.getPlatform() === 'android' ? 'android' : 'ios';
          await this.persistSuccess(REVENUECAT_TIER_MONTHLY, await resolveAppUserId(userId) || '', platform);
        }
      } else {
        const info = await this.purchasesInstance?.getCustomerInfo?.();
        if (this.hasProEntitlement(info)) {
          await this.persistSuccess(REVENUECAT_TIER_MONTHLY, await resolveAppUserId(userId) || '', 'web');
        }
      }
    } catch (err) {
      console.warn('[RevenueCat] Restore failed:', err);
    }
    const info = await this.getCustomerEntitlements(userId);
    return { success: info.isActive, info };
  }
}

export const revenueCatService = new RevenueCatManager();
export const executeMembershipPurchase = (p: string, a: string = '') =>
  revenueCatService.purchasePackage(p, a);
export const restorePurchases = async (a: string = '') => {
  const r = await revenueCatService.restore(a);
  return { success: r.success, isPro: r.info.isActive };
};

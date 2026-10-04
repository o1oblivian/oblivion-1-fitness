import { Capacitor } from '@capacitor/core';
import { Purchases, type Package, type CustomerInfo } from '@revenuecat/purchases-js';
import { supabase } from './supabaseClient';
import { appleKey, googleKey } from './purchasesService';

export { appleKey, googleKey };
export const REVENUECAT_WEB_BILLING_KEY = 'rcb_FyTrwaYRNbRxDuYZuEeksYMwXwam', REVENUECAT_ENTITLEMENT_PRO = 'pro', REVENUECAT_TIER_MONTHLY = 'o1fc_pro_monthly', REVENUECAT_TIER_ANNUAL = 'o1fc_pro_annual';
const STORAGE_KEY = 'o1fc_revenuecat_entitlements';

export interface EntitlementInfo {
  isActive: boolean; tierId: string; tierName: string; platform: 'ios' | 'android' | 'web'; expiresAt: string | null; willRenew: boolean;
}

class RevenueCatManager {
  private purchasesInstance: Purchases | null = null;
  isNative = (): boolean => {
    if (typeof window === 'undefined') return false;
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android';
  };

  async init(appUserId: string = 'default-athlete'): Promise<Purchases | null> {
    if (typeof window === 'undefined') return null;
    const platform = Capacitor.getPlatform();

    if (platform !== 'ios' && platform !== 'android') {
      console.warn(`[RevenueCat] Non-native platform (${platform}). Skipping Purchases.configure() gracefully to prevent preview crash.`);
      return null;
    }

    try {
      const nativePurchases = (window as any)?.Purchases;
      const apiKey = platform === 'ios' ? appleKey : googleKey;
      if (apiKey && nativePurchases?.configure) {
        await nativePurchases.configure({ apiKey, appUserId });
        return nativePurchases;
      }
      return nativePurchases || null;
    } catch (e) {
      console.warn('[RevenueCat Safe Guard] Initialization fallback:', e);
      return null;
    }
  }

  private async handleStripeRedirectReturn(userId: string): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (url.searchParams.has('session_id') || url.searchParams.get('rc_status') === 'success') {
        const info = await this.purchasesInstance?.getCustomerInfo();
        if (this.hasProEntitlement(info)) await this.persistSuccess(REVENUECAT_TIER_MONTHLY, userId, 'web');
      }
    } catch {}
  }

  hasProEntitlement = (info?: CustomerInfo | null): boolean => {
    const a = info?.entitlements?.active;
    return Boolean(a && (a[REVENUECAT_ENTITLEMENT_PRO] || a[REVENUECAT_TIER_MONTHLY] || a['o1fc_pro']));
  };

  async getOfferings(appUserId?: string) {
    try {
      const p = await this.init(appUserId);
      return p ? await p.getOfferings() : null;
    } catch { return null; }
  }

  async purchasePackage(planId: string = REVENUECAT_TIER_MONTHLY, athleteId: string = 'default-athlete'): Promise<{ success: boolean; error?: string }> {
    try {
      const p = await this.init(athleteId);
      if (this.isNative()) {
        const nativeP = (window as any)?.Purchases;
        const offerings = await nativeP?.getOfferings();
        const pkg = offerings?.current?.availablePackages?.find((i: any) => i.identifier === planId) || offerings?.current?.availablePackages?.[0];
        if (pkg) {
          const { customerInfo } = await nativeP.purchasePackage(pkg);
          const isPro = this.hasProEntitlement(customerInfo);
          if (isPro) await this.persistSuccess(planId, athleteId, 'ios');
          return { success: isPro };
        }
      }
      if (p) {
        const offerings = await p.getOfferings();
        const offering = offerings?.current || Object.values(offerings?.all || {})[0];
        const pkg = offering?.availablePackages?.find((i: Package) => i.identifier === planId || i.identifier.includes('monthly')) || offering?.availablePackages?.[0];
        if (pkg) {
          const res = await p.purchasePackage(pkg);
          const isPro = this.hasProEntitlement(res.customerInfo);
          if (isPro) await this.persistSuccess(planId, athleteId, 'web');
          return { success: isPro };
        }
      }
    } catch (err: any) {
      if (err?.errorCode === 1 || err?.message?.includes('cancelled')) return { success: false, error: 'Checkout cancelled.' };
      return { success: false, error: err?.message || 'Store billing error.' };
    }
    // Strictly report clean status banner if offerings unconfigured or running outside native app store
    return {
      success: false,
      error: 'Membership Tier Available via App Store / Google Play',
    };
  }

  async persistSuccess(planId: string, athleteId: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    const info: EntitlementInfo = { isActive: true, tierId: planId, tierName: planId.includes('annual') ? 'O1 Pass Pro (Annual)' : 'O1 Pass Pro (Monthly)', platform, expiresAt: '2099-12-31T23:59:59Z', willRenew: true };
    if (typeof window !== 'undefined') { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(info)); } catch {} }
    try {
      await supabase.from('user_entitlements').upsert({ user_id: athleteId, tier: planId, status: 'active', platform, updated_at: new Date().toISOString() });
      await supabase.from('athlete_profiles').update({ membership_tier: planId, status: 'active', updated_at: new Date().toISOString() }).eq('id', athleteId);
    } catch {}
  }

  async getCustomerEntitlements(userId: string = 'default-athlete'): Promise<EntitlementInfo> {
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
      const info = await p?.getCustomerInfo();
      if (this.hasProEntitlement(info)) {
        await this.persistSuccess(REVENUECAT_TIER_MONTHLY, userId, 'web');
        return { isActive: true, tierId: REVENUECAT_TIER_MONTHLY, tierName: 'O1 Pass Pro (Verified)', platform: 'web', expiresAt: null, willRenew: true };
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

  async restore(userId: string = 'default-athlete'): Promise<{ success: boolean; info: EntitlementInfo }> {
    try {
      const p = await this.init(userId);
      if (this.isNative()) {
        const nativeP = (window as any)?.Purchases;
        const res = await nativeP?.restorePurchases();
        if (this.hasProEntitlement(res?.customerInfo || res)) {
          await this.persistSuccess(REVENUECAT_TIER_MONTHLY, userId, 'ios');
        }
      } else if (p) {
        const info = await p.getCustomerInfo();
        if (this.hasProEntitlement(info)) {
          await this.persistSuccess(REVENUECAT_TIER_MONTHLY, userId, 'web');
        }
      }
    } catch {}
    const info = await this.getCustomerEntitlements(userId);
    return { success: info.isActive, info };
  }
}

export const revenueCatService = new RevenueCatManager();
export const executeMembershipPurchase = (p: string, a: string = 'default-athlete') => revenueCatService.purchasePackage(p, a);
export const restorePurchases = async (a: string = 'default-athlete') => {
  const r = await revenueCatService.restore(a);
  return { success: r.success, isPro: r.info.isActive };
};

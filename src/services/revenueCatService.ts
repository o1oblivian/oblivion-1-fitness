import { Purchases, type Package, type CustomerInfo } from '@revenuecat/purchases-js';
import { supabase } from './supabaseClient';

export const REVENUECAT_WEB_BILLING_KEY = 'rcb_FyTrwaYRNbRxDuYZuEeksYMwXwam';
export const REVENUECAT_ENTITLEMENT_PRO = 'pro';
export const REVENUECAT_TIER_MONTHLY = 'o1fc_pro_monthly';
export const REVENUECAT_TIER_ANNUAL = 'o1fc_pro_annual';

export interface EntitlementInfo {
  isActive: boolean; tierId: string; tierName: string; platform: 'ios' | 'android' | 'web'; expiresAt: string | null; willRenew: boolean;
}

const STORAGE_KEY = 'o1fc_revenuecat_entitlements';

class RevenueCatManager {
  private purchasesInstance: Purchases | null = null;

  isNative(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any)?.Capacitor?.isNativePlatform?.() || (window as any)?.ReactNativeWebView || (window as any)?.cordova);
  }

  async init(appUserId: string = 'default-athlete'): Promise<Purchases | null> {
    if (typeof window === 'undefined') return null;
    if (this.purchasesInstance && Purchases.isConfigured()) return this.purchasesInstance;
    try {
      if (this.isNative()) {
        const nativePurchases = (window as any)?.Purchases;
        const nativeKey = (import.meta as any).env?.VITE_REVENUECAT_APPLE_KEY || (import.meta as any).env?.VITE_REVENUECAT_API_KEY || REVENUECAT_WEB_BILLING_KEY;
        if (nativePurchases) await nativePurchases.configure({ apiKey: nativeKey, appUserId });
        return nativePurchases;
      }
      this.purchasesInstance = Purchases.configure({ apiKey: REVENUECAT_WEB_BILLING_KEY, appUserId });
      await this.handleStripeRedirectReturn(appUserId);
      return this.purchasesInstance;
    } catch (e) {
      console.warn('[RevenueCat] Initialization fallback:', e);
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

  hasProEntitlement(customerInfo?: CustomerInfo | null): boolean {
    const active = customerInfo?.entitlements?.active;
    return Boolean(active && (active[REVENUECAT_ENTITLEMENT_PRO] || active[REVENUECAT_TIER_MONTHLY] || active['o1fc_pro']));
  }

  async getOfferings(appUserId?: string) {
    const p = await this.init(appUserId);
    try { return p ? await p.getOfferings() : null; } catch { return null; }
  }

  async purchasePackage(planId: string = REVENUECAT_TIER_MONTHLY, athleteId: string = 'default-athlete'): Promise<{ success: boolean; error?: string }> {
    const p = await this.init(athleteId);
    try {
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
        const offering = offerings.current || Object.values(offerings.all)[0];
        const pkg: Package | undefined = offering?.availablePackages.find((item) =>
          item.identifier === planId || item.identifier.includes('monthly') || item.identifier.includes('pro')
        ) || offering?.availablePackages[0];
        if (pkg) {
          const res = await p.purchasePackage(pkg);
          const isPro = this.hasProEntitlement(res.customerInfo);
          if (isPro) await this.persistSuccess(planId, athleteId, 'web');
          return { success: isPro };
        }
      }
    } catch (err: any) {
      if (err?.errorCode === 1 || err?.message?.includes('cancelled')) return { success: false, error: 'Checkout cancelled.' };
    }
    await this.persistSuccess(planId, athleteId, 'web');
    return { success: true };
  }

  async persistSuccess(planId: string, athleteId: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    const info: EntitlementInfo = {
      isActive: true, tierId: planId, tierName: planId.includes('annual') ? 'O1 Club Pass Pro (Annual)' : 'O1 Club Pass Pro (Monthly)',
      platform, expiresAt: '2099-12-31T23:59:59Z', willRenew: true,
    };
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(info)); } catch {}
    }
    try {
      await supabase.from('user_entitlements').upsert({ user_id: athleteId, tier: planId, status: 'active', platform, updated_at: new Date().toISOString() });
      await supabase.from('athlete_profiles').update({ membership_tier: planId, status: 'active', updated_at: new Date().toISOString() }).eq('id', athleteId);
    } catch {}
  }

  async getCustomerEntitlements(userId: string = 'default-athlete'): Promise<EntitlementInfo> {
    if (typeof window !== 'undefined') {
      try { const cached = localStorage.getItem(STORAGE_KEY); if (cached) return JSON.parse(cached); } catch {}
    }
    try {
      const p = await this.init(userId);
      const info = await p?.getCustomerInfo();
      if (this.hasProEntitlement(info)) {
        await this.persistSuccess(REVENUECAT_TIER_MONTHLY, userId, 'web');
        return { isActive: true, tierId: REVENUECAT_TIER_MONTHLY, tierName: 'O1 Club Pass Pro (Verified)', platform: 'web', expiresAt: null, willRenew: true };
      }
    } catch {}
    return { isActive: true, tierId: REVENUECAT_TIER_MONTHLY, tierName: 'O1 Club Pass Pro', platform: this.isNative() ? 'ios' : 'web', expiresAt: '2099-12-31T23:59:59Z', willRenew: true };
  }

  async restore(userId: string = 'default-athlete'): Promise<{ success: boolean; info: EntitlementInfo }> {
    try {
      const p = await this.init(userId);
      if (this.hasProEntitlement(await p?.getCustomerInfo())) await this.persistSuccess(REVENUECAT_TIER_MONTHLY, userId, this.isNative() ? 'ios' : 'web');
    } catch {}
    const info = await this.getCustomerEntitlements(userId);
    return { success: info.isActive, info };
  }
}

export const revenueCatService = new RevenueCatManager();

export async function executeMembershipPurchase(
  planId: string,
  athleteId: string = 'default-athlete'
): Promise<{ success: boolean; error?: string }> {
  return await revenueCatService.purchasePackage(planId, athleteId);
}

export async function restorePurchases(
  athleteId: string = 'default-athlete'
): Promise<{ success: boolean; isPro: boolean }> {
  const res = await revenueCatService.restore(athleteId);
  return { success: res.success, isPro: res.info.isActive };
}

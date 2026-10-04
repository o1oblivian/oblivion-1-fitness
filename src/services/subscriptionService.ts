import { revenueCatService } from './revenueCatService';

export const PLUS_ENTITLEMENT = 'com.o1fc.fitness.plus_monthly';
export type MembershipTierId = 'com.o1fc.fitness.plus_monthly' | 'coach_pro_monthly' | 'coach_pro_annual' | 'coach_pro_unlimited';

export interface SubscriptionStatus {
  isActive: boolean;
  tierId: string;
  tierName: string;
  platform: 'ios' | 'android' | 'web';
  expirationDate: string | null;
  willRenew: boolean;
}

const STORAGE_KEY = 'o1fc_subscription_status';

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any)?.Capacitor?.isNativePlatform?.());
}

export function checkSubscriptionStatus(): SubscriptionStatus {
  const isNative = isNativePlatform();
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return {
    isActive: false,
    tierId: 'o1fc_core_free',
    tierName: 'Core Athlete',
    platform: isNative ? 'ios' : 'web',
    expirationDate: null,
    willRenew: false,
  };
}

export async function initializeIAP(userId?: string): Promise<void> {
  await revenueCatService.init(userId || 'default-athlete');
}

export async function purchasePro(
  tierId: string = PLUS_ENTITLEMENT
): Promise<{ success: boolean; isPro: boolean; status: SubscriptionStatus }> {
  const res = await revenueCatService.purchasePackage(tierId);
  const isNative = isNativePlatform();
  if (res.success) {
    const newStatus: SubscriptionStatus = {
      isActive: true,
      tierId,
      tierName: tierId === PLUS_ENTITLEMENT ? 'O1 Club Pass Pro' : tierId.replace(/_/g, ' ').toUpperCase(),
      platform: isNative ? 'ios' : 'web',
      expirationDate: null,
      willRenew: true,
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStatus));
      } catch {}
    }
    return { success: true, isPro: true, status: newStatus };
  }
  const current = checkSubscriptionStatus();
  return { success: false, isPro: current.isActive, status: current };
}

export async function restorePurchases(): Promise<{ success: boolean; isPro: boolean; status: SubscriptionStatus }> {
  const res = await revenueCatService.restore();
  const current: SubscriptionStatus = {
    isActive: res.success,
    tierId: res.info.tierId,
    tierName: res.info.tierName,
    platform: res.info.platform,
    expirationDate: res.info.expiresAt,
    willRenew: res.info.willRenew,
  };
  return { success: res.success, isPro: res.success, status: current };
}

export const purchaseMembershipTier = purchasePro;

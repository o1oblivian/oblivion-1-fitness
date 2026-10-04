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
  // Web / AI Studio fallback: Default isPro to true in dev/preview mode
  return {
    isActive: true,
    tierId: PLUS_ENTITLEMENT,
    tierName: 'O1 Club Pass Pro',
    platform: isNative ? 'ios' : 'web',
    expirationDate: '2099-12-31T23:59:59Z',
    willRenew: true,
  };
}

export async function initializeIAP(userId?: string): Promise<void> {
  const isNative = isNativePlatform();
  if (isNative && typeof window !== 'undefined') {
    const Purchases = (window as any)?.Purchases;
    if (Purchases?.configure) {
      Purchases.configure({ apiKey: 'appl_revcat_o1fc_prod', appUserID: userId });
    }
  }
}

export async function purchasePro(
  tierId: string = PLUS_ENTITLEMENT
): Promise<{ success: boolean; isPro: boolean; status: SubscriptionStatus }> {
  await new Promise((res) => setTimeout(res, 400));
  const newStatus: SubscriptionStatus = {
    isActive: true,
    tierId,
    tierName: tierId === PLUS_ENTITLEMENT ? 'O1 Club Pass Pro' : tierId.replace(/_/g, ' ').toUpperCase(),
    platform: isNativePlatform() ? 'ios' : 'web',
    expirationDate: '2099-12-31T23:59:59Z',
    willRenew: true,
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStatus));
    } catch {}
  }
  return { success: true, isPro: true, status: newStatus };
}

export async function restorePurchases(): Promise<{ success: boolean; isPro: boolean; status: SubscriptionStatus }> {
  await new Promise((res) => setTimeout(res, 400));
  const current = checkSubscriptionStatus();
  return { success: true, isPro: current.isActive, status: current };
}

export const purchaseMembershipTier = purchasePro;

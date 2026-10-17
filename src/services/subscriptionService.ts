import { Capacitor } from '@capacitor/core';
import {
  revenueCatService,
  readCachedEntitlement,
  type EntitlementInfo,
  type StorePlatform,
} from './revenueCatService';

/** Default paid product to purchase when Settings opens the paywall (maps to Google `o1fc_pro_monthly:monthly`). */
export const PLUS_ENTITLEMENT = 'o1fc_pro_monthly';
export interface SubscriptionStatus {
  isActive: boolean;
  tierId: string;
  tierName: string;
  platform: StorePlatform;
  expirationDate: string | null;
  willRenew: boolean;
}

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function toStatus(info: EntitlementInfo): SubscriptionStatus {
  return {
    isActive: info.isActive,
    tierId: info.tierId,
    tierName: info.tierName,
    platform: info.platform,
    expirationDate: info.expiresAt,
    willRenew: info.willRenew,
  };
}

/** Last plan the store confirmed on this device. Expired plans read as free. */
export function checkSubscriptionStatus(): SubscriptionStatus {
  const cached = readCachedEntitlement();
  if (cached) return toStatus(cached);
  return {
    isActive: false,
    tierId: 'o1fc_core_free',
    tierName: 'Core Athlete',
    platform: isNativePlatform()
      ? Capacitor.getPlatform() === 'android'
        ? 'android'
        : 'ios'
      : 'web',
    expirationDate: null,
    willRenew: false,
  };
}

export async function initializeIAP(userId?: string): Promise<void> {
  await revenueCatService.init(userId || '');
}

/** The store's answer right now, or null when the store can't be reached (offline, web). */
export async function verifySubscriptionWithStore(
  userId?: string,
): Promise<SubscriptionStatus | null> {
  const info = await revenueCatService.verifyWithStore(userId || '');
  return info ? toStatus(info) : null;
}

export async function purchasePro(
  tierId: string = PLUS_ENTITLEMENT,
): Promise<{ success: boolean; isPro: boolean; status: SubscriptionStatus }> {
  const res = await revenueCatService.purchasePackage(tierId);
  const status = checkSubscriptionStatus();
  return { success: res.success, isPro: status.isActive, status };
}

export async function restorePurchases(): Promise<{
  success: boolean;
  isPro: boolean;
  status: SubscriptionStatus;
}> {
  const res = await revenueCatService.restore();
  return { success: res.success, isPro: res.success, status: toStatus(res.info) };
}

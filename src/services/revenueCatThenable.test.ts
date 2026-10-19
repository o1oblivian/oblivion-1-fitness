import { describe, expect, it, vi } from 'vitest';

/**
 * Capacitor plugins are proxies that answer any property name with a function, `then` included.
 * Handing one back from an async function makes JavaScript call that `then`, which on a phone is sent
 * to the native side and never answered. This mock behaves the same way, so any billing path that
 * returns or resolves with the plugin itself hangs here exactly as it did on the device.
 */
const purchases = vi.hoisted(() => ({
  isConfigured: vi.fn(),
  configure: vi.fn(),
  logIn: vi.fn(),
  logOut: vi.fn(),
  getOfferings: vi.fn(),
  getCustomerInfo: vi.fn(),
  restorePurchases: vi.fn(),
  purchasePackage: vi.fn(),
  then: vi.fn(() => undefined),
}));

vi.mock('@revenuecat/purchases-capacitor', () => ({ Purchases: purchases }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true },
}));
vi.mock('./supabaseClient', () => ({ supabase: {} }));
vi.mock('./authUser', () => ({ getAuthenticatedUserId: async () => 'user-1' }));
vi.mock('./purchasesService', () => ({
  isNativeStorePlatform: () => true,
  resolveNativeStoreKey: () => 'goog_test_key',
}));

import { revenueCatService } from './revenueCatService';

const monthly = {
  identifier: '$rc_monthly',
  packageType: 'MONTHLY',
  product: { identifier: 'o1fc_pro_monthly:monthly', priceString: '$9.99' },
};
const info = {
  entitlements: { active: {} },
  allPurchasedProductIdentifiers: [],
  activeSubscriptions: [],
  allExpirationDates: {},
};

describe('billing never hands the store plugin back as a value', () => {
  it('loads prices even though the plugin looks like a promise that never settles', async () => {
    purchases.isConfigured.mockResolvedValue({ isConfigured: false });
    purchases.configure.mockResolvedValue(undefined);
    purchases.getOfferings.mockResolvedValue({
      current: { availablePackages: [monthly] },
      all: {},
    });
    await revenueCatService.logOut();

    const catalog = await Promise.race([
      revenueCatService.getOfferings('user-1'),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2_000)),
    ]);

    expect(catalog).not.toBeNull();
    expect(catalog?.packages).toHaveLength(1);
    expect(purchases.then).not.toHaveBeenCalled();
  });

  it('reads the customer and restores purchases without touching the plugin as a promise', async () => {
    purchases.getCustomerInfo.mockResolvedValue({ customerInfo: info });
    purchases.restorePurchases.mockResolvedValue({ customerInfo: info });

    const verified = await Promise.race([
      revenueCatService.verifyWithStore('user-1'),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2_000)),
    ]);
    const restored = await Promise.race([
      revenueCatService.restore('user-1'),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2_000)),
    ]);

    expect(verified?.isActive).toBe(false);
    expect(restored?.success).toBe(false);
    expect(purchases.then).not.toHaveBeenCalled();
  });
});

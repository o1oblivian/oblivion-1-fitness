import { beforeEach, describe, expect, it, vi } from 'vitest';

const purchases = vi.hoisted(() => ({
  isConfigured: vi.fn(),
  configure: vi.fn(),
  logIn: vi.fn(),
  logOut: vi.fn(),
  getOfferings: vi.fn(),
  getCustomerInfo: vi.fn(),
  restorePurchases: vi.fn(),
  purchasePackage: vi.fn(),
}));

vi.mock('@revenuecat/purchases-capacitor', () => ({ Purchases: purchases }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true },
}));
vi.mock('./supabaseClient', () => ({ supabase: {} }));
vi.mock('./authUser', () => ({
  getAuthenticatedUserId: async () => 'user-1',
  getCachedUserId: async () => 'user-1',
}));
vi.mock('./purchasesService', () => ({
  isNativeStorePlatform: () => true,
  resolveNativeStoreKey: () => 'goog_test_key',
}));

import { isAlreadyOwnedError, revenueCatService } from './revenueCatService';

const founder = {
  identifier: '$rc_lifetime',
  packageType: 'LIFETIME',
  product: { identifier: 'o1fc_founder_pass', priceString: '$34.99' },
};

const none = {
  entitlements: { active: {} },
  allPurchasedProductIdentifiers: [],
  activeSubscriptions: [],
  allExpirationDates: {},
};

const ownsFounder = {
  entitlements: { active: {} },
  allPurchasedProductIdentifiers: ['o1fc_founder_pass'],
  activeSubscriptions: [],
  allExpirationDates: {},
};

const alreadyActive = {
  code: '6',
  message: 'This product is already active for the user.',
  underlyingErrorMessage: 'You already own this item.',
};

describe('a plan the store says is already owned', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    purchases.isConfigured.mockResolvedValue({ isConfigured: false });
    purchases.configure.mockResolvedValue(undefined);
    purchases.logOut.mockResolvedValue(undefined);
    purchases.getOfferings.mockResolvedValue({
      current: { availablePackages: [founder] },
      all: {},
    });
    await revenueCatService.logOut();
  });

  it('recognises the RevenueCat and Google Play wording', () => {
    expect(isAlreadyOwnedError(alreadyActive)).toBe(true);
    expect(isAlreadyOwnedError({ code: '6' })).toBe(true);
    expect(isAlreadyOwnedError(new Error('You already own this item.'))).toBe(true);
    expect(isAlreadyOwnedError({ code: '1', message: 'Purchase was cancelled.' })).toBe(false);
    expect(isAlreadyOwnedError(new Error('Network error'))).toBe(false);
  });

  it('restores the purchase and unlocks the plan instead of showing an error', async () => {
    purchases.purchasePackage.mockRejectedValue(alreadyActive);
    purchases.restorePurchases.mockResolvedValue({ customerInfo: ownsFounder });

    const result = await revenueCatService.purchasePackage('o1fc_founder_pass', 'user-1');

    expect(result).toEqual({ success: true });
    expect(purchases.restorePurchases).toHaveBeenCalledTimes(1);
  });

  it('says the account is not linked when the restore finds nothing', async () => {
    purchases.purchasePackage.mockRejectedValue(alreadyActive);
    purchases.restorePurchases.mockResolvedValue({ customerInfo: none });

    const result = await revenueCatService.purchasePackage('o1fc_founder_pass', 'user-1');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already bought/i);
    expect(result.error).toMatch(/Restore Purchases/);
  });

  it('leaves a cancelled checkout alone and does not restore', async () => {
    purchases.purchasePackage.mockRejectedValue({ code: '1', userCancelled: true });

    const result = await revenueCatService.purchasePackage('o1fc_founder_pass', 'user-1');

    expect(result).toEqual({ success: false, error: 'Checkout cancelled.' });
    expect(purchases.restorePurchases).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const purchases = vi.hoisted(() => ({
  isConfigured: vi.fn(),
  configure: vi.fn(),
  logIn: vi.fn(),
  logOut: vi.fn(),
  getOfferings: vi.fn(),
}));

vi.mock('@revenuecat/purchases-capacitor', () => ({ Purchases: purchases }));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true } }));
vi.mock('./supabaseClient', () => ({ supabase: {} }));
vi.mock('./authUser', () => ({ getAuthenticatedUserId: async () => 'user-1' }));
vi.mock('./purchasesService', () => ({
  isNativeStorePlatform: () => true,
  resolveNativeStoreKey: () => 'goog_test_key',
}));

import { revenueCatService } from './revenueCatService';

describe('store diagnostics', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    purchases.isConfigured.mockResolvedValue({ isConfigured: false });
    purchases.logOut.mockResolvedValue(undefined);
    await revenueCatService.logOut();
  });

  it('says why the store could not connect', async () => {
    purchases.configure.mockRejectedValue(new Error('Invalid API key'));
    const res = await revenueCatService.purchasePackage('o1fc_pro_monthly', 'user-1');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Billing is unavailable.');
    expect(res.error).toContain('Invalid API key');
    expect(revenueCatService.lastIssue).toContain('Invalid API key');
  });

  it('says when the store connects but has no products', async () => {
    purchases.configure.mockResolvedValue(undefined);
    purchases.getOfferings.mockResolvedValue({ current: null, all: {} });
    const catalog = await revenueCatService.getOfferings('user-1');
    expect(catalog.packages).toEqual([]);
    expect(revenueCatService.lastIssue).toContain('returned no products');
  });

  it('reports no issue once products load', async () => {
    purchases.configure.mockResolvedValue(undefined);
    purchases.getOfferings.mockResolvedValue({
      current: { availablePackages: [{ identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'o1fc_pro_monthly:monthly' } }] },
      all: {},
    });
    const catalog = await revenueCatService.getOfferings('user-1');
    expect(catalog.packages).toHaveLength(1);
    expect(revenueCatService.lastIssue).toBeNull();
  });
});

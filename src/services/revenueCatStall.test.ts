import { describe, expect, it, vi } from 'vitest';

const purchases = vi.hoisted(() => ({
  isConfigured: vi.fn(),
  configure: vi.fn(),
  logIn: vi.fn(),
  logOut: vi.fn(),
  getOfferings: vi.fn(),
}));

vi.mock('@revenuecat/purchases-capacitor', () => ({ Purchases: purchases }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true },
}));
// Sign-in service that never answers: the worst case for the account lookup that runs before the store.
vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => new Promise(() => undefined),
      getUser: () => new Promise(() => undefined),
    },
  },
}));
vi.mock('./purchasesService', () => ({
  isNativeStorePlatform: () => true,
  resolveNativeStoreKey: () => 'goog_test_key',
}));

import { revenueCatService } from './revenueCatService';

describe('a stuck sign-in service', () => {
  it('still ends the product request in well under a minute, with a reason', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      purchases.isConfigured.mockResolvedValue({ isConfigured: false });
      const pending = revenueCatService.getOfferings();
      await vi.advanceTimersByTimeAsync(45_000);
      const catalog = await pending;
      expect(catalog.packages).toEqual([]);
      expect(revenueCatService.lastIssue).toContain('account could not be confirmed');
    } finally {
      vi.useRealTimers();
    }
  });
});

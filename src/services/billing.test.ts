import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CustomerInfo, PurchasesPackage } from '@revenuecat/purchases-capacitor';

vi.mock('@revenuecat/purchases-capacitor', () => ({ Purchases: {} }));
vi.mock('./supabaseClient', () => ({ supabase: {} }));
vi.mock('./authUser', () => ({
  getAuthenticatedUserId: async () => null,
  getCachedUserId: async () => null,
}));

import {
  entitlementFromCustomerInfo,
  findPackageForPlan,
  ownsPlan,
  packagesFromOfferings,
  planKind,
  readCachedEntitlement,
  revenueCatService,
} from './revenueCatService';

const pkg = (identifier: string, productId: string, packageType = 'CUSTOM') =>
  ({
    identifier,
    packageType,
    product: { identifier: productId, title: productId, priceString: '$1', price: 1 },
  }) as unknown as PurchasesPackage;

const monthly = pkg('$rc_monthly', 'o1fc_pro_monthly', 'MONTHLY');
const travel = pkg('travel', 'o1fc_pro_travel_monthly', 'MONTHLY');
const founder = pkg('$rc_lifetime', 'o1fc_founder_pass', 'LIFETIME');
const coach = pkg('coach_pro', 'o1fc_coach_pro_monthly', 'MONTHLY');
const catalog = [monthly, travel, founder, coach];

function customer(parts: {
  active?: {
    identifier: string;
    productIdentifier: string;
    expirationDate: string | null;
    willRenew?: boolean;
  }[];
  activeSubscriptions?: string[];
  purchased?: string[];
  expirations?: Record<string, string | null>;
}): CustomerInfo {
  const active = Object.fromEntries(
    (parts.active ?? []).map((e) => [
      e.identifier,
      { ...e, isActive: true, willRenew: e.willRenew ?? true },
    ]),
  );
  return {
    entitlements: { active, all: active },
    activeSubscriptions: parts.activeSubscriptions ?? [],
    allPurchasedProductIdentifiers: parts.purchased ?? [],
    allExpirationDates: parts.expirations ?? {},
  } as unknown as CustomerInfo;
}

describe('planKind', () => {
  it('classifies every catalog product', () => {
    expect(planKind('o1fc_founder_pass')).toBe('lifetime');
    expect(planKind('o1fc_coach_pro_monthly')).toBe('coach');
    expect(planKind('o1fc_pro_travel_monthly')).toBe('travel');
    expect(planKind('o1fc_pro_monthly')).toBe('monthly');
  });
});

describe('findPackageForPlan', () => {
  it('prefers an exact product match', () => {
    expect(findPackageForPlan(catalog, 'o1fc_pro_travel_monthly')).toBe(travel);
  });

  it('never sells a sibling plan in place of the one chosen', () => {
    expect(findPackageForPlan([travel, coach, founder], 'o1fc_pro_monthly')).toBeNull();
    expect(findPackageForPlan([monthly, travel], 'o1fc_founder_pass')).toBeNull();
    expect(findPackageForPlan([monthly, founder], 'o1fc_coach_pro_monthly')).toBeNull();
  });

  it('falls back to the same kind when store ids differ from the catalog', () => {
    expect(
      findPackageForPlan(
        [pkg('$rc_monthly', 'pro_month_v2', 'MONTHLY'), founder],
        'o1fc_pro_monthly',
      )?.identifier,
    ).toBe('$rc_monthly');
  });
});

describe('packagesFromOfferings', () => {
  it('uses the current offering, then every offering, then nothing', () => {
    expect(
      packagesFromOfferings({ current: { availablePackages: [monthly] }, all: {} } as never),
    ).toEqual([monthly]);
    expect(
      packagesFromOfferings({
        current: null,
        all: { a: { availablePackages: [founder] } },
      } as never),
    ).toEqual([founder]);
    expect(packagesFromOfferings(null)).toEqual([]);
  });
});

describe('ownsPlan', () => {
  it('confirms an active subscription', () => {
    expect(
      ownsPlan(customer({ activeSubscriptions: ['o1fc_pro_monthly:monthly'] }), 'o1fc_pro_monthly'),
    ).toBe(true);
  });

  it('does not count an expired subscription that is only in purchase history', () => {
    expect(ownsPlan(customer({ purchased: ['o1fc_pro_monthly'] }), 'o1fc_pro_monthly')).toBe(false);
  });

  it('confirms a lifetime pass from purchase history', () => {
    expect(ownsPlan(customer({ purchased: ['o1fc_founder_pass'] }), 'o1fc_founder_pass')).toBe(
      true,
    );
  });

  it('does not treat an athlete entitlement as a coach plan', () => {
    const info = customer({
      active: [
        { identifier: 'o1fc_pro', productIdentifier: 'o1fc_pro_monthly', expirationDate: null },
      ],
    });
    expect(ownsPlan(info, 'o1fc_coach_pro_monthly')).toBe(false);
  });

  it('is false with no customer record', () => {
    expect(ownsPlan(null, 'o1fc_pro_monthly')).toBe(false);
  });
});

describe('entitlementFromCustomerInfo', () => {
  it('uses the store expiry and renewal state', () => {
    const info = customer({
      active: [
        {
          identifier: 'o1fc_pro',
          productIdentifier: 'o1fc_pro_monthly',
          expirationDate: '2026-11-14T00:00:00Z',
          willRenew: false,
        },
      ],
    });
    expect(entitlementFromCustomerInfo(info, 'ios')).toEqual({
      isActive: true,
      tierId: 'o1fc_pro_monthly',
      tierName: 'O1 Pass Pro (Monthly)',
      platform: 'ios',
      expiresAt: '2026-11-14T00:00:00Z',
      willRenew: false,
    });
  });

  it('prefers a lifetime entitlement over a subscription', () => {
    const info = customer({
      active: [
        {
          identifier: 'monthly',
          productIdentifier: 'o1fc_pro_monthly',
          expirationDate: '2026-11-14T00:00:00Z',
        },
        {
          identifier: 'founder',
          productIdentifier: 'o1fc_founder_pass',
          expirationDate: null,
          willRenew: false,
        },
      ],
    });
    expect(entitlementFromCustomerInfo(info, 'android')).toMatchObject({
      tierId: 'o1fc_founder_pass',
      expiresAt: null,
    });
  });

  it('recognises a lifetime purchase with no entitlement attached', () => {
    expect(
      entitlementFromCustomerInfo(customer({ purchased: ['o1fc_founder_pass'] }), 'ios'),
    ).toMatchObject({
      isActive: true,
      tierId: 'o1fc_founder_pass',
      willRenew: false,
    });
  });

  it('reads free when nothing is active', () => {
    expect(
      entitlementFromCustomerInfo(customer({ purchased: ['o1fc_pro_monthly'] }), 'ios'),
    ).toMatchObject({
      isActive: false,
      tierId: 'o1fc_core_free',
    });
  });
});

describe('cached entitlement', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubStorage(value: unknown) {
    const store = new Map<string, string>([
      ['o1fc_revenuecat_entitlements', JSON.stringify(value)],
    ]);
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });
  }

  const plan = {
    isActive: true,
    tierId: 'o1fc_pro_monthly',
    tierName: 'Pro',
    platform: 'ios',
    willRenew: true,
  };

  it('keeps a plan that has not expired', () => {
    stubStorage({ ...plan, expiresAt: new Date(Date.now() + 86_400_000).toISOString() });
    expect(readCachedEntitlement()?.isActive).toBe(true);
  });

  it('drops a plan once its store expiry has passed', () => {
    stubStorage({ ...plan, expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect(readCachedEntitlement()).toBeNull();
  });

  it('ignores malformed data', () => {
    stubStorage({ nope: true });
    expect(readCachedEntitlement()).toBeNull();
  });
});

describe('web checkout', () => {
  it('refuses to charge outside the native store apps', async () => {
    expect(await revenueCatService.purchasePackage('o1fc_pro_monthly', 'user-1')).toEqual({
      success: false,
      error: 'Subscribe in the iOS or Android app to complete checkout.',
    });
  });

  it('asks for sign-in before checkout', async () => {
    expect(await revenueCatService.purchasePackage('o1fc_pro_monthly')).toEqual({
      success: false,
      error: 'Sign in to subscribe.',
    });
  });

  it('never offers the preview package as a real product', () => {
    expect(revenueCatService.packageForPlan({ packages: [] }, 'o1fc_pro_monthly')).toBeNull();
    expect(revenueCatService.listPackages({ packages: [] })[0]?.isFallback).toBe(true);
  });
});

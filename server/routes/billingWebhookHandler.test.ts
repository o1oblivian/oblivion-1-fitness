import { describe, expect, it } from 'vitest';
import {
  entitlementChangeFor,
  webhookAuthorized,
  writableChange,
  type StoredEntitlement,
} from './billingWebhookHandler';

const base = {
  app_user_id: 'user-1',
  product_id: 'o1fc_pro_monthly',
  store: 'APP_STORE',
  expiration_at_ms: Date.UTC(2026, 10, 14),
};

describe('webhookAuthorized', () => {
  it('rejects every request when no secret is configured', () => {
    expect(webhookAuthorized('Bearer ', '')).toBe(false);
    expect(webhookAuthorized(undefined, '')).toBe(false);
  });

  it('accepts only the exact bearer secret', () => {
    expect(webhookAuthorized('Bearer s3cret', 's3cret')).toBe(true);
    expect(webhookAuthorized('Bearer wrong', 's3cret')).toBe(false);
    expect(webhookAuthorized('s3cret', 's3cret')).toBe(false);
    expect(webhookAuthorized(undefined, 's3cret')).toBe(false);
  });
});

describe('entitlementChangeFor', () => {
  it('grants access on purchase with the store expiry and platform', () => {
    expect(entitlementChangeFor({ ...base, type: 'INITIAL_PURCHASE' })).toEqual({
      userId: 'user-1',
      tier: 'o1fc_pro_monthly',
      status: 'active',
      platform: 'ios',
      expiresAt: '2026-11-14T00:00:00.000Z',
    });
  });

  it('grants the lifetime pass, which arrives as a non-renewing purchase', () => {
    expect(
      entitlementChangeFor({
        ...base,
        type: 'NON_RENEWING_PURCHASE',
        product_id: 'o1fc_founder_pass',
        store: 'PLAY_STORE',
        expiration_at_ms: null,
      }),
    ).toMatchObject({
      status: 'active',
      tier: 'o1fc_founder_pass',
      platform: 'android',
      expiresAt: null,
    });
  });

  it('records the new product after a plan change', () => {
    expect(
      entitlementChangeFor({
        ...base,
        type: 'PRODUCT_CHANGE',
        new_product_id: 'o1fc_coach_pro_monthly',
      })?.tier,
    ).toBe('o1fc_coach_pro_monthly');
  });

  it('keeps access when auto-renew is turned off, until expiry', () => {
    expect(
      entitlementChangeFor({ ...base, type: 'CANCELLATION', cancel_reason: 'UNSUBSCRIBE' }),
    ).toBeNull();
    expect(entitlementChangeFor({ ...base, type: 'EXPIRATION' })?.status).toBe('inactive');
  });

  it('ends access immediately on a refund', () => {
    expect(
      entitlementChangeFor({ ...base, type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT' })
        ?.status,
    ).toBe('inactive');
  });

  it('ignores anonymous users, test events and billing notices', () => {
    expect(
      entitlementChangeFor({
        ...base,
        type: 'INITIAL_PURCHASE',
        app_user_id: '$RCAnonymousID:abc',
      }),
    ).toBeNull();
    expect(entitlementChangeFor({ ...base, type: 'TEST' })).toBeNull();
    expect(entitlementChangeFor({ ...base, type: 'BILLING_ISSUE' })).toBeNull();
  });
});

describe('writableChange', () => {
  const now = Date.UTC(2026, 9, 18);
  const liveCoach: StoredEntitlement = {
    tier: 'o1fc_coach_pro_monthly',
    status: 'active',
    expires_at: '2026-11-18T00:00:00.000Z',
  };
  const founder = entitlementChangeFor({
    ...base,
    type: 'NON_RENEWING_PURCHASE',
    product_id: 'o1fc_founder_pass',
    expiration_at_ms: null,
  });
  const coachExpired = entitlementChangeFor({
    ...base,
    type: 'EXPIRATION',
    product_id: 'o1fc_coach_pro_monthly:monthly',
  });

  it('writes when the user has no row yet', () => {
    expect(founder && writableChange(null, founder, now)).toEqual(founder);
  });

  it('does not let a Founder Pass purchase replace a live Coach Pro row', () => {
    expect(founder && writableChange(liveCoach, founder, now)).toBeNull();
  });

  it('does not let an athlete Pro expiry switch off a live Coach Pro row', () => {
    const athleteExpired = entitlementChangeFor({ ...base, type: 'EXPIRATION' });
    expect(athleteExpired && writableChange(liveCoach, athleteExpired, now)).toBeNull();
  });

  it('lets the Coach Pro expiry through, including the Play base-plan id', () => {
    expect(coachExpired && writableChange(liveCoach, coachExpired, now)).toEqual(coachExpired);
  });

  it('lets a lesser product write once Coach Pro has lapsed', () => {
    const lapsed: StoredEntitlement = { ...liveCoach, expires_at: '2026-10-01T00:00:00.000Z' };
    const inactive: StoredEntitlement = { ...liveCoach, status: 'inactive' };
    expect(founder && writableChange(lapsed, founder, now)).toEqual(founder);
    expect(founder && writableChange(inactive, founder, now)).toEqual(founder);
  });
});

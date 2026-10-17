import { describe, expect, it } from 'vitest';
import { entitlementChangeFor, webhookAuthorized } from './billingWebhookHandler';

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

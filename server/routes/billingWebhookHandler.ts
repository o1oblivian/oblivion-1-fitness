import { timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/stripeLedger';

export interface RevenueCatEvent {
  type?: string;
  app_user_id?: string;
  product_id?: string;
  new_product_id?: string;
  store?: string;
  expiration_at_ms?: number | null;
  cancel_reason?: string;
}

export interface EntitlementChange {
  userId: string;
  tier: string;
  status: 'active' | 'inactive';
  platform: 'ios' | 'android' | 'web';
  expiresAt: string | null;
}

const GRANTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
  'TEMPORARY_ENTITLEMENT_GRANT',
]);

function storePlatform(store?: string): EntitlementChange['platform'] {
  if (store === 'APP_STORE' || store === 'MAC_APP_STORE') return 'ios';
  if (store === 'PLAY_STORE' || store === 'AMAZON') return 'android';
  return 'web';
}

/**
 * Maps one RevenueCat event to the entitlement row it implies, or null when the event does not change access.
 * A plain CANCELLATION only turns off auto-renew; access ends with the EXPIRATION event. Refunds end it at once.
 */
export function entitlementChangeFor(event: RevenueCatEvent): EntitlementChange | null {
  const userId = event.app_user_id || '';
  const type = event.type || '';
  if (!userId || userId.startsWith('$RCAnonymousID') || userId === 'default-athlete') return null;
  const tier = event.new_product_id || event.product_id || '';
  if (!tier) return null;
  const expiresAt = typeof event.expiration_at_ms === 'number' ? new Date(event.expiration_at_ms).toISOString() : null;
  const base = { userId, tier, platform: storePlatform(event.store), expiresAt };
  if (GRANTS.has(type)) return { ...base, status: 'active' };
  if (type === 'EXPIRATION') return { ...base, status: 'inactive' };
  if (type === 'CANCELLATION' && event.cancel_reason === 'CUSTOMER_SUPPORT') return { ...base, status: 'inactive' };
  return null;
}

export function webhookAuthorized(header: string | undefined, secret: string): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function handleRevenueCatWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.REVENUECAT_WEBHOOK_AUTH || '';
  if (!secret) {
    res.status(503).json({ error: 'Webhook is not configured.' });
    return;
  }
  if (!webhookAuthorized(req.headers.authorization, secret)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const event = (req.body as { event?: RevenueCatEvent } | undefined)?.event;
  if (!event) {
    res.status(400).json({ error: 'Missing event payload' });
    return;
  }
  const admin = getSupabaseAdmin();
  if (!admin) {
    res.status(503).json({ error: 'Entitlement storage is not configured.' });
    return;
  }
  const change = entitlementChangeFor(event);
  if (change) {
    const now = new Date().toISOString();
    const { error } = await admin.from('user_entitlements').upsert({
      user_id: change.userId,
      tier: change.tier,
      status: change.status,
      platform: change.platform,
      expires_at: change.expiresAt,
      updated_at: now,
    });
    if (error) {
      console.error('[RevenueCat webhook] Entitlement write failed:', error.message);
      res.status(500).json({ error: 'Entitlement write failed' });
      return;
    }
    await admin
      .from('athlete_profiles')
      .update({ membership_tier: change.tier, status: change.status, updated_at: now })
      .eq('id', change.userId);
  }
  res.json({ received: true });
}

/** The signed-in user's own store entitlement, as last written by the webhook. */
export async function handleSyncEntitlements(req: Request, res: Response): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    res.status(503).json({ error: 'Entitlement sync is not configured.' });
    return;
  }
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const { data: auth } = token ? await admin.auth.getUser(token) : { data: null };
  const userId = auth?.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { data } = await admin
    .from('user_entitlements')
    .select('tier, status, expires_at')
    .eq('user_id', userId)
    .maybeSingle();
  res.json({ isPro: data?.status === 'active', tier: data?.tier ?? null, expiresAt: data?.expires_at ?? null });
}

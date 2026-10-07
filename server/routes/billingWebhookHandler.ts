import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function handleRevenueCatWebhook(req: Request, res: Response): Promise<void> {
  const rcWebhookAuth = process.env.REVENUECAT_WEBHOOK_AUTH || '';
  const authHeader = req.headers.authorization;
  if (rcWebhookAuth && authHeader !== `Bearer ${rcWebhookAuth}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { event } = req.body || {};
  if (!event) {
    res.status(400).json({ error: 'Missing event payload' });
    return;
  }
  const athleteId = event.app_user_id;
  if (!athleteId || athleteId === 'default-athlete') {
    res.status(400).json({ error: 'Missing app_user_id' });
    return;
  }
  const planId = event.product_id || 'com.o1fc.membership.premium';
  if (event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL') {
    await persistEntitlement(athleteId, planId, 'active');
  } else if (event.type === 'EXPIRATION' || event.type === 'CANCELLATION') {
    await persistEntitlement(athleteId, planId, 'inactive');
  }
  res.json({ received: true });
}

async function persistEntitlement(athleteId: string, tier: string, status: 'active' | 'inactive') {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('user_entitlements').upsert({
    user_id: athleteId,
    tier,
    status,
    platform: 'ios',
    updated_at: new Date().toISOString(),
  });
  await supabaseAdmin
    .from('athlete_profiles')
    .update({
      membership_tier: tier,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', athleteId);
}

export async function handleSyncEntitlements(req: Request, res: Response): Promise<void> {
  const athleteId = (req.query.athleteId as string) || '';
  if (!athleteId || athleteId === 'default-athlete') {
    res.status(400).json({ error: 'athleteId is required' });
    return;
  }
  if (!supabaseAdmin) {
    res.status(503).json({ error: 'Entitlement sync is not configured.' });
    return;
  }
  const { data } = await supabaseAdmin
    .from('user_entitlements')
    .select('tier, status')
    .eq('user_id', athleteId)
    .maybeSingle();
  res.json({ isPro: data?.status === 'active', tier: data?.tier || 'com.o1fc.fitness.plus_monthly' });
}

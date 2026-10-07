import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { coachPlanFromTier, CoachPlanId, splitProgramSale } from '../../shared/coachPlans';

/**
 * Server-only Stripe + ledger helpers. Uses the Supabase SERVICE ROLE key, so none of this
 * may ever be imported by client code.
 */

export const PAYOUT_CURRENCY = 'aud';
export const MIN_PAYOUT_CENTS = 500;
/**
 * Sales sit in PENDING for this many days before they become withdrawable.
 * Read lazily: env files are loaded by server.ts AFTER this module is imported.
 */
export function payoutHoldDays(): number {
  const raw = process.env.COACH_PAYOUT_HOLD_DAYS;
  const parsed = raw === undefined || raw === '' ? 7 : Number(raw);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 7;
}

let adminClient: SupabaseClient | null = null;

/** Service-role client. Returns null when the server is not configured for privileged access. */
export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) return null;
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return adminClient;
}

type StripeClient = import('stripe').default;
let stripeClient: StripeClient | null = null;

export async function getStripe(): Promise<StripeClient | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    const StripeModule = await import('stripe');
    const Stripe = StripeModule.default;
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export interface CoachConnectProfile {
  id: string;
  stripe_connect_account_id: string | null;
  stripe_payouts_enabled: boolean;
}

export async function getCoachConnectProfile(coachId: string): Promise<CoachConnectProfile | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from('coach_profiles')
    .select('id, stripe_connect_account_id, stripe_payouts_enabled')
    .eq('id', coachId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: String(data.id),
    stripe_connect_account_id: data.stripe_connect_account_id ? String(data.stripe_connect_account_id) : null,
    stripe_payouts_enabled: Boolean(data.stripe_payouts_enabled),
  };
}

/** Coach plan comes from the RevenueCat-fed entitlement row, never from the client. */
export async function resolveCoachPlan(coachId: string): Promise<CoachPlanId> {
  const admin = getSupabaseAdmin();
  if (!admin) return 'starter';
  const { data } = await admin
    .from('user_entitlements')
    .select('tier, status')
    .eq('user_id', coachId)
    .maybeSingle();
  if (!data || data.status !== 'active') return 'starter';
  return coachPlanFromTier(data.tier);
}

export interface CoachTransactionRow {
  id: string;
  coach_id: string;
  athlete_id?: string | null;
  athlete_name?: string | null;
  program_title?: string | null;
  gross_amount: number;
  platform_fee: number;
  coach_net: number;
  status: 'PENDING' | 'AVAILABLE' | 'PAID_OUT' | 'REFUNDED' | string;
  currency?: string | null;
  created_at: string;
}

export interface CoachPayoutRow {
  id: string;
  coach_id: string;
  amount_cents: number;
  currency: string;
  stripe_transfer_id?: string | null;
  status: 'pending' | 'processing' | 'paid' | 'failed' | string;
  error_message?: string | null;
  created_at: string;
}

export interface CoachBalanceSummary {
  currency: string;
  /** Earned and released from the hold period, minus everything already withdrawn or in flight. */
  availableCents: number;
  /** Earned but still inside the hold period. */
  pendingCents: number;
  /** Successfully transferred to the coach's bank via Stripe. */
  paidCents: number;
  /** All gross sales (excluding refunds). */
  grossCents: number;
  /** Platform share of those sales. */
  platformFeeCents: number;
}

const toCents = (dollars: unknown): number => Math.round(Number(dollars || 0) * 100);

function isReleased(tx: CoachTransactionRow, now: number): boolean {
  const status = String(tx.status).toUpperCase();
  if (status === 'AVAILABLE' || status === 'PAID_OUT') return true;
  if (status !== 'PENDING') return false;
  const ageDays = (now - new Date(tx.created_at).getTime()) / 86_400_000;
  return ageDays >= payoutHoldDays();
}

export function summariseBalance(transactions: CoachTransactionRow[], payouts: CoachPayoutRow[]): CoachBalanceSummary {
  const now = Date.now();
  let earnedReleased = 0;
  let pending = 0;
  let gross = 0;
  let fee = 0;
  for (const tx of transactions) {
    if (String(tx.status).toUpperCase() === 'REFUNDED') continue;
    gross += toCents(tx.gross_amount);
    fee += toCents(tx.platform_fee);
    if (isReleased(tx, now)) earnedReleased += toCents(tx.coach_net);
    else pending += toCents(tx.coach_net);
  }
  let committed = 0;
  let paid = 0;
  for (const p of payouts) {
    const s = String(p.status).toLowerCase();
    if (s === 'paid') {
      paid += Number(p.amount_cents || 0);
      committed += Number(p.amount_cents || 0);
    } else if (s === 'processing' || s === 'pending') {
      committed += Number(p.amount_cents || 0);
    }
  }
  return {
    currency: PAYOUT_CURRENCY,
    availableCents: earnedReleased - committed,
    pendingCents: pending,
    paidCents: paid,
    grossCents: gross,
    platformFeeCents: fee,
  };
}

export async function loadCoachLedger(
  coachId: string,
): Promise<{ transactions: CoachTransactionRow[]; payouts: CoachPayoutRow[] } | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const [tx, po] = await Promise.all([
    admin.from('coach_transactions').select('*').eq('coach_id', coachId).order('created_at', { ascending: false }),
    admin.from('coach_payout_ledger').select('*').eq('coach_id', coachId).order('created_at', { ascending: false }),
  ]);
  if (tx.error) throw new Error(`coach_transactions: ${tx.error.message}`);
  if (po.error) throw new Error(`coach_payout_ledger: ${po.error.message}`);
  return { transactions: (tx.data || []) as CoachTransactionRow[], payouts: (po.data || []) as CoachPayoutRow[] };
}

export async function getCoachBalance(coachId: string) {
  const ledger = await loadCoachLedger(coachId);
  if (!ledger) return null;
  return { ...ledger, summary: summariseBalance(ledger.transactions, ledger.payouts) };
}

/**
 * Records one program sale and the platform/coach split. Idempotent on the Stripe session id,
 * so webhook retries never double count.
 */
export async function recordProgramSale(input: {
  coachId: string;
  athleteId?: string | null;
  athleteName?: string | null;
  programTitle?: string | null;
  grossCents: number;
  currency?: string | null;
  stripeSessionId: string;
}): Promise<{ recorded: boolean; reason?: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { recorded: false, reason: 'not_configured' };

  const existing = await admin
    .from('coach_transactions')
    .select('id')
    .eq('stripe_session_id', input.stripeSessionId)
    .maybeSingle();
  if (existing.data) return { recorded: false, reason: 'duplicate' };

  const plan = await resolveCoachPlan(input.coachId);
  const split = splitProgramSale(input.grossCents, plan);
  const { error } = await admin.from('coach_transactions').insert({
    coach_id: input.coachId,
    athlete_id: input.athleteId || null,
    athlete_name: input.athleteName || 'Athlete',
    program_title: input.programTitle || 'Program',
    gross_amount: input.grossCents / 100,
    platform_fee: split.platformFeeCents / 100,
    coach_net: split.coachNetCents / 100,
    status: 'PENDING',
    currency: (input.currency || PAYOUT_CURRENCY).toLowerCase(),
    coach_plan: plan,
    platform_fee_rate: split.platformFeeRate,
    stripe_session_id: input.stripeSessionId,
  });
  if (error) throw new Error(`Failed to record sale: ${error.message}`);
  return { recorded: true };
}

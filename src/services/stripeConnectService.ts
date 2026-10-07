import { supabase } from './supabaseClient';
import { apiUrl } from './apiBase';
import { CoachPayoutLedgerRecord } from '../types/database';
import type { CoachPlanId } from '../../shared/coachPlans';

export interface CoachProfileData {
  id: string;
  stripe_connect_account_id: string | null;
  stripe_payouts_enabled: boolean;
  currency: string;
  is_id_verified?: boolean;
  identity_status?: 'unverified' | 'processing' | 'verified' | 'failed_retry_required';
  verified_at?: string;
  accepting_new_athletes?: boolean;
}

export interface CoachSaleRecord {
  id: string;
  athlete_name?: string | null;
  program_title?: string | null;
  gross_amount: number;
  platform_fee: number;
  coach_net: number;
  status: string;
  currency?: string | null;
  created_at: string;
}

/** Response of the authenticated GET /api/stripe/balance. All money is integer cents. */
export interface StripeBalance {
  accountLinked: boolean;
  accountId: string | null;
  payoutsEnabled: boolean;
  plan: CoachPlanId;
  platformFeeRate: number;
  currency: string;
  availableCents: number;
  pendingCents: number;
  paidCents: number;
  grossCents: number;
  platformFeeCents: number;
  payouts: CoachPayoutLedgerRecord[];
  transactions: CoachSaleRecord[];
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

const isValidUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export const stripeConnectService = {
  async getCoachProfile(coachId = ''): Promise<CoachProfileData> {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const targetId = authData?.user?.id || (isValidUuid(coachId) ? coachId : null);
      if (targetId) {
        const { data, error } = await supabase
          .from('coach_profiles')
          .select('id, stripe_connect_account_id, stripe_payouts_enabled, is_id_verified, identity_status, verified_at, accepting_new_athletes')
          .eq('id', targetId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            stripe_connect_account_id: data.stripe_connect_account_id || null,
            stripe_payouts_enabled: Boolean(data.stripe_payouts_enabled),
            currency: 'AUD',
            is_id_verified: Boolean(data.is_id_verified),
            identity_status: data.identity_status || (data.is_id_verified ? 'verified' : 'unverified'),
            verified_at: data.verified_at,
            accepting_new_athletes: data.accepting_new_athletes !== false,
          };
        }
      }
    } catch (err) {
      console.warn('[StripeConnectService] Supabase coach profile retrieval error:', err);
    }

    return {
      id: coachId || '',
      stripe_connect_account_id: null,
      stripe_payouts_enabled: false,
      currency: 'AUD',
      is_id_verified: false,
      identity_status: 'unverified',
      accepting_new_athletes: false,
    };
  },

  /** Starts (or resumes) Stripe Express onboarding. Auth comes from the Supabase session token. */
  async createConnectAccount(returnUrl?: string): Promise<{ url?: string; error?: string }> {
    try {
      const origin = returnUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      const res = await fetch(apiUrl('/api/stripe/create-connect-account'), {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ returnUrl: origin }),
      });
      const data = await res.json().catch(() => ({}));
      const url = typeof data?.url === 'string' ? data.url : undefined;
      if (!res.ok || !url) return { error: data?.error || 'Failed to initialize Stripe onboarding.' };
      return { url };
    } catch (err: any) {
      return { error: err.message || 'Network error communicating with Stripe Connect.' };
    }
  },

  /** The server decides the destination account and validates the amount against the real balance. */
  async createPayout(amountCents: number): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      const res = await fetch(apiUrl('/api/stripe/create-payout'), {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ amountCents }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) return { success: false, error: data?.error || 'Failed to process withdrawal.' };
      return { success: true, payoutId: data?.payoutId || data?.transferId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error communicating with payout service.' };
    }
  },

  async createStripeLoginLink(): Promise<{ url?: string; error?: string }> {
    try {
      const res = await fetch(apiUrl('/api/stripe/create-login-link'), {
        method: 'POST',
        headers: await authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data?.error || 'Could not open the Stripe dashboard.' };
      return { url: data?.url };
    } catch (err: any) {
      return { error: err.message || 'Network error reaching Stripe portal service.' };
    }
  },

  /** Real pending / available / paid balance, computed on the server from the payout ledger. */
  async getBalance(): Promise<{ data?: StripeBalance; error?: string }> {
    try {
      const res = await fetch(apiUrl('/api/stripe/balance'), { method: 'GET', headers: await authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data?.error || 'Could not load your balance.' };
      return { data: data as StripeBalance };
    } catch (err: any) {
      return { error: err.message || 'Network error loading your balance.' };
    }
  },
};

export default stripeConnectService;

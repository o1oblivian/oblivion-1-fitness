import { supabase } from './supabaseClient';
import { CoachPayoutLedgerRecord } from '../types/database';

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

export interface CoachBalanceTelemetry {
  availableNet: number;
  pendingNet: number;
  grossVolume: number;
  platformFee10Pct: number;
  currency: string;
}

const isValidUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export const stripeConnectService = {
  async getCoachProfile(coachId = 'coach_alpha'): Promise<CoachProfileData> {
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

  async createConnectAccount(returnUrl?: string): Promise<{ url?: string; error?: string }> {
    try {
      const origin = returnUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/create-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ returnUrl: origin }),
      });
      const data = await res.json();
      if (!res.ok || (data.error && !data.url)) return { error: data.error || 'Failed to initialize Stripe onboarding.' };
      return { url: data?.url };
    } catch (err: any) {
      return { error: err.message || 'Network error reaching onboarding service.' };
    }
  },

  async createPayout(amountCents: number): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/create-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ amountCents }),
      });
      const data = await res.json();
      if (!res.ok || data.error) return { success: false, error: data.error || 'Failed to process withdrawal.' };
      return { success: true, payoutId: data?.payoutId || data?.transferId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error communicating with payout service.' };
    }
  },

  async createStripeLoginLink(): Promise<{ url?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/create-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      });
      const data = await res.json();
      return { url: data?.url };
    } catch (err: any) {
      return { error: err.message || 'Network error reaching Stripe portal service.' };
    }
  },

  async getLedgerAndBalance(coachId: string): Promise<{ balance: CoachBalanceTelemetry; ledger: CoachPayoutLedgerRecord[] }> {
    const emptyBal = { availableNet: 0, pendingNet: 0, grossVolume: 0, platformFee10Pct: 0, currency: 'AUD' };
    if (!isValidUuid(coachId)) return { balance: emptyBal, ledger: [] };
    try {
      const { data, error } = await supabase.from('coach_payout_ledger').select('*').eq('coach_id', coachId).order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const ledger = data as CoachPayoutLedgerRecord[];
        const paidOut = ledger.filter((l) => l.status?.toLowerCase() === 'paid').reduce((s, l) => s + Number(l.amount_cents || 0), 0);
        const inFlight = ledger.filter((l) => ['pending', 'processing'].includes(l.status?.toLowerCase() || '')).reduce((s, l) => s + Number(l.amount_cents || 0), 0);
        const total = ledger.filter((l) => l.status?.toLowerCase() !== 'failed').reduce((s, l) => s + Number(l.amount_cents || 0), 0);
        return {
          balance: {
            availableNet: Math.max(0, (total - paidOut - inFlight) / 100),
            pendingNet: inFlight / 100, grossVolume: total / 100,
            platformFee10Pct: (total / 100) * 0.1, currency: (ledger[0]?.currency || 'aud').toUpperCase(),
          },
          ledger,
        };
      }
    } catch {}
    return { balance: emptyBal, ledger: [] };
  },
};

export default stripeConnectService;

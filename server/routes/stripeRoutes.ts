import type { Express, NextFunction, Request, Response } from 'express';
import { COACH_PLANS } from '../../shared/coachPlans';
import {
  MIN_PAYOUT_CENTS,
  PAYOUT_CURRENCY,
  getCoachBalance,
  getCoachConnectProfile,
  getStripe,
  getSupabaseAdmin,
  resolveCoachPlan,
  summariseBalance,
  loadCoachLedger,
} from '../lib/stripeLedger';
import { handleCreateIdentitySession, handleStripeWebhook } from './stripeIdentityRoutes';

/**
 * Every /api/stripe/* route requires a valid Supabase access token (Authorization: Bearer <jwt>),
 * except the webhook, which Stripe calls and which is authenticated by its signature instead.
 * The coach identity ALWAYS comes from the verified token, never from the request body.
 */
export async function requireSupabaseAuth(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/webhook') return next();

  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ error: 'Payments backend is not configured.' });
  }
  try {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.locals.userId = data.user.id;
    res.locals.userEmail = data.user.email || undefined;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/** Only allow Stripe to send the coach back to an http(s) page or the app's own URL scheme. */
function safeReturnBase(candidate: unknown, fallback: string): string {
  if (typeof candidate !== 'string' || !candidate) return fallback;
  try {
    const url = new URL(candidate);
    if (url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'com.o1fc.fitness:') {
      return `${url.origin === 'null' ? `${url.protocol}//${url.host}` : url.origin}${url.pathname}`.replace(/\/$/, '');
    }
  } catch {
    /* fall through */
  }
  return fallback;
}

const inFlightPayouts = new Set<string>();

export function registerStripeRoutes(app: Express) {
  app.use('/api/stripe', requireSupabaseAuth);

  // -------------------------------------------------------------------------
  // Connect onboarding
  // -------------------------------------------------------------------------
  app.post('/api/stripe/create-connect-account', async (req, res) => {
    try {
      const coachId = res.locals.userId as string;
      const stripe = await getStripe();
      const admin = getSupabaseAdmin();
      if (!stripe || !admin) return res.status(503).json({ error: 'Stripe is not configured.' });

      const fallbackOrigin = String(req.headers.origin || 'http://localhost:3000');
      const base = safeReturnBase(req.body?.returnUrl, fallbackOrigin);
      const withParam = (param: string) => `${base}${base.includes('?') ? '&' : '?'}${param}`;

      const profile = await getCoachConnectProfile(coachId);
      let accountId = profile?.stripe_connect_account_id || null;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'AU',
          email: (res.locals.userEmail as string | undefined) || undefined,
          capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
          metadata: { coach_id: coachId },
        });
        accountId = account.id;
        const { error } = await admin
          .from('coach_profiles')
          .upsert({ id: coachId, stripe_connect_account_id: accountId, stripe_payouts_enabled: false }, { onConflict: 'id' });
        if (error) {
          return res.status(500).json({ error: 'Could not save the Stripe account to your coach profile.' });
        }
      }

      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: withParam('stripe=refresh'),
        return_url: withParam('stripe=success'),
        type: 'account_onboarding',
      });
      return res.json({ url: link.url });
    } catch (err: any) {
      console.error('[stripe] create-connect-account failed:', err?.message);
      return res.status(500).json({ error: err?.message || 'Failed to start Stripe onboarding.' });
    }
  });

  app.post('/api/stripe/create-login-link', async (_req, res) => {
    try {
      const stripe = await getStripe();
      if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
      const profile = await getCoachConnectProfile(res.locals.userId as string);
      if (!profile?.stripe_connect_account_id) {
        return res.status(400).json({ error: 'No Stripe account is linked to this coach.' });
      }
      const link = await stripe.accounts.createLoginLink(profile.stripe_connect_account_id);
      return res.json({ url: link.url });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to open the Stripe dashboard.' });
    }
  });

  app.post('/api/stripe/create-identity-session', handleCreateIdentitySession);

  // -------------------------------------------------------------------------
  // Balance (real data from coach_transactions + coach_payout_ledger)
  // -------------------------------------------------------------------------
  app.get('/api/stripe/balance', async (_req, res) => {
    try {
      const coachId = res.locals.userId as string;
      if (!getSupabaseAdmin()) return res.status(503).json({ error: 'Payments backend is not configured.' });

      let profile = await getCoachConnectProfile(coachId);

      // Webhook may not have landed yet (e.g. the coach just returned from onboarding): sync from Stripe.
      if (profile?.stripe_connect_account_id && !profile.stripe_payouts_enabled) {
        const stripe = await getStripe();
        if (stripe) {
          try {
            const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
            if (account.payouts_enabled) {
              await getSupabaseAdmin()!
                .from('coach_profiles')
                .update({ stripe_payouts_enabled: true })
                .eq('id', coachId);
              profile = { ...profile, stripe_payouts_enabled: true };
            }
          } catch (syncErr) {
            console.warn('[stripe] account sync skipped:', (syncErr as Error)?.message);
          }
        }
      }

      const [ledger, plan] = await Promise.all([loadCoachLedger(coachId), resolveCoachPlan(coachId)]);
      const transactions = ledger?.transactions ?? [];
      const payouts = ledger?.payouts ?? [];
      const summary = summariseBalance(transactions, payouts);

      return res.json({
        accountLinked: Boolean(profile?.stripe_connect_account_id),
        accountId: profile?.stripe_connect_account_id || null,
        payoutsEnabled: Boolean(profile?.stripe_payouts_enabled),
        plan,
        platformFeeRate: COACH_PLANS[plan].platformFeeRate,
        ...summary,
        payouts: payouts.slice(0, 50),
        transactions: transactions.slice(0, 50),
      });
    } catch (err: any) {
      console.error('[stripe] balance failed:', err?.message);
      return res.status(500).json({ error: 'Could not load your balance.' });
    }
  });

  // -------------------------------------------------------------------------
  // Payout. The destination and the amount limit are both resolved server-side.
  // -------------------------------------------------------------------------
  app.post('/api/stripe/create-payout', async (req, res) => {
    const coachId = res.locals.userId as string;
    let ledgerId: string | null = null;
    let locked = false;
    try {
      const amountCents = Number(req.body?.amountCents);
      if (!Number.isInteger(amountCents) || amountCents < MIN_PAYOUT_CENTS) {
        return res.status(400).json({
          error: `Withdrawal must be a whole number of cents, at least ${MIN_PAYOUT_CENTS / 100} ${PAYOUT_CURRENCY.toUpperCase()}.`,
        });
      }
      const stripe = await getStripe();
      const admin = getSupabaseAdmin();
      if (!stripe || !admin) return res.status(503).json({ error: 'Stripe payouts are not configured.' });

      const profile = await getCoachConnectProfile(coachId);
      if (!profile?.stripe_connect_account_id) {
        return res.status(400).json({ error: 'Connect a Stripe account before withdrawing.' });
      }
      // Confirm with Stripe itself that this account can really receive transfers right now.
      const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
      if (!account.payouts_enabled) {
        return res.status(403).json({ error: 'Stripe has not enabled payouts on your account yet.' });
      }

      if (inFlightPayouts.has(coachId)) {
        return res.status(409).json({ error: 'A withdrawal is already being processed.' });
      }
      inFlightPayouts.add(coachId);
      locked = true;

      const before = await getCoachBalance(coachId);
      if (!before) return res.status(503).json({ error: 'Payments backend is not configured.' });
      if (amountCents > before.summary.availableCents) {
        return res.status(400).json({ error: 'Amount exceeds your available balance.' });
      }

      // Reserve the funds first, then re-check, so two racing requests can never both succeed.
      const reserve = await admin
        .from('coach_payout_ledger')
        .insert({ coach_id: coachId, amount_cents: amountCents, currency: PAYOUT_CURRENCY, status: 'processing' })
        .select('id')
        .single();
      if (reserve.error || !reserve.data) {
        return res.status(500).json({ error: 'Could not reserve your withdrawal.' });
      }
      ledgerId = String(reserve.data.id);

      const after = await getCoachBalance(coachId);
      if (!after || after.summary.availableCents < 0) {
        await admin.from('coach_payout_ledger').delete().eq('id', ledgerId);
        ledgerId = null;
        return res.status(409).json({ error: 'Balance changed. Please try again.' });
      }

      const transfer = await stripe.transfers.create(
        {
          amount: amountCents,
          currency: PAYOUT_CURRENCY,
          destination: profile.stripe_connect_account_id,
          description: `Oblivion 1 coaching payout ${coachId.slice(0, 8)}`,
          metadata: { coach_id: coachId, ledger_id: ledgerId },
        },
        { idempotencyKey: `o1fc_payout_${ledgerId}` },
      );

      await admin
        .from('coach_payout_ledger')
        .update({ status: 'paid', stripe_transfer_id: transfer.id, updated_at: new Date().toISOString() })
        .eq('id', ledgerId);

      return res.json({ success: true, payoutId: transfer.id, transferId: transfer.id, amountCents });
    } catch (err: any) {
      console.error('[stripe] create-payout failed:', err?.message);
      if (ledgerId) {
        await getSupabaseAdmin()
          ?.from('coach_payout_ledger')
          .update({ status: 'failed', error_message: String(err?.message || 'transfer failed').slice(0, 300), updated_at: new Date().toISOString() })
          .eq('id', ledgerId);
      }
      return res.status(502).json({ error: err?.message || 'Payout failed.' });
    } finally {
      if (locked) inFlightPayouts.delete(coachId);
    }
  });

  // Signature-verified, no JWT.
  app.post('/api/stripe/webhook', handleStripeWebhook);
}

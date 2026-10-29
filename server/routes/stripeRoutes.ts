import type { Express, NextFunction, Request, Response } from 'express';
import { COACH_PLANS } from '../../shared/coachPlans';
import { errorMessage } from '../../shared/errorMessage';
import {
  MIN_PAYOUT_CENTS,
  PAYOUT_CURRENCY,
  getCoachBalance,
  getCoachConnectProfile,
  getStripe,
  getSupabaseAdmin,
  reconcileStuckPayouts,
  resolveCheckoutItem,
  resolveCoachPlan,
  defaultReturnOrigin,
  safeReturnBase,
} from '../lib/stripeLedger';
import { handleCreateIdentitySession, handleStripeWebhook } from './stripeIdentityRoutes';

/**
 * Every /api/stripe/* route requires a valid Supabase access token (Authorization: Bearer <jwt>),
 * except the webhook, which Stripe calls and which is authenticated by its signature instead.
 * The coach identity ALWAYS comes from the verified token, never from the request body.
 */
async function requireSupabaseAuth(req: Request, res: Response, next: NextFunction) {
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

/**
 * Stripe errors that prove no transfer was created. Anything else (dropped connection, 5xx, timeout)
 * may have gone through, so it must never be treated as "not sent".
 */
function stripeDefinitelyRejected(err: unknown): boolean {
  const type = typeof err === 'object' && err !== null ? (err as { type?: unknown }).type : '';
  return [
    'StripeInvalidRequestError',
    'StripePermissionError',
    'StripeAuthenticationError',
    'StripeRateLimitError',
  ].includes(String(type || ''));
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

      const fallbackOrigin = defaultReturnOrigin(req.headers.origin);
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
        const stripeFields = {
          stripe_connect_account_id: accountId,
          stripe_payouts_enabled: false,
        };
        const email = (res.locals.userEmail as string | undefined) || '';
        // Postgres checks NOT NULL columns before ON CONFLICT, so an upsert fails for existing profiles too.
        const { error } = profile
          ? await admin.from('coach_profiles').update(stripeFields).eq('id', coachId)
          : await admin.from('coach_profiles').insert({
              id: coachId,
              display_name: email.split('@')[0] || 'Coach',
              ...stripeFields,
            });
        if (error) {
          console.error('[stripe] saving connect account failed:', error.message);
          await stripe.accounts.del(accountId).catch(() => undefined);
          return res
            .status(500)
            .json({ error: 'Could not save the Stripe account to your coach profile.' });
        }
      }

      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: withParam('stripe=refresh'),
        return_url: withParam('stripe=success'),
        type: 'account_onboarding',
      });
      return res.json({ url: link.url });
    } catch (err) {
      console.error('[stripe] create-connect-account failed:', errorMessage(err));
      return res.status(500).json({ error: 'Could not start Stripe onboarding. Try again.' });
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
    } catch (err) {
      console.error('[stripe] create-login-link failed:', errorMessage(err));
      return res.status(500).json({ error: 'Could not open the Stripe dashboard. Try again.' });
    }
  });

  app.post('/api/stripe/create-identity-session', handleCreateIdentitySession);

  // -------------------------------------------------------------------------
  // Balance (real data from coach_transactions + coach_payout_ledger)
  // -------------------------------------------------------------------------
  app.get('/api/stripe/balance', async (_req, res) => {
    try {
      const coachId = res.locals.userId as string;
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(503).json({ error: 'Payments backend is not configured.' });

      let profile = await getCoachConnectProfile(coachId);

      // Webhook may not have landed yet (e.g. the coach just returned from onboarding): sync from Stripe.
      if (profile?.stripe_connect_account_id && !profile.stripe_payouts_enabled) {
        const stripe = await getStripe();
        if (stripe) {
          try {
            const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
            if (account.payouts_enabled) {
              await admin
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

      // Settle any withdrawal that was interrupted before reading the balance.
      await reconcileStuckPayouts(coachId, profile?.stripe_connect_account_id || null).catch((e) =>
        console.warn('[stripe] reconcile skipped:', (e as Error)?.message),
      );

      const [ledger, plan] = await Promise.all([
        getCoachBalance(coachId),
        resolveCoachPlan(coachId),
      ]);
      if (!ledger) return res.status(503).json({ error: 'Payments backend is not configured.' });

      return res.json({
        accountLinked: Boolean(profile?.stripe_connect_account_id),
        accountId: profile?.stripe_connect_account_id || null,
        payoutsEnabled: Boolean(profile?.stripe_payouts_enabled),
        plan,
        platformFeeRate: COACH_PLANS[plan].platformFeeRate,
        ...ledger.summary,
        payouts: ledger.payouts,
        transactions: ledger.transactions,
      });
    } catch (err) {
      console.error('[stripe] balance failed:', errorMessage(err));
      return res.status(500).json({ error: 'Could not load your balance.' });
    }
  });

  // -------------------------------------------------------------------------
  // Payout. The destination and the amount limit are both resolved server-side.
  // -------------------------------------------------------------------------
  app.post('/api/stripe/create-payout', async (req, res) => {
    const coachId = res.locals.userId as string;
    let ledgerId: string | null = null;
    let transferId: string | null = null;
    let unsure = false;
    let locked = false;
    try {
      const amountCents = Number(req.body?.amountCents);
      if (!Number.isSafeInteger(amountCents) || amountCents < MIN_PAYOUT_CENTS) {
        return res.status(400).json({
          error: `Withdrawal must be a whole number of cents, at least ${MIN_PAYOUT_CENTS / 100} ${PAYOUT_CURRENCY.toUpperCase()}.`,
        });
      }
      const stripe = await getStripe();
      const admin = getSupabaseAdmin();
      if (!stripe || !admin)
        return res.status(503).json({ error: 'Stripe payouts are not configured.' });

      const profile = await getCoachConnectProfile(coachId);
      if (!profile?.stripe_connect_account_id) {
        return res.status(400).json({ error: 'Connect a Stripe account before withdrawing.' });
      }
      // Confirm with Stripe itself that this account can really receive transfers right now.
      const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
      if (!account.payouts_enabled) {
        return res
          .status(403)
          .json({ error: 'Stripe has not enabled payouts on your account yet.' });
      }

      if (inFlightPayouts.has(coachId)) {
        return res.status(409).json({ error: 'A withdrawal is already being processed.' });
      }
      inFlightPayouts.add(coachId);
      locked = true;

      // A withdrawal interrupted earlier must be settled first, or its funds look free and could be sent twice.
      await reconcileStuckPayouts(coachId, profile.stripe_connect_account_id);

      const before = await getCoachBalance(coachId);
      if (!before) return res.status(503).json({ error: 'Payments backend is not configured.' });
      if (amountCents > before.summary.availableCents) {
        return res.status(400).json({ error: 'Amount exceeds your available balance.' });
      }

      // Reserve the funds first, then re-check, so two racing requests can never both succeed.
      const reserve = await admin
        .from('coach_payout_ledger')
        .insert({
          coach_id: coachId,
          amount_cents: amountCents,
          currency: PAYOUT_CURRENCY,
          status: 'processing',
        })
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

      const destination = profile.stripe_connect_account_id;
      const sendTransfer = () =>
        stripe.transfers.create(
          {
            amount: amountCents,
            currency: PAYOUT_CURRENCY,
            destination,
            description: `Oblivion 1 coaching payout ${coachId.slice(0, 8)}`,
            metadata: { coach_id: coachId, ledger_id: String(ledgerId) },
          },
          { idempotencyKey: `o1fc_payout_${ledgerId}` },
        );
      let transfer;
      try {
        transfer = await sendTransfer();
      } catch (first) {
        if (stripeDefinitelyRejected(first)) throw first;
        // The answer may have been lost on the way back. Asking again with the same idempotency key
        // returns the original transfer if it was created, and creates it once if it was not.
        try {
          transfer = await sendTransfer();
        } catch (second) {
          if (!stripeDefinitelyRejected(second)) unsure = true;
          throw second;
        }
      }

      // Money has left. From here the ledger row must never be marked failed, or the same
      // balance could be withdrawn twice.
      transferId = transfer.id;
      const marked = await admin
        .from('coach_payout_ledger')
        .update({
          status: 'paid',
          stripe_transfer_id: transfer.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ledgerId);
      if (marked.error) {
        console.error(
          '[stripe] transfer sent but ledger update failed:',
          transfer.id,
          marked.error.message,
        );
      }

      return res.json({
        success: true,
        payoutId: transfer.id,
        transferId: transfer.id,
        amountCents,
      });
    } catch (err) {
      console.error('[stripe] create-payout failed:', errorMessage(err));
      if (transferId) {
        console.error(
          '[stripe] transfer',
          transferId,
          'was sent; leaving ledger row',
          ledgerId,
          'as processing for review.',
        );
        return res.json({
          success: true,
          payoutId: transferId,
          transferId,
          amountCents: Number(req.body?.amountCents),
        });
      }
      if (unsure && ledgerId) {
        // Stripe never confirmed either way. The funds stay reserved and the next balance check settles
        // the row from Stripe's records. Releasing them now could pay the same money twice.
        return res.status(502).json({
          error:
            'Your withdrawal is being confirmed by Stripe. Do not try again. Check your balance in a few minutes.',
        });
      }
      if (ledgerId) {
        await getSupabaseAdmin()
          ?.from('coach_payout_ledger')
          .update({
            status: 'failed',
            error_message: errorMessage(err, 'transfer failed').slice(0, 300),
            updated_at: new Date().toISOString(),
          })
          .eq('id', ledgerId);
      }
      return res.status(502).json({
        error: 'The withdrawal could not be sent. Your balance is unchanged. Try again later.',
      });
    } finally {
      if (locked) inFlightPayouts.delete(coachId);
    }
  });

  // -------------------------------------------------------------------------
  // Checkout. The buyer is the verified token; the price and coach are read from the database.
  // -------------------------------------------------------------------------
  app.post('/api/stripe/create-checkout', async (req, res) => {
    try {
      const athleteId = res.locals.userId as string;
      const kind =
        req.body?.kind === 'coaching'
          ? 'coaching'
          : req.body?.kind === 'program'
            ? 'program'
            : null;
      const coachId = typeof req.body?.coachId === 'string' ? req.body.coachId : '';
      if (!kind || !coachId) return res.status(400).json({ error: 'Missing what to buy.' });
      if (coachId === athleteId)
        return res.status(400).json({ error: 'You can’t buy from yourself.' });

      const stripe = await getStripe();
      const admin = getSupabaseAdmin();
      if (!stripe || !admin) return res.status(503).json({ error: 'Payments are not configured.' });

      const coach = await getCoachConnectProfile(coachId);
      if (!coach?.stripe_connect_account_id) {
        return res.status(409).json({ error: 'This coach is not taking payments yet.' });
      }

      const resolved = await resolveCheckoutItem({
        kind,
        coachId,
        programId: typeof req.body?.programId === 'string' ? req.body.programId : null,
        athleteId,
      });
      if (!resolved.item) {
        const status = resolved.error === 'not_configured' ? 503 : 400;
        return res.status(status).json({
          error:
            resolved.error === 'not_configured' ? 'Payments are not configured.' : resolved.error,
        });
      }
      const { item } = resolved;

      // A program is bought once. Without this, a second tap or a second device charges the card again.
      if (item.kind === 'program' && item.programId) {
        const owned = await admin
          .from('program_enrollments')
          .select('status')
          .eq('athlete_id', athleteId)
          .eq('program_id', item.programId)
          .maybeSingle();
        if (owned.data?.status === 'active') {
          return res.status(409).json({ error: 'You already own this program.' });
        }
      }

      const athleteName = String(req.body?.athleteName || '').slice(0, 80);
      const metadata: Record<string, string> = {
        kind: item.kind,
        coach_id: item.coachId,
        athlete_id: athleteId,
        athlete_name: athleteName,
        program_id: item.programId || '',
        program_title: item.title.slice(0, 200),
      };
      const fallbackOrigin = defaultReturnOrigin(req.headers.origin);
      const base = safeReturnBase(req.body?.returnUrl, fallbackOrigin);
      const withParam = (param: string) => `${base}${base.includes('?') ? '&' : '?'}${param}`;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: athleteId,
        customer_email: (res.locals.userEmail as string | undefined) || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: PAYOUT_CURRENCY,
              unit_amount: item.priceCents,
              product_data: { name: item.title },
            },
          },
        ],
        metadata,
        payment_intent_data: { metadata, transfer_group: `coach_${item.coachId}` },
        success_url: withParam('checkout=success&session_id={CHECKOUT_SESSION_ID}'),
        cancel_url: withParam('checkout=cancel'),
      });
      if (!session.url)
        return res.status(502).json({ error: 'Stripe did not return a checkout page.' });
      return res.json({ url: session.url });
    } catch (err) {
      console.error('[stripe] create-checkout failed:', errorMessage(err));
      return res.status(500).json({ error: 'Could not start checkout.' });
    }
  });

  // Signature-verified, no JWT.
  app.post('/api/stripe/webhook', handleStripeWebhook);
}

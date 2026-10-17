import { Request, Response } from 'express';
import { errorMessage } from '../../shared/errorMessage';
import {
  enrollPaidProgram,
  getStripe,
  getSupabaseAdmin,
  recordProgramSale,
  recordSaleDispute,
  recordSaleRefund,
  recordTransferReversal,
  safeReturnBase,
} from '../lib/stripeLedger';

/**
 * Identity session. The coach id is the verified Supabase user from requireSupabaseAuth,
 * never a value taken from the request body.
 */
export async function handleCreateIdentitySession(req: Request, res: Response) {
  try {
    const coachId = res.locals.userId as string | undefined;
    if (!coachId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const returnUrl = safeReturnBase(req.body?.returnUrl, String(req.headers.origin || 'http://localhost:3000'));
    const userEmail = (res.locals.userEmail as string | undefined) || '';
    const stripe = await getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe Identity is not configured.' });
    }

    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      options: {
        document: {
          require_matching_selfie: true,
          require_id_number: true,
          allowed_types: ['driving_license', 'passport', 'id_card'],
        },
      },
      metadata: { coach_id: coachId, user_email: userEmail },
      return_url: `${returnUrl}/?identity_status=processing`,
    });

    const admin = getSupabaseAdmin();
    if (admin) {
      const { error } = await admin
        .from('coach_profiles')
        .update({ stripe_identity_session_id: verificationSession.id, identity_status: 'processing' })
        .eq('id', coachId);
      if (error) console.warn('[Stripe Identity] DB sync warning:', error.message);
    }

    return res.json({ url: verificationSession.url, sessionId: verificationSession.id });
  } catch (err) {
    console.error('Error in /api/stripe/create-identity-session:', err);
    return res.status(500).json({ error: 'Identity check could not start. Try again.' });
  }
}

/**
 * Verifies the signature against every configured endpoint secret (platform events and Connect events
 * use separate secrets in Stripe). An unsigned webhook is only tolerated outside production.
 */
async function constructVerifiedEvent(req: Request): Promise<any> {
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(
    (s): s is string => Boolean(s),
  );
  const signature = req.headers['stripe-signature'];

  if (secrets.length === 0) {
    // An unsigned webhook would let anyone credit a coach without paying. Never accept one.
    throw Object.assign(new Error('Webhook secret is not configured.'), { status: 503 });
  }

  const stripe = await getStripe();
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!stripe || !signature || !rawBody) {
    throw Object.assign(new Error('Missing Stripe signature, key, or raw body.'), { status: 400 });
  }
  let lastError: unknown = null;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(rawBody, signature as string, secret);
    } catch (err) {
      lastError = err;
    }
  }
  console.warn('[Stripe Webhook] Signature verification failed:', errorMessage(lastError));
  throw Object.assign(new Error('Invalid Stripe signature'), { status: 400 });
}

export async function handleStripeWebhook(req: Request, res: Response) {
  let event: any;
  try {
    event = await constructVerifiedEvent(req);
  } catch (err) {
    const status = err instanceof Error && 'status' in err && typeof err.status === 'number' ? err.status : 400;
    return res.status(status).json({ error: errorMessage(err, 'Invalid webhook') });
  }

  try {
    const admin = getSupabaseAdmin();
    const type: string | undefined = event?.type;
    const object = event?.data?.object;

    // Stripe Connect onboarding finished (or changed): mirror payouts_enabled onto the coach profile.
    if (type === 'account.updated' && object?.id && admin) {
      const payoutsEnabled = Boolean(object.payouts_enabled);
      const { error } = await admin
        .from('coach_profiles')
        .update({ stripe_payouts_enabled: payoutsEnabled })
        .eq('stripe_connect_account_id', object.id);
      if (error) throw new Error(`account.updated sync failed: ${error.message}`);
      return res.json({ received: true, payoutsEnabled });
    }

    // Program sale paid: write the platform/coach split to the ledger.
    // `async_payment_succeeded` covers methods that confirm after checkout closes; both carry a paid session.
    if (
      (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') &&
      object?.payment_status === 'paid'
    ) {
      const meta = object?.metadata ?? {};
      const coachId = meta.coach_id;
      if (coachId) {
        const grossCents = Number(object?.amount_total || 0);
        if (!Number.isInteger(grossCents) || grossCents <= 0 || String(object?.currency || '').toLowerCase() !== 'aud') {
          // Checkout only ever creates positive AUD sessions, so anything else is not one of ours.
          console.error('[Stripe Webhook] Ignoring session with unexpected amount/currency:', object?.id, grossCents, object?.currency);
          return res.json({ received: true, ignored: 'unexpected amount or currency' });
        }
        const result = await recordProgramSale({
          coachId,
          athleteId: meta.athlete_id,
          athleteName: meta.athlete_name,
          programTitle: meta.program_title,
          grossCents,
          currency: object?.currency,
          stripeSessionId: String(object.id),
        });
        if (meta.kind === 'program' && meta.program_id && meta.athlete_id) {
          await enrollPaidProgram(meta.athlete_id, coachId, meta.program_id);
        }
        return res.json({ received: true, ...result });
      }
      return res.json({ received: true, ignored: 'no coach metadata' });
    }

    if (type === 'charge.refunded' && object) {
      const refund = await recordSaleRefund(object);
      // The sale may not be written yet. A 500 makes Stripe deliver this again later instead of losing the refund.
      if (refund.reason === 'sale_not_found') return res.status(500).json({ error: 'Sale not recorded yet.', ...refund });
      return res.json({ received: true, ...refund });
    }

    // A dispute takes the money back at once: void the sale. If it is won, put it back.
    if (type === 'charge.dispute.created' && object) {
      return res.json({ received: true, ...(await recordSaleDispute(object, false)) });
    }
    if (type === 'charge.dispute.closed' && object) {
      if (object.status === 'won') return res.json({ received: true, ...(await recordSaleDispute(object, true)) });
      if (object.status === 'lost') return res.json({ received: true, ...(await recordSaleDispute(object, false)) });
      return res.json({ received: true, ignored: `dispute ${object.status}` });
    }

    if (type === 'transfer.reversed' && object?.id) {
      return res.json({ received: true, ...(await recordTransferReversal(object)) });
    }

    if (type === 'identity.verification_session.verified') {
      const coachId = object?.metadata?.coach_id;
      if (coachId && admin) {
        await admin
          .from('coach_profiles')
          .update({ is_id_verified: true, identity_status: 'verified', verified_at: new Date().toISOString() })
          .eq('id', coachId);
      }
      return res.json({ received: true, verified: true });
    }

    if (type === 'identity.verification_session.requires_input') {
      const coachId = object?.metadata?.coach_id;
      if (coachId && admin) {
        await admin.from('coach_profiles').update({ identity_status: 'failed_retry_required' }).eq('id', coachId);
      }
      return res.json({ received: true, status: 'requires_input' });
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    // 500 makes Stripe retry, which is what we want for transient DB failures.
    return res.status(500).json({ error: errorMessage(err) });
  }
}

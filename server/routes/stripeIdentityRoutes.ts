import { Request, Response } from 'express';
import {
  enrollPaidProgram,
  getStripe,
  getSupabaseAdmin,
  recordProgramSale,
  recordSaleRefund,
  recordTransferReversal,
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
    const returnUrl = req.body?.returnUrl || req.headers.origin || 'http://localhost:3000';
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
  } catch (err: any) {
    console.error('Error in /api/stripe/create-identity-session:', err);
    return res.status(500).json({ error: err.message || 'Identity session creation failed' });
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
    if (process.env.NODE_ENV === 'production') {
      throw Object.assign(new Error('Webhook secret is not configured.'), { status: 503 });
    }
    console.warn('[Stripe Webhook] No webhook secret set; accepting unsigned events (non-production only).');
    return req.body;
  }

  const stripe = await getStripe();
  const rawBody = (req as any).rawBody;
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
  console.warn('[Stripe Webhook] Signature verification failed:', (lastError as Error)?.message);
  throw Object.assign(new Error('Invalid Stripe signature'), { status: 400 });
}

export async function handleStripeWebhook(req: Request, res: Response) {
  let event: any;
  try {
    event = await constructVerifiedEvent(req);
  } catch (err: any) {
    return res.status(err?.status || 400).json({ error: err?.message || 'Invalid webhook' });
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
    if (type === 'checkout.session.completed' && object?.payment_status === 'paid') {
      const meta = object?.metadata ?? {};
      const coachId = meta.coach_id;
      if (coachId) {
        const result = await recordProgramSale({
          coachId,
          athleteId: meta.athlete_id,
          athleteName: meta.athlete_name,
          programTitle: meta.program_title,
          grossCents: Number(object?.amount_total || 0),
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
      return res.json({ received: true, ...(await recordSaleRefund(object)) });
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
  } catch (err: any) {
    console.error('Error handling Stripe webhook:', err);
    // 500 makes Stripe retry, which is what we want for transient DB failures.
    return res.status(500).json({ error: err.message });
  }
}

export const handleStripeIdentityWebhook = handleStripeWebhook;

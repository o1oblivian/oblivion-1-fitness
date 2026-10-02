import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function handleCreateIdentitySession(req: Request, res: Response) {
  try {
    const coachId = req.body?.coachId || 'coach_alpha';
    const returnUrl = req.body?.returnUrl || req.headers.origin || 'http://localhost:3000';
    const userEmail = req.body?.email || 'coach@oblivion1.com';
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (stripeKey) {
      try {
        const StripeModule = await import('stripe');
        const Stripe = StripeModule.default;
        const stripe = new Stripe(stripeKey);

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

        // Save session id to coach_profiles
        if (supabaseAdmin) {
          try {
            await supabaseAdmin
              .from('coach_profiles')
              .update({
                stripe_identity_session_id: verificationSession.id,
                identity_status: 'processing',
              })
              .eq('id', coachId);
          } catch (dbErr) {
            console.warn('[Stripe Identity] DB sync warning:', dbErr);
          }
        }

        return res.json({ url: verificationSession.url, sessionId: verificationSession.id });
      } catch (stripeErr: any) {
        console.warn('[Stripe Identity] Error creating live session:', stripeErr.message);
      }
    }

    // Dev/Sandbox verification return URL
    const simulatedUrl = `${returnUrl}/coach?tab=earnings&identity_status=verified`;
    return res.json({
      url: simulatedUrl,
      sessionId: `vs_sim_${Date.now()}`,
      simulated: true,
    });
  } catch (err: any) {
    console.error('Error in /api/stripe/create-identity-session:', err);
    return res.status(500).json({ error: err.message || 'Identity session creation failed' });
  }
}

export async function handleStripeIdentityWebhook(req: Request, res: Response) {
  try {
    const event = req.body;
    const type = event?.type;
    const session = event?.data?.object;

    if (type === 'identity.verification_session.verified') {
      const coachId = session?.metadata?.coach_id;
      if (coachId && supabaseAdmin) {
        await supabaseAdmin
          .from('coach_profiles')
          .update({
            is_id_verified: true,
            identity_status: 'verified',
            verified_at: new Date().toISOString(),
          })
          .eq('id', coachId);
      }
      return res.json({ received: true, verified: true });
    }

    if (type === 'identity.verification_session.requires_input') {
      const coachId = session?.metadata?.coach_id;
      if (coachId && supabaseAdmin) {
        await supabaseAdmin
          .from('coach_profiles')
          .update({
            identity_status: 'failed_retry_required',
          })
          .eq('id', coachId);
      }
      return res.json({ received: true, status: 'requires_input' });
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('Error handling Stripe Identity webhook:', err);
    return res.status(500).json({ error: err.message });
  }
}

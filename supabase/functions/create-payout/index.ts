import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^14';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? supabaseAnonKey;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized coach identity' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { amountCents } = await req.json().catch(() => ({}));
    if (!amountCents || typeof amountCents !== 'number' || amountCents <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid disbursement amount (must be positive integer cents)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('coach_profiles')
      .select('id, stripe_connect_account_id, stripe_payouts_enabled, currency')
      .eq('id', user.id)
      .maybeSingle();

    if (profErr || !profile?.stripe_connect_account_id) {
      return new Response(JSON.stringify({ error: 'No Stripe Connect account linked to this coach' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
    const currency = (profile.currency || 'aud').toLowerCase();

    const transfer = await stripe.transfers.create({
      amount: Math.round(amountCents),
      currency,
      destination: profile.stripe_connect_account_id,
      description: `Oblivion 1 Coaching Payout - Coach ${user.id.slice(0, 8)}`,
      metadata: { coach_id: user.id },
    });

    const { error: ledgerErr } = await supabaseAdmin.from('coach_payout_ledger').insert({
      coach_id: user.id,
      amount_cents: Math.round(amountCents),
      currency,
      stripe_transfer_id: transfer.id,
      status: 'paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (ledgerErr) {
      console.error('Ledger insert warning:', ledgerErr);
    }

    return new Response(JSON.stringify({ success: true, transferId: transfer.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Disbursement dispatch failure' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

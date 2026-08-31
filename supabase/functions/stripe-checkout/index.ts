import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  appInfo: { name: 'Bolt Integration', version: '1.0.0' },
});

const PLAN_CATALOG: Record<string, { name: string; amount: number; lookupKey: string }> = {
  premium: {
    name: 'O1FC Plus (50km Radius)',
    amount: 999,
    lookupKey: 'o1fc_premium_50km',
  },
  premium_50k: {
    name: 'O1FC Plus (50km Radius)',
    amount: 999,
    lookupKey: 'o1fc_premium_50km',
  },
  premium_50km: {
    name: 'O1FC Plus (50km Radius)',
    amount: 999,
    lookupKey: 'o1fc_premium_50km',
  },
  premium_travel: {
    name: 'O1FC Global VIP (Travel Pass)',
    amount: 1599,
    lookupKey: 'o1fc_premium_travel',
  },
  coach_pro: {
    name: 'O1FC Coach Pro (Unlimited)',
    amount: 2999,
    lookupKey: 'o1fc_pro_membership',
  },
};

async function resolveStripePriceId(planKey: string): Promise<string> {
  const plan = PLAN_CATALOG[planKey];
  if (!plan) throw new Error(`Unknown plan: ${planKey}`);

  const existing = await stripe.prices.list({
    lookup_keys: [plan.lookupKey],
    active: true,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const products = await stripe.products.search({
    query: `name:"${plan.name}" AND active:"true"`,
    limit: 1,
  });

  let productId: string;
  if (products.data.length > 0) {
    productId = products.data[0].id;
  } else {
    const newProduct = await stripe.products.create({
      name: plan.name,
      metadata: { plan_key: planKey },
    });
    productId = newProduct.id;
  }

  const newPrice = await stripe.prices.create({
    product: productId,
    unit_amount: plan.amount,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: plan.lookupKey,
    transfer_lookup_key: true,
  });

  return newPrice.id;
}

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  };
  if (status === 204) return new Response(null, { status, headers });
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return corsResponse(null, 204);
    if (req.method !== 'POST') return corsResponse({ error: 'Method not allowed' }, 405);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return corsResponse({ error: 'Missing authorization' }, 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return corsResponse({ error: 'Unauthorized. Please log in.' }, 401);

    const body = await req.json();
    const planId = body.planId || body.price_id;
    const successUrl = body.successUrl || body.success_url;
    const cancelUrl = body.cancelUrl || body.cancel_url;

    if (!planId || typeof planId !== 'string') {
      return corsResponse({ error: 'Missing required parameter: planId' }, 400);
    }
    if (!successUrl || !cancelUrl) {
      return corsResponse({ error: 'Missing success_url or cancel_url' }, 400);
    }

    const plan = PLAN_CATALOG[planId];
    if (!plan) return corsResponse({ error: `Unknown plan: ${planId}` }, 400);

    // Find or create Stripe customer
    const { data: existingCustomer } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    let customerId: string;

    if (existingCustomer?.customer_id) {
      customerId = existingCustomer.customer_id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_uid: user.id },
      });
      customerId = newCustomer.id;

      const { error: mapError } = await supabaseAdmin.from('stripe_customers').insert({
        user_id: user.id,
        customer_id: newCustomer.id,
      });

      if (mapError) {
        try { await stripe.customers.del(newCustomer.id); } catch {}
        return corsResponse({ error: 'Failed to create customer mapping' }, 500);
      }
    }

    // Ensure subscription tracking row exists
    const { data: existingSub } = await supabaseAdmin
      .from('stripe_subscriptions')
      .select('customer_id')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (!existingSub) {
      await supabaseAdmin.from('stripe_subscriptions').insert({
        customer_id: customerId,
        status: 'not_started',
      });
    }

    const resolvedPriceId = await resolveStripePriceId(planId);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      payment_method_collection: 'always',
      metadata: {
        user_id: user.id,
        tier: planId,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier: planId,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return corsResponse({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error(`Checkout error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});

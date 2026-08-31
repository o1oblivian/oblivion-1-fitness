import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  appInfo: { name: 'Bolt Integration', version: '1.0.0' },
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const signature = req.headers.get('stripe-signature');
    if (!signature) return new Response('No signature found', { status: 400 });

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(
      handleEvent(event).catch((err) => {
        console.error(`handleEvent failed for ${event.type} (${event.id}):`, err);
      })
    );

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const tier = session.metadata?.tier || 'premium_50k';
      const customerId = session.customer as string;

      if (session.mode === 'subscription' && userId) {
        await updateUserTier(userId, tier, 'active');
        await syncSubscriptionRecord(customerId);
      } else if (session.mode === 'payment' && session.payment_status === 'paid') {
        await recordOneTimePayment(session, customerId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      const tier = subscription.metadata?.tier || 'premium_50k';
      const customerId = subscription.customer as string;

      if (userId) {
        const isActive = ['active', 'trialing'].includes(subscription.status);
        await updateUserTier(userId, isActive ? tier : 'free', isActive ? 'active' : 'past_due');
      } else {
        await syncViaCustomerLookup(customerId, subscription);
      }

      await syncSubscriptionRecord(customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      const customerId = subscription.customer as string;

      if (userId) {
        await updateUserTier(userId, 'free', 'canceled');
      } else {
        const resolved = await resolveUserId(customerId);
        if (resolved) await updateUserTier(resolved, 'free', 'canceled');
      }

      await syncSubscriptionRecord(customerId);
      break;
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      if (pi.invoice !== null) return;
      break;
    }
  }
}

async function updateUserTier(userId: string, tier: string, status: string) {
  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .update({
      subscription_tier: tier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    console.error(`Failed to update user_profiles for ${userId}:`, profileError);
  }

  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        tier,
        status,
        started_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (subError) {
    console.error(`Failed to upsert subscriptions for ${userId}:`, subError);
  }

  console.info(`Updated user ${userId} -> tier="${tier}" status="${status}"`);
}

async function syncSubscriptionRecord(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      await supabaseAdmin.from('stripe_subscriptions').upsert(
        { customer_id: customerId, status: 'not_started' },
        { onConflict: 'customer_id' },
      );
      return;
    }

    const sub = subscriptions.data[0];
    await supabaseAdmin.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: sub.id,
        price_id: sub.items.data[0].price.id,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        status: sub.status,
        ...(sub.default_payment_method && typeof sub.default_payment_method !== 'string'
          ? {
              payment_method_brand: sub.default_payment_method.card?.brand ?? null,
              payment_method_last4: sub.default_payment_method.card?.last4 ?? null,
            }
          : {}),
      },
      { onConflict: 'customer_id' },
    );
  } catch (err) {
    console.error(`syncSubscriptionRecord failed for ${customerId}:`, err);
  }
}

async function syncViaCustomerLookup(customerId: string, subscription: Stripe.Subscription) {
  const userId = await resolveUserId(customerId);
  if (!userId) return;

  const isActive = ['active', 'trialing'].includes(subscription.status);
  const tier = subscription.metadata?.tier || 'premium_50k';
  await updateUserTier(userId, isActive ? tier : 'free', isActive ? 'active' : 'past_due');
}

async function resolveUserId(stripeCustomerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', stripeCustomerId)
    .maybeSingle();

  if (!data?.user_id) {
    console.warn(`No user mapping for Stripe customer: ${stripeCustomerId}`);
    return null;
  }
  return data.user_id;
}

async function recordOneTimePayment(session: Stripe.Checkout.Session, customerId: string) {
  try {
    const { error } = await supabaseAdmin.from('stripe_orders').insert({
      checkout_session_id: session.id,
      payment_intent_id: session.payment_intent,
      customer_id: customerId,
      amount_subtotal: session.amount_subtotal,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      status: 'completed',
    });
    if (error) console.error('Error inserting order:', error);
    else console.info(`Recorded one-time payment for session: ${session.id}`);
  } catch (err) {
    console.error('Error processing one-time payment:', err);
  }
}

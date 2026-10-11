#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Stripe test-mode end-to-end check for coach payments against the local server (port 3000).
 *   node scripts/stripe-e2e.cjs setup     creates test users, Connect account, paid program, Checkout URL
 *   (pay the Checkout URL with 4242 4242 4242 4242)
 *   node scripts/stripe-e2e.cjs verify    webhooks, split, enrollment, hold, payout + reversal, refunds
 *   node scripts/stripe-e2e.cjs cleanup   deletes everything setup created
 * Refuses to run with a live Stripe key. Webhooks are signed locally with STRIPE_WEBHOOK_SECRET.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const ROOT = path.resolve(__dirname, '..');
const STATE = path.join(ROOT, '.stripe-e2e-state.json');
const API = process.env.E2E_API || 'http://localhost:3000';
const PRICE_CENTS = 4999;

const env = {};
for (const f of ['.env', '.env.local']) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
if (!String(env.STRIPE_SECRET_KEY || '').startsWith('sk_test_')) {
  console.error('Refusing to run: STRIPE_SECRET_KEY is not a test key.');
  process.exit(1);
}
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const db = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const results = [];
function check(name, ok, detail = '') {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  return ok;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const loadState = () => (fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {});
const saveState = (s) => fs.writeFileSync(STATE, JSON.stringify(s, null, 2));

async function token(email, password) {
  const client = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for test user: ${error.message}`);
  return data.session.access_token;
}

async function api(method, route, jwt, body) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function webhook(type, object, { badSignature = false } = {}) {
  const payload = JSON.stringify({ id: `evt_e2e_${Date.now()}`, object: 'event', type, data: { object } });
  const header = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: badSignature ? 'whsec_wrong' : env.STRIPE_WEBHOOK_SECRET,
  });
  const res = await fetch(`${API}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': header },
    body: payload,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function sale(coachId) {
  const { data } = await db.from('coach_transactions').select('*').eq('coach_id', coachId).maybeSingle();
  return data;
}

async function payoutRow(id) {
  const { data } = await db.from('coach_payout_ledger').select('*').eq('id', id).maybeSingle();
  return data;
}

async function setup() {
  if (fs.existsSync(STATE)) throw new Error('State file exists. Run cleanup first.');
  const state = {};
  const stamp = Date.now();
  const password = `E2e-${stamp}-${Math.random().toString(36).slice(2)}`;
  state.password = password;
  saveState(state);

  for (const role of ['coach', 'athlete']) {
    const email = `o1fc-e2e-${role}-${stamp}@example.com`;
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(`create ${role} user: ${error.message}`);
    state[`${role}Id`] = data.user.id;
    state[`${role}Email`] = email;
    saveState(state);
  }
  check('test coach + athlete users created', true);

  const coachJwt = await token(state.coachEmail, password);
  const express = await api('POST', '/api/stripe/create-connect-account', coachJwt, { returnUrl: `${API}/` });
  const expressProfile = await db.from('coach_profiles').select('stripe_connect_account_id').eq('id', state.coachId).maybeSingle();
  state.expressAccountId = expressProfile.data?.stripe_connect_account_id || null;
  saveState(state);
  check(
    'create-connect-account returns onboarding link and saves account',
    express.status === 200 && String(express.body.url || '').startsWith('https://') && Boolean(state.expressAccountId),
    express.status === 200 ? '' : `${express.status} ${express.body.error || ''}`,
  );

  const account = await stripe.accounts.create({
    type: 'custom',
    country: 'AU',
    email: state.coachEmail,
    business_type: 'individual',
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    business_profile: { mcc: '7997', url: 'https://oblivion-1-fitness.onrender.com', product_description: 'Coaching programs' },
    individual: {
      first_name: 'E2E',
      last_name: 'Coach',
      email: state.coachEmail,
      phone: '+61412345678',
      dob: { day: 1, month: 1, year: 1901 },
      address: { line1: 'address_full_match', city: 'Sydney', state: 'NSW', postal_code: '2000', country: 'AU' },
    },
    external_account: { object: 'bank_account', country: 'AU', currency: 'aud', routing_number: '110000', account_number: '000123456' },
    tos_acceptance: { date: Math.floor(Date.now() / 1000), ip: '8.8.8.8' },
    metadata: { coach_id: state.coachId, o1fc_e2e: '1' },
  }).catch((err) => {
    console.log(`SKIP  payout + reversal checks: Stripe refused a test connected account (${err.message.split('. ')[0]})`);
    return null;
  });
  state.customAccountId = account?.id || null;
  saveState(state);
  const linkedAccountId = account?.id || state.expressAccountId || 'acct_e2e_placeholder';
  const stripeFields = { stripe_connect_account_id: linkedAccountId, stripe_payouts_enabled: false };
  const linked = state.expressAccountId
    ? await db.from('coach_profiles').update(stripeFields).eq('id', state.coachId)
    : await db.from('coach_profiles').insert({ id: state.coachId, display_name: 'E2E Coach', ...stripeFields });
  if (linked.error) throw new Error(`link connect account: ${linked.error.message}`);
  check('coach linked to a Connect account id', true, account ? 'test connected account' : 'placeholder id, payouts skipped');

  state.programId = `prog-e2e-${stamp}`;
  const program = await db.from('coach_programs').insert({
    id: state.programId,
    coach_id: state.coachId,
    title: 'E2E Strength Block',
    description: 'Automated Stripe test program',
    price_cents: PRICE_CENTS,
    listed: true,
  });
  saveState(state);
  if (!check('paid program listed', !program.error, program.error?.message)) return;

  const athleteJwt = await token(state.athleteEmail, password);
  const self = await api('POST', '/api/stripe/create-checkout', coachJwt, { kind: 'program', coachId: state.coachId, programId: state.programId });
  check('coach cannot buy own program', self.status === 400, `${self.status}`);
  const forged = await api('POST', '/api/stripe/create-checkout', athleteJwt, { kind: 'program', coachId: state.coachId, programId: 'does-not-exist', priceCents: 1 });
  check('unknown program rejected (client price ignored)', forged.status === 400, `${forged.status} ${forged.body.error || ''}`);

  const checkout = await api('POST', '/api/stripe/create-checkout', athleteJwt, {
    kind: 'program',
    coachId: state.coachId,
    programId: state.programId,
    athleteName: 'E2E Athlete',
    returnUrl: `${API}/`,
  });
  if (!check('checkout session created', checkout.status === 200 && Boolean(checkout.body.url), `${checkout.status} ${checkout.body.error || ''}`)) return;
  state.checkoutUrl = checkout.body.url;
  state.sessionId = (checkout.body.url.match(/(cs_test_[A-Za-z0-9]+)/) || [])[1] || null;
  saveState(state);
  console.log(`\nCHECKOUT_URL ${checkout.body.url}`);
}

async function balance(jwt) {
  const r = await api('GET', '/api/stripe/balance', jwt);
  return r.body;
}

async function verify() {
  const s = loadState();
  if (!s.sessionId) throw new Error('Run setup first.');
  const coachJwt = await token(s.coachEmail, s.password);
  const session = await stripe.checkout.sessions.retrieve(s.sessionId);
  if (!check('checkout paid with 4242', session.payment_status === 'paid', session.payment_status)) return;
  check('session metadata carries coach, athlete, program', session.metadata.coach_id === s.coachId && session.metadata.athlete_id === s.athleteId && session.metadata.program_id === s.programId);
  check('price came from the database', session.amount_total === PRICE_CENTS && session.currency === 'aud', `${session.amount_total} ${session.currency}`);

  const bad = await webhook('checkout.session.completed', session, { badSignature: true });
  check('webhook with bad signature rejected', bad.status === 400, `${bad.status}`);
  const first = await webhook('checkout.session.completed', session);
  check('checkout.session.completed recorded', first.status === 200 && first.body.recorded === true, JSON.stringify(first.body));
  const dupe = await webhook('checkout.session.completed', session);
  check('webhook retry does not double count', dupe.body.reason === 'duplicate', JSON.stringify(dupe.body));

  const row = await sale(s.coachId);
  const fee = Math.round(PRICE_CENTS * 0.15);
  check(
    'starter split 15% recorded',
    row && Math.round(row.gross_amount * 100) === PRICE_CENTS && Math.round(row.platform_fee * 100) === fee && Math.round(row.coach_net * 100) === PRICE_CENTS - fee && row.coach_plan === 'starter' && row.status === 'PENDING',
    row ? `gross ${row.gross_amount} fee ${row.platform_fee} net ${row.coach_net} ${row.coach_plan} ${row.status}` : 'no row',
  );
  const enrolled = await db.from('program_enrollments').select('status').eq('athlete_id', s.athleteId).eq('program_id', s.programId).maybeSingle();
  check('athlete enrolled in paid program', enrolled.data?.status === 'active', enrolled.error?.message || enrolled.data?.status);

  const net = PRICE_CENTS - fee;
  let b = await balance(coachJwt);
  check('7-day hold: sale is pending, not withdrawable', b.pendingCents === net && b.availableCents === 0 && b.platformFeeRate === 0.15, `pending ${b.pendingCents} available ${b.availableCents}`);

  if (s.customAccountId) {
    for (let i = 0; i < 30; i += 1) {
      const acct = await stripe.accounts.retrieve(s.customAccountId);
      if (acct.payouts_enabled && acct.capabilities?.transfers === 'active') break;
      await sleep(3000);
    }
    const blocked = await api('POST', '/api/stripe/create-payout', coachJwt, { amountCents: 1000 });
    check('withdrawal blocked during hold', blocked.status === 400 || blocked.status === 403, `${blocked.status} ${blocked.body.error || ''}`);
  }

  const eightDaysAgo = new Date(Date.now() - 8 * 86_400_000).toISOString();
  await db.from('coach_transactions').update({ created_at: eightDaysAgo }).eq('id', row.id);
  b = await balance(coachJwt);
  check('after hold the coach net becomes available', b.availableCents === net && b.pendingCents === 0, `available ${b.availableCents}`);

  if (s.customAccountId) await payoutChecks(coachJwt, net);
  else console.log('SKIP  payout, over-withdraw guard, transfer reversals (no test connected account)');

  await refundChecks(s, session, coachJwt);
  summary();
}

async function payoutChecks(coachJwt, net) {
  let b;
  const topUp = await stripe.paymentIntents.create({
    amount: 5000,
    currency: 'aud',
    payment_method: 'pm_card_bypassPending',
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    description: 'O1FC e2e: fund test transfers',
  });
  check('platform test balance funded for transfer', topUp.status === 'succeeded', topUp.status);

  const payout = await api('POST', '/api/stripe/create-payout', coachJwt, { amountCents: 1000 });
  if (!check('payout transfer created', payout.status === 200 && Boolean(payout.body.transferId), `${payout.status} ${payout.body.error || ''}`)) return;
  const { data: ledger } = await db.from('coach_payout_ledger').select('*').eq('stripe_transfer_id', payout.body.transferId).maybeSingle();
  check('payout ledger marked paid', ledger?.status === 'paid' && ledger.amount_cents === 1000, ledger?.status);
  const over = await api('POST', '/api/stripe/create-payout', coachJwt, { amountCents: net });
  check('cannot withdraw more than remaining balance', over.status === 400, `${over.status}`);
  b = await balance(coachJwt);
  check('balance after payout', b.availableCents === net - 1000 && b.paidCents === 1000, `available ${b.availableCents} paid ${b.paidCents}`);

  await stripe.transfers.createReversal(payout.body.transferId, { amount: 400 });
  let transfer = await stripe.transfers.retrieve(payout.body.transferId);
  await webhook('transfer.reversed', transfer);
  let reversed = await payoutRow(ledger.id);
  check('partial transfer reversal shrinks payout', reversed.amount_cents === 600 && reversed.status === 'paid', `${reversed.amount_cents} ${reversed.status}`);

  await stripe.transfers.createReversal(payout.body.transferId);
  transfer = await stripe.transfers.retrieve(payout.body.transferId);
  await webhook('transfer.reversed', transfer);
  reversed = await payoutRow(ledger.id);
  check('full transfer reversal voids payout', reversed.status === 'reversed', reversed.status);
  b = await balance(coachJwt);
  check('reversed funds return to available balance', b.availableCents === net && b.paidCents === 0, `available ${b.availableCents}`);
}

async function refundChecks(s, session, coachJwt) {
  let b;
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id;
  await stripe.refunds.create({ payment_intent: pi, amount: 1000 });
  let charge = await stripe.charges.retrieve((await stripe.paymentIntents.retrieve(pi)).latest_charge);
  await webhook('charge.refunded', charge);
  let refunded = await sale(s.coachId);
  const keptFee = Math.round((PRICE_CENTS - 1000) * 0.15);
  check(
    'partial refund recomputes the split',
    Math.round(refunded.gross_amount * 100) === PRICE_CENTS - 1000 && Math.round(refunded.platform_fee * 100) === keptFee && refunded.status !== 'REFUNDED',
    `gross ${refunded.gross_amount} fee ${refunded.platform_fee} net ${refunded.coach_net}`,
  );

  await stripe.refunds.create({ payment_intent: pi });
  charge = await stripe.charges.retrieve(charge.id);
  await webhook('charge.refunded', charge);
  refunded = await sale(s.coachId);
  check('full refund marks sale REFUNDED', refunded.status === 'REFUNDED', refunded.status);
  b = await balance(coachJwt);
  check('refunded sale leaves no balance', b.availableCents === 0 && b.grossCents === 0, `available ${b.availableCents} gross ${b.grossCents}`);
}

function summary() {
  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  if (failed) process.exitCode = 1;
}

async function cleanup() {
  const s = loadState();
  const steps = [];
  if (s.coachId) {
    steps.push(db.from('coach_transactions').delete().eq('coach_id', s.coachId));
    steps.push(db.from('coach_payout_ledger').delete().eq('coach_id', s.coachId));
    steps.push(db.from('coach_programs').delete().eq('coach_id', s.coachId));
    steps.push(db.from('coach_profiles').delete().eq('id', s.coachId));
  }
  if (s.athleteId) steps.push(db.from('program_enrollments').delete().eq('athlete_id', s.athleteId));
  for (const r of await Promise.all(steps)) if (r.error) console.log('cleanup warning:', r.error.message);
  for (const id of [s.coachId, s.athleteId].filter(Boolean)) {
    const { error } = await db.auth.admin.deleteUser(id);
    if (error) console.log('cleanup warning: delete user', error.message);
  }
  const accountIds = new Set([s.customAccountId, s.expressAccountId].filter(Boolean));
  if (s.coachId) {
    for await (const acct of stripe.accounts.list({ limit: 100 })) {
      if (acct.metadata?.coach_id === s.coachId) accountIds.add(acct.id);
    }
  }
  for (const id of accountIds) {
    await stripe.accounts.del(id).catch((e) => console.log('cleanup warning: delete account', e.message));
  }
  if (fs.existsSync(STATE)) fs.unlinkSync(STATE);
  console.log('cleanup done: test users, Connect accounts, program, enrollment, ledger rows removed');
}

const phase = process.argv[2];
const run = { setup: () => setup().then(summary), verify, cleanup }[phase];
if (!run) {
  console.error('usage: node scripts/stripe-e2e.cjs setup | verify | cleanup');
  process.exit(1);
}
run().catch((err) => {
  console.error('ERROR', err.message);
  process.exitCode = 1;
});

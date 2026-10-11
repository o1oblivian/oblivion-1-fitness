// Verifies supabase/migrations/20261011_coach_profiles_privacy.sql against the live project.
// Usage: node scripts/coach-privacy-check.cjs   (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = {};
for (const file of ['.env', '.env.local']) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
if (!url || !anonKey || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase URL, anon key or service role key.');
  process.exit(1);
}
const opts = { auth: { persistSession: false } };
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, opts);
const anon = createClient(url, anonKey, opts);

let failed = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

(async () => {
  const email = `privacy-check-${Date.now()}@example.com`;
  const password = `P${Math.random().toString(36).slice(2)}!9x`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createErr) {
    console.error('Could not create test user:', createErr.message);
    process.exit(1);
  }
  const uid = created.user.id;
  const user = createClient(url, anonKey, opts);
  try {
    await user.auth.signInWithPassword({ email, password });

    const pub = await anon.from('coach_profiles').select('id, display_name, avatar_url, specialties, bio, accepting_new_athletes').limit(1);
    check(!pub.error, 'public card columns readable', pub.error?.message);

    const leak = await anon.from('coach_profiles').select('payout_details').limit(1);
    check(Boolean(leak.error), 'payout_details hidden from public');
    const balance = await user.from('coach_profiles').select('available_balance').limit(1);
    check(Boolean(balance.error), 'available_balance hidden from signed-in users');

    const own = await user.from('coach_profiles').insert({ id: uid, display_name: 'Privacy Check', accepting_new_athletes: false });
    check(!own.error, 'coach can create own public card', own.error?.message);

    const fake = await user.from('coach_profiles').update({ available_balance: 999999 }).eq('id', uid);
    check(Boolean(fake.error), 'coach cannot set own balance');
    const verified = await user.from('coach_profiles').update({ is_id_verified: true }).eq('id', uid);
    check(Boolean(verified.error), 'coach cannot mark self verified');

    const rename = await user.from('coach_profiles').update({ display_name: 'Renamed' }).eq('id', uid).select('id');
    check(!rename.error && (rename.data || []).length === 1, 'coach can edit own name', rename.error?.message);

    const account = await user.rpc('my_coach_account').maybeSingle();
    check(!account.error && account.data?.id === uid && account.data?.accepting_new_athletes === false, 'my_coach_account returns own row', account.error?.message);
    const anonAccount = await anon.rpc('my_coach_account');
    check(Boolean(anonAccount.error) || (anonAccount.data || []).length === 0, 'my_coach_account empty when signed out');
  } finally {
    await admin.from('coach_profiles').delete().eq('id', uid);
    await admin.auth.admin.deleteUser(uid);
  }
  console.log(failed ? `\n${failed} check(s) failed` : '\nAll coach privacy checks passed');
  process.exit(failed ? 1 : 0);
})();

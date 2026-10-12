// Verifies supabase/migrations/20261012_buddy_safety.sql against the live project with a throwaway user.
// Usage: node scripts/buddy-safety-check.cjs   (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ path: '.env', quiet: true });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error('Missing Supabase URL, anon key or service role key.');
  process.exit(1);
}
const opts = { auth: { persistSession: false } };
const admin = createClient(url, serviceKey, opts);

let failed = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

(async () => {
  const email = `buddy-check-${Date.now()}@example.com`;
  const password = `P${Math.random().toString(36).slice(2)}!9x`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createErr) {
    console.error('Could not create test user:', createErr.message);
    process.exit(1);
  }
  const uid = created.user.id;
  const user = createClient(url, anonKey, opts);
  try {
    const signIn = await user.auth.signInWithPassword({ email, password });
    check(!signIn.error, 'test user signs in', signIn.error?.message);

    const card = await user.from('buddy_profiles').upsert(
      { id: uid, user_id: uid, athlete_name: 'Buddy Check', display_name: 'Buddy Check', age: 30, is_ghost_mode: true, latitude: -33.8688, longitude: 151.2093, is_verified: true, verified_at: new Date().toISOString() },
      { onConflict: 'id' },
    );
    check(!card.error, 'card insert accepted', card.error?.message);

    const afterInsert = await admin.from('buddy_profiles').select('is_verified, verified_at, latitude, longitude').eq('id', uid).maybeSingle();
    check(afterInsert.data && afterInsert.data.is_verified === false, 'client-set is_verified reset on insert', afterInsert.error?.message);
    check(afterInsert.data && afterInsert.data.verified_at === null, 'client-set verified_at reset on insert');
    check(afterInsert.data && afterInsert.data.latitude === null && afterInsert.data.longitude === null, 'public coordinates blanked');

    const loc = await admin.from('buddy_locations').select('latitude, longitude').eq('user_id', uid).maybeSingle();
    check(loc.data && loc.data.latitude === -33.87 && loc.data.longitude === 151.21, 'private location snapped to 2 decimals', loc.error?.message);

    const forged = await user.from('buddy_profiles').update({ is_verified: true, verified_at: new Date().toISOString() }).eq('id', uid);
    check(!forged.error, 'update request accepted', forged.error?.message);
    const afterUpdate = await admin.from('buddy_profiles').select('is_verified').eq('id', uid).maybeSingle();
    check(afterUpdate.data && afterUpdate.data.is_verified === false, 'client update cannot set is_verified');

    const peek = await user.from('buddy_locations').select('user_id').limit(1);
    check(Boolean(peek.error) || (peek.data || []).length === 0, 'buddy_locations unreadable from the app');

    const radius = await user.rpc('buddy_within_radius', { origin_lat: -33.87, origin_lng: 151.21, radius_km: 25 });
    check(!radius.error && Array.isArray(radius.data), 'radius search runs for signed-in user', radius.error?.message);
    check(!(radius.data || []).some((row) => row.id === uid), 'radius search excludes self and ghost cards');
  } catch (err) {
    failed += 1;
    console.error('FAIL ', err.message);
  } finally {
    await admin.from('buddy_locations').delete().eq('user_id', uid);
    await admin.from('buddy_profiles').delete().eq('id', uid);
    await admin.auth.admin.deleteUser(uid);
  }
  console.log(failed ? `\n${failed} check(s) failed` : '\nAll buddy safety checks passed');
  process.exit(failed ? 1 : 0);
})();

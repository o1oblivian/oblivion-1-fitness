// End-to-end check of the Fuel cloud model (fuel_profiles, fuel_days, meal_logs + recalc trigger) and its RLS.
// Usage: node scripts/fuel-sync-check.cjs   (needs SUPABASE_SERVICE_ROLE_KEY in .env.local and the 20261011_fuel_cloud migration)
// Creates throwaway users (athlete, coach, outsider) and removes them and their rows afterwards.
const fs = require('fs');
const crypto = require('crypto');
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

let failed = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};
const rows = (res) => (res.error ? [] : res.data || []);

async function signIn(email, password) {
  const client = createClient(url, anonKey, opts);
  const res = await client.auth.signInWithPassword({ email, password });
  if (res.error) throw new Error(`sign in ${email}: ${res.error.message}`);
  return client;
}

async function makeUser(tag) {
  const email = `fuel-sync-${tag}-${Date.now()}@example.com`;
  const password = `P${Math.random().toString(36).slice(2)}!9x`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`create ${tag}: ${error.message}`);
  return { id: data.user.id, email, password, client: await signIn(email, password) };
}

(async () => {
  const probe = await admin.from('fuel_days').select('user_id').limit(1);
  if (probe.error) {
    console.error(`fuel_days is not available (${probe.error.message}). Run supabase/migrations/20261011_fuel_cloud.sql first.`);
    process.exit(2);
  }

  const users = [];
  // 07:30 in Sydney on the 11th is still the 10th in UTC: the meal must belong to the athlete's local day.
  const dateKey = '2026-10-11';
  const earlyMorningUtc = '2026-10-10T20:30:00.000Z';
  const meals = [
    { id: `meal-${crypto.randomUUID()}`, meal_type: 'breakfast', name: 'Oats', calories: 380, protein: 14, carbs: 62, fats: 7.5 },
    { id: `meal-${crypto.randomUUID()}`, meal_type: 'lunch', name: 'Chicken rice', calories: 640, protein: 52, carbs: 70, fats: 12 },
  ];
  try {
    const athlete = await makeUser('athlete');
    users.push(athlete);
    const coach = await makeUser('coach');
    users.push(coach);
    const outsider = await makeUser('outsider');
    users.push(outsider);

    const profile = await athlete.client.from('fuel_profiles').upsert({
      user_id: athlete.id, calorie_target: 2450, protein_g: 180, carbs_g: 260, fats_g: 75,
      weight_kg: 82.4, height_cm: 181, age_years: 31, sex: 'male', country: 'AU', diet: 'Omnivore',
      supplement_stack: [{ id: 'supp-a', name: 'Creatine', dosage: '5g', timing: 'Anytime', category: 'Custom' }],
    }, { onConflict: 'user_id' });
    check(!profile.error, 'athlete saves targets, body, market, diet and stack', profile.error?.message);

    const inserted = await athlete.client.from('meal_logs').insert(meals.map((m) => ({
      ...m, user_id: athlete.id, date: dateKey, created_at: earlyMorningUtc,
    })));
    check(!inserted.error, 'athlete logs two meals (one before 11am local)', inserted.error?.message);

    const water = await athlete.client.from('fuel_days').upsert({
      user_id: athlete.id, date_key: dateKey, water_ml: 1250, burned_kcal: 420,
      electrolytes: { sodium: 750, potassium: 500, magnesium: 0 }, supplements_taken: ['supp-a'],
    }, { onConflict: 'user_id,date_key' });
    check(!water.error, 'athlete saves water, burn, electrolytes and supplements taken', water.error?.message);

    const secondDevice = await signIn(athlete.email, athlete.password);
    const p2 = await secondDevice.from('fuel_profiles').select('*').eq('user_id', athlete.id).maybeSingle();
    check(p2.data?.calorie_target === 2450 && Number(p2.data?.weight_kg) === 82.4 && p2.data?.country === 'AU'
      && Array.isArray(p2.data?.supplement_stack) && p2.data.supplement_stack.length === 1, 'second device loads the full profile', p2.error?.message);
    const m2 = await secondDevice.from('meal_logs').select('id').eq('user_id', athlete.id).eq('date', dateKey);
    check(rows(m2).length === 2, 'second device loads both meals by local date, including the pre-11am one', m2.error?.message);
    const d2 = await secondDevice.from('fuel_days').select('*').eq('user_id', athlete.id).eq('date_key', dateKey).maybeSingle();
    check(d2.data?.calories === 1020 && Number(d2.data?.protein) === 66 && Number(d2.data?.fats) === 19.5,
      'trigger totals equal the sum of meals', `calories=${d2.data?.calories} protein=${d2.data?.protein} fats=${d2.data?.fats}`);
    check(d2.data?.water_ml === 1250 && d2.data?.burned_kcal === 420 && d2.data?.electrolytes?.sodium === 750
      && (d2.data?.supplements_taken || []).includes('supp-a'), 'meal trigger keeps water, burn, electrolytes and supplements');

    const del = await secondDevice.from('meal_logs').delete().eq('id', meals[1].id).eq('user_id', athlete.id);
    check(!del.error, 'second device deletes a meal', del.error?.message);
    const d3 = await athlete.client.from('fuel_days').select('calories, protein, carbs, fats, water_ml').eq('user_id', athlete.id).eq('date_key', dateKey).maybeSingle();
    check(d3.data?.calories === 380 && Number(d3.data?.protein) === 14 && Number(d3.data?.carbs) === 62 && d3.data?.water_ml === 1250,
      'delete recalculates totals atomically', `calories=${d3.data?.calories}`);

    const priorDays = [
      { date: '2026-10-05', calories: 2400, protein: 182 },
      { date: '2026-10-07', calories: 1900, protein: 120 },
      { date: '2026-10-09', calories: 2800, protein: 175 },
    ];
    const weekInsert = await athlete.client.from('meal_logs').insert(priorDays.map((d) => ({
      id: `meal-${crypto.randomUUID()}`, user_id: athlete.id, date: d.date, meal_type: 'dinner', name: 'Week meal',
      calories: d.calories, protein: d.protein, carbs: 200, fats: 70,
    })));
    check(!weekInsert.error, 'athlete logs meals on three earlier days', weekInsert.error?.message);
    const week = await secondDevice.from('meal_logs').select('date, calories, protein')
      .eq('user_id', athlete.id).gte('date', '2026-10-05').lte('date', '2026-10-10');
    const byDate = {};
    for (const r of rows(week)) {
      const t = byDate[r.date] || { calories: 0, protein: 0 };
      byDate[r.date] = { calories: t.calories + Number(r.calories), protein: t.protein + Number(r.protein) };
    }
    check(Object.keys(byDate).length === 3 && priorDays.every((d) => byDate[d.date]?.calories === d.calories && byDate[d.date]?.protein === d.protein),
      'second device loads the 7-day week from meal_logs', week.error?.message || `days=${Object.keys(byDate).length}`);
    check(!byDate['2026-10-11'] && !byDate['2026-10-06'], 'week range excludes today and unlogged days');
    const weekTotals = await secondDevice.from('fuel_days').select('date_key, calories')
      .eq('user_id', athlete.id).gte('date_key', '2026-10-05').lte('date_key', '2026-10-10');
    check(rows(weekTotals).length === 3 && rows(weekTotals).every((r) => byDate[r.date_key]?.calories === r.calories),
      'trigger totals for earlier days match their meals (coach view)');

    const leakProfile = await outsider.client.from('fuel_profiles').select('user_id').eq('user_id', athlete.id);
    const leakDay = await outsider.client.from('fuel_days').select('user_id').eq('user_id', athlete.id);
    const leakMeals = await outsider.client.from('meal_logs').select('id').eq('user_id', athlete.id);
    check(rows(leakProfile).length === 0 && rows(leakDay).length === 0 && rows(leakMeals).length === 0, 'outsider cannot read athlete fuel data');
    const forged = await outsider.client.from('meal_logs').insert({ id: `meal-${crypto.randomUUID()}`, user_id: athlete.id, date: dateKey, meal_type: 'snack', name: 'forged', calories: 999 });
    check(Boolean(forged.error), 'outsider cannot log meals for the athlete');
    const forgedDay = await outsider.client.from('fuel_days').update({ water_ml: 0 }).eq('user_id', athlete.id).select('user_id');
    check(rows(forgedDay).length === 0, 'outsider cannot edit athlete water');

    const coachBefore = await coach.client.from('fuel_days').select('user_id').eq('user_id', athlete.id);
    check(rows(coachBefore).length === 0, 'unlinked coach cannot read fuel days');
    const link = await admin.from('coach_clients').insert({ coach_id: coach.id, client_id: athlete.id, status: 'active', client_name: 'Fuel Sync Athlete' });
    check(!link.error, 'coach linked to athlete', link.error?.message);
    const coachDay = await coach.client.from('fuel_days').select('calories').eq('user_id', athlete.id).eq('date_key', dateKey);
    const coachWrite = await coach.client.from('fuel_days').update({ water_ml: 0 }).eq('user_id', athlete.id).select('user_id');
    check(rows(coachDay)[0]?.calories === 380, 'linked coach reads fuel day', coachDay.error?.message);
    check(rows(coachWrite).length === 0, 'linked coach cannot edit fuel day');
  } catch (err) {
    failed += 1;
    console.error('FAIL ', err.message);
  } finally {
    for (const u of users) {
      await admin.from('coach_clients').delete().or(`coach_id.eq.${u.id},client_id.eq.${u.id}`);
      await admin.from('meal_logs').delete().eq('user_id', u.id);
      await admin.from('fuel_days').delete().eq('user_id', u.id);
      await admin.from('fuel_profiles').delete().eq('user_id', u.id);
      await admin.auth.admin.deleteUser(u.id);
    }
    console.log(failed === 0 ? '\nAll fuel sync checks passed.' : `\n${failed} check(s) failed.`);
    process.exit(failed === 0 ? 0 : 1);
  }
})();

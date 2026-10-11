// End-to-end check of the coach <-> athlete cloud flows and their RLS against the live project.
// Usage: node scripts/coach-sync-check.cjs   (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
// Creates three throwaway users (coach, athlete, outsider) and removes them and their rows afterwards.
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
const anon = createClient(url, anonKey, opts);

let failed = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};
const rows = (res) => (res.error ? [] : res.data || []);

async function makeUser(tag) {
  const email = `coach-sync-${tag}-${Date.now()}@example.com`;
  const password = `P${Math.random().toString(36).slice(2)}!9x`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`create ${tag}: ${error.message}`);
  const client = createClient(url, anonKey, opts);
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw new Error(`sign in ${tag}: ${signIn.error.message}`);
  return { id: data.user.id, client };
}

(async () => {
  const users = [];
  const ids = {
    note: crypto.randomUUID(),
    program: crypto.randomUUID(),
    completion: crypto.randomUUID(),
    checkin: crypto.randomUUID(),
    message: `msg-coach-${crypto.randomUUID()}`,
    reel: `coach-reel-sync-${Date.now()}`,
  };
  try {
    const coach = await makeUser('coach');
    users.push(coach);
    const athlete = await makeUser('athlete');
    users.push(athlete);
    const outsider = await makeUser('outsider');
    users.push(outsider);

    const card = await coach.client.from('coach_profiles').insert({ id: coach.id, display_name: 'Sync Check Coach', accepting_new_athletes: false });
    check(!card.error, 'coach creates public card', card.error?.message);

    const link = await athlete.client.from('coach_clients').insert({ coach_id: coach.id, client_id: athlete.id, status: 'active', client_name: 'Sync Athlete' });
    check(!link.error, 'athlete links to coach', link.error?.message);
    const roster = await coach.client.from('coach_clients').select('client_id, client_name').eq('coach_id', coach.id).eq('status', 'active');
    check(rows(roster).some((r) => r.client_id === athlete.id), 'coach sees athlete on roster', roster.error?.message);
    const rosterLeak = await outsider.client.from('coach_clients').select('client_id').eq('coach_id', coach.id);
    check(rows(rosterLeak).length === 0, 'outsider cannot read roster');

    const note = await coach.client.from('coach_directives').insert({ id: ids.note, coach_id: coach.id, tag: 'General', title: 'Sync note', summary: 'Hydrate', affected_count: 1, priority: 'NORMAL' }).select('id').single();
    check(!note.error, 'coach posts note', note.error?.message);
    const edited = await coach.client.from('coach_directives').update({ summary: 'Hydrate more' }).eq('id', ids.note).select('summary');
    check(rows(edited)[0]?.summary === 'Hydrate more', 'coach edits note', edited.error?.message);
    const athleteNote = await athlete.client.from('coach_directives').select('summary').eq('id', ids.note);
    check(rows(athleteNote)[0]?.summary === 'Hydrate more', 'linked athlete reads edited note', athleteNote.error?.message);
    const forged = await outsider.client.from('coach_directives').update({ summary: 'hijack' }).eq('id', ids.note).select('id');
    check(rows(forged).length === 0, 'outsider cannot edit note');
    const removed = await coach.client.from('coach_directives').delete().eq('id', ids.note).select('id');
    check(rows(removed).length === 1, 'coach deletes note', removed.error?.message);

    const plan = { version: 1, difficulty: 'Intermediate', overview: 'Sync', methodology: '', weeks: [{ week: 1, days: [{ day: 1, title: 'Push', exercises: [{ name: 'Bench', sets: 3, reps: '8' }] }] }] };
    const program = await coach.client.from('coach_programs').insert({ id: ids.program, coach_id: coach.id, title: 'Sync Program', weeks_duration: 1, program_data: plan, price_cents: 0, listed: true });
    check(!program.error, 'coach publishes program with full plan', program.error?.message);
    const athleteProgram = await athlete.client.from('coach_programs').select('program_data').eq('id', ids.program);
    check(rows(athleteProgram)[0]?.program_data?.weeks?.[0]?.days?.[0]?.exercises?.length === 1, 'athlete reads week-by-week plan', athleteProgram.error?.message);

    const done = await athlete.client.from('workout_completions').insert({ id: ids.completion, coach_id: coach.id, athlete_id: athlete.id, metrics_summary: { title: 'Push', volumeKg: 1200 }, submitted_at: new Date().toISOString() });
    check(!done.error, 'athlete publishes finished session', done.error?.message);
    const coachDone = await coach.client.from('workout_completions').select('id').eq('id', ids.completion);
    check(rows(coachDone).length === 1, 'coach sees finished session', coachDone.error?.message);
    const feedback = await coach.client.from('workout_completions').update({ metrics_summary: { title: 'Push', volumeKg: 1200, feedback: 'Great', feedbackAt: new Date().toISOString() } }).eq('id', ids.completion).select('id');
    check(rows(feedback).length === 1, 'coach saves session feedback', feedback.error?.message);
    const seen = await athlete.client.from('workout_completions').select('metrics_summary').eq('id', ids.completion);
    check(rows(seen)[0]?.metrics_summary?.feedback === 'Great', 'athlete reads session feedback', seen.error?.message);
    const doneLeak = await outsider.client.from('workout_completions').select('id').eq('id', ids.completion);
    check(rows(doneLeak).length === 0, 'outsider cannot read finished session');

    const msg = await coach.client.from('coach_messages').insert({ id: ids.message, coach_id: coach.id, athlete_id: athlete.id, sender_name: 'Sync Check Coach', message: 'Nice work' });
    check(!msg.error, 'coach sends message', msg.error?.message);
    const inbox = await athlete.client.from('coach_messages').select('message').eq('id', ids.message);
    check(rows(inbox)[0]?.message === 'Nice work', 'athlete reads message', inbox.error?.message);
    const msgLeak = await outsider.client.from('coach_messages').select('id').eq('id', ids.message);
    check(rows(msgLeak).length === 0, 'outsider cannot read message');

    const checkin = await athlete.client.from('athlete_checkins').insert({ id: ids.checkin, athlete_id: athlete.id, athlete_name: 'Sync Athlete', coach_id: coach.id, weight_kg: 80, sleep_hours: 7, soreness: 3, stress: 2, notes: 'ok' });
    check(!checkin.error, 'athlete submits check-in', checkin.error?.message);
    const reply = await coach.client.from('athlete_checkins').update({ feedback_text: 'Keep going', feedback_at: new Date().toISOString() }).eq('id', ids.checkin).select('id');
    check(rows(reply).length === 1, 'coach replies to check-in', reply.error?.message);
    const replySeen = await athlete.client.from('athlete_checkins').select('feedback_text').eq('id', ids.checkin);
    check(rows(replySeen)[0]?.feedback_text === 'Keep going', 'athlete reads check-in reply', replySeen.error?.message);
    const checkinLeak = await outsider.client.from('athlete_checkins').select('id').eq('id', ids.checkin);
    check(rows(checkinLeak).length === 0, 'outsider cannot read check-in');

    const reel = await coach.client.from('reels').insert({ id: ids.reel, title: 'Sync reel', category: 'ALL', filter_tag: 'ALL', video_url: `${url}/storage/v1/object/public/reels/sync-check.mp4`, coach_id: coach.id, cues: '' });
    check(!reel.error, 'coach publishes reel', reel.error?.message);
    const feed = await anon.from('reels').select('id').eq('id', ids.reel);
    check(rows(feed).length === 1, 'reel visible in public feed', feed.error?.message);
    const reelDelete = await coach.client.from('reels').delete().eq('id', ids.reel).select('id');
    check(rows(reelDelete).length === 1, 'coach deletes own reel', reelDelete.error?.message);
  } catch (err) {
    failed += 1;
    console.error('FAIL ', err.message);
  } finally {
    const userIds = users.map((u) => u.id);
    if (userIds.length) {
      await admin.from('reels').delete().eq('id', ids.reel);
      await admin.from('coach_messages').delete().eq('id', ids.message);
      await admin.from('athlete_checkins').delete().eq('id', ids.checkin);
      await admin.from('workout_completions').delete().eq('id', ids.completion);
      await admin.from('coach_programs').delete().eq('id', ids.program);
      await admin.from('coach_directives').delete().eq('id', ids.note);
      await admin.from('coach_clients').delete().in('coach_id', userIds);
      await admin.from('coach_profiles').delete().in('id', userIds);
      for (const id of userIds) await admin.auth.admin.deleteUser(id);
    }
  }
  console.log(failed ? `\n${failed} check(s) failed` : '\nAll coach sync checks passed');
  process.exit(failed ? 1 : 0);
})();

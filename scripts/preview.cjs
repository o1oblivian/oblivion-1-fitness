/**
 * Preview rows for the real screens. Not imported by the app.
 *   node scripts/preview.cjs          writes the preview rows
 *   node scripts/preview.cjs clear    removes only ids that start with preview-
 *
 * Payout is left alone. Heart rate, strain, and load flags are not written.
 */
const fs = require('fs');
const path = require('path');

const PREFIX = 'preview-';
const COACH_ID = 'preview-coach';

const PEOPLE = [
  ['Mira Chen', 'Strength', 'Push'],
  ['Owen Blake', 'Hypertrophy', 'Pull'],
  ['Sofia Reyes', 'Conditioning', 'Engine'],
  ['Jonah Adeyemi', 'Olympic', 'Full body'],
  ['Priya Nair', 'Mobility', 'Restore'],
];

const PROGRAMS = [
  ['Base Strength', 'Four days of the main lifts.'],
  ['Hypertrophy Block', 'Volume for muscle, kept simple.'],
  ['Return to Lift', 'After time off, back to the bar.'],
  ['Conditioning', 'Short sessions for the engine.'],
  ['Deload Week', 'Same lifts, lighter week.'],
];

const NOTES = [
  ['Thursday squat', 'Squat day is Thursday. Leave a rep in the tank.'],
  ['Sleep first', 'Sleep before you add weight.'],
  ['Sharp knee', 'If the knee is sharp, swap the lunge for a step-up.'],
  ['Eat before', 'Eat before the evening session.'],
  ['Lighter week', 'Next week starts with a lighter squat.'],
];

const MESSAGES = [
  ['Mira Chen', 'Shoulder felt tight on the last press set.'],
  ['Owen Blake', 'Can I train legs Friday instead of Thursday?'],
  ['Sofia Reyes', 'Finished the engine session. Legs are fine.'],
  ['Jonah Adeyemi', 'The jerk catch was late today.'],
  ['Priya Nair', 'Hips felt better after the long warm-up.'],
];

function id(kind, index) {
  return `${PREFIX}${kind}-${index + 1}`;
}

function bundle() {
  const now = Date.now();
  const athletes = PEOPLE.map(([name, discipline], index) => ({
    id: id('athlete', index),
    client_id: id('athlete', index),
    name,
    handle: name.split(' ')[0].toLowerCase(),
    status: ['Active', 'Active', 'Check-in', 'Need Routine', 'Inactive'][index],
    readiness: null,
    volume: null,
  }));

  const programs = PROGRAMS.map(([title, description], index) => ({
    id: id('program', index),
    title,
    description,
    difficulty: 'Custom',
    durationWeeks: 4 + index,
  }));

  const notes = NOTES.map(([title, summary], index) => ({
    id: id('note', index),
    tag: 'TRAINING',
    title,
    summary,
    affectedCount: 0,
    priority: 'NORMAL',
    badgeStyle: '',
  }));

  const messages = MESSAGES.map(([sender, message], index) => ({
    id: id('message', index),
    sender,
    time: ['7:10', '8:05', '9:40', '11:15', '12:30'][index],
    message,
    athleteId: id('athlete', index),
  }));

  const checkins = PEOPLE.map(([name], index) => ({
    id: id('checkin', index),
    athleteId: id('athlete', index),
    athleteName: name,
    coachId: COACH_ID,
    date: '',
    weightKg: 0,
    sleepHours: 0,
    sorenessRating: 0,
    stressRating: 0,
    nutritionAdherence: 0,
    completedSessionsCount: 0,
    targetSessionsCount: 0,
    notes: ['Slept short.', 'Weight is steady.', 'Legs are sore.', 'Hungry after training.', 'Easy day.'][index],
    coachFeedback: index === 0
      ? { feedbackText: 'Keep Thursday. Stop one rep early.', givenAt: 'Today', status: 'reviewed' }
      : { feedbackText: '', givenAt: 'Pending', status: 'pending' },
  }));

  const finished = PEOPLE.map(([name, , split], index) => ({
    id: id('finish', index),
    athleteId: id('athlete', index),
    athleteName: name,
    title: split,
    tonnageKg: 0,
    totalSets: 0,
    totalReps: 0,
    avgRpe: 0,
    durationMinutes: 0,
    completedAt: new Date(now - index * 60 * 60 * 1000).toISOString(),
    exercises: [],
  }));

  const photos = [
    '/preview-buddies/buddy-mira.jpg',
    '/preview-buddies/buddy-owen.jpg',
    '/preview-buddies/buddy-sofia.jpg',
    '/preview-buddies/buddy-jonah.jpg',
    '/preview-buddies/buddy-priya.jpg',
  ];
  const buddies = PEOPLE.map(([name, discipline, split], index) => ({
    id: id('buddy', index),
    name,
    handle: name.split(' ')[0].toLowerCase(),
    discipline,
    current_split: split,
    home_gym: ['Local gym', 'Local gym', '', 'Local gym', ''][index],
    bio: `${discipline}. Trains ${split.toLowerCase()}.`,
    age: [28, 31, 27, 33, 29][index],
    gender: ['women', 'men', 'women', 'men', 'women'][index],
    time: ['Morning', 'Evening', 'Midday', 'Evening', 'Night'][index],
    level: ['Intermediate', 'Advanced', 'Intermediate', 'Advanced', 'Beginner'][index],
    looking_for: ['Training partner', 'Spotter', 'Run club', 'Program swap', 'Sauna and recover'][index],
    where: ['gym', 'gym', 'outdoors', 'gym', 'home'][index],
    avatar: photos[index],
  }));

  return {
    coach: { id: COACH_ID, name: 'o1 oblivianfitness', handle: '', avatar: '' },
    athletes,
    programs,
    notes,
    messages,
    checkins,
    finished,
    assigned: { coachId: COACH_ID, title: 'Lower strength' },
    buddies,
  };
}

function readEnv() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'supabaseClient.ts'), 'utf8');
  const url = (source.match(/PROD_SUPABASE_URL = '([^']+)'/) || [])[1] || '';
  const key = (source.match(/PROD_SUPABASE_ANON_KEY =\s*'([^']+)'/) || [])[1] || '';
  return { url, key };
}

async function rest(method, table, query, body) {
  const { url, key } = readEnv();
  if (!key) return { ok: false, error: 'no key' };
  const response = await fetch(`${url}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.ok) return { ok: true };
  const detail = (await response.text()).replace(/eyJ[A-Za-z0-9._-]+/g, '').slice(0, 160);
  return { ok: false, error: `${table} ${response.status} ${detail}` };
}

async function clearRemote() {
  const tables = ['coach_programs', 'coach_directives', 'coach_messages', 'buddy_profiles', 'athlete_checkins', 'workout_completions', 'assigned_workouts'];
  const results = [];
  for (const table of tables) {
    results.push(await rest('DELETE', table, `?id=like.${encodeURIComponent(PREFIX + '%')}`, null));
  }
  return results.filter((row) => !row.ok).map((row) => row.error);
}

module.exports = { bundle, PREFIX, COACH_ID };

if (require.main === module) {
  if (!process.argv.includes('clear')) {
    console.log('Preview rows stay on this phone. Open the app and refresh after they are applied.');
    process.exit(0);
  }
  clearRemote().then((failed) => {
    console.log(failed.length ? `Remote clear left: ${failed.join(', ')}` : 'Remote preview rows removed.');
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

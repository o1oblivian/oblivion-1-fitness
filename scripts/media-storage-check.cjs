#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Checks the `media` Storage bucket and the media tables against the Supabase project in .env/.env.local.
 *   node scripts/media-storage-check.cjs
 * Uploads a 1x1 PNG as a fresh test user (so Storage policies are exercised), reads it back
 * through the public URL, then deletes the file and the user. Prints no keys.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.resolve(__dirname, '..');
const env = {};
for (const f of ['.env', '.env.local']) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
if (!url || !env.SUPABASE_SERVICE_ROLE_KEY || !anon) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

(async () => {
  const { data: buckets, error: bucketErr } = await admin.storage.listBuckets();
  const media = (buckets || []).find((b) => b.id === 'media');
  check(!bucketErr && Boolean(media), 'bucket "media" exists', bucketErr?.message);
  check(Boolean(media?.public), 'bucket "media" is public');

  for (const table of ['media_vault', 'reels']) {
    const { error } = await admin.from(table).select('id').limit(1);
    check(!error, `table ${table} readable`, error?.message);
  }
  if (!media) return;

  const email = `media-check-${Date.now()}@example.com`;
  const password = `Mc!${Math.random().toString(36).slice(2)}A9`;
  const { data: created, error: userErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  check(!userErr, 'test user created', userErr?.message);
  if (userErr) return;
  const uid = created.user.id;
  try {
    const client = createClient(url, anon, { auth: { persistSession: false } });
    const { error: signErr } = await client.auth.signInWithPassword({ email, password });
    check(!signErr, 'test user signed in', signErr?.message);

    const own = `${uid}/vault/check.png`;
    const up = await client.storage.from('media').upload(own, PNG, { contentType: 'image/png' });
    check(!up.error, 'upload into own folder allowed', up.error?.message);

    const foreign = `00000000-0000-0000-0000-000000000000/vault/check.png`;
    const blocked = await client.storage.from('media').upload(foreign, PNG, { contentType: 'image/png' });
    check(Boolean(blocked.error), "upload into someone else's folder blocked");

    const publicUrl = client.storage.from('media').getPublicUrl(own).data.publicUrl;
    const res = await fetch(publicUrl);
    check(res.ok, 'public URL serves the file', `HTTP ${res.status}`);

    const del = await client.storage.from('media').remove([own]);
    check(!del.error, 'owner can delete', del.error?.message);
  } finally {
    await admin.storage.from('media').remove([`${uid}/vault/check.png`]).catch(() => undefined);
    await admin.auth.admin.deleteUser(uid).catch(() => undefined);
  }
})()
  .catch((err) => {
    failures += 1;
    console.error('FAIL  unexpected error:', err.message);
  })
  .finally(() => {
    console.log(failures ? `\n${failures} check(s) failed` : '\nAll media storage checks passed');
    process.exit(failures ? 1 : 0);
  });

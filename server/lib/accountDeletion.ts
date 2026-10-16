import { getCoachBalance, getCoachConnectProfile, getStripe, getSupabaseAdmin } from './stripeLedger';

/**
 * Everything a person owns, as [table, column] pairs. A table or column that does not exist in a given
 * project is skipped, so this list can safely name every place personal data may live.
 *
 * coach_transactions and coach_payout_ledger are NOT here on purpose: they are the platform's financial records
 * for money that really moved, and tax law requires keeping them.
 */
const OWNED_ROWS: ReadonlyArray<readonly [string, string]> = [
  ['workout_logs', 'user_id'],
  ['nutrition_logs', 'user_id'],
  ['meal_logs', 'user_id'],
  ['daily_macros', 'user_id'],
  ['completed_sessions', 'user_id'],
  ['completed_sessions', 'client_id'],
  ['workout_sessions', 'user_id'],
  ['workout_completions', 'athlete_id'],
  ['assigned_workouts', 'athlete_id'],
  ['user_telemetry', 'user_id'],
  ['user_entitlements', 'user_id'],
  ['athlete_day_logs', 'user_id'],
  ['athlete_checkins', 'athlete_id'],
  ['athlete_checkins', 'coach_id'],
  ['athlete_consultations', 'user_id'],
  ['athlete_report_snapshots', 'athlete_id'],
  ['fuel_days', 'user_id'],
  ['fuel_profiles', 'user_id'],
  ['media_vault', 'user_id'],
  ['vault_bookmarks', 'user_id'],
  ['reel_likes', 'user_id'],
  ['reel_views', 'user_id'],
  ['reels', 'coach_id'],
  ['buddy_locations', 'user_id'],
  ['buddy_messages', 'sender_id'],
  ['buddy_messages', 'recipient_id'],
  ['buddy_likes', 'from_id'],
  ['buddy_likes', 'to_id'],
  ['buddy_profiles', 'id'],
  ['user_blocks', 'blocker_id'],
  ['user_blocks', 'blocked_id'],
  ['coach_messages', 'coach_id'],
  ['coach_messages', 'athlete_id'],
  ['coach_clients', 'coach_id'],
  ['coach_clients', 'client_id'],
  ['coach_invites', 'coach_id'],
  ['coach_programs', 'coach_id'],
  ['coach_directives', 'coach_id'],
  ['coach_storefronts', 'coach_id'],
  ['coach_follows', 'follower_id'],
  ['coach_follows', 'coach_id'],
  ['coach_reviews', 'athlete_id'],
  ['coaching_applications', 'athlete_id'],
  ['program_enrollments', 'athlete_id'],
  ['athlete_profiles', 'id'],
  ['profiles', 'id'],
  ['coach_profiles', 'id'],
];

const MEDIA_BUCKET = 'media';

type Admin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

/** Lists every file under a user's folder, a few levels deep, so uploaded photos and videos are removed too. */
async function listUserFiles(admin: Admin, folder: string, depth = 0): Promise<string[]> {
  const { data, error } = await admin.storage.from(MEDIA_BUCKET).list(folder, { limit: 1000 });
  if (error || !data) return [];
  const files: string[] = [];
  for (const entry of data) {
    const path = `${folder}/${entry.name}`;
    // Folders come back without an id; files have one.
    if (entry.id) files.push(path);
    else if (depth < 3) files.push(...(await listUserFiles(admin, path, depth + 1)));
  }
  return files;
}

export type DeletionResult = { ok: true } | { ok: false; status: number; error: string };

export async function deleteAccountData(uid: string): Promise<DeletionResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, status: 503, error: 'Account deletion is not configured.' };

  // Money owed to a coach must not vanish with the account.
  const balance = await getCoachBalance(uid).catch(() => null);
  if (balance && (balance.summary.availableCents > 0 || balance.summary.pendingCents > 0)) {
    return {
      ok: false,
      status: 409,
      error: 'You still have coaching earnings. Withdraw them in Earnings, and wait for pending earnings to clear, then delete your account.',
    };
  }
  if (balance?.payouts.some((p) => ['processing', 'pending'].includes(String(p.status).toLowerCase()))) {
    return { ok: false, status: 409, error: 'A withdrawal is still being processed. Try again in a few minutes.' };
  }

  // Stored files first, while we can still tell which are theirs.
  try {
    const files = await listUserFiles(admin, uid);
    for (let i = 0; i < files.length; i += 100) {
      await admin.storage.from(MEDIA_BUCKET).remove(files.slice(i, i + 100));
    }
  } catch (e) {
    console.warn('[account/delete] storage cleanup skipped:', (e as Error)?.message);
  }

  for (const [table, column] of OWNED_ROWS) {
    const { error } = await admin.from(table).delete().eq(column, uid);
    // 42P01 / 42703: the table or column does not exist in this project, which is fine.
    if (error && !['42P01', '42703', 'PGRST205', 'PGRST204'].includes(String(error.code))) {
      console.warn(`[account/delete] ${table}.${column}:`, error.message);
    }
  }

  // Close the payout account (it holds no balance by now). Failure is not fatal.
  try {
    const profile = await getCoachConnectProfile(uid);
    const stripe = await getStripe();
    if (stripe && profile?.stripe_connect_account_id) await stripe.accounts.del(profile.stripe_connect_account_id);
  } catch (e) {
    console.warn('[account/delete] stripe account not closed:', (e as Error)?.message);
  }

  // Remove the customer from RevenueCat (their store subscription is cancelled in the store's own settings).
  const rcKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (rcKey) {
    try {
      await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${rcKey}` },
      });
    } catch (e) {
      console.warn('[account/delete] revenuecat delete skipped:', (e as Error)?.message);
    }
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) {
    console.error('[account/delete] auth user not deleted:', delErr.message);
    return { ok: false, status: 500, error: 'Your account could not be deleted. Try again.' };
  }
  return { ok: true };
}

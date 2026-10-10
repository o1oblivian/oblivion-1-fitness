import { supabase } from '../../services/supabaseClient';
import type { OblivionReport } from './types';

const TABLE = 'athlete_report_snapshots';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHARE_PREF_KEY = 'o1fc_report_share_with_coach';

export function readSharePreference(): boolean {
  try {
    return localStorage.getItem(SHARE_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSharePreference(on: boolean): void {
  try {
    localStorage.setItem(SHARE_PREF_KEY, on ? '1' : '0');
  } catch {
    // best-effort
  }
}

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Publishes the computed report (scores + aggregates only, never raw set logs)
 * so the athlete's coach can read it. `shared=false` keeps a private copy and
 * the coach-side RLS policy hides it.
 */
export async function publishReport(report: OblivionReport, shared: boolean): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  const { error } = await supabase.from(TABLE).upsert(
    { athlete_id: uid, shared, snapshot: report, updated_at: new Date().toISOString() },
    { onConflict: 'athlete_id' },
  );
  if (error) {
    console.error('[Report] publish failed:', error.message);
    return false;
  }
  writeSharePreference(shared);
  return true;
}

/** Turning sharing off wipes the snapshot so nothing stale stays on the server. */
export async function revokeReport(): Promise<boolean> {
  const uid = await currentUserId();
  if (!uid) return false;
  const { error } = await supabase.from(TABLE).delete().eq('athlete_id', uid);
  if (error) {
    console.error('[Report] revoke failed:', error.message);
    return false;
  }
  writeSharePreference(false);
  return true;
}

export type CoachReportResult =
  | { status: 'ok'; report: OblivionReport }
  | { status: 'not_shared' }
  | { status: 'unlinked' }
  | { status: 'error' };

/** Coach-side read. RLS only returns rows the athlete has shared with this coach. */
export async function fetchSharedReport(athleteId: string | undefined): Promise<CoachReportResult> {
  if (!athleteId || !UUID.test(athleteId)) return { status: 'unlinked' };
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('snapshot, shared')
      .eq('athlete_id', athleteId)
      .maybeSingle();
    if (error) return { status: 'error' };
    const row = data as { snapshot?: OblivionReport; shared?: boolean } | null;
    if (!row || !row.shared || !row.snapshot || row.snapshot.version !== 1) return { status: 'not_shared' };
    return { status: 'ok', report: row.snapshot };
  } catch {
    return { status: 'error' };
  }
}

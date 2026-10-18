import { supabase } from '../../../services/supabaseClient';

/** The message the database raises when a roster is full (supabase/migrations/20261018_coach_roster_cap.sql). */
export const ROSTER_FULL = 'ROSTER_FULL';

export const ROSTER_FULL_COACH_MESSAGE =
  'Your roster is full. Upgrade to Coach Pro to add more athletes.';
export const ROSTER_FULL_ATHLETE_MESSAGE =
  'This coach has no open spots right now. Ask them to open one, then use their link again.';

export function isRosterFull(error: { message?: string } | null | undefined): boolean {
  return Boolean(error?.message && error.message.includes(ROSTER_FULL));
}

export interface RosterStatus {
  active: number;
  /** Null when the coach has no cap (Coach Pro). */
  limit: number | null;
}

export function parseRosterStatus(value: unknown): RosterStatus | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as { active?: unknown; limit?: unknown };
  const active = Number(row.active);
  if (!Number.isFinite(active) || active < 0) return null;
  if (row.limit === null || row.limit === undefined) return { active, limit: null };
  const limit = Number(row.limit);
  return Number.isFinite(limit) && limit >= 0 ? { active, limit } : null;
}

/** Seats used and the cap, as the server counts them. Null when it could not be read. */
export async function fetchRosterStatus(): Promise<RosterStatus | null> {
  const { data, error } = await supabase.rpc('my_roster_status');
  if (error) {
    console.warn('[rosterCap] status unavailable:', error.message);
    return null;
  }
  return parseRosterStatus(data);
}

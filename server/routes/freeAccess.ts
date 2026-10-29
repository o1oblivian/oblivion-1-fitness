import type { Request, Response } from 'express';
import { memoizeAsync } from '../lib/memoizeAsync';
import { getSupabaseAdmin } from '../lib/stripeLedger';

/** The 90-day full access is for the first 100,000 members. Everyone after gets Core Free. */
export const FREE_ACCESS_CAP = 100_000;

export function freeAccessRemaining(taken: number): number {
  const count = Number.isFinite(taken) ? Math.max(0, Math.floor(taken)) : 0;
  return Math.max(0, FREE_ACCESS_CAP - count);
}

/**
 * A member's decision is made once, the first time the server sees them, and is kept on their account.
 * Someone who got the 90 days keeps them; someone who arrives after the cap does not get them later.
 */
export function decideFreeAccess(stored: unknown, memberCount: number): boolean {
  if (typeof stored === 'boolean') return stored;
  return memberCount <= FREE_ACCESS_CAP;
}

async function memberCount(): Promise<number | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { count, error } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  return error ? null : (count ?? 0);
}

/** The public counter is read often, so callers within 10 seconds share one database count. */
const publicMemberCount = memoizeAsync(memberCount, 10_000);

/** Public: how many of the 100,000 places are left. */
export async function handleFreeAccessSpots(_req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  const taken = await publicMemberCount().catch(() => null);
  if (taken === null) {
    // An unreadable count is not "100,000 left". The app shows no number until the server can say.
    res.status(503).json({ error: 'Free access count is unavailable.' });
    return;
  }
  res.json({ cap: FREE_ACCESS_CAP, taken, remaining: freeAccessRemaining(taken) });
}

/** The signed-in member's own answer: do they have the 90-day full access? */
export async function handleFreeAccessMe(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  const admin = getSupabaseAdmin();
  if (!admin) {
    res.status(503).json({ error: 'Free access is not configured.' });
    return;
  }
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const { data: auth } = token ? await admin.auth.getUser(token) : { data: null };
  const user = auth?.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  if (typeof meta.free_access === 'boolean') {
    res.json({ eligible: meta.free_access });
    return;
  }
  const count = await memberCount();
  // If the count cannot be read, do not take the 90 days away from anyone.
  const eligible = count === null ? true : decideFreeAccess(undefined, count);
  if (count !== null) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...meta, free_access: eligible },
    });
    if (error) console.warn('[free-access] could not save the decision:', error.message);
  }
  res.json({ eligible });
}

import { apiFetch } from './apiBase';
import { supabase } from './supabaseClient';
import { safeStorage } from '../utils/safeStorage';
import type { TrialState } from './trialService';

const KEY = 'o1fc_free_access_v1';

function cached(userId: string): boolean {
  return safeStorage.getItem<boolean>(`${KEY}_${userId}`, true) !== false;
}

/** What this device last heard for this member. Defaults to yes, so a missing answer never locks anyone out. */
export function cachedFreeAccess(userId: string): boolean {
  return userId ? cached(userId) : true;
}

/** Asks the server whether this member is among the first 100,000. Keeps the last answer when offline. */
export async function resolveFreeAccess(userId: string): Promise<boolean> {
  if (!userId) return true;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return cached(userId);
    const res = await apiFetch('/api/billing/free-access/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return cached(userId);
    const body = (await res.json()) as { eligible?: unknown };
    if (typeof body.eligible !== 'boolean') return cached(userId);
    safeStorage.setItem(`${KEY}_${userId}`, body.eligible);
    return body.eligible;
  } catch {
    return cached(userId);
  }
}

/** Members past the first 100,000 start on Core Free: the 90-day clock does not unlock the full app for them. */
export function withoutFreeAccess(trial: TrialState): TrialState {
  if (trial.hasSubscribedPro) return trial;
  return { ...trial, daysRemaining: 0, isTrialActive: false, isTrialExpired: true };
}

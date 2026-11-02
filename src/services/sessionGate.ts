import type { AuthError, Session } from '@supabase/supabase-js';
import { storedSessionIssuedAtMs } from './accountScope';
import { supabase } from './supabaseClient';

/** `checking` until the first answer; after that the app is either signed in or must show Sign In. */
export type GateStatus = 'checking' | 'in' | 'out';

/** A stuck auth call must end in an answer, never leave the splash screen up forever. */
const CHECK_TIMEOUT_MS = 10_000;

/** How long a login last confirmed online keeps working without signal. */
export const OFFLINE_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionRead {
  data: { session: Session | null };
  error: AuthError | null;
}

/** Device keys that say "someone is signed in". Removed whenever Supabase has no session. */
const IDENTITY_KEYS = ['o1fc_user_id', 'o1fc_user_email', 'o1fc_auth_token'];

export function forgetIdentityKeys(): void {
  try {
    for (const key of IDENTITY_KEYS) localStorage.removeItem(key);
  } catch (err) {
    console.error('[SessionGate] Could not clear identity keys', err);
  }
}

/** Phone is offline or the auth server is unreachable: the stored sign-in may still be good. */
export function isNetworkFailure(error: AuthError | null): boolean {
  return error?.name === 'AuthRetryableFetchError' || error?.status === 0;
}

/** True while the stored login is inside the 30-day offline window. */
export function withinOfflineWindow(
  lastIssuedAt: () => number | null = storedSessionIssuedAtMs,
  now: () => number = Date.now,
): boolean {
  const issuedAt = lastIssuedAt();
  if (issuedAt === null) return false;
  const offlineFor = now() - issuedAt;
  return offlineFor >= 0 && offlineFor <= OFFLINE_SESSION_MS;
}

/**
 * Refreshes the stored login as soon as the phone gets signal back. An expired access token is
 * exchanged by `getSession`, which emits TOKEN_REFRESHED to every auth listener.
 * Returns the cleanup function.
 */
export function startSessionRefreshOnReconnect(): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const refresh = () => {
    if (storedSessionIssuedAtMs() === null) return;
    void supabase.auth.startAutoRefresh();
    supabase.auth
      .getSession()
      .then(({ error }) => {
        if (error) console.warn('[SessionGate] Token refresh after reconnect failed', error);
      })
      .catch((err: unknown) => {
        console.warn('[SessionGate] Token refresh after reconnect failed', err);
      });
  };
  window.addEventListener('online', refresh);
  return () => window.removeEventListener('online', refresh);
}

/** A Supabase session with a user whose access token has not expired. A session without an expiry is not trusted. */
export function isLiveSession(
  session: Session | null | undefined,
  now = Date.now(),
): session is Session {
  if (!session?.user) return false;
  const expiresAt = session.expires_at;
  return typeof expiresAt === 'number' && Number.isFinite(expiresAt) && expiresAt * 1000 > now;
}

/**
 * Asks Supabase whether a person is signed in. The local `o1fc_user_id` flag is never trusted:
 * a restored backup or an expired login leaves it behind with no session.
 *
 * When the auth server cannot be reached, the stored login keeps working for 30 days from when the
 * server last issued its token, so a gym with no signal does not sign anyone out. After that, or
 * when the server rejects the login, the athlete signs in again.
 */
export async function resolveGateStatus(
  readSession: () => Promise<SessionRead> = () => supabase.auth.getSession(),
  lastIssuedAt: () => number | null = storedSessionIssuedAtMs,
  now: () => number = Date.now,
): Promise<'in' | 'out'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), CHECK_TIMEOUT_MS);
  });
  const answer = await Promise.race([
    readSession().catch((err: unknown) => {
      console.error('[SessionGate] Session check failed', err);
      return null;
    }),
    timeout,
  ]);
  clearTimeout(timer);

  if (isLiveSession(answer?.data.session, now())) return 'in';
  const unreachable = answer === null || isNetworkFailure(answer.error);
  if (unreachable && withinOfflineWindow(lastIssuedAt, now)) return 'in';
  forgetIdentityKeys();
  return 'out';
}

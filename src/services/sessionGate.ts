import type { AuthError, Session } from '@supabase/supabase-js';
import { storedSessionUser } from './accountScope';
import { supabase } from './supabaseClient';

/** `checking` until the first answer; after that the app is either signed in or must show Sign In. */
export type GateStatus = 'checking' | 'in' | 'out';

/** A stuck auth call must end in an answer, never leave the splash screen up forever. */
const CHECK_TIMEOUT_MS = 10_000;

interface SessionRead {
  data: { session: Session | null };
  error: AuthError | null;
}

/** Device keys that say "someone is signed in". Removed whenever Supabase has no session. */
const IDENTITY_KEYS = ['o1fc_user_id', 'o1fc_user_email', 'o1fc_auth_token'];

export function forgetIdentityKeys(): void {
  try {
    for (const key of IDENTITY_KEYS) localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

/** Phone is offline or the auth server is unreachable: the stored sign-in may still be good. */
function isNetworkFailure(error: AuthError | null): boolean {
  return error?.name === 'AuthRetryableFetchError' || error?.status === 0;
}

/**
 * Asks Supabase whether a person is signed in. The local `o1fc_user_id` flag is never trusted:
 * a restored backup or an expired login leaves it behind with no session.
 *
 * A stored login that cannot be refreshed only because there is no signal still counts as
 * signed in, so opening the app in a basement gym does not throw an athlete out.
 */
export async function resolveGateStatus(
  readSession: () => Promise<SessionRead> = () => supabase.auth.getSession(),
  hasStoredLogin: () => boolean = () => storedSessionUser() !== null,
): Promise<'in' | 'out'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), CHECK_TIMEOUT_MS);
  });
  const answer = await Promise.race([readSession().catch(() => null), timeout]);
  clearTimeout(timer);

  if (answer?.data.session?.user) return 'in';
  const unreachable = answer === null || isNetworkFailure(answer.error);
  if (unreachable && hasStoredLogin()) return 'in';
  forgetIdentityKeys();
  return 'out';
}

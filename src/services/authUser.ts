import { supabase } from './supabaseClient';

function isPlaceholderUserId(id: string | null | undefined): boolean {
  if (!id) return true;
  return (
    id === 'default-athlete' ||
    id === 'athlete-c1' ||
    id === 'coach_alpha' ||
    id === 'current-athlete' ||
    id === 'client_alpha' ||
    id === 'athlete_01' ||
    id === 'default_coach'
  );
}

/** How long a server-confirmed account is reused for the same sign-in. */
const VERIFIED_FOR_MS = 30_000;

interface Verification {
  token: string;
  at: number;
  id: Promise<string | null>;
}

let verification: Verification | null = null;

/** A slow or stuck auth call must end in "unknown", never leave a screen waiting forever. */
const AUTH_TIMEOUT_MS = 8_000;

function within<T>(work: Promise<T>, fallback: T, ms = AUTH_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

function askServerWho(): Promise<string | null> {
  return within(
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user?.id || isPlaceholderUserId(data.user.id)) return null;
      return data.user.id;
    }),
    null,
  );
}

function currentAccessToken(): Promise<string | null> {
  return within(
    supabase.auth.getSession().then(({ data }) => data.session?.access_token ?? null),
    null,
  );
}

/**
 * The signed-in account, confirmed by the server.
 * Screens ask this many times at once, so calls made with the same sign-in share one
 * server round trip for a short while. A new sign-in or a sign-out has a different
 * token and always asks again; a failed check is never reused.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const token = await currentAccessToken();
  if (!token) return askServerWho();

  if (
    verification &&
    verification.token === token &&
    Date.now() - verification.at < VERIFIED_FOR_MS
  ) {
    return verification.id;
  }
  const mine: Verification = { token, at: Date.now(), id: askServerWho() };
  verification = mine;
  const id = await mine.id;
  if (!id && verification === mine) verification = null;
  return id;
}

/** Forgets the confirmed account. Tests use this to start each case clean. */
export function forgetVerifiedUser(): void {
  verification = null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The account signed in on this device, read without a network round trip so it works offline. */
export async function getCachedUserId(): Promise<string | null> {
  const sessionId = await within(
    supabase.auth.getSession().then(({ data }) => data.session?.user?.id ?? null),
    null,
    3_000,
  );
  if (sessionId && !isPlaceholderUserId(sessionId)) return sessionId;
  const id = peekStoredUserId()?.replace(/^"|"$/g, '') ?? null;
  return id && UUID.test(id) ? id : null;
}

function peekStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const id = localStorage.getItem('o1fc_user_id');
    return isPlaceholderUserId(id) ? null : id;
  } catch {
    return null;
  }
}

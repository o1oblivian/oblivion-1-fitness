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

async function askServerWho(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.id || isPlaceholderUserId(data.user.id)) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

async function currentAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
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

  if (verification && verification.token === token && Date.now() - verification.at < VERIFIED_FOR_MS) {
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
  try {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user?.id;
    if (id && !isPlaceholderUserId(id)) return id;
  } catch {
    // fall back to the stored id
  }
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

import { supabase } from './supabaseClient';

export function isPlaceholderUserId(id: string | null | undefined): boolean {
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

export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.id || isPlaceholderUserId(data.user.id)) return null;
    return data.user.id;
  } catch {
    return null;
  }
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

export function peekStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const id = localStorage.getItem('o1fc_user_id');
    return isPlaceholderUserId(id) ? null : id;
  } catch {
    return null;
  }
}

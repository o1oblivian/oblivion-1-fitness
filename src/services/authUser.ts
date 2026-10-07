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

export function peekStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const id = localStorage.getItem('o1fc_user_id');
    return isPlaceholderUserId(id) ? null : id;
  } catch {
    return null;
  }
}

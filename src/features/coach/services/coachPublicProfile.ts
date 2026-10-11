import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { isSharedUrl } from '../../../services/mediaStorage';
import { CoachCard, fetchCoachCard } from './coachDirectory';

export interface CoachPublicProfile {
  displayName: string;
  avatarUrl: string;
  bio: string;
  acceptingNewAthletes: boolean;
  handle: string;
  specialties: string[];
}

export type HandleResult = 'saved' | 'unchanged' | 'taken' | 'invalid' | 'failed';

export const HANDLE_PATTERN = /^[a-z0-9_.]{3,30}$/;

export function cleanHandle(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

/** The signed-in coach's public card, or null when signed out / not saved yet. */
export async function fetchMyCoachCard(): Promise<CoachCard | null> {
  const uid = await getAuthenticatedUserId();
  return uid ? fetchCoachCard(uid) : null;
}

/** Creates a minimal card so the coach can publish programs (coach_programs references coach_profiles). */
export async function ensureCoachCard(displayName: string): Promise<boolean> {
  const uid = await getAuthenticatedUserId();
  if (!uid) return false;
  const { data, error } = await supabase.from('coach_profiles').select('id').eq('id', uid).maybeSingle();
  if (error) return false;
  if (data) return true;
  const inserted = await supabase.from('coach_profiles').insert({ id: uid, display_name: displayName.trim() || 'Coach' });
  return !inserted.error;
}

async function saveHandle(uid: string, raw: string, current: string): Promise<HandleResult> {
  const handle = cleanHandle(raw);
  if (handle === current) return 'unchanged';
  if (handle && !HANDLE_PATTERN.test(handle)) return 'invalid';
  const { error } = await supabase.from('coach_profiles').update({ handle: handle || null }).eq('id', uid);
  if (!error) return 'saved';
  return error.code === '23505' ? 'taken' : 'failed';
}

/** Writes the public card athletes see on Buddy, in Reels and in the coach directory. */
export async function saveMyPublicProfile(profile: CoachPublicProfile, currentHandle: string): Promise<{ card: boolean; handle: HandleResult }> {
  const uid = await getAuthenticatedUserId();
  if (!uid) return { card: false, handle: 'failed' };
  const fields = {
    display_name: profile.displayName,
    avatar_url: isSharedUrl(profile.avatarUrl) ? profile.avatarUrl : null,
    bio: profile.bio,
    accepting_new_athletes: profile.acceptingNewAthletes,
    specialties: profile.specialties,
  };
  const updated = await supabase.from('coach_profiles').update(fields).eq('id', uid).select('id');
  let card = !updated.error && (updated.data ?? []).length > 0;
  if (!updated.error && !card) card = !(await supabase.from('coach_profiles').insert({ id: uid, ...fields })).error;
  if (!card) return { card: false, handle: 'failed' };
  return { card, handle: await saveHandle(uid, profile.handle, cleanHandle(currentHandle)) };
}

/** Sets only the card photo, e.g. from the Vault. Phone-only links are rejected. */
export async function saveMyCoachAvatar(url: string): Promise<boolean> {
  const uid = await getAuthenticatedUserId();
  if (!uid || !isSharedUrl(url)) return false;
  const { data, error } = await supabase.from('coach_profiles').update({ avatar_url: url }).eq('id', uid).select('id');
  return !error && Array.isArray(data) && data.length > 0;
}

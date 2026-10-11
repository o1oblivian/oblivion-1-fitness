import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { isSharedUrl } from '../../../services/mediaStorage';

export interface CoachPublicProfile {
  displayName: string;
  avatarUrl: string;
  bio: string;
  acceptingNewAthletes: boolean;
}

/** The signed-in coach's public card, or null when signed out / not saved yet. */
export async function fetchMyPublicProfile(): Promise<CoachPublicProfile | null> {
  const uid = await getAuthenticatedUserId();
  if (!uid) return null;
  const { data, error } = await supabase
    .from('coach_profiles')
    .select('display_name, avatar_url, bio, accepting_new_athletes')
    .eq('id', uid)
    .maybeSingle();
  if (error || !data) return null;
  return {
    displayName: String(data.display_name || ''),
    avatarUrl: String(data.avatar_url || ''),
    bio: String(data.bio || ''),
    acceptingNewAthletes: data.accepting_new_athletes !== false,
  };
}

/** Writes the public card athletes see on Buddy and in the coach directory. Returns false when it could not sync. */
export async function saveMyPublicProfile(profile: CoachPublicProfile): Promise<boolean> {
  const uid = await getAuthenticatedUserId();
  if (!uid) return false;
  const fields = {
    display_name: profile.displayName,
    avatar_url: isSharedUrl(profile.avatarUrl) ? profile.avatarUrl : null,
    bio: profile.bio,
    accepting_new_athletes: profile.acceptingNewAthletes,
  };
  const updated = await supabase.from('coach_profiles').update(fields).eq('id', uid).select('id');
  if (updated.error) return false;
  if ((updated.data ?? []).length > 0) return true;
  const inserted = await supabase.from('coach_profiles').insert({ id: uid, ...fields });
  return !inserted.error;
}

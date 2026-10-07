import { supabase } from './supabaseClient';
import { getAuthenticatedUserId } from './authUser';
import { patchAthleteSettingsSnapshot } from '../utils/athleteSettingsSnapshot';

export async function syncBuddyGhostMode(isGhost: boolean): Promise<{ ok: boolean; error?: string }> {
  patchAthleteSettingsSnapshot({ ghostMode: isGhost });
  const uid = await getAuthenticatedUserId();
  if (!uid) return { ok: false, error: 'Sign in to hide or show your radar profile.' };
  const { error } = await supabase
    .from('buddy_profiles')
    .update({ is_ghost_mode: isGhost, last_active: new Date().toISOString() })
    .eq('user_id', uid);
  if (error) {
    const byId = await supabase
      .from('buddy_profiles')
      .update({ is_ghost_mode: isGhost, last_active: new Date().toISOString() })
      .eq('id', uid);
    if (byId.error) return { ok: false, error: byId.error.message };
  }
  return { ok: true };
}

export async function upsertBuddyLocation(coords: {
  latitude: number;
  longitude: number;
}): Promise<{ ok: boolean; error?: string }> {
  const uid = await getAuthenticatedUserId();
  if (!uid) return { ok: false, error: 'Sign in required to publish location.' };
  const { error } = await supabase.from('buddy_profiles').upsert(
    {
      id: uid,
      user_id: uid,
      latitude: coords.latitude,
      longitude: coords.longitude,
      last_active: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

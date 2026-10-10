import { supabase } from './supabaseClient';
import { getAuthenticatedUserId } from './authUser';
import { patchAthleteSettingsSnapshot } from '../utils/athleteSettingsSnapshot';
import { areaKey } from '../features/radar/services/buddyLaunch';

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

export async function publishBuddyCard(
  coords: { latitude: number; longitude: number },
  profile: {
    displayName: string;
    age: number;
    homeGym: string;
    discipline: string;
    split: string;
    time: string;
    bio: string;
    photo: string;
    experience: string;
    ghost: boolean;
    gender: string;
    lookingFor: string;
    place: string;
  },
): Promise<{ ok: boolean; error?: string; warning?: string }> {
  const uid = await getAuthenticatedUserId();
  if (!uid) return { ok: false, error: 'Sign in required to publish location.' };
  const photoFits = Boolean(profile.photo) && profile.photo.length <= 180_000;
  const photo = photoFits ? profile.photo : '';
  const photoDropped = Boolean(profile.photo) && !photoFits;
  const payload = {
    id: uid,
    user_id: uid,
    athlete_name: profile.displayName,
    display_name: profile.displayName,
    age: profile.age >= 18 ? profile.age : null,
    home_gym: profile.homeGym,
    discipline: profile.discipline,
    current_split: profile.split,
    training_time: profile.time,
    bio: profile.bio,
    avatar_url: photo,
    image_url: photo,
    experience_level: profile.experience,
    is_ghost_mode: profile.ghost,
    gender: profile.gender || null,
    looking_for: profile.lookingFor || null,
    training_place: profile.place || null,
    latitude: coords.latitude,
    longitude: coords.longitude,
    region_key: areaKey(coords.latitude, coords.longitude),
    last_active: new Date().toISOString(),
  };
  let { error } = await supabase.from('buddy_profiles').upsert(payload, { onConflict: 'id' });
  if (error && /region_key/i.test(error.message)) {
    const { region_key: omitted, ...withoutRegion } = payload;
    if (omitted) {
      const retry = await supabase.from('buddy_profiles').upsert(withoutRegion, { onConflict: 'id' });
      error = retry.error;
    }
  }
  if (error) return { ok: false, error: error.message };
  if (photoDropped) return { ok: true, warning: 'Photo was too large, so your card saved without it' };
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

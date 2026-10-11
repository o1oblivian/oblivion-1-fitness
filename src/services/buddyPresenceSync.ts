import { supabase } from './supabaseClient';
import { getAuthenticatedUserId } from './authUser';
import { patchAthleteSettingsSnapshot } from '../utils/athleteSettingsSnapshot';
import { areaKey } from '../features/radar/services/buddyLaunch';
import { BuddyProfileState, ExperienceLevel, useBuddyProfileStore } from '../stores/useBuddyProfileStore';

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

function leadWith(cloudValue: unknown, local: string[]): string[] {
  const value = typeof cloudValue === 'string' ? cloudValue.trim() : '';
  if (!value) return local;
  return [value, ...local.filter((item) => item !== value)];
}

/** Pull the athlete's own radar card so a new device starts from the account, not a blank profile. */
export async function hydrateOwnBuddyCard(): Promise<boolean> {
  const uid = await getAuthenticatedUserId();
  if (!uid) return false;
  const { data, error } = await supabase.from('buddy_profiles').select('*').eq('id', uid).maybeSingle();
  if (error || !data) return !error;
  const local = useBuddyProfileStore.getState();
  const updates: Partial<BuddyProfileState> = {
    selectedDisciplines: leadWith(data.discipline, local.selectedDisciplines),
    favoriteWorkouts: leadWith(data.current_split, local.favoriteWorkouts),
    preferredTimes: leadWith(data.training_time, local.preferredTimes),
    buddyPhotos: leadWith(data.avatar_url || data.image_url, local.buddyPhotos).slice(0, 6),
    ghostMode: Boolean(data.is_ghost_mode),
  };
  const name = String(data.athlete_name || data.display_name || '').trim();
  if (name) updates.displayName = name;
  if (Number(data.age) >= 18) updates.age = Number(data.age);
  if (typeof data.home_gym === 'string') updates.homeGym = data.home_gym;
  if (typeof data.bio === 'string') updates.partnerBio = data.bio;
  if (['Beginner', 'Intermediate', 'Advanced', 'Elite'].includes(data.experience_level)) {
    updates.experienceLevel = data.experience_level as ExperienceLevel;
  }
  if (data.gender === 'women' || data.gender === 'men') updates.gender = data.gender;
  if (['gym', 'home', 'outdoors'].includes(data.training_place)) {
    updates.trainingPlace = data.training_place as BuddyProfileState['trainingPlace'];
  }
  local.updateBuddyProfile(updates);
  return true;
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

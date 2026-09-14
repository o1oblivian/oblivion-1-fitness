import { supabase } from '../lib/supabase';

export interface BuddyProfilePayload {
  user_email: string;
  user_name: string;
  handle: string;
  avatar_url: string;
  photos: string[];
  age: number;
  height: number;
  weight: number;
  show_weight: boolean;
  training_focus: string;
  discipline: string;
  experience_level: string;
  preferred_time: string;
  home_gym: string;
  current_gym: string;
  gym_zone_sharing: boolean;
  public_telemetry: boolean;
  is_ghost_mode: boolean;
  latitude: number;
  longitude: number;
  last_active_at: string;
  updated_at: string;
}

export async function upsertCurrentUserBuddyProfile(currentCoords?: { latitude: number; longitude: number }) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user || !user.email) return;

    const email = user.email.toLowerCase();

    // Read cached profile from localStorage if present
    let cachedProfile: any = null;
    try {
      const raw = localStorage.getItem('o1fc_user_profile_data') || localStorage.getItem('o1fc_user_profile');
      if (raw) cachedProfile = JSON.parse(raw);
    } catch {}

    let lat = currentCoords?.latitude ?? cachedProfile?.latitude;
    let lng = currentCoords?.longitude ?? cachedProfile?.longitude;

    if (lat === undefined || lng === undefined) {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, enableHighAccuracy: false });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          lat = -33.8688;
          lng = 151.2093;
        }
      } else {
        lat = -33.8688;
        lng = 151.2093;
      }
    }

    const displayName = cachedProfile?.display_name || user.user_metadata?.full_name || 'Athlete';
    const username = cachedProfile?.username || user.user_metadata?.user_name || email.split('@')[0];
    const avatarUrl = cachedProfile?.avatar_url || user.user_metadata?.avatar_url || '';
    const photos = (cachedProfile?.photos && cachedProfile.photos.length > 0)
      ? cachedProfile.photos
      : (avatarUrl ? [avatarUrl] : []);

    const payload: BuddyProfilePayload = {
      user_email: email,
      user_name: displayName,
      handle: username.startsWith('@') ? username : `@${username}`,
      avatar_url: avatarUrl,
      photos: photos,
      age: cachedProfile?.age || 26,
      height: cachedProfile?.height_cm || cachedProfile?.height || 178,
      weight: cachedProfile?.weight_kg || cachedProfile?.weight || 75,
      show_weight: cachedProfile?.show_weight ?? true,
      training_focus: cachedProfile?.primary_focus || 'Hypertrophy',
      discipline: cachedProfile?.primary_focus || 'Hypertrophy',
      experience_level: cachedProfile?.experience_level || 'Intermediate',
      preferred_time: cachedProfile?.preferred_time || 'Evening (4-7 PM)',
      home_gym: cachedProfile?.home_gym || 'Iron Works Barbell',
      current_gym: cachedProfile?.current_gym || cachedProfile?.home_gym || 'Iron Works Barbell',
      gym_zone_sharing: cachedProfile?.gym_zone_sharing ?? true,
      public_telemetry: cachedProfile?.public_telemetry ?? true,
      is_ghost_mode: cachedProfile?.is_ghost_mode ?? false,
      latitude: lat,
      longitude: lng,
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('buddy_profiles').upsert(payload, { onConflict: 'user_email' });
    if (error) {
      console.warn('[buddy_profiles] Auto-upsert note:', error.message);
    } else {
      console.log('[buddy_profiles] User profile upserted successfully on boot/auth:', email);
    }
  } catch (err) {
    console.warn('[buddy_profiles] Auto-upsert error:', err);
  }
}

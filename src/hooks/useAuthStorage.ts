import { useState, useCallback, useEffect } from 'react';
import { getSessionUserEmail } from '../utils/authStorage';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

export interface UserProfileData {
  display_name?: string;
  username?: string;
  avatar_url?: string;
  email?: string;
  bio?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  show_weight?: boolean;
  home_gym?: string;
  latitude?: number;
  longitude?: number;
  auto_location_enabled?: boolean;
  primary_focus?: string;
  training_days?: string[];
  auto_dispatch?: boolean;
  pre_workout_notif?: boolean;
  input_method?: 'dial' | 'numpad';
  buddy_match_enabled?: boolean;
  reels_visibility_enabled?: boolean;
  is_ghost_mode?: boolean;
  gym_zone_sharing?: boolean;
  public_telemetry?: boolean;
  crash_reports?: boolean;
  rest_mode?: boolean;
  private_training?: boolean;
  theme?: 'dark' | 'light' | 'system';
}

const PROFILE_KEY = 'o1fc_user_profile_data';

export function getLocalProfile(): UserProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
    const email = getSessionUserEmail();
    const fallbackName = email ? email.split('@')[0] : 'Athlete';
    return {
      display_name: fallbackName,
      username: fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      primary_focus: 'Hypertrophy',
      training_days: ['Mo', 'Tu', 'Th', 'Fr', 'Sa'],
      auto_dispatch: true,
      pre_workout_notif: true,
      input_method: 'dial',
      home_gym: 'Melbourne, AU',
      latitude: -37.8136,
      longitude: 144.9631,
      auto_location_enabled: true,
      buddy_match_enabled: true,
      reels_visibility_enabled: true,
      is_ghost_mode: false,
      gym_zone_sharing: true,
      public_telemetry: true,
      crash_reports: true,
      show_weight: false,
      rest_mode: false,
      private_training: false,
      age: 26,
      height_cm: 180,
      weight_kg: 82,
    };
  } catch {
    return {};
  }
}

export function saveLocalProfile(data: UserProfileData): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('user_profile_updated', { detail: data }));
    }
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function useAuthStorage() {
  const [profile, setProfileState] = useState<UserProfileData>(getLocalProfile);

  // Sync profile from Supabase when user signs in or mounts
  useEffect(() => {
    let isMounted = true;

    const fetchRemoteProfile = async () => {
      if (!isSupabaseConfigured() || !supabase) return;
      try {
        const { data: sess } = await supabase.auth.getSession();
        const email = sess?.session?.user?.email || getSessionUserEmail();
        if (!email) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_email', email.toLowerCase())
          .maybeSingle();

        if (data && !error && isMounted) {
          const current = getLocalProfile();
          const merged: UserProfileData = {
            ...current,
            email: data.user_email || email,
            display_name: data.user_name || current.display_name,
            username: data.handle || current.username,
            avatar_url: data.avatar_url || current.avatar_url,
            bio: data.bio || current.bio,
            home_gym: data.home_gym || current.home_gym,
            latitude: data.latitude ?? current.latitude,
            longitude: data.longitude ?? current.longitude,
            age: data.age || current.age,
            height_cm: data.height || current.height_cm,
            weight_kg: data.weight || current.weight_kg,
            show_weight: data.show_weight ?? current.show_weight,
            primary_focus: data.training_focus || current.primary_focus,
            is_ghost_mode: data.is_ghost_mode ?? current.is_ghost_mode,
            gym_zone_sharing: data.gym_zone_sharing ?? current.gym_zone_sharing,
            public_telemetry: data.public_telemetry ?? current.public_telemetry,
          };
          // Cross-sync buddy match with ghost mode
          if (merged.is_ghost_mode) {
            merged.buddy_match_enabled = false;
            merged.gym_zone_sharing = false;
          }
          saveLocalProfile(merged);
          setProfileState(merged);
        }
      } catch {
        // quiet fallback to local storage
      }
    };

    fetchRemoteProfile();

    const { data: authListener } = supabase?.auth?.onAuthStateChange((event, session) => {
      if (session?.user?.email && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
        fetchRemoteProfile();
      }
    }) || { data: null };

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfileData>;
      if (customEvent.detail) {
        setProfileState(customEvent.detail);
      } else {
        setProfileState(getLocalProfile());
      }
    };

    window.addEventListener('user_profile_updated', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('user_profile_updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const getProfile = useCallback((): UserProfileData => {
    return getLocalProfile();
  }, []);

  const updateProfile = useCallback(async (partial: Partial<UserProfileData>) => {
    const current = getLocalProfile();
    const updated: UserProfileData = { ...current, ...partial };

    // Strict Cross-Sync Invariant:
    // If Ghost Mode is enabled -> User is hidden from Buddy Radar & Gym Zone Sharing is disabled
    if (partial.is_ghost_mode === true) {
      updated.is_ghost_mode = true;
      updated.buddy_match_enabled = false;
      updated.gym_zone_sharing = false;
    } else if (partial.is_ghost_mode === false) {
      updated.is_ghost_mode = false;
      if (partial.buddy_match_enabled === undefined) {
        updated.buddy_match_enabled = true;
      }
      if (partial.gym_zone_sharing === undefined) {
        updated.gym_zone_sharing = true;
      }
    }

    // If Buddy Radar Discovery is toggled:
    if (partial.buddy_match_enabled === false) {
      updated.buddy_match_enabled = false;
      updated.is_ghost_mode = true;
      updated.gym_zone_sharing = false;
    } else if (partial.buddy_match_enabled === true) {
      updated.buddy_match_enabled = true;
      updated.is_ghost_mode = false;
      updated.gym_zone_sharing = true;
    }

    saveLocalProfile(updated);
    setProfileState(updated);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const email = sess?.session?.user?.email || getSessionUserEmail();
        if (email) {
          await supabase.from('profiles').upsert({
            user_email: email.toLowerCase(),
            user_name: updated.display_name,
            handle: updated.username,
            avatar_url: updated.avatar_url,
            bio: updated.bio,
            home_gym: updated.home_gym,
            age: updated.age,
            height: updated.height_cm,
            weight: updated.weight_kg,
            show_weight: updated.show_weight ?? false,
            training_focus: updated.primary_focus,
            discipline: updated.primary_focus,
            is_ghost_mode: updated.is_ghost_mode ?? false,
            gym_zone_sharing: updated.gym_zone_sharing ?? true,
            public_telemetry: updated.public_telemetry ?? true,
            latitude: updated.latitude,
            longitude: updated.longitude,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_email' });
        }
      } catch (e) {
        // quiet fallback
      }
    }
  }, []);

  return {
    getProfile,
    updateProfile,
    profile,
  };
}

export { getSessionUserEmail };

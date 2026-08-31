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
  home_gym?: string;
  latitude?: number;
  longitude?: number;
  primary_focus?: string;
  training_days?: string[];
  auto_dispatch?: boolean;
  pre_workout_notif?: boolean;
  input_method?: 'dial' | 'numpad';
  buddy_match_enabled?: boolean;
  reels_visibility_enabled?: boolean;
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
      buddy_match_enabled: true,
      reels_visibility_enabled: true,
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
    const updated = { ...current, ...partial };
    saveLocalProfile(updated);
    setProfileState(updated);

    if (isSupabaseConfigured()) {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const email = sess?.session?.user?.email;
        if (email) {
          await supabase.from('profiles').update(partial).eq('user_email', email);
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

import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

/**
 * Initiates Google OAuth authentication.
 * On native platforms (iOS/Android), uses @capacitor/browser with skipBrowserRedirect: true,
 * opening the OAuth URL in an in-app browser overlay that targets 'com.o1fc.fitness://auth/callback'.
 */
export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'com.o1fc.fitness://auth/callback',
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }

    if (data?.url) {
      await Browser.open({ url: data.url, windowName: '_self' });
    }

    return { data, error: null };
  } else {
    const redirectTo =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://o1fc-official-1.ai.studio';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  }
}

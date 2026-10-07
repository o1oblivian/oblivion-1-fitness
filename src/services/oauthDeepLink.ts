import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';
import { safeStorage } from '../utils/safeStorage';

export const NATIVE_OAUTH_REDIRECT = 'com.o1fc.fitness://auth/callback';

export function getOAuthRedirectTo(): string | undefined {
  if (Capacitor.isNativePlatform()) return NATIVE_OAUTH_REDIRECT;
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}${window.location.pathname || '/'}`;
  }
  return undefined;
}

export async function persistAuthenticatedUser(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    const user = data?.session?.user;
    if (error || !user) return false;
    safeStorage.setItem('o1fc_user_id', user.id);
    if (user.email) safeStorage.setItem('o1fc_user_email', user.email);
    safeStorage.setItem('o1fc_onboarding_completed', 'true');
    return true;
  } catch (err) {
    console.warn('[OAuth] Failed to persist session user:', err);
    return false;
  }
}

/**
 * Apply a native custom-scheme or web OAuth callback URL.
 * Supports PKCE (`code`) and implicit (`access_token`) responses.
 */
export async function applyAuthCallbackUrl(rawUrl: string): Promise<boolean> {
  if (!rawUrl) return false;
  try {
    if (rawUrl.includes('code=')) {
      const { error } = await supabase.auth.exchangeCodeForSession(rawUrl);
      if (error) {
        console.warn('[OAuth] exchangeCodeForSession failed:', error.message);
        return false;
      }
      return persistAuthenticatedUser();
    }

    const fragment = rawUrl.includes('#') ? rawUrl.split('#')[1] : '';
    const query = rawUrl.includes('?') ? rawUrl.split('?')[1]?.split('#')[0] : '';
    const params = new URLSearchParams(fragment || query);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token') || '';
    if (!accessToken) return false;

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      console.warn('[OAuth] setSession failed:', error.message);
      return false;
    }
    return persistAuthenticatedUser();
  } catch (err) {
    console.warn('[OAuth] Callback handling failed:', err);
    return false;
  }
}

export async function openOAuthUrl(url: string): Promise<void> {
  if (!url) throw new Error('OAuth provider URL missing.');
  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
      return;
    } catch (err) {
      console.warn('[OAuth] Capacitor Browser unavailable, using system navigation:', err);
    }
  }
  try {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
  } catch {
    /* iframe access may throw */
  }
  window.location.assign(url);
}

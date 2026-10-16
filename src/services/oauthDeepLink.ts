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

/** Native opens the system browser tab, never an embedded web view. */
export async function startAppleOAuth(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: getOAuthRedirectTo(), skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Sign-in provider is unavailable right now.');
  await openOAuthUrl(data.url);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: getOAuthRedirectTo() });
  if (error) throw error;
}

export async function resendSignupEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: getOAuthRedirectTo() } });
  if (error) throw error;
}

async function closeNativeBrowser(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.close();
  } catch {
    /* already closed */
  }
}

export const AUTH_ERROR_EVENT = 'o1fc_auth_error';
let pendingAuthError: string | null = null;

function callbackError(rawUrl: string): string | null {
  const fragment = rawUrl.includes('#') ? rawUrl.split('#')[1] : '';
  const query = rawUrl.includes('?') ? rawUrl.split('?')[1]?.split('#')[0] : '';
  for (const part of [query, fragment]) {
    const params = new URLSearchParams(part || '');
    const code = params.get('error');
    if (!code) continue;
    if (code === 'access_denied') return 'Sign-in was cancelled.';
    return (params.get('error_description') || 'Sign-in could not be completed.').replace(/\+/g, ' ');
  }
  return null;
}

function publishAuthError(message: string): void {
  pendingAuthError = message;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT, { detail: message }));
}

/** Returns (once) an error the provider sent back on the last redirect. */
export function takeAuthCallbackError(): string | null {
  if (typeof window !== 'undefined' && !pendingAuthError) {
    const fromUrl = callbackError(window.location.href);
    if (fromUrl) {
      pendingAuthError = fromUrl;
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        /* ignore */
      }
    }
  }
  const message = pendingAuthError;
  pendingAuthError = null;
  return message;
}

export async function persistAuthenticatedUser(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    const user = data?.session?.user;
    if (error || !user) return false;
    safeStorage.setItem('o1fc_user_id', user.id);
    if (user.email) safeStorage.setItem('o1fc_user_email', user.email);
    return true;
  } catch (err) {
    console.warn('[OAuth] Failed to persist session user:', err);
    return false;
  }
}

/** Server flag only. A local flag used to be set on every sign-in, which skipped the wizard. */
export async function profileOnboardingComplete(): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return false;
    const { data, error } = await supabase.from('profiles').select('onboarding_completed').eq('id', uid).maybeSingle();
    if (error || !data) return false;
    return (data as { onboarding_completed?: boolean }).onboarding_completed === true;
  } catch {
    return false;
  }
}

function authCode(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).searchParams.get('code');
  } catch {
    const match = rawUrl.match(/[?&#]code=([^&#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

/** The WebView cannot read the saved login code until it is in the foreground again. */
async function waitUntilActive(): Promise<void> {
  await closeNativeBrowser();
  if (typeof document === 'undefined') return;
  if (document.visibilityState !== 'visible') {
    await new Promise<void>((resolve) => {
      const finish = () => {
        document.removeEventListener('visibilitychange', onChange);
        resolve();
      };
      const onChange = () => {
        if (document.visibilityState === 'visible') finish();
      };
      document.addEventListener('visibilitychange', onChange);
      window.setTimeout(finish, 1200);
    });
  }
  await new Promise((resolve) => window.setTimeout(resolve, 250));
}

let consumedCode = '';
let exchangeInFlight: Promise<boolean> | null = null;

/**
 * Apply a native custom-scheme or web OAuth callback URL.
 * Supports PKCE (`code`) and implicit (`access_token`) responses.
 */
export async function applyAuthCallbackUrl(rawUrl: string): Promise<boolean> {
  if (!rawUrl) return false;
  const code = authCode(rawUrl);
  if (code && code === consumedCode) return persistAuthenticatedUser();
  if (exchangeInFlight) return exchangeInFlight;

  const run = async (): Promise<boolean> => {
  if (rawUrl.startsWith('com.o1fc.fitness://')) await waitUntilActive();
  const providerError = callbackError(rawUrl);
  if (providerError) {
    publishAuthError(providerError);
    return false;
  }
  try {
    if (code) {
      let { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error && /verifier/i.test(error.message)) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        ({ error } = await supabase.auth.exchangeCodeForSession(code));
      }
      if (error) {
        console.warn('[OAuth] exchangeCodeForSession failed:', error.message);
        publishAuthError(error.message || 'Sign-in could not be completed. Please try again.');
        return false;
      }
      consumedCode = code;
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
      publishAuthError(error.message || 'Sign-in could not be completed. Please try again.');
      return false;
    }
    return persistAuthenticatedUser();
  } catch (err) {
    console.warn('[OAuth] Callback handling failed:', err);
    const message = err instanceof Error ? err.message : 'Sign-in could not be completed. Please try again.';
    publishAuthError(message);
    return false;
  }
  };

  exchangeInFlight = run().finally(() => {
    exchangeInFlight = null;
  });
  return exchangeInFlight;
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

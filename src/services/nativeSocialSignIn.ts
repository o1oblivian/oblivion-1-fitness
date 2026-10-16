import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';
import { persistAuthenticatedUser } from './oauthDeepLink';

const GOOGLE_WEB_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '').trim();
const GOOGLE_IOS_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || '').trim();

export type SocialProvider = 'google' | 'apple';

/**
 * Native account sheets (Android Credential Manager, iOS Sign in with Apple / Google SDK).
 * Apple has no native sign-in on Android, so Apple there stays on the browser flow.
 */
export function hasNativeSignIn(provider: SocialProvider): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  const platform = Capacitor.getPlatform();
  if (provider === 'apple') return platform === 'ios';
  if (platform === 'android') return GOOGLE_WEB_CLIENT_ID.length > 0;
  return platform === 'ios' && GOOGLE_IOS_CLIENT_ID.length > 0;
}

let initialized: Promise<void> | null = null;

async function plugin() {
  const { SocialLogin } = await import('@capgo/capacitor-social-login');
  // Apple config is iOS-only. Passing apple on Android makes Capgo throw
  // "apple.android.clientId is null or empty" even when logging in with Google.
  const platform = Capacitor.getPlatform();
  const options: {
    google?: {
      webClientId?: string;
      iOSClientId?: string;
      iOSServerClientId?: string;
      mode: 'online';
    };
    apple?: { redirectUrl: string };
  } = {
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
      iOSClientId: GOOGLE_IOS_CLIENT_ID || undefined,
      iOSServerClientId: GOOGLE_WEB_CLIENT_ID || undefined,
      mode: 'online',
    },
  };
  if (platform === 'ios') {
    options.apple = { redirectUrl: '' };
  }
  initialized ??= SocialLogin.initialize(options).catch((err) => {
    initialized = null;
    throw err;
  });
  await initialized;
  return SocialLogin;
}

/** Supabase checks sha256(rawNonce) inside the provider's ID token against the raw nonce it receives. */
async function nonces(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return { raw, hashed };
}

function cancelled(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return /cancel|dismiss|user.?closed|1001/i.test(message);
}

/** Resolves true when signed in, false when the athlete closed the sheet. */
export async function nativeSignIn(provider: SocialProvider): Promise<boolean> {
  if (!hasNativeSignIn(provider)) {
    throw new Error(`${provider === 'google' ? 'Google' : 'Apple'} native sign-in is not available on this device.`);
  }
  const SocialLogin = await plugin();
  const { raw, hashed } = await nonces();
  let idToken: string | null = null;
  try {
    if (provider === 'google') {
      // Do not pass scopes on Android. Capgo rejects scopes unless MainActivity
      // implements ModifiedMainActivityForSocialLoginPlugin. Default credential
      // scopes already include openid + email + profile for the ID token.
      const res = await SocialLogin.login({ provider: 'google', options: { nonce: hashed } });
      idToken = res.result.responseType === 'online' ? res.result.idToken : null;
    } else {
      const res = await SocialLogin.login({ provider: 'apple', options: { scopes: ['name', 'email'], nonce: hashed } });
      idToken = res.result.idToken;
    }
  } catch (err) {
    if (cancelled(err)) return false;
    throw err;
  }
  if (!idToken) throw new Error(`${provider === 'google' ? 'Google' : 'Apple'} did not return a sign-in token.`);
  const { error } = await supabase.auth.signInWithIdToken({ provider, token: idToken, nonce: raw });
  if (error) throw error;
  return persistAuthenticatedUser();
}

import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';
import { persistAuthenticatedUser } from './oauthDeepLink';

/**
 * Native Sign in with Apple sheet on iPhone and iPad.
 * Android has no native Apple sheet, so Apple there stays on the browser flow.
 */
export function hasNativeAppleSignIn(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/**
 * Apple sign-in is offered on iPhone (native sheet) and in a normal browser tab.
 * On Android it would send the athlete to a browser page inside the app, so it is not offered there.
 */
export function appleSignInAvailable(): boolean {
  return !Capacitor.isNativePlatform() || hasNativeAppleSignIn();
}

let initialized: Promise<void> | null = null;

async function plugin() {
  const { SocialLogin } = await import('@capgo/capacitor-social-login');
  initialized ??= SocialLogin.initialize({ apple: { redirectUrl: '' } }).catch((err) => {
    initialized = null;
    throw err;
  });
  await initialized;
  return SocialLogin;
}

/** Supabase checks sha256(rawNonce) inside Apple's ID token against the raw nonce it receives. */
async function nonces(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join(
    '',
  );
  return { raw, hashed };
}

function cancelled(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return /cancel|dismiss|user.?closed|1001/i.test(message);
}

/** Resolves true when signed in, false when the athlete closed the sheet. */
export async function nativeAppleSignIn(): Promise<boolean> {
  if (!hasNativeAppleSignIn()) {
    throw new Error('Apple native sign-in is not available on this device.');
  }
  const SocialLogin = await plugin();
  const { raw, hashed } = await nonces();
  let idToken: string | null = null;
  try {
    const res = await SocialLogin.login({
      provider: 'apple',
      options: { scopes: ['name', 'email'], nonce: hashed },
    });
    idToken = res.result.idToken;
  } catch (err) {
    if (cancelled(err)) return false;
    throw err;
  }
  if (!idToken) throw new Error('Apple did not return a sign-in token.');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: idToken,
    nonce: raw,
  });
  if (error) throw error;
  return persistAuthenticatedUser();
}

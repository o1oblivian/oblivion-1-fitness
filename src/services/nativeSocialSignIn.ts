import { Capacitor } from '@capacitor/core';
import { NATIVE_PROMPT_TIMEOUT_MS, withNativeTimeout } from '../utils/nativeTimeout';
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
  initialized ??= withNativeTimeout(
    SocialLogin.initialize({ apple: { redirectUrl: '' } }),
    'Apple sign-in did not start. Close the app, open it again and retry.',
  ).catch((err) => {
    initialized = null;
    throw err;
  });
  await initialized;
  // In an object on purpose: a Capacitor plugin returned straight from an async function is treated
  // as a promise, which sends a `then` call to the phone that is never answered.
  return { SocialLogin };
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

/**
 * Asks Apple for a fresh one-time authorization code. The server trades it for a token and revokes it
 * when the account is deleted, which App Review requires for apps with Sign in with Apple.
 * Returns null on any other platform, when the sheet is closed, or when Apple gives no code.
 * Never signs the athlete in again.
 */
export async function appleRevocationCode(): Promise<string | null> {
  if (!hasNativeAppleSignIn()) return null;
  try {
    const { SocialLogin } = await plugin();
    const { hashed } = await nonces();
    const res = await withNativeTimeout(
      SocialLogin.login({
        provider: 'apple',
        options: { scopes: ['name', 'email'], nonce: hashed },
      }),
      'Apple did not answer.',
      NATIVE_PROMPT_TIMEOUT_MS,
    );
    // Without proper token exchange the plugin hands the authorization code back as the access token.
    return res.result.authorizationCode || res.result.accessToken?.token || null;
  } catch {
    return null;
  }
}

/** Resolves true when signed in, false when the athlete closed the sheet. */
export async function nativeAppleSignIn(): Promise<boolean> {
  if (!hasNativeAppleSignIn()) {
    throw new Error('Apple native sign-in is not available on this device.');
  }
  const { SocialLogin } = await plugin();
  const { raw, hashed } = await nonces();
  let idToken: string | null = null;
  try {
    const res = await withNativeTimeout(
      SocialLogin.login({
        provider: 'apple',
        options: { scopes: ['name', 'email'], nonce: hashed },
      }),
      'Apple sign-in did not answer. Try again.',
      NATIVE_PROMPT_TIMEOUT_MS,
    );
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

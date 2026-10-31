import { beforeEach, describe, expect, it, vi } from 'vitest';

const platform = { native: false, name: 'web' };

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => platform.native,
    getPlatform: () => platform.name,
  },
}));
const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  initialize: vi.fn(),
  signInWithIdToken: vi.fn(),
  persist: vi.fn(),
}));
vi.mock('@capgo/capacitor-social-login', () => ({
  SocialLogin: { initialize: mocks.initialize, login: mocks.login },
}));
vi.mock('./supabaseClient', () => ({
  supabase: { auth: { signInWithIdToken: mocks.signInWithIdToken } },
}));
vi.mock('./oauthDeepLink', () => ({ persistAuthenticatedUser: mocks.persist }));

import {
  appleSignInAvailable,
  explainAppleSignInError,
  hasNativeAppleSignIn,
  nativeAppleSignIn,
} from './nativeSocialSignIn';

describe('Apple sign-in availability', () => {
  beforeEach(() => {
    platform.native = false;
    platform.name = 'web';
  });

  it('is offered in a normal browser tab', () => {
    expect(appleSignInAvailable()).toBe(true);
    expect(hasNativeAppleSignIn()).toBe(false);
  });

  it('is offered on iPhone through the native sheet', () => {
    platform.native = true;
    platform.name = 'ios';
    expect(hasNativeAppleSignIn()).toBe(true);
    expect(appleSignInAvailable()).toBe(true);
  });

  it('is not offered on Android, where it would open a browser page', () => {
    platform.native = true;
    platform.name = 'android';
    expect(hasNativeAppleSignIn()).toBe(false);
    expect(appleSignInAvailable()).toBe(false);
  });
});

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

describe('native Apple sign-in', () => {
  beforeEach(() => {
    platform.native = true;
    platform.name = 'ios';
    mocks.initialize.mockReset().mockResolvedValue(undefined);
    mocks.login.mockReset();
    mocks.signInWithIdToken.mockReset();
    mocks.persist.mockReset().mockResolvedValue(true);
  });

  it('passes Apple identity token and the raw nonce to the sign-in service', async () => {
    mocks.login.mockResolvedValue({ result: { idToken: 'identity-token' } });
    mocks.signInWithIdToken.mockResolvedValue({ error: null });

    await expect(nativeAppleSignIn()).resolves.toBe(true);

    const sent = mocks.login.mock.calls[0][0].options.nonce as string;
    const exchange = mocks.signInWithIdToken.mock.calls[0][0] as {
      provider: string;
      token: string;
      nonce: string;
    };
    expect(exchange).toMatchObject({ provider: 'apple', token: 'identity-token' });
    // Apple received the hash; the service receives the raw value it was made from.
    expect(await sha256Hex(exchange.nonce)).toBe(sent);
  });

  it('returns false, not an error, when the sheet is closed', async () => {
    mocks.login.mockRejectedValue(new Error('The user canceled the sign-in flow (1001)'));
    await expect(nativeAppleSignIn()).resolves.toBe(false);
    expect(mocks.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('fails loudly when Apple gives no token', async () => {
    mocks.login.mockResolvedValue({ result: { idToken: null } });
    await expect(nativeAppleSignIn()).rejects.toThrow(
      'Apple did not return a sign-in token. Try again.',
    );
  });

  it('shows a plain message when the sign-in service rejects the token', async () => {
    mocks.login.mockResolvedValue({ result: { idToken: 't' } });
    mocks.signInWithIdToken.mockResolvedValue({
      error: new Error('Unacceptable audience in id_token: [com.o1fc.fitness]'),
    });
    const failure = await nativeAppleSignIn().catch((err: Error) => err);
    expect((failure as Error).message).toBe(
      'Apple sign-in could not be completed. Try again, or sign in with your email.',
    );
  });

  it('does not report a signed-in athlete whose session cannot be read as a closed sheet', async () => {
    mocks.login.mockResolvedValue({ result: { idToken: 't' } });
    mocks.signInWithIdToken.mockResolvedValue({ error: null });
    mocks.persist.mockResolvedValue(false);
    await expect(nativeAppleSignIn()).rejects.toThrow(/session did not start/);
  });

  it('gives up with a message when the sign-in service never answers', async () => {
    vi.useFakeTimers();
    try {
      mocks.login.mockResolvedValue({ result: { idToken: 't' } });
      mocks.signInWithIdToken.mockReturnValue(new Promise(() => undefined));
      const outcome = nativeAppleSignIn().catch((err: Error) => err);
      await vi.waitFor(() => expect(mocks.signInWithIdToken).toHaveBeenCalled());
      await vi.advanceTimersByTimeAsync(30_000);
      expect(((await outcome) as Error).message).toBe(
        'Sign-in is taking too long. Check your connection and try again.',
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('explainAppleSignInError', () => {
  it('turns network and provider errors into plain sentences', () => {
    expect(explainAppleSignInError(new Error('TypeError: Load failed')).message).toMatch(
      /connection/,
    );
    expect(explainAppleSignInError(new Error('Nonces mismatch')).message).toMatch(
      /could not be completed/,
    );
    expect(explainAppleSignInError('weird').message).toMatch(/did not finish/);
  });
});

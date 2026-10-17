import { beforeEach, describe, expect, it, vi } from 'vitest';

const platform = { native: false, name: 'web' };

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => platform.native,
    getPlatform: () => platform.name,
  },
}));
vi.mock('./supabaseClient', () => ({ supabase: {} }));
vi.mock('./oauthDeepLink', () => ({ persistAuthenticatedUser: vi.fn() }));

import { appleSignInAvailable, hasNativeAppleSignIn } from './nativeSocialSignIn';

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

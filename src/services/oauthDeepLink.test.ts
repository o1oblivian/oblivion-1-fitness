import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
}));
vi.mock('./supabaseClient', () => ({ supabase: { auth } }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' },
}));

import { applyAuthCallbackUrl, authFlowId } from './oauthDeepLink';

describe('authFlowId', () => {
  it('reads the flow id Supabase adds to the redirect', () => {
    expect(authFlowId('com.o1fc.fitness://auth/callback?sb_flow_id=abc12345XYZ&code=111')).toBe(
      'abc12345XYZ',
    );
    expect(authFlowId('com.o1fc.fitness://auth/callback?code=111&sb_flow_id=abc12345XYZ')).toBe(
      'abc12345XYZ',
    );
  });

  it('is undefined for links from older builds', () => {
    expect(authFlowId('com.o1fc.fitness://auth/callback?code=111')).toBeUndefined();
  });
});

describe('applyAuthCallbackUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('hands the flow id to the code exchange so the saved verifier is found', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    await applyAuthCallbackUrl('https://app.example/cb?sb_flow_id=abc12345XYZ&code=flow-code');
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('flow-code', {
      flowId: 'abc12345XYZ',
    });
  });

  it('exchanges a plain code when the link carries no flow id', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    await applyAuthCallbackUrl('https://app.example/cb?code=plain-code');
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('plain-code', undefined);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabaseClient', () => ({ supabase: { auth: { getSession: vi.fn() } } }));

import { resolveGateStatus } from './sessionGate';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const user = { id: '11111111-1111-4111-8111-111111111111' };
const session = (value: unknown) =>
  vi.fn().mockResolvedValue({ data: { session: value }, error: null });

describe('resolveGateStatus', () => {
  it('lets a person in only when Supabase has a session', async () => {
    expect(await resolveGateStatus(session({ user }), () => false)).toBe('in');
  });

  it('ignores a leftover local flag when there is no session', async () => {
    store.set('o1fc_user_id', user.id);
    store.set('o1fc_user_email', 'a@b.co');

    expect(await resolveGateStatus(session(null), () => false)).toBe('out');
    expect(store.has('o1fc_user_id')).toBe(false);
    expect(store.has('o1fc_user_email')).toBe(false);
  });

  it('keeps an athlete in when only the signal is missing and a login is stored', async () => {
    const offline = vi.fn().mockResolvedValue({
      data: { session: null },
      error: { name: 'AuthRetryableFetchError', status: 0 },
    });
    expect(await resolveGateStatus(offline, () => true)).toBe('in');
  });

  it('asks for sign-in when the auth server rejects the login', async () => {
    const rejected = vi.fn().mockResolvedValue({
      data: { session: null },
      error: { name: 'AuthApiError', status: 400 },
    });
    expect(await resolveGateStatus(rejected, () => true)).toBe('out');
  });

  it('ends with an answer when the auth call never returns', async () => {
    vi.useFakeTimers();
    const pending = resolveGateStatus(
      () => new Promise(() => undefined),
      () => false,
    );
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await pending).toBe('out');
  });
});

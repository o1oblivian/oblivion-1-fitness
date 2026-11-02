import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabaseClient', () => ({ supabase: { auth: { getSession: vi.fn() } } }));

import {
  isLiveSession,
  OFFLINE_SESSION_MS,
  resolveGateStatus,
  withinOfflineWindow,
} from './sessionGate';

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

const NOW = Date.UTC(2026, 10, 2, 2, 0, 0);
const clock = () => NOW;
const inAnHour = NOW / 1000 + 3600;
const anHourAgo = NOW / 1000 - 3600;
const user = { id: '11111111-1111-4111-8111-111111111111' };
const session = (value: unknown) =>
  vi.fn().mockResolvedValue({ data: { session: value }, error: null });
const offline = () =>
  vi.fn().mockResolvedValue({
    data: { session: null },
    error: { name: 'AuthRetryableFetchError', status: 0 },
  });

describe('resolveGateStatus', () => {
  it('lets a person in when Supabase has an unexpired session', async () => {
    expect(
      await resolveGateStatus(session({ user, expires_at: inAnHour }), () => null, clock),
    ).toBe('in');
  });

  it('asks for sign-in when the session Supabase returns has expired', async () => {
    expect(
      await resolveGateStatus(session({ user, expires_at: anHourAgo }), () => null, clock),
    ).toBe('out');
  });

  it('does not trust a session without an expiry', async () => {
    expect(await resolveGateStatus(session({ user }), () => null, clock)).toBe('out');
  });

  it('ignores a leftover local flag when there is no session', async () => {
    store.set('o1fc_user_id', user.id);
    store.set('o1fc_user_email', 'a@b.co');

    expect(await resolveGateStatus(session(null), () => null, clock)).toBe('out');
    expect(store.has('o1fc_user_id')).toBe(false);
    expect(store.has('o1fc_user_email')).toBe(false);
  });

  it('keeps an athlete in offline long after the access token expired', async () => {
    const twoHoursAgo = NOW - 2 * 3600_000;
    expect(await resolveGateStatus(offline(), () => twoHoursAgo, clock)).toBe('in');
  });

  it('keeps an athlete in offline up to 30 days after the last online check', async () => {
    expect(await resolveGateStatus(offline(), () => NOW - OFFLINE_SESSION_MS, clock)).toBe('in');
  });

  it('asks for sign-in offline once 30 days pass without a connection', async () => {
    expect(await resolveGateStatus(offline(), () => NOW - OFFLINE_SESSION_MS - 1, clock)).toBe(
      'out',
    );
  });

  it('does not trust a stored token issued in the future', async () => {
    expect(await resolveGateStatus(offline(), () => NOW + 60_000, clock)).toBe('out');
  });

  it('asks for sign-in offline when the stored login has no readable token times', async () => {
    expect(await resolveGateStatus(offline(), () => null, clock)).toBe('out');
  });

  it('asks for sign-in when the auth server rejects the login', async () => {
    const rejected = vi.fn().mockResolvedValue({
      data: { session: null },
      error: { name: 'AuthApiError', status: 400 },
    });
    expect(await resolveGateStatus(rejected, () => NOW - 60_000, clock)).toBe('out');
  });

  it('ends with an answer when the auth call never returns', async () => {
    vi.useFakeTimers();
    const pending = resolveGateStatus(
      () => new Promise(() => undefined),
      () => null,
      clock,
    );
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await pending).toBe('out');
  });
});

describe('isLiveSession', () => {
  it('needs a user and a future expiry', () => {
    expect(isLiveSession(null, NOW)).toBe(false);
    expect(isLiveSession({ expires_at: inAnHour } as never, NOW)).toBe(false);
    expect(isLiveSession({ user, expires_at: inAnHour } as never, NOW)).toBe(true);
    expect(isLiveSession({ user, expires_at: anHourAgo } as never, NOW)).toBe(false);
  });
});

describe('withinOfflineWindow', () => {
  const now = () => NOW;

  it('keeps a login issued up to 30 days ago', () => {
    expect(withinOfflineWindow(() => NOW - 2 * 60 * 60 * 1000, now)).toBe(true);
    expect(withinOfflineWindow(() => NOW - OFFLINE_SESSION_MS, now)).toBe(true);
  });

  it('drops a login older than 30 days, a missing one, or one from the future', () => {
    expect(withinOfflineWindow(() => NOW - OFFLINE_SESSION_MS - 1, now)).toBe(false);
    expect(withinOfflineWindow(() => null, now)).toBe(false);
    expect(withinOfflineWindow(() => NOW + 1000, now)).toBe(false);
  });
});

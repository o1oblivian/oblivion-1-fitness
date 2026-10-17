import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getUser: vi.fn(), getSession: vi.fn() }));
vi.mock('./supabaseClient', () => ({ supabase: { auth } }));

import { forgetVerifiedUser, getAuthenticatedUserId, getCachedUserId } from './authUser';

const USER = '11111111-1111-4111-8111-111111111111';
const signedIn = (token: string) =>
  auth.getSession.mockResolvedValue({ data: { session: { access_token: token } } });

describe('getAuthenticatedUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    forgetVerifiedUser();
    auth.getUser.mockResolvedValue({ data: { user: { id: USER } }, error: null });
  });

  it('shares one server check between simultaneous callers', async () => {
    signedIn('token-a');
    const ids = await Promise.all([
      getAuthenticatedUserId(),
      getAuthenticatedUserId(),
      getAuthenticatedUserId(),
    ]);
    expect(ids).toEqual([USER, USER, USER]);
    expect(auth.getUser).toHaveBeenCalledTimes(1);
  });

  it('reuses the confirmed account on the next call with the same sign-in', async () => {
    signedIn('token-a');
    await getAuthenticatedUserId();
    await getAuthenticatedUserId();
    expect(auth.getUser).toHaveBeenCalledTimes(1);
  });

  it('asks again after a different sign-in', async () => {
    signedIn('token-a');
    await getAuthenticatedUserId();
    signedIn('token-b');
    await getAuthenticatedUserId();
    expect(auth.getUser).toHaveBeenCalledTimes(2);
  });

  it('is null and asks the server when nobody is signed in', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });
    expect(await getAuthenticatedUserId()).toBeNull();
    expect(auth.getUser).toHaveBeenCalledTimes(1);
  });

  it('never reuses a failed check', async () => {
    signedIn('token-a');
    auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'offline' } });
    expect(await getAuthenticatedUserId()).toBeNull();
    expect(await getAuthenticatedUserId()).toBe(USER);
    expect(auth.getUser).toHaveBeenCalledTimes(2);
  });

  it('rejects placeholder ids', async () => {
    signedIn('token-a');
    auth.getUser.mockResolvedValue({ data: { user: { id: 'default-athlete' } }, error: null });
    expect(await getAuthenticatedUserId()).toBeNull();
  });

  it('still works when the session cannot be read', async () => {
    auth.getSession.mockRejectedValue(new Error('storage blocked'));
    expect(await getAuthenticatedUserId()).toBe(USER);
  });
});

describe('a stuck auth client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    forgetVerifiedUser();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gives up on a server check that never answers instead of waiting forever', async () => {
    signedIn('token-a');
    auth.getUser.mockReturnValue(new Promise(() => {}));
    const pending = getAuthenticatedUserId();
    await vi.advanceTimersByTimeAsync(8_000);
    expect(await pending).toBeNull();
  });

  it('gives up on a session read that never answers', async () => {
    auth.getSession.mockReturnValue(new Promise(() => {}));
    auth.getUser.mockResolvedValue({ data: { user: { id: USER } }, error: null });
    const pending = getAuthenticatedUserId();
    await vi.advanceTimersByTimeAsync(8_000);
    expect(await pending).toBe(USER);
  });

  it('falls back to the account stored on the device when the session read hangs', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (key === 'o1fc_user_id' ? USER : null),
    });
    auth.getSession.mockReturnValue(new Promise(() => {}));
    const pending = getCachedUserId();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(await pending).toBe(USER);
    vi.unstubAllGlobals();
  });
});

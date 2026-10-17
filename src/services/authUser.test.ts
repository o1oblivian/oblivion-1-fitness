import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getUser: vi.fn(), getSession: vi.fn() }));
vi.mock('./supabaseClient', () => ({ supabase: { auth } }));

import { forgetVerifiedUser, getAuthenticatedUserId } from './authUser';

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

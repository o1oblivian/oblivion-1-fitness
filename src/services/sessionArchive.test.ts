import { beforeEach, describe, expect, it, vi } from 'vitest';

const sync = vi.fn<(payload: unknown) => Promise<boolean>>();
const liveUser = vi.fn<() => Promise<string | null>>();
const cachedUser = vi.fn<() => Promise<string | null>>();

vi.mock('./supabaseClient', () => ({ syncSessionToSupabase: (p: unknown) => sync(p) }));
vi.mock('./authUser', () => ({
  getAuthenticatedUserId: () => liveUser(),
  getCachedUserId: () => cachedUser(),
}));

const { archiveSession, forgetPendingArchives } = await import('./sessionArchive');
const { enqueueSync, flushSync, pendingSyncOps, registerSyncHandler } =
  await import('./syncOutbox');
const { safeStorage } = await import('../utils/safeStorage');

const UID = '11111111-2222-3333-4444-555555555555';
const sessions = () =>
  pendingSyncOps()
    .filter((op) => op.kind === 'session')
    .map((op) => op.payload as Record<string, any>);

beforeEach(() => {
  safeStorage.clear();
  sync.mockReset();
  liveUser.mockReset();
  cachedUser.mockReset();
});

describe('archiveSession offline', () => {
  it('queues with the cached account when the server cannot be reached', async () => {
    liveUser.mockResolvedValue(null);
    cachedUser.mockResolvedValue(UID);
    sync.mockResolvedValue(false);
    expect(await archiveSession({ title: 'Push', exercises: [] })).toBe('queued');
    const [item] = sessions();
    expect(item.user_id).toBe(UID);
    expect(item.completed_at).toBeTruthy();
  });

  it('clears the queue entry once the upload lands', async () => {
    liveUser.mockResolvedValue(UID);
    sync.mockResolvedValue(true);
    expect(await archiveSession({ title: 'Push', exercises: [] })).toBe('saved');
    expect(sessions()).toEqual([]);
  });

  it('reports signed out only when no account is known on the device', async () => {
    liveUser.mockResolvedValue(null);
    cachedUser.mockResolvedValue(null);
    expect(await archiveSession({ title: 'Push' })).toBe('signed-out');
    expect(sync).not.toHaveBeenCalled();
  });

  it('drops a deleted lift or day from the queue', async () => {
    liveUser.mockResolvedValue(UID);
    sync.mockResolvedValue(false);
    const at = new Date(2026, 9, 14, 18).toISOString();
    await archiveSession({
      title: 'Push',
      completed_at: at,
      exercises: [{ name: 'Bench' }, { name: 'Dips' }],
    });
    forgetPendingArchives('2026-10-14', 'workout', 'Bench');
    expect(sessions()[0].exercises).toEqual([{ name: 'Dips' }]);
    forgetPendingArchives('2026-10-14', 'cardio');
    expect(sessions()).toHaveLength(1);
    forgetPendingArchives('2026-10-14', 'workout');
    expect(sessions()).toEqual([]);
  });
});

describe('sync outbox', () => {
  it('keeps only the newest change per key', () => {
    enqueueSync('test', 'day:1', '2026-10-01', { v: 1 });
    enqueueSync('test', 'day:1', '2026-10-01', { v: 2 });
    expect(pendingSyncOps().map((op) => op.payload.v)).toEqual([2]);
  });

  it('holds back later changes for the same day after a failure, but sends other days', async () => {
    liveUser.mockResolvedValue(UID);
    const sent: string[] = [];
    registerSyncHandler('ordered', async (payload) => {
      sent.push(String(payload.name));
      return payload.name !== 'a1';
    });
    enqueueSync('ordered', 'a1', 'day-a', { name: 'a1' });
    enqueueSync('ordered', 'a2', 'day-a', { name: 'a2' });
    enqueueSync('ordered', 'b1', 'day-b', { name: 'b1' });
    await flushSync();
    expect(sent).toEqual(['a1', 'b1']);
    expect(pendingSyncOps().map((op) => op.key)).toEqual(['a1', 'a2']);
    expect(pendingSyncOps()[0].attempts).toBe(1);
  });

  it('automatic retries wait out the backoff; the athlete can always send now', async () => {
    liveUser.mockResolvedValue(UID);
    const handler = vi.fn(async () => false);
    registerSyncHandler('flaky', handler);
    enqueueSync('flaky', 'f1', 'day-f', {});
    await flushSync();
    expect(handler).toHaveBeenCalledTimes(1);
    await flushSync(true);
    expect(handler).toHaveBeenCalledTimes(1);
    await flushSync();
    expect(handler).toHaveBeenCalledTimes(2);
    expect(pendingSyncOps()[0].attempts).toBe(2);
  });

  it('sends nothing without a signed-in account', async () => {
    liveUser.mockResolvedValue(null);
    const handler = vi.fn(async () => true);
    registerSyncHandler('nouser', handler);
    enqueueSync('nouser', 'x', 'day', {});
    await flushSync();
    expect(handler).not.toHaveBeenCalled();
    expect(pendingSyncOps()).toHaveLength(1);
  });
});

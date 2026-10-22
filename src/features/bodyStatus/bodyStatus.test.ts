import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  };
  vi.stubGlobal('window', { localStorage, dispatchEvent: vi.fn() });
  vi.stubGlobal('localStorage', localStorage);
  vi.resetModules();
});

const MARCH_1 = new Date(2026, 2, 1, 9).getTime();
const MARCH_2 = new Date(2026, 2, 2, 9).getTime();
const MARCH_3 = new Date(2026, 2, 3, 9).getTime();

const load = () => import('./bodyStatus');

describe('body status', () => {
  it('starts ready', async () => {
    const { readBodyStatus } = await load();
    expect(readBodyStatus(MARCH_1)).toEqual({ status: 'ready', since: null, area: null });
  });

  it('keeps being sick until the athlete says otherwise, counting days', async () => {
    const { setBodyStatus, readBodyStatus, statusDay } = await load();
    setBodyStatus('sick', null, MARCH_1);
    const later = readBodyStatus(MARCH_3);
    expect(later.status).toBe('sick');
    expect(statusDay(later, MARCH_1)).toBe(1);
    expect(statusDay(later, MARCH_3)).toBe(3);
  });

  it('lets a rest day lapse by the next day', async () => {
    const { setBodyStatus, readBodyStatus } = await load();
    setBodyStatus('rest', null, MARCH_1);
    expect(readBodyStatus(MARCH_1).status).toBe('rest');
    expect(readBodyStatus(MARCH_2).status).toBe('ready');
  });

  it('remembers the injured area only while injured', async () => {
    const { setBodyStatus, readBodyStatus } = await load();
    setBodyStatus('injured', 'Knee', MARCH_1);
    expect(readBodyStatus(MARCH_1).area).toBe('Knee');
    setBodyStatus('sick', 'Knee', MARCH_1);
    expect(readBodyStatus(MARCH_1).area).toBeNull();
  });

  it('keeps the start date when the same status is chosen again', async () => {
    const { setBodyStatus, readBodyStatus } = await load();
    setBodyStatus('injured', null, MARCH_1);
    setBodyStatus('injured', 'Back', MARCH_3);
    expect(readBodyStatus(MARCH_3)).toEqual({
      status: 'injured',
      since: '2026-03-01',
      area: 'Back',
    });
  });

  it('goes back to ready on request', async () => {
    const { setBodyStatus, readBodyStatus } = await load();
    setBodyStatus('sick', null, MARCH_1);
    setBodyStatus('ready', null, MARCH_2);
    expect(readBodyStatus(MARCH_2).status).toBe('ready');
  });

  it('ignores damaged saved data', async () => {
    storage.set('o1fc_body_status_v1', JSON.stringify({ status: 'bogus' }));
    const { readBodyStatus } = await load();
    expect(readBodyStatus(MARCH_1).status).toBe('ready');
  });

  it('announces every change so reminders can be rebuilt', async () => {
    const { setBodyStatus, BODY_STATUS_EVENT } = await load();
    setBodyStatus('sick', null, MARCH_1);
    const dispatch = (window as unknown as { dispatchEvent: ReturnType<typeof vi.fn> })
      .dispatchEvent;
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe(BODY_STATUS_EVENT);
  });
});

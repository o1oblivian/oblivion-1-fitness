import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  };
  vi.stubGlobal('window', { localStorage });
  vi.stubGlobal('localStorage', localStorage);
  vi.resetModules();
});

const MARCH_1 = new Date(2026, 2, 1, 8).getTime();
const MARCH_2 = new Date(2026, 2, 2, 8).getTime();

async function load() {
  return import('./weighInStore');
}

describe('weigh-in log', () => {
  it('starts empty', async () => {
    const { readWeighIns } = await load();
    expect(readWeighIns()).toEqual([]);
  });

  it('saves one entry per day, rounded to a tenth', async () => {
    const { logWeighIn, readWeighIns } = await load();
    logWeighIn(82.46, MARCH_1);
    expect(readWeighIns()).toEqual([{ day: '2026-03-01', kg: 82.5 }]);
  });

  it('replaces the same day, including when the weight has not changed', async () => {
    const { logWeighIn, readWeighIns } = await load();
    logWeighIn(82, MARCH_1);
    logWeighIn(82, MARCH_1 + 3_600_000);
    logWeighIn(81.4, MARCH_1 + 7_200_000);
    expect(readWeighIns()).toEqual([{ day: '2026-03-01', kg: 81.4 }]);
  });

  it('records the same weight again on the next day', async () => {
    const { logWeighIn, readWeighIns } = await load();
    logWeighIn(82, MARCH_1);
    logWeighIn(82, MARCH_2);
    expect(readWeighIns().map((w) => w.day)).toEqual(['2026-03-01', '2026-03-02']);
  });

  it('refuses weights that cannot be real', async () => {
    const { logWeighIn, readWeighIns } = await load();
    logWeighIn(0, MARCH_1);
    logWeighIn(-5, MARCH_1);
    logWeighIn(Number.NaN, MARCH_1);
    logWeighIn(900, MARCH_1);
    expect(readWeighIns()).toEqual([]);
  });

  it('keeps weigh-ins saved before this version and drops damaged ones', async () => {
    storage.set(
      'o1fc_weighins_v1',
      JSON.stringify([
        { day: '2026-02-27', kg: 83 },
        { day: 5, kg: 80 },
        null,
        { day: 'x', kg: 'a' },
      ]),
    );
    const { readWeighIns } = await load();
    expect(readWeighIns()).toEqual([{ day: '2026-02-27', kg: 83 }]);
  });
});

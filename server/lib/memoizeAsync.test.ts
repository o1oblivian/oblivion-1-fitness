import { describe, expect, it, vi } from 'vitest';
import { memoizeAsync } from './memoizeAsync';

describe('memoizeAsync', () => {
  it('shares one read between callers inside the window', async () => {
    let clock = 0;
    const read = vi.fn(async () => 7);
    const get = memoizeAsync(read, 10_000, () => clock);

    expect(await get()).toBe(7);
    clock = 9_999;
    expect(await get()).toBe(7);
    expect(read).toHaveBeenCalledTimes(1);

    clock = 10_000;
    await get();
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('lets callers who arrive during a read share it', async () => {
    let release: (n: number) => void = () => undefined;
    const read = vi.fn(() => new Promise<number>((resolve) => (release = resolve)));
    const get = memoizeAsync(read, 10_000);

    const first = get();
    const second = get();
    release(3);

    expect(await first).toBe(3);
    expect(await second).toBe(3);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('never keeps a null answer, so the next caller asks again', async () => {
    const read = vi.fn<() => Promise<number | null>>().mockResolvedValueOnce(null);
    read.mockResolvedValueOnce(5);
    const get = memoizeAsync(read, 10_000);

    expect(await get()).toBeNull();
    expect(await get()).toBe(5);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('never keeps a thrown error either', async () => {
    const read = vi.fn<() => Promise<number | null>>().mockRejectedValueOnce(new Error('down'));
    read.mockResolvedValueOnce(9);
    const get = memoizeAsync(read, 10_000);

    await expect(get()).rejects.toThrow('down');
    expect(await get()).toBe(9);
  });
});

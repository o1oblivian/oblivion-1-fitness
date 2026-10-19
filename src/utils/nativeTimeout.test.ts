import { afterEach, describe, expect, it, vi } from 'vitest';
import { withNativeTimeout } from './nativeTimeout';

describe('withNativeTimeout', () => {
  afterEach(() => vi.useRealTimers());

  it('rejects with the message when the phone never answers', async () => {
    vi.useFakeTimers();
    const outcome = withNativeTimeout(new Promise<string>(() => {}), 'No answer.', 1000);
    const assertion = expect(outcome).rejects.toThrow('No answer.');
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it('passes the value through when the phone answers in time', async () => {
    await expect(withNativeTimeout(Promise.resolve('ok'), 'No answer.', 1000)).resolves.toBe('ok');
  });

  it('passes the original error through', async () => {
    await expect(
      withNativeTimeout(Promise.reject(new Error('denied')), 'No answer.', 1000),
    ).rejects.toThrow('denied');
  });
});

/**
 * Wraps an async read so that callers within `ttlMs` share one result, and callers who arrive while a
 * read is in flight share that read. Only answers are kept: a throw or a null is never cached, so the
 * next caller asks again instead of being handed a stale failure.
 */
export function memoizeAsync<T>(
  read: () => Promise<T | null>,
  ttlMs: number,
  now: () => number = Date.now,
): () => Promise<T | null> {
  let value: { at: number; data: T } | null = null;
  let inflight: Promise<T | null> | null = null;

  return () => {
    if (value && now() - value.at < ttlMs) return Promise.resolve(value.data);
    if (inflight) return inflight;
    const started = read()
      .then((data) => {
        if (data !== null) value = { at: now(), data };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
    inflight = started;
    return started;
  };
}

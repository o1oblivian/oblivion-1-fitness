import { describe, it, expect, beforeEach } from 'vitest';
import { getLocalDateString, getYesterdayDateString, executeMidnightRollover } from '@/utils/midnightRolloverEngine';
import { hashString, resolveShard, LRUMemoryCache, TokenBucketLimiter } from '@/utils/scaleEngine';

describe('System Scale Engine', () => {
  it('hashes user identifiers consistently', () => {
    const hash1 = hashString('o1oblivianfitness@gmail.com');
    const hash2 = hashString('o1oblivianfitness@gmail.com');
    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('number');
  });

  it('assigns user to valid virtual shard across 4096 shards and 8 regions', () => {
    const shard = resolveShard('o1oblivianfitness@gmail.com');
    expect(shard.shardId).toBeGreaterThanOrEqual(0);
    expect(shard.shardId).toBeLessThan(4096);
    expect(shard.region).toBeDefined();
    expect(shard.clusterEndpoint).toContain(shard.region);
  });

  it('enforces LRU cache capacity limits', () => {
    const cache = new LRUMemoryCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    cache.set('c', 3); // should evict 'b' since 'a' was accessed recently
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('handles token bucket rate limiting', () => {
    const limiter = new TokenBucketLimiter(5, 1);
    expect(limiter.tryAcquire(3)).toBe(true);
    expect(limiter.tryAcquire(3)).toBe(false);
  });
});

describe('Midnight Rollover Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('formats local date strings correctly', () => {
    const today = getLocalDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const yesterday = getYesterdayDateString();
    expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles rollover gracefully when no active logs exist', async () => {
    const res = await executeMidnightRollover('test@o1fc.com', () => []);
    expect(res.success).toBe(true);
    expect(res.archived).toBe(false);
  });
});

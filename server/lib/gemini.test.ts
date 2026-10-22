import type { GoogleGenAI } from '@google/genai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateContentWithFallback, resetModelCooldowns } from './gemini';

type Call = { model: string };
type Behaviour = (call: Call, signal: AbortSignal | undefined) => Promise<{ text: string }>;

/** A stand-in for the Gemini client whose answers the test scripts, one model at a time. */
function fakeAi(behaviour: Behaviour) {
  const calls: string[] = [];
  const ai = {
    models: {
      generateContent: vi.fn((req: { model: string; config?: { abortSignal?: AbortSignal } }) => {
        calls.push(req.model);
        return behaviour({ model: req.model }, req.config?.abortSignal);
      }),
    },
  } as unknown as GoogleGenAI;
  return { ai, calls };
}

/** Never answers, but rejects when the caller cancels, as the real client does. */
const stalls: Behaviour = (_call, signal) =>
  new Promise((_, reject) => {
    signal?.addEventListener('abort', () => reject(new Error('aborted')));
  });

describe('generateContentWithFallback', () => {
  beforeEach(resetModelCooldowns);

  it('returns the first answer', async () => {
    const { ai, calls } = fakeAi(async () => ({ text: '{"ok":true}' }));
    const res = await generateContentWithFallback(ai, 'hi');
    expect(res.text).toBe('{"ok":true}');
    expect(calls).toHaveLength(1);
  });

  it('moves to the next model when one stalls, instead of waiting for it', async () => {
    const { ai, calls } = fakeAi(async (call, signal) =>
      call.model === 'gemini-flash-latest' ? stalls(call, signal) : { text: 'fast' },
    );
    const started = Date.now();
    const res = await generateContentWithFallback(ai, 'hi', undefined, {
      attemptTimeoutMs: 80,
      budgetMs: 5_000,
    });
    expect(res.text).toBe('fast');
    expect(calls).toEqual(['gemini-flash-latest', 'gemini-3.1-flash-lite']);
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('gives up inside its budget when every model stalls', async () => {
    const { ai } = fakeAi(stalls);
    const started = Date.now();
    await expect(
      generateContentWithFallback(ai, 'hi', undefined, { attemptTimeoutMs: 60, budgetMs: 1_500 }),
    ).rejects.toThrow();
    expect(Date.now() - started).toBeLessThan(3_000);
  });

  describe('hedged', () => {
    it('does not start the second model when the first answers in time', async () => {
      const { ai, calls } = fakeAi(async () => ({ text: 'quick' }));
      const res = await generateContentWithFallback(ai, 'hi', undefined, { hedgeAfterMs: 200 });
      expect(res.text).toBe('quick');
      await new Promise((r) => setTimeout(r, 300));
      expect(calls).toEqual(['gemini-flash-latest']);
    });

    it('races the second model against a slow first and takes whichever answers first', async () => {
      const { ai, calls } = fakeAi(async (call, signal) =>
        call.model === 'gemini-flash-latest' ? stalls(call, signal) : { text: 'second won' },
      );
      const started = Date.now();
      const res = await generateContentWithFallback(ai, 'hi', undefined, {
        hedgeAfterMs: 100,
        attemptTimeoutMs: 5_000,
        budgetMs: 8_000,
      });
      expect(res.text).toBe('second won');
      expect(calls).toEqual(['gemini-flash-latest', 'gemini-3.1-flash-lite']);
      expect(Date.now() - started).toBeLessThan(1_500);
    });

    it('moves straight to the second model when the first fails', async () => {
      const { ai, calls } = fakeAi(async (call) => {
        if (call.model === 'gemini-flash-latest') throw new Error('404 model not found');
        return { text: 'fallback' };
      });
      const started = Date.now();
      const res = await generateContentWithFallback(ai, 'hi', undefined, { hedgeAfterMs: 5_000 });
      expect(res.text).toBe('fallback');
      expect(calls).toEqual(['gemini-flash-latest', 'gemini-3.1-flash-lite']);
      expect(Date.now() - started).toBeLessThan(1_500);
    });

    it('fails inside its budget when both models stall', async () => {
      const { ai } = fakeAi(stalls);
      const started = Date.now();
      await expect(
        generateContentWithFallback(ai, 'hi', undefined, {
          hedgeAfterMs: 100,
          attemptTimeoutMs: 5_000,
          budgetMs: 1_200,
        }),
      ).rejects.toThrow();
      expect(Date.now() - started).toBeLessThan(2_500);
    });
  });

  it('retries a busy (503) model once before falling back', async () => {
    let n = 0;
    const { ai, calls } = fakeAi(async () => {
      n += 1;
      if (n === 1) throw new Error('503 UNAVAILABLE high demand');
      return { text: 'second try' };
    });
    const res = await generateContentWithFallback(ai, 'hi', undefined, { budgetMs: 10_000 });
    expect(res.text).toBe('second try');
    expect(calls).toEqual(['gemini-flash-latest', 'gemini-flash-latest']);
  });

  describe('a model whose daily quota is spent', () => {
    const spent = new Error(
      '429 RESOURCE_EXHAUSTED GenerateRequestsPerDayPerProjectPerModel-FreeTier "retryDelay":"68347s"',
    );

    it('is not retried, and the next model answers', async () => {
      const { ai, calls } = fakeAi(async (call) => {
        if (call.model === 'gemini-flash-latest') throw spent;
        return { text: 'next' };
      });
      const res = await generateContentWithFallback(ai, 'hi');
      expect(res.text).toBe('next');
      expect(calls).toEqual(['gemini-flash-latest', 'gemini-3.1-flash-lite']);
    });

    it('is skipped by later requests, so nobody waits on it again', async () => {
      const { ai, calls } = fakeAi(async (call) => {
        if (call.model === 'gemini-flash-latest') throw spent;
        return { text: 'next' };
      });
      await generateContentWithFallback(ai, 'first');
      calls.length = 0;
      await generateContentWithFallback(ai, 'second', undefined, { hedgeAfterMs: 5_000 });
      expect(calls).toEqual(['gemini-3.1-flash-lite']);
    });
  });
});

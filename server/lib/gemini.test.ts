import type { GoogleGenAI } from '@google/genai';
import { describe, expect, it, vi } from 'vitest';
import { generateContentWithFallback } from './gemini';

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
});

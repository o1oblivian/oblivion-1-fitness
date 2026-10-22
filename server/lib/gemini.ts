import {
  GoogleGenAI,
  ThinkingLevel,
  type GenerateContentConfig,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from '@google/genai';
import { errorMessage } from '../../shared/errorMessage';

function readImportMetaGeminiKey(): string {
  try {
    return String(
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || '',
    );
  } catch {
    return '';
  }
}

function getGeminiApiKey(explicitKey?: string): string {
  return (
    explicitKey ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    readImportMetaGeminiKey() ||
    process.env.GEMINI_API_KEY_2 ||
    process.env.VITE_GEMINI_API_KEY_2 ||
    ''
  );
}

let aiClient: GoogleGenAI | null = null;
export function getGenAI(overrideKey?: string): GoogleGenAI | null {
  const activeKey = getGeminiApiKey(overrideKey);
  if (!activeKey) return null;
  if (aiClient && !overrideKey) return aiClient;
  try {
    const client = new GoogleGenAI({
      apiKey: activeKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    if (!overrideKey) aiClient = client;
    return client;
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI client:', e);
    return null;
  }
}

/** Reading digits off a photo does not need long reasoning; a low thinking level answers noticeably faster. */
export const QUICK_READ_THINKING = { thinkingLevel: ThinkingLevel.LOW };

/** How long one Gemini call may take, and how long a whole request may spend across retries. */
export interface GenerateLimits {
  attemptTimeoutMs?: number;
  budgetMs?: number;
}

const DEFAULT_ATTEMPT_TIMEOUT_MS = 25_000;
const DEFAULT_BUDGET_MS = 50_000;

class GeminiTimeoutError extends Error {
  constructor(ms: number) {
    super(`Gemini did not answer within ${Math.round(ms / 1000)}s`);
  }
}

/** Runs one call that gives up, and cancels the request, after `ms`. A stalled call never holds the caller. */
async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new GeminiTimeoutError(ms));
    }, ms);
  });
  try {
    return await Promise.race([run(controller.signal), expired]);
  } finally {
    clearTimeout(timer);
  }
}

// Resilient Gemini generateContent caller with model fallback & exponential retry for 503/429 spikes.
// Every attempt is time-limited, so an overloaded model costs seconds, not minutes.
export async function generateContentWithFallback(
  genAI: GoogleGenAI,
  contents: GenerateContentParameters['contents'],
  config?: GenerateContentConfig,
  limits: GenerateLimits = {},
): Promise<GenerateContentResponse> {
  const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];
  const attemptTimeoutMs = limits.attemptTimeoutMs ?? DEFAULT_ATTEMPT_TIMEOUT_MS;
  const budgetMs = limits.budgetMs ?? DEFAULT_BUDGET_MS;
  const startedAt = Date.now();
  let lastError: unknown = null;
  let activeConfig = config;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = budgetMs - (Date.now() - startedAt);
      if (remaining <= 1_000) {
        throw lastError instanceof Error ? lastError : new GeminiTimeoutError(budgetMs);
      }
      try {
        const response = await withTimeout(Math.min(attemptTimeoutMs, remaining), (signal) =>
          genAI.models.generateContent({
            model,
            contents,
            config: { ...activeConfig, abortSignal: signal },
          }),
        );
        if (response && response.text) {
          return response;
        }
      } catch (err) {
        lastError = err;
        if (err instanceof GeminiTimeoutError) break; // this model is stalled; try the next one
        const errMsg = errorMessage(err, String(err));
        if (activeConfig?.thinkingConfig && /thinking/i.test(errMsg)) {
          // This model does not accept the thinking setting. Ask again without it.
          activeConfig = { ...activeConfig, thinkingConfig: undefined };
          attempt -= 1;
          continue;
        }
        if (
          errMsg.includes('404') ||
          errMsg.includes('not found') ||
          errMsg.includes('no longer available')
        ) {
          break; // Dead model, skip immediately without waiting
        }
        const isTemporary =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('quota');
        if (isTemporary && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        break; // try fallback model
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(errorMessage(lastError, 'All model attempts failed'));
}

/** Parses the JSON object in a model reply. The shape is unchecked, so callers narrow it before use. */
export function parseGeminiJson(responseText: string): unknown {
  return parseJsonText(responseText);
}

/** Like `parseGeminiJson`, for replies that must be an object. Anything else reads as an empty object. */
export function parseGeminiObject(responseText: string): Record<string, unknown> {
  const parsed = parseJsonText(responseText);
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function parseJsonText(responseText: string): unknown {
  const cleaned = String(responseText || '')
    .replace(/```json\n?|```/g, '')
    .trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
}

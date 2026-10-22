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
  /** Start the next model alongside the first once it has been quiet this long. */
  hedgeAfterMs?: number;
}

const DEFAULT_ATTEMPT_TIMEOUT_MS = 25_000;
const DEFAULT_BUDGET_MS = 50_000;

class GeminiTimeoutError extends Error {
  constructor(ms: number) {
    super(`Gemini did not answer within ${Math.round(ms / 1000)}s`);
  }
}

/** Runs one call that gives up, and cancels the request, after `ms`. A stalled call never holds the caller. */
async function withTimeout<T>(
  ms: number,
  run: (signal: AbortSignal) => Promise<T>,
  cancelled?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new GeminiTimeoutError(ms));
    }, ms);
    cancelled?.addEventListener('abort', () => {
      controller.abort();
      reject(new Error('Cancelled: another model answered first'));
    });
  });
  try {
    return await Promise.race([run(controller.signal), expired]);
  } finally {
    clearTimeout(timer);
  }
}

const MODELS = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];

const MAX_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const modelAvailableAt = new Map<string, number>();

/** Forgets which models ran out of quota. Tests use it to start clean. */
export function resetModelCooldowns(): void {
  modelAvailableAt.clear();
}

/** A model whose daily quota is spent refuses every call until it resets, so asking it again only costs time. */
function noteQuotaSpent(model: string, errMsg: string): boolean {
  if (!/PerDay|per day/i.test(errMsg)) return false;
  const seconds = Number(/retryDelay"?:\s*"?(\d+)/.exec(errMsg)?.[1] ?? 0);
  const wait = seconds > 0 ? Math.min(seconds * 1000, MAX_COOLDOWN_MS) : MAX_COOLDOWN_MS;
  modelAvailableAt.set(model, Date.now() + wait);
  return true;
}

/** Models worth asking now: those not known to be out of quota. If every one is, ask them all anyway. */
function modelsToAsk(): string[] {
  const now = Date.now();
  const ready = MODELS.filter((model) => (modelAvailableAt.get(model) ?? 0) <= now);
  return ready.length > 0 ? ready : MODELS;
}

/** One model, up to two tries: a model that refuses the thinking setting is asked again without it, a busy one once more. */
async function askModel(
  genAI: GoogleGenAI,
  model: string,
  contents: GenerateContentParameters['contents'],
  config: GenerateContentConfig | undefined,
  attemptTimeoutMs: number,
  deadline: number,
  cancelled?: AbortSignal,
): Promise<GenerateContentResponse> {
  let lastError: unknown = null;
  let activeConfig = config;

  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 1_000) break;
    try {
      const response = await withTimeout(
        Math.min(attemptTimeoutMs, remaining),
        (signal) =>
          genAI.models.generateContent({
            model,
            contents,
            config: { ...activeConfig, abortSignal: signal },
          }),
        cancelled,
      );
      if (response && response.text) return response;
    } catch (err) {
      lastError = err;
      if (err instanceof GeminiTimeoutError || cancelled?.aborted) break; // stalled or beaten: stop
      const errMsg = errorMessage(err, String(err));
      if (noteQuotaSpent(model, errMsg)) break; // quota spent for the day: do not retry
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
      break;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(errorMessage(lastError, `${model} gave no answer`));
}

/**
 * Starts the first model; if it has not answered after `hedgeAfterMs` (or has failed), starts the next
 * alongside it. The first answer wins and the other request is cancelled. A slow model no longer
 * decides how long the person waits.
 */
function raceModels(
  genAI: GoogleGenAI,
  contents: GenerateContentParameters['contents'],
  config: GenerateContentConfig | undefined,
  { attemptTimeoutMs, budgetMs, hedgeAfterMs }: Required<GenerateLimits>,
): Promise<GenerateContentResponse> {
  const models = modelsToAsk();
  const deadline = Date.now() + budgetMs;
  const cancel = new AbortController();
  return new Promise((resolve, reject) => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let launched = 0;
    let failed = 0;
    let settled = false;
    let lastError: unknown = null;

    const finish = (settle: () => void) => {
      if (settled) return;
      settled = true;
      timers.forEach(clearTimeout);
      cancel.abort();
      settle();
    };

    const launch = () => {
      if (settled || launched >= models.length) return;
      const model = models[launched++];
      askModel(genAI, model, contents, config, attemptTimeoutMs, deadline, cancel.signal).then(
        (response) => finish(() => resolve(response)),
        (err) => {
          lastError = err;
          failed += 1;
          if (failed === models.length) finish(() => reject(lastError));
          else launch();
        },
      );
      if (launched < models.length) timers.push(setTimeout(launch, hedgeAfterMs));
    };

    timers.push(
      setTimeout(
        () => finish(() => reject(lastError ?? new GeminiTimeoutError(budgetMs))),
        budgetMs,
      ),
    );
    launch();
  });
}

// Resilient Gemini generateContent caller with model fallback & retry for 503/429 spikes.
// Every attempt is time-limited, so an overloaded model costs seconds, not minutes.
// With `hedgeAfterMs`, a slow first model is raced by the second instead of waited for.
export async function generateContentWithFallback(
  genAI: GoogleGenAI,
  contents: GenerateContentParameters['contents'],
  config?: GenerateContentConfig,
  limits: GenerateLimits = {},
): Promise<GenerateContentResponse> {
  const attemptTimeoutMs = limits.attemptTimeoutMs ?? DEFAULT_ATTEMPT_TIMEOUT_MS;
  const budgetMs = limits.budgetMs ?? DEFAULT_BUDGET_MS;

  if (limits.hedgeAfterMs !== undefined) {
    return raceModels(genAI, contents, config, {
      attemptTimeoutMs,
      budgetMs,
      hedgeAfterMs: limits.hedgeAfterMs,
    });
  }

  const deadline = Date.now() + budgetMs;
  let lastError: unknown = null;
  for (const model of modelsToAsk()) {
    if (deadline - Date.now() <= 1_000) break;
    try {
      return await askModel(genAI, model, contents, config, attemptTimeoutMs, deadline);
    } catch (err) {
      lastError = err;
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

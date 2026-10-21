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

// Resilient Gemini generateContent caller with model fallback & exponential retry for 503/429 spikes
export async function generateContentWithFallback(
  genAI: GoogleGenAI,
  contents: GenerateContentParameters['contents'],
  config?: GenerateContentConfig,
): Promise<GenerateContentResponse> {
  const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: unknown = null;
  let activeConfig = config;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await genAI.models.generateContent({
          model,
          contents,
          config: activeConfig,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err) {
        lastError = err;
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

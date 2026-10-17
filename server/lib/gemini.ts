import { GoogleGenAI, ThinkingLevel } from '@google/genai';

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
    (process.env as any).GEMINI_API_KEY_2 ||
    (process.env as any).VITE_GEMINI_API_KEY_2 ||
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
  contents: any[],
  config?: any,
): Promise<any> {
  const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;
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
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err);
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

  throw lastError || new Error('All model attempts failed');
}

export function parseGeminiJson(responseText: string): any {
  const cleaned = String(responseText || '')
    .replace(/```json\n?|```/g, '')
    .trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
}

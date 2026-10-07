import { GoogleGenAI } from '@google/genai';

export const GEMINI_FLASH_MODEL = 'gemini-1.5-flash';

function readImportMetaGeminiKey(): string {
  try {
    return String((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || '');
  } catch {
    return '';
  }
}

export function getGeminiApiKey(): string {
  const fromProcess =
    (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY)) || '';
  return fromProcess || readImportMetaGeminiKey() || '';
}

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  if (client) return client;
  try {
    client = new GoogleGenAI({ apiKey });
    return client;
  } catch (err) {
    console.warn('[mealScannerService] Gemini client init failed:', err);
    return null;
  }
}

export function parseGeminiJson<T = Record<string, unknown>>(responseText: string): T {
  const cleaned = String(responseText || '').replace(/```json\n?|```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const data = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
  return data as T;
}

export interface GeminiCardioTelemetry {
  deviceType?: string | null;
  steps?: number | null;
  elapsedMinutes?: number | string | null;
  distanceKm?: number | null;
  caloriesBurned?: number | null;
  avgHeartRateBpm?: number | null;
  speedKmh?: number | null;
  inclinePct?: number | null;
}

export async function analyzeCardioImageWithGemini(
  base64Image: string,
  scanMode: 'console' | 'watch'
): Promise<GeminiCardioTelemetry | null> {
  const genAI = getGeminiClient();
  if (!genAI) return null;

  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';

  const prompt = `You are a precision optical character recognition engine for fitness screens.
Extract only physically legible metrics from this ${scanMode === 'watch' ? 'digital watch / wearable' : 'cardio console'} image.
NEVER estimate or fabricate missing values. If a metric is not visible, return null — never 0 for unread metrics.

Return STRICT JSON:
{
  "deviceType": "WATCH" | "CONSOLE",
  "steps": number | null,
  "elapsedMinutes": number | null,
  "distanceKm": number | null,
  "caloriesBurned": number | null,
  "avgHeartRateBpm": number | null,
  "speedKmh": number | null,
  "inclinePct": number | null
}`;

  const response = await genAI.models.generateContent({
    model: GEMINI_FLASH_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: prompt },
        ],
      },
    ],
  });

  const responseText = response?.text || '';
  if (!responseText.trim()) return null;
  return parseGeminiJson<GeminiCardioTelemetry>(responseText);
}

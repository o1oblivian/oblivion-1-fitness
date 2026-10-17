import { GoogleGenAI } from '@google/genai';

const GEMINI_FLASH_MODEL = 'gemini-1.5-flash';

function readImportMetaGeminiKey(): string {
  try {
    return String(
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || '',
    );
  } catch {
    return '';
  }
}

function getGeminiApiKey(): string {
  const fromProcess =
    (typeof process !== 'undefined' &&
      (process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY)) ||
    '';
  return fromProcess || readImportMetaGeminiKey() || '';
}

let client: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
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

function parseGeminiJson<T = Record<string, unknown>>(responseText: string): T {
  const cleaned = String(responseText || '')
    .replace(/```json\n?|```/g, '')
    .trim();
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
  scanMode: 'console' | 'watch',
): Promise<GeminiCardioTelemetry | null> {
  const genAI = getGeminiClient();
  if (!genAI) return null;

  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';

  const prompt = `You are a precision optical character recognition engine for fitness screens.
Extract only physically legible metrics from this ${scanMode === 'watch' ? 'watch' : 'cardio console'} image.
When the image is a watch, accept any wristwatch: Apple Watch, Garmin, Whoop, Fitbit, Polar, Suunto, Coros, Casio, G-Shock, Ironman, Timex, other sports digitals, and analog or chronograph faces. Brand is not a reason to reject the photo.
Segmented LCDs often read as "6 151" or "6,151". Return that as steps: 6151. A clock such as "4:14" or "P 4:11" is the time of day, not workout duration — return elapsedMinutes null.
An analog face with only hands and no printed digits has no step count: return steps null.
NEVER estimate or fabricate missing values. If a metric is not visible, return null — never 0 for unread metrics. Do not convert distance into steps; only return steps that are printed on the screen.

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
        parts: [{ inlineData: { mimeType, data: cleanBase64 } }, { text: prompt }],
      },
    ],
  });

  const responseText = response?.text || '';
  if (!responseText.trim()) return null;
  return parseGeminiJson<GeminiCardioTelemetry>(responseText);
}

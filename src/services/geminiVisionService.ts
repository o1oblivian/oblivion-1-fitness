/**
 * Oblivion 1 - Gemini Multi-Model Vision Service
 * Precision optical telemetry extraction. Strict null contract for unread values.
 */
import { downscaleBase64IfNeeded } from './imageDownscaleUtils';
import { apiUrl } from './apiBase';
import { readConfidence, readNutrient, resolveCalories } from './mealVisionTypes';

// 1. PERMANENT GEMINI API KEY FALLBACK
export const geminiKey: string =
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta.env as any)?.GEMINI_API_KEY_2) ||
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY_2) ||
  '';

export interface CardioTelemetryResult {
  elapsedDisplay?: string | number | null;
  elapsedMinutes: number | null;
  caloriesBurned: number | null;
  distanceKm: number | null;
  speedKmh: number | null;
  inclinePct: number | null;
  avgHeartRateBpm: number | null;
  steps: number | null;
  watts?: number | null;
  pace?: string | null;
  deviceType?: 'watch' | 'console' | 'wearable' | 'other';
}

export interface MealNutrientsResult {
  mealName: string;
  detectedItems: string[];
  estimatedGrams: number | null;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  confidenceScore: number | null;
  servingDescription?: string;
}

export async function analyzeConsoleTelemetry(base64Image: string): Promise<CardioTelemetryResult> {
  const cleanBase64 = await downscaleBase64IfNeeded(base64Image, 1024, 0.8);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (geminiKey) headers['x-gemini-key'] = geminiKey;
      const response = await fetch(apiUrl('/api/vision/cardio-telemetry'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageBase64: cleanBase64, mimeType: 'image/jpeg' }),
      });
      if (!response.ok) {
        if (attempt === 1) { await new Promise((r) => setTimeout(r, 350)); continue; }
        break;
      }
      const json = await response.json();
      if (json?.success && json?.telemetry) {
        const t = json.telemetry;
        return {
          deviceType: t.deviceType || 'watch',
          elapsedDisplay: t.elapsedDisplay ?? null,
          elapsedMinutes: t.elapsedMinutes != null ? Number(t.elapsedMinutes) : null,
          distanceKm: t.distanceKm != null ? Number(t.distanceKm) : null,
          caloriesBurned: t.caloriesBurned != null ? Number(t.caloriesBurned) : null,
          speedKmh: t.speedKmh != null ? Number(t.speedKmh) : null,
          inclinePct: t.inclinePct != null ? Number(t.inclinePct) : null,
          avgHeartRateBpm: t.avgHeartRateBpm != null ? Number(t.avgHeartRateBpm) : null,
          steps: t.steps != null ? Number(t.steps) : null,
          watts: t.watts != null ? Number(t.watts) : null,
          pace: t.pace ?? null,
        };
      }
    } catch {
      if (attempt === 1) { await new Promise((r) => setTimeout(r, 350)); continue; }
      break;
    }
  }

  // Strict null baseline: Zero fake numbers and zero fallback estimates
  return {
    deviceType: 'watch',
    elapsedDisplay: null,
    elapsedMinutes: null,
    distanceKm: null,
    caloriesBurned: null,
    speedKmh: null,
    inclinePct: null,
    avgHeartRateBpm: null,
    steps: null,
    watts: null,
    pace: null,
  };
}

export async function analyzeMealNutrients(
  base64Image: string,
  scanMode: 'plate' | 'package' | 'barcode' = 'plate'
): Promise<MealNutrientsResult> {
  const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (geminiKey) headers['x-gemini-key'] = geminiKey;
      const response = await fetch(apiUrl('/api/vision/meal-nutrients'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: cleanBase64,
          mimeType: 'image/jpeg',
          scanMode,
        }),
      });

      if (response.ok) {
        const json = await response.json().catch(() => null);
        if (json?.success && json?.nutrients) {
          const n = json.nutrients;
          const prot = readNutrient(n.proteinGrams);
          const carbs = readNutrient(n.carbsGrams);
          const fats = readNutrient(n.fatGrams);
          const cals = resolveCalories(readNutrient(n.calories), prot, carbs, fats);

          return {
            mealName: n.mealName || (scanMode === 'package' ? 'Packaged Nutrition Item' : 'Analyzed Athletic Plate'),
            detectedItems: Array.isArray(n.detectedItems) ? n.detectedItems : [],
            estimatedGrams: readNutrient(n.estimatedGrams),
            calories: cals,
            proteinGrams: prot,
            carbsGrams: carbs,
            fatGrams: fats,
            confidenceScore: readConfidence(n.confidenceScore),
            servingDescription: n.servingDescription || (n.estimatedGrams ? `${n.estimatedGrams}g portion` : '1 standard portion'),
          };
        }
      } else {
        const errJson = await response.json().catch(() => null);
        if (errJson?.error && attempt === 2) {
          throw new Error(errJson.error);
        }
      }
    } catch (err: any) {
      console.error('[MealScanner Failure]', err);
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      throw err?.message ? err : new Error('Unable to resolve meal macronutrients with Gemini Vision.');
    }
  }

  throw new Error('Could not analyze meal photo with Gemini Vision. Please retake photo with clear view of the food.');
}

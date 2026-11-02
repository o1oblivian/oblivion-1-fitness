import {
  gramsInLabel,
  readConfidence,
  readGrams,
  readNutrient,
  readText,
  resolveCalories,
  ScannedMealBreakdown,
  ScanMode,
} from './mealVisionTypes';
import { tryDetectNativeBarcode, lookupBarcodeNumber } from './barcodeLookupService';
import { compressAndAnalyzeImage } from './imageCompressionService';
import { apiFetch } from './apiBase';
import { ScanError, serverFailure } from './scanErrors';

export * from './mealVisionTypes';
export { lookupBarcodeNumber } from './barcodeLookupService';

const MEAL_READ_TIMEOUT_MS = 75_000;
const MAX_ATTEMPTS = 2;

export async function analyzePackageNutritionPhoto(imageBlob: Blob): Promise<ScannedMealBreakdown> {
  return analyzeMealImageWithGemini(imageBlob, 'package');
}

/**
 * Multimodal nutrition scanner.
 * 1. Client-side compression (1024px max, 0.8 JPEG).
 * 2. Server-side Gemini Vision reading, retried once after a dropped connection or a 5xx.
 * 3. Fields the model did not report come back as `null`; failures throw a `ScanError`.
 */
export async function analyzeMealImageWithGemini(
  imageBlob: Blob,
  scanMode: ScanMode = 'plate',
): Promise<ScannedMealBreakdown> {
  if (scanMode === 'barcode') {
    const detectedCode = await tryDetectNativeBarcode(imageBlob);
    if (detectedCode) {
      return await lookupBarcodeNumber(detectedCode);
    }
  }

  const { compressedBase64, mimeType } = await compressAndAnalyzeImage(imageBlob, 1024, 0.8);
  if (!compressedBase64) {
    throw new ScanError('unreadable', 'This photo could not be opened. Take another one.');
  }

  let lastError: ScanError | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (lastError) await new Promise((r) => setTimeout(r, 600));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MEAL_READ_TIMEOUT_MS);

    let proxyRes: Response;
    try {
      proxyRes = await apiFetch('/api/vision/meal-nutrients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          imageBase64: `data:${mimeType};base64,${compressedBase64}`,
          mimeType,
          scanMode,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === 'AbortError';
      lastError = new ScanError(
        'network',
        timedOut
          ? 'The meal reader did not answer in time.'
          : 'The meal reader could not be reached. Check your connection.',
        { cause: err },
      );
      // A timeout already used the whole wait; only a dropped connection is worth another try.
      if (timedOut) throw lastError;
      continue;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!proxyRes.ok) {
      lastError = await serverFailure(proxyRes, 'Meal reading');
      if (proxyRes.status >= 500) continue;
      throw lastError;
    }

    const data = await proxyRes.json().catch((err: unknown) => {
      throw new ScanError('server', 'The meal reader sent an unreadable reply.', {
        status: proxyRes.status,
        cause: err,
      });
    });
    if (!data?.success || !data?.nutrients) {
      throw new ScanError('server', 'The meal reader sent a reply without nutrients.', {
        status: proxyRes.status,
      });
    }

    const n = data.nutrients;
    const prot = readNutrient(n.proteinGrams);
    const carbs = readNutrient(n.carbsGrams);
    const fats = readNutrient(n.fatGrams);
    const servingDescription = readText(n.servingDescription);
    return {
      dishName: readText(n.mealName),
      servingDescription,
      servingGrams: readGrams(n.estimatedGrams) ?? gramsInLabel(servingDescription),
      calories: resolveCalories(readNutrient(n.calories), prot, carbs, fats),
      proteinGrams: prot,
      carbsGrams: carbs,
      fatsGrams: fats,
      confidenceScore: readConfidence(n.confidenceScore),
      ingredientsDetected: Array.isArray(n.detectedItems) ? n.detectedItems : [],
    };
  }

  throw lastError ?? new ScanError('server', 'The meal reader did not answer.');
}

import { readConfidence, readNutrient, resolveCalories, ScannedMealBreakdown, ScanMode } from './mealVisionTypes';
import { tryDetectNativeBarcode, lookupBarcodeNumber } from './barcodeLookupService';
import { compressAndAnalyzeImage } from './imageCompressionService';
import { apiUrl } from './apiBase';

export * from './mealVisionTypes';
export { lookupBarcodeNumber } from './barcodeLookupService';
export { analyzeMealNutrients } from './geminiVisionService';

export async function analyzePackageNutritionPhoto(imageBlob: Blob): Promise<ScannedMealBreakdown> {
  return analyzeMealImageWithGemini(imageBlob, 'package');
}

/**
 * Ultra-fast & resilient multimodal nutrition scanner.
 * 1. Rapid client-side compression (<50ms, 1024px max, 0.8 JPEG).
 * 2. Instant server-side Gemini Vision inference.
 * 3. Protected Content-Type parsing with auto-retry on network blips.
 * 4. Nutrients the model did not report come back as `null`; no estimated fallbacks.
 */
export async function analyzeMealImageWithGemini(
  imageBlob: Blob,
  scanMode: ScanMode = 'plate'
): Promise<ScannedMealBreakdown> {
  if (scanMode === 'barcode') {
    const detectedCode = await tryDetectNativeBarcode(imageBlob);
    if (detectedCode) {
      return await lookupBarcodeNumber(detectedCode);
    }
  }

  // 1. Client-side downscaling (max dimension 1024px, JPEG 0.8)
  const { compressedBase64, mimeType } = await compressAndAnalyzeImage(imageBlob, 1024, 0.8);

  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const proxyRes = await fetch(apiUrl('/api/vision/meal-nutrients'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          imageBase64: `data:${mimeType};base64,${compressedBase64}`,
          mimeType,
          scanMode,
          generationConfig: { temperature: 0.0 },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = proxyRes.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Gateway returned HTML (e.g. 502/504 or server reboot)
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        break;
      }

      const data = await proxyRes.json().catch(() => null);
      if (proxyRes.ok && data?.success && data?.nutrients) {
        const n = data.nutrients;
        const prot = readNutrient(n.proteinGrams);
        const carbs = readNutrient(n.carbsGrams);
        const fats = readNutrient(n.fatGrams);
        const cals = resolveCalories(readNutrient(n.calories), prot, carbs, fats);

        return {
          dishName: n.mealName || (scanMode === 'package' ? 'Packaged Nutrition Item' : 'Analyzed Athletic Plate'),
          servingDescription: n.servingDescription || (n.estimatedGrams ? `${n.estimatedGrams}g portion` : '1 standard portion'),
          calories: cals,
          proteinGrams: prot,
          carbsGrams: carbs,
          fatsGrams: fats,
          confidenceScore: readConfidence(n.confidenceScore),
          ingredientsDetected: Array.isArray(n.detectedItems) ? n.detectedItems : [],
        };
      } else if (!proxyRes.ok && data?.error && attempt === maxAttempts) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      if (err?.message && !err.message.includes('Sensor Standby')) {
        throw err;
      }
    }
  }

  throw new Error('Could not analyze meal photo with Gemini Vision. Please retake photo with clear view of the food.');
}

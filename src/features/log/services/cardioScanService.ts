import { ExtractedCardioData } from '../components/scan/CardioScanMetricFields';
import { parseTelemetryFromOcrText } from '../../../services/ocrTelemetryParser';
import { analyzeCardioImageWithGemini } from '../../../services/mealScannerService';
import Tesseract from 'tesseract.js';
import { apiUrl } from '../../../services/apiBase';

function readMetric(value: unknown, decimals = 0): number | null {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function toExtracted(
  scanMode: 'console' | 'watch',
  fields: {
    activityType?: string;
    distanceKm?: unknown;
    durationMinutes?: unknown;
    burnedKcal?: unknown;
    avgHeartRateBpm?: unknown;
    steps?: unknown;
    rawReadings?: string;
    aliveAiNote?: string;
  }
): ExtractedCardioData {
  const distanceKm = readMetric(fields.distanceKm, 2);
  const durationMinutes = readMetric(fields.durationMinutes);
  const burnedKcal = readMetric(fields.burnedKcal);
  const avgHeartRateBpm = readMetric(fields.avgHeartRateBpm);
  const steps = readMetric(fields.steps);
  return {
    activityType: fields.activityType || (scanMode === 'watch' ? 'Smartwatch Pedometer' : 'Cardio Console'),
    distanceKm,
    durationMinutes,
    burnedKcal,
    avgHeartRateBpm,
    steps,
    fieldsRead: [distanceKm, durationMinutes, burnedKcal, avgHeartRateBpm, steps].filter((v) => v != null).length,
    rawReadings: fields.rawReadings,
    aliveAiNote: fields.aliveAiNote,
  };
}

function isEmptyTelemetry(data: ExtractedCardioData | null): boolean {
  return !data || data.fieldsRead === 0;
}

async function geminiWatchFallback(
  base64Image: string,
  scanMode: 'console' | 'watch'
): Promise<ExtractedCardioData | null> {
  try {
    const parsed = await analyzeCardioImageWithGemini(base64Image, scanMode);
    if (!parsed) return null;
    const data = toExtracted(scanMode, {
      activityType:
        parsed.deviceType === 'WATCH' || scanMode === 'watch' ? 'Smartwatch Pedometer' : 'Cardio Console',
      distanceKm: parsed.distanceKm,
      durationMinutes: parsed.elapsedMinutes,
      burnedKcal: parsed.caloriesBurned,
      avgHeartRateBpm: parsed.avgHeartRateBpm,
      steps: parsed.steps,
    });
    if (isEmptyTelemetry(data)) return null;
    data.rawReadings = [
      data.steps != null ? `${data.steps.toLocaleString()} steps` : null,
      data.burnedKcal != null ? `${data.burnedKcal} kcal` : null,
      data.distanceKm != null ? `${data.distanceKm} km` : null,
    ]
      .filter(Boolean)
      .join(' • ');
    data.aliveAiNote = 'Read by Gemini Vision. Check the numbers before saving.';
    return data;
  } catch (err) {
    console.warn('[Optical Vision] Gemini watch OCR fallback failed:', err);
    return null;
  }
}

export async function processCardioScanImage(
  base64Image: string,
  scanMode: 'console' | 'watch'
): Promise<ExtractedCardioData> {
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  const dataUrl = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${cleanBase64}`;

  let extracted: ExtractedCardioData | null = null;

  try {
    const res = await fetch(apiUrl('/api/vision/cardio-telemetry'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: cleanBase64, mimeType: 'image/jpeg' }),
    });

    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json?.success && json?.telemetry) {
        const t = json.telemetry;
        extracted = toExtracted(scanMode, {
          distanceKm: t.distanceKm,
          durationMinutes: t.elapsedMinutes,
          burnedKcal: t.caloriesBurned,
          avgHeartRateBpm: t.avgHeartRateBpm,
          steps: t.steps,
          rawReadings: json.calibrationNote,
          aliveAiNote: json.calibrationNote,
        });
      }
    }
  } catch {
    // Expected in native mobile Capacitor runtime where /api is not hosted locally
  }

  if (isEmptyTelemetry(extracted)) {
    try {
      const ocrResult = await Tesseract.recognize(dataUrl, 'eng');
      const rawText = ocrResult?.data?.text || '';
      if (rawText.trim().length > 0) {
        const parsed = parseTelemetryFromOcrText(rawText);
        extracted = toExtracted(scanMode, {
          activityType:
            parsed.deviceType === 'watch' || scanMode === 'watch' ? 'Smartwatch Pedometer' : 'Cardio Console',
          distanceKm: parsed.distanceKm,
          durationMinutes: parsed.elapsedMinutes,
          burnedKcal: parsed.caloriesBurned,
          avgHeartRateBpm: parsed.avgHeartRateBpm,
          steps: parsed.steps,
          rawReadings: rawText.slice(0, 120),
          aliveAiNote: 'Read on device. Check the numbers before saving.',
        });
      }
    } catch (ocrErr) {
      console.warn('[Optical Vision] On-device OCR pass exception:', ocrErr);
    }
  }

  if (isEmptyTelemetry(extracted)) {
    const geminiResult = await geminiWatchFallback(dataUrl, scanMode);
    if (geminiResult) extracted = geminiResult;
  }

  if (extracted && !isEmptyTelemetry(extracted)) return extracted;

  return toExtracted(scanMode, {
    rawReadings: 'No digital numbers detected. Enter values manually or retake photo.',
    aliveAiNote: 'Nothing could be read from the screen.',
  });
}

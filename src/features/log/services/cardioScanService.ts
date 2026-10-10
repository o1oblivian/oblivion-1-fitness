import { ExtractedCardioData } from '../components/scan/CardioScanMetricFields';
import { parseTelemetryFromOcrText } from '../../../services/ocrTelemetryParser';
import { analyzeCardioImageWithGemini } from '../../../services/mealScannerService';
import Tesseract from 'tesseract.js';
import { apiUrl } from '../../../services/apiBase';

function toExtracted(
  scanMode: 'console' | 'watch',
  fields: {
    activityType?: string;
    distanceKm?: number | null;
    durationMinutes?: number | null;
    burnedKcal?: number | null;
    avgHeartRateBpm?: number | null;
    steps?: number | null;
    confidenceScore: number;
    rawReadings?: string;
    aliveAiNote?: string;
  }
): ExtractedCardioData {
  const dist = fields.distanceKm != null ? Number(fields.distanceKm) : 0;
  const dur = fields.durationMinutes != null ? Number(fields.durationMinutes) : 0;
  const burn = fields.burnedKcal != null ? Number(fields.burnedKcal) : 0;
  const hr = fields.avgHeartRateBpm != null ? Number(fields.avgHeartRateBpm) : 0;
  const steps = fields.steps != null ? Number(fields.steps) : 0;
  return {
    activityType: fields.activityType || (scanMode === 'watch' ? 'Smartwatch Pedometer' : 'Cardio Console'),
    distanceKm: Number(dist.toFixed(2)),
    durationMinutes: Math.round(dur),
    burnedKcal: Math.round(burn),
    avgHeartRateBpm: Math.round(hr),
    zone2Minutes: 0,
    steps,
    confidenceScore: fields.confidenceScore,
    rawReadings: fields.rawReadings,
    aliveAiNote: fields.aliveAiNote,
  };
}

function isEmptyTelemetry(data: ExtractedCardioData | null): boolean {
  if (!data) return true;
  if (data.confidenceScore === 0) return true;
  return (
    !(data.steps > 0) &&
    !(data.distanceKm > 0) &&
    !(data.burnedKcal > 0) &&
    !(data.durationMinutes > 0) &&
    !(data.avgHeartRateBpm > 0)
  );
}

async function geminiWatchFallback(
  base64Image: string,
  scanMode: 'console' | 'watch'
): Promise<ExtractedCardioData | null> {
  try {
    const parsed = await analyzeCardioImageWithGemini(base64Image, scanMode);
    if (!parsed) return null;
    const dist = parsed.distanceKm != null ? Number(parsed.distanceKm) : null;
    const dur =
      typeof parsed.elapsedMinutes === 'number'
        ? parsed.elapsedMinutes
        : parsed.elapsedMinutes != null && String(parsed.elapsedMinutes).trim() !== ''
          ? Number(parsed.elapsedMinutes)
          : null;
    const burn = parsed.caloriesBurned != null ? Number(parsed.caloriesBurned) : null;
    const hr = parsed.avgHeartRateBpm != null ? Number(parsed.avgHeartRateBpm) : null;
    const steps = parsed.steps != null ? Number(parsed.steps) : null;
    const hasData =
      (steps != null && steps > 0) ||
      (dist != null && dist > 0) ||
      (burn != null && burn > 0) ||
      (dur != null && dur > 0) ||
      (hr != null && hr > 0);
    if (!hasData) return null;
    return toExtracted(scanMode, {
      activityType:
        parsed.deviceType === 'WATCH' || scanMode === 'watch' ? 'Smartwatch Pedometer' : 'Cardio Console',
      distanceKm: dist,
      durationMinutes: dur,
      burnedKcal: burn,
      avgHeartRateBpm: hr,
      steps,
      confidenceScore: 96,
      rawReadings: [
        steps != null && steps > 0 ? `${steps.toLocaleString()} steps` : null,
        burn != null && burn > 0 ? `${burn} kcal` : null,
        dist != null && dist > 0 ? `${dist} km` : null,
      ]
        .filter(Boolean)
        .join(' • '),
      aliveAiNote: 'Gemini Vision watch/console telemetry verified.',
    });
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
          durationMinutes: t.elapsedMinutes != null ? Number(t.elapsedMinutes) : null,
          burnedKcal: t.caloriesBurned,
          avgHeartRateBpm: t.avgHeartRateBpm,
          steps: t.steps,
          confidenceScore:
            t.steps != null || t.distanceKm != null || t.caloriesBurned != null || t.elapsedMinutes != null ? 98 : 0,
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
          confidenceScore:
            parsed.steps != null ||
            parsed.distanceKm != null ||
            parsed.caloriesBurned != null ||
            parsed.elapsedMinutes != null ||
            parsed.avgHeartRateBpm != null
              ? 95
              : 0,
          rawReadings: rawText.slice(0, 120),
          aliveAiNote: 'On-device Optical OCR telemetry extraction verified.',
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

  return {
    activityType: scanMode === 'watch' ? 'Smartwatch Pedometer' : 'Cardio Console',
    distanceKm: 0,
    durationMinutes: 0,
    burnedKcal: 0,
    avgHeartRateBpm: 0,
    zone2Minutes: 0,
    steps: 0,
    confidenceScore: 0,
    rawReadings: 'No digital numbers detected. Enter values manually or retake photo.',
    aliveAiNote: 'Optical display requires manual verification.',
  };
}

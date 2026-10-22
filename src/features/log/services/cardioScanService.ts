import { parseTelemetryFromOcrText } from '../../../services/ocrTelemetryParser';
import { apiFetch } from '../../../services/apiBase';
import { compressAndAnalyzeImage } from '../../../services/imageCompressionService';
import { SCAN_WAIT_MS } from '../../../services/geminiVisionService';

/** Unread metrics stay null and render as '--'. */
interface ExtractedCardioData {
  activityType: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  burnedKcal: number | null;
  avgHeartRateBpm: number | null;
  steps: number | null;
  fieldsRead: number;
  rawReadings?: string;
  aliveAiNote?: string;
}

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
  },
): ExtractedCardioData {
  const distanceKm = readMetric(fields.distanceKm, 2);
  const durationMinutes = readMetric(fields.durationMinutes);
  const burnedKcal = readMetric(fields.burnedKcal);
  const avgHeartRateBpm = readMetric(fields.avgHeartRateBpm);
  const steps = readMetric(fields.steps);
  return {
    activityType:
      fields.activityType || (scanMode === 'watch' ? 'Smartwatch Pedometer' : 'Cardio Console'),
    distanceKm,
    durationMinutes,
    burnedKcal,
    avgHeartRateBpm,
    steps,
    fieldsRead: [distanceKm, durationMinutes, burnedKcal, avgHeartRateBpm, steps].filter(
      (v) => v != null,
    ).length,
    rawReadings: fields.rawReadings,
    aliveAiNote: fields.aliveAiNote,
  };
}

function isEmptyTelemetry(data: ExtractedCardioData | null): boolean {
  return !data || data.fieldsRead === 0;
}

function withinMs<T>(work: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([work, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

export async function processCardioScanImage(
  base64Image: string,
  scanMode: 'console' | 'watch',
  options: { skipServer?: boolean } = {},
): Promise<ExtractedCardioData> {
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  const dataUrl = base64Image.startsWith('data:')
    ? base64Image
    : `data:image/jpeg;base64,${cleanBase64}`;

  let extracted: ExtractedCardioData | null = null;

  if (!options.skipServer)
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const { compressedBase64 } = await compressAndAnalyzeImage(blob, 1600, 0.85);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SCAN_WAIT_MS);
      const res = await apiFetch('/api/vision/cardio-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressedBase64 || cleanBase64,
          mimeType: 'image/jpeg',
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

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
      const { default: Tesseract } = await import('tesseract.js');
      const ocrResult = await withinMs(Tesseract.recognize(dataUrl, 'eng'), 15_000);
      const rawText = ocrResult?.data?.text || '';
      if (rawText.trim().length > 0) {
        const parsed = parseTelemetryFromOcrText(rawText);
        extracted = toExtracted(scanMode, {
          activityType: parsed.deviceType === 'watch' ? 'Smartwatch Pedometer' : 'Cardio Console',
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

  if (extracted && !isEmptyTelemetry(extracted)) return extracted;

  return toExtracted(scanMode, {
    rawReadings: 'No digital numbers detected. Enter values manually or retake photo.',
    aliveAiNote: 'Nothing could be read from the screen.',
  });
}

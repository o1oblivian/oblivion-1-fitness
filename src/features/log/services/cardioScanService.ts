import { parseTelemetryFromOcrText } from '../../../services/ocrTelemetryParser';
import { ScanError } from '../../../services/scanErrors';

/** Unread metrics stay null and render as '--'. */
export interface ExtractedCardioData {
  deviceType: 'watch' | 'console';
  distanceKm: number | null;
  durationMinutes: number | null;
  burnedKcal: number | null;
  avgHeartRateBpm: number | null;
  steps: number | null;
  fieldsRead: number;
  rawReadings: string;
}

const ON_DEVICE_OCR_MS = 15_000;

function readMetric(value: unknown, decimals = 0): number | null {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/**
 * Reads a watch or console photo on this phone with Tesseract.
 * Throws a `ScanError`: `unreadable` when no metric could be read, `unsupported` when the reader failed.
 */
export async function processCardioScanImage(base64Image: string): Promise<ExtractedCardioData> {
  const dataUrl = base64Image.startsWith('data:')
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let text: string;
  try {
    const { default: Tesseract } = await import('tesseract.js');
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(new ScanError('unreadable', 'The on-device reader took too long on this photo.')),
        ON_DEVICE_OCR_MS,
      );
    });
    const result = await Promise.race([Tesseract.recognize(dataUrl, 'eng'), timeout]);
    text = result.data.text ?? '';
  } catch (err) {
    if (err instanceof ScanError) throw err;
    const reason = err instanceof Error ? err.message : String(err);
    throw new ScanError('unsupported', `The on-device reader failed. ${reason}`, { cause: err });
  } finally {
    clearTimeout(timer);
  }

  const parsed = parseTelemetryFromOcrText(text);
  const distanceKm = readMetric(parsed.distanceKm, 2);
  const durationMinutes = readMetric(parsed.elapsedMinutes);
  const burnedKcal = readMetric(parsed.caloriesBurned);
  const avgHeartRateBpm = readMetric(parsed.avgHeartRateBpm);
  const steps = readMetric(parsed.steps);
  const fieldsRead = [distanceKm, durationMinutes, burnedKcal, avgHeartRateBpm, steps].filter(
    (v) => v != null,
  ).length;
  if (fieldsRead === 0) {
    throw new ScanError(
      'unreadable',
      'No numbers could be read from this photo. Retake it with the screen filling the frame.',
    );
  }
  return {
    deviceType: parsed.deviceType,
    distanceKm,
    durationMinutes,
    burnedKcal,
    avgHeartRateBpm,
    steps,
    fieldsRead,
    rawReadings: text.trim().slice(0, 120),
  };
}

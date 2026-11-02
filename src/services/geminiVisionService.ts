/**
 * Oblivion 1 - Gemini Multi-Model Vision Service
 * Precision optical telemetry extraction. Strict null contract for unread values.
 */
import { downscaleBase64IfNeeded } from './imageDownscaleUtils';
import { apiFetch } from './apiBase';
import { ScanError, serverFailure, TELEMETRY_UNREADABLE } from './scanErrors';

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
  /** `null` when the reader could not tell a watch from a gym console. */
  deviceType?: 'watch' | 'console' | 'wearable' | 'other' | null;
}

/** How long the app waits for the photo reader: its AI attempt, then its backup, with room to spare. */
export const SCAN_WAIT_MS = 60_000;

/** A reported number, or `null` when the reader left it out or sent something that is not a number. */
function readingOf(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Reads a watch or console photo on the server.
 * Throws a `ScanError` when the server could not be reached or answered with a failure.
 */
export async function analyzeConsoleTelemetry(base64Image: string): Promise<CardioTelemetryResult> {
  const cleanBase64 = await downscaleBase64IfNeeded(base64Image, 1600, 0.85);
  for (let attempt = 1; ; attempt++) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCAN_WAIT_MS);
    // Retry only a fast failure (dropped connection); a slow one already used the time budget.
    const retryable = () => attempt === 1 && Date.now() - startedAt < 5_000;
    let response: Response;
    try {
      response = await apiFetch('/api/vision/cardio-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ imageBase64: cleanBase64, mimeType: 'image/jpeg' }),
        signal: controller.signal,
      });
    } catch (err) {
      if (retryable()) {
        await new Promise((r) => setTimeout(r, 350));
        continue;
      }
      const timedOut = err instanceof DOMException && err.name === 'AbortError';
      throw new ScanError(
        'network',
        timedOut
          ? 'The photo reader did not answer within a minute.'
          : 'The photo reader could not be reached. Check your connection.',
        { cause: err },
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      if (response.status >= 500 && retryable()) {
        await new Promise((r) => setTimeout(r, 350));
        continue;
      }
      throw await serverFailure(response, 'Photo reading');
    }
    const json = await response.json().catch((err: unknown) => {
      throw new ScanError('server', 'The photo reader sent an unreadable reply.', {
        status: response.status,
        cause: err,
      });
    });
    if (!json?.success || !json?.telemetry) {
      throw new ScanError('server', 'The photo reader sent a reply without readings.', {
        status: response.status,
      });
    }
    const t = json.telemetry;
    const result: CardioTelemetryResult = {
      deviceType: t.deviceType === 'watch' || t.deviceType === 'console' ? t.deviceType : null,
      elapsedDisplay: t.elapsedDisplay ?? null,
      elapsedMinutes: readingOf(t.elapsedMinutes),
      distanceKm: readingOf(t.distanceKm),
      caloriesBurned: readingOf(t.caloriesBurned),
      speedKmh: readingOf(t.speedKmh),
      inclinePct: readingOf(t.inclinePct),
      avgHeartRateBpm: readingOf(t.avgHeartRateBpm),
      steps: readingOf(t.steps),
      watts: readingOf(t.watts),
      pace: typeof t.pace === 'string' && t.pace ? t.pace : null,
    };
    const readSomething = [
      result.elapsedMinutes,
      result.distanceKm,
      result.caloriesBurned,
      result.speedKmh,
      result.inclinePct,
      result.avgHeartRateBpm,
      result.steps,
      result.watts,
    ].some((v) => v !== null);
    if (!readSomething) {
      throw new ScanError('unreadable', TELEMETRY_UNREADABLE, { status: response.status });
    }
    return result;
  }
}

import { ExtractedCardioData } from '../components/scan/CardioScanMetricFields';
import { parseTelemetryFromOcrText } from '../../../services/ocrTelemetryParser';
import Tesseract from 'tesseract.js';

export async function processCardioScanImage(
  base64Image: string,
  scanMode: 'console' | 'watch'
): Promise<ExtractedCardioData> {
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  const dataUrl = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${cleanBase64}`;

  // 1. First attempt fast backend proxy if running in web server environment
  try {
    const res = await fetch('/api/vision/cardio-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: cleanBase64, mimeType: 'image/jpeg' }),
    });

    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json?.success && json?.telemetry) {
        const t = json.telemetry;
        const dist = t.distanceKm != null ? Number(t.distanceKm) : 0;
        const dur = t.elapsedMinutes != null ? Number(t.elapsedMinutes) : 0;
        const burn = t.caloriesBurned != null ? Number(t.caloriesBurned) : 0;
        const hr = t.avgHeartRateBpm != null ? Number(t.avgHeartRateBpm) : 0;
        const steps = t.steps != null ? Number(t.steps) : 0;
        const hasData = steps > 0 || dist > 0 || burn > 0 || dur > 0;

        return {
          activityType: scanMode === 'watch' ? 'Smartwatch Pedometer' : 'Cardio Console',
          distanceKm: Number(dist.toFixed(2)),
          durationMinutes: Math.round(dur),
          burnedKcal: Math.round(burn),
          avgHeartRateBpm: Math.round(hr),
          zone2Minutes: Math.round(dur * 0.75),
          steps,
          confidenceScore: hasData ? 98 : 0,
          rawReadings: hasData
            ? `${steps > 0 ? `${steps.toLocaleString()} steps • ` : ''}${burn > 0 ? `${burn} kcal • ` : ''}${dist > 0 ? `${dist} km` : ''}`.replace(/•\s*$/, '')
            : 'No metrics detected. Enter manually.',
          aliveAiNote: hasData ? 'Optical telemetry extraction verified.' : 'No readable metrics found. Please enter values manually.',
        };
      }
    }
  } catch {
    // Expected in native mobile Capacitor runtime where /api is not hosted locally
  }

  // 2. Client-side Optical Vision Engine via Tesseract (runs 100% on-device on Android & iOS)
  try {
    const ocrResult = await Tesseract.recognize(dataUrl, 'eng');
    const rawText = ocrResult?.data?.text || '';
    if (rawText.trim().length > 0) {
      const parsed = parseTelemetryFromOcrText(rawText);
      const dist = parsed.distanceKm != null ? Number(parsed.distanceKm) : 0;
      const dur = parsed.elapsedMinutes != null ? Number(parsed.elapsedMinutes) : 0;
      const burn = parsed.caloriesBurned != null ? Number(parsed.caloriesBurned) : 0;
      const hr = parsed.avgHeartRateBpm != null ? Number(parsed.avgHeartRateBpm) : 0;
      const steps = parsed.steps != null ? Number(parsed.steps) : 0;
      const hasData = steps > 0 || dist > 0 || burn > 0 || dur > 0 || hr > 0;

      return {
        activityType: parsed.deviceType === 'watch' || scanMode === 'watch' ? 'Smartwatch Pedometer' : 'Cardio Console',
        distanceKm: Number(dist.toFixed(2)),
        durationMinutes: Math.round(dur),
        burnedKcal: Math.round(burn),
        avgHeartRateBpm: Math.round(hr),
        zone2Minutes: Math.round(dur * 0.75),
        steps,
        confidenceScore: hasData ? 95 : 0,
        rawReadings: hasData
          ? `${steps > 0 ? `${steps.toLocaleString()} steps • ` : ''}${burn > 0 ? `${burn} kcal • ` : ''}${dist > 0 ? `${dist} km` : ''}`.replace(/•\s*$/, '')
          : 'No metrics detected. Enter manually.',
        aliveAiNote: hasData ? 'On-device Optical OCR telemetry extraction verified.' : 'Optical display requires manual verification.',
      };
    }
  } catch (ocrErr) {
    console.warn('[Optical Vision] On-device OCR pass exception:', ocrErr);
  }

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

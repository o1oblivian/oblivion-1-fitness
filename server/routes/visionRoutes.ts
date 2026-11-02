import type { Express } from 'express';
import { recognizeTelemetryFromBuffer } from '../../src/services/ocrTelemetryParser';
import {
  generateContentWithFallback,
  getGenAI,
  parseGeminiObject,
  QUICK_READ_THINKING,
} from '../lib/gemini';
import { errorMessage } from '../../shared/errorMessage';
import { CARDIO_TELEMETRY_PROMPT } from '../lib/cardioTelemetryPrompt';

/**
 * Time allowed for the AI reader on a photo. Gemini sometimes takes half a minute to answer one, so
 * a second model is raced against it after 6 seconds. The on-server text reader starts at the same
 * time as Gemini, so when Gemini gives up its answer is usually ready. Both stay inside the 60
 * seconds the app waits.
 */
const SCAN_AI_LIMITS = { attemptTimeoutMs: 24_000, budgetMs: 26_000, hedgeAfterMs: 6_000 };
const OCR_FALLBACK_MS = 22_000;
/** A meal photo has no backup reader, and the app waits 75 seconds for it. */
const MEAL_AI_LIMITS = { attemptTimeoutMs: 45_000, budgetMs: 60_000, hedgeAfterMs: 8_000 };

/** A non-negative rounded figure the model reported, or `null` when it left it out. */
function reportedAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/** A finite number the model reported (0 allowed, e.g. a flat incline), or `null`. */
function readingOf(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function reportedText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Photo reading: cardio consoles and watches, and meal photos. */
export function registerVisionRoutes(app: Express): void {
  // DEDICATED ZERO-MOCK MULTIMODAL VISION OCR FOR CONSOLES AND SMARTWATCHES
  app.post('/api/vision/cardio-telemetry', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image base64 data required' });
      }
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      // Tesseract is slow on the hosted CPU, so it starts now and works while Gemini is asked.
      // Its reading backs up Gemini, and stands in when Gemini cannot answer.
      const imgBuffer = Buffer.from(cleanBase64, 'base64');
      let ocrExtracted = null as Awaited<ReturnType<typeof recognizeTelemetryFromBuffer>> | null;
      const ocrRead = recognizeTelemetryFromBuffer(imgBuffer).then(
        (reading) => (ocrExtracted = reading),
        (ocrErr: unknown) => {
          console.error('Server OCR pass failed:', errorMessage(ocrErr, String(ocrErr)));
          return null;
        },
      );

      const genAI = getGenAI();
      // True when the AI reader could not answer, so "nothing found" below does not mean the screen was empty.
      let aiFailed = !genAI;

      if (genAI) {
        try {
          const prompt = CARDIO_TELEMETRY_PROMPT;

          const response = await generateContentWithFallback(
            genAI,
            [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: cleanBase64,
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
            { responseMimeType: 'application/json', thinkingConfig: QUICK_READ_THINKING },
            SCAN_AI_LIMITS,
          );

          const text = response?.text || '';
          const parsed = parseGeminiObject(text);

          // Normalize elapsed time
          let normalizedElapsed: string | null = null;
          let elapsedMinsNumber: number | null = null;
          if (typeof parsed.elapsedMinutes === 'string' && parsed.elapsedMinutes.trim() !== '') {
            const timeParts = parsed.elapsedMinutes
              .split(':')
              .map((p: string) => parseFloat(p.trim()));
            if (timeParts.length === 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
              elapsedMinsNumber = Number((timeParts[0] + timeParts[1] / 60).toFixed(2));
              normalizedElapsed = parsed.elapsedMinutes.trim();
            } else if (!isNaN(parseFloat(parsed.elapsedMinutes))) {
              elapsedMinsNumber = parseFloat(parsed.elapsedMinutes);
              normalizedElapsed = `${elapsedMinsNumber} min`;
            }
          } else if (typeof parsed.elapsedMinutes === 'number' && parsed.elapsedMinutes > 0) {
            elapsedMinsNumber = parsed.elapsedMinutes;
            normalizedElapsed = `${elapsedMinsNumber} min`;
          } else if (ocrExtracted?.elapsedMinutes) {
            elapsedMinsNumber = ocrExtracted.elapsedMinutes;
            normalizedElapsed = ocrExtracted.elapsedDisplay;
          }

          const distanceVal = readingOf(parsed.distanceKm) ?? ocrExtracted?.distanceKm ?? null;
          const caloriesVal =
            readingOf(parsed.caloriesBurned) ?? ocrExtracted?.caloriesBurned ?? null;
          const speedVal = readingOf(parsed.speedKmh) ?? ocrExtracted?.speedKmh ?? null;
          const inclineVal = readingOf(parsed.inclinePct) ?? ocrExtracted?.inclinePct ?? null;
          const heartRateVal =
            readingOf(parsed.avgHeartRateBpm) ?? ocrExtracted?.avgHeartRateBpm ?? null;
          // Steps come from Gemini alone when it answered: a step count needs the word "steps"
          // beside it, and the backup reader once took a port number in an address bar for 3,000 steps.
          const stepsVal = readingOf(parsed.steps);
          const wattsVal = readingOf(parsed.watts);
          const paceVal = reportedText(parsed.pace);
          // The watch's own clock as "HH:MM" and how sure the reader was. Both come from Gemini.
          const timestampVal =
            typeof parsed.timestamp === 'string' &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(parsed.timestamp)
              ? parsed.timestamp
              : null;
          const confidenceVal =
            parsed.confidence === 'high' ||
            parsed.confidence === 'medium' ||
            parsed.confidence === 'low'
              ? parsed.confidence
              : null;

          const hasAnyMetric =
            distanceVal !== null ||
            caloriesVal !== null ||
            speedVal !== null ||
            inclineVal !== null ||
            heartRateVal !== null ||
            stepsVal !== null ||
            (elapsedMinsNumber !== null && elapsedMinsNumber > 0);
          if (hasAnyMetric) {
            return res.json({
              success: true,
              telemetry: {
                deviceType:
                  parsed.deviceType === 'WATCH'
                    ? 'watch'
                    : parsed.deviceType === 'CONSOLE'
                      ? 'console'
                      : (ocrExtracted?.deviceType ?? null),
                elapsedDisplay: normalizedElapsed,
                elapsedMinutes: elapsedMinsNumber,
                distanceKm: distanceVal,
                caloriesBurned: caloriesVal,
                speedKmh: speedVal,
                inclinePct: inclineVal,
                avgHeartRateBpm: heartRateVal,
                steps: stepsVal,
                watts: wattsVal,
                pace: paceVal,
              },
              reading: { steps: stepsVal, timestamp: timestampVal, confidence: confidenceVal },
              calibrationNote: stepsVal
                ? `Optical OCR read ${stepsVal.toLocaleString()} steps directly.`
                : 'Optical OCR calibrated.',
            });
          }
        } catch (genErr) {
          aiFailed = true;
          console.error(
            'Gemini vision API unavailable or interrupted, falling back to pure Tesseract OCR pass:',
            errorMessage(genErr, String(genErr)),
          );
        }
      }

      ocrExtracted = await Promise.race([
        ocrRead,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), OCR_FALLBACK_MS)),
      ]);
      // The backup reader's step count is used only when Gemini could not answer at all.
      const ocrSteps = aiFailed ? (ocrExtracted?.steps ?? null) : null;
      if (
        ocrExtracted &&
        (ocrSteps ||
          ocrExtracted.distanceKm ||
          ocrExtracted.caloriesBurned ||
          (ocrExtracted.elapsedMinutes ?? 0) > 0)
      ) {
        return res.json({
          success: true,
          telemetry: {
            deviceType: ocrExtracted.deviceType,
            elapsedDisplay: ocrExtracted.elapsedDisplay,
            elapsedMinutes: ocrExtracted.elapsedMinutes,
            distanceKm: ocrExtracted.distanceKm,
            caloriesBurned: ocrExtracted.caloriesBurned,
            speedKmh: ocrExtracted.speedKmh,
            inclinePct: ocrExtracted.inclinePct,
            avgHeartRateBpm: ocrExtracted.avgHeartRateBpm,
            steps: ocrSteps,
            watts: null,
            pace: null,
          },
          calibrationNote: ocrSteps
            ? `Optical OCR verified: ${ocrSteps.toLocaleString()} steps read from display.`
            : 'Optical OCR telemetry extracted from display.',
        });
      }

      // The AI reader was down and the backup found nothing: say so, rather than blaming the photo.
      if (aiFailed) {
        return res.status(503).json({
          error: 'The photo reader is busy right now. Try again in a moment.',
          code: 'reader_busy',
        });
      }

      // If no digits detected on screen, return honest null state (zero fake numbers, no zero fallbacks)
      return res.json({
        success: true,
        telemetry: {
          deviceType: null,
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
        },
        calibrationNote:
          'No readable numbers detected on image. Tap any metric to enter manually or retake photo.',
      });
    } catch (err) {
      console.error('Error in /api/vision/cardio-telemetry:', err);
      // A server fault is not "no numbers on the screen". Let the app try its on-device reader.
      res.status(500).json({ error: 'The scanner could not process this photo.' });
    }
  });

  app.post('/api/vision/meal-nutrients', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', scanMode = 'plate' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image base64 data required' });
      }
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      const genAI = getGenAI();

      let prompt = `You are a clinical sports nutritionist. Analyze the meal photo. Estimate real portion sizes, macro ratios (protein, carbs, fats), and total calories based on FSANZ / AUSNUT Australian nutritional tables. Never return generic mock arrays. Return valid JSON only.

Structured JSON output schema:
{
  "mealName": string,
  "detectedItems": string[],
  "estimatedGrams": number,
  "servingDescription": string,
  "calories": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "confidenceScore": number
}`;

      if (scanMode === 'package') {
        prompt = `Extract numerical values strictly from the Nutrition Facts panel: serving size in grams, calories, total protein (g), total carbohydrate (g), total fat (g). Return raw JSON only.
Schema:
{
  "mealName": string,
  "detectedItems": string[],
  "estimatedGrams": number,
  "servingDescription": string,
  "calories": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "confidenceScore": number
}
Use null for any value the panel does not show.`;
      } else if (scanMode === 'barcode') {
        prompt = `You are an optical barcode and packaged food identifier. Analyze this photo containing a product barcode or package.
Read any visible barcode numbers (UPC/EAN digits) and product branding.
Extract exact product name, brand, serving size, calories (kcal), protein (g), carbs (g), and fat (g).
Return valid JSON only matching:
{
  "mealName": string,
  "detectedItems": string[],
  "estimatedGrams": number,
  "servingDescription": string,
  "calories": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "confidenceScore": number
}`;
      }

      // True when the AI reader could not answer, which is not the same as a photo it could not read.
      let aiFailed = !genAI;

      if (genAI) {
        try {
          const response = await generateContentWithFallback(
            genAI,
            [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: cleanBase64,
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
            {
              temperature: 0.0,
              responseMimeType: 'application/json',
              thinkingConfig: QUICK_READ_THINKING,
            },
            MEAL_AI_LIMITS,
          );

          const text = response.text || '';
          const parsed = parseGeminiObject(text);
          const proteinG = reportedAmount(parsed.proteinGrams);
          const carbsG = reportedAmount(parsed.carbsGrams);
          const fatG = reportedAmount(parsed.fatGrams);

          // Reported calories, else Atwater factors (4 kcal/g protein and carbs, 9 kcal/g fat) when all three macros were read.
          const reportedKcal = reportedAmount(parsed.calories);
          const calories =
            reportedKcal !== null && reportedKcal > 0
              ? reportedKcal
              : proteinG !== null && carbsG !== null && fatG !== null
                ? Math.round(proteinG * 4 + carbsG * 4 + fatG * 9)
                : null;

          if (calories === null || calories <= 0) {
            return res.status(422).json({
              error:
                'Could not resolve meal macronutrients. Retake photo with clear lighting and full plate visibility.',
            });
          }

          const confidence = reportedAmount(parsed.confidenceScore);
          return res.json({
            success: true,
            nutrients: {
              mealName: reportedText(parsed.mealName),
              detectedItems: Array.isArray(parsed.detectedItems) ? parsed.detectedItems : [],
              estimatedGrams: reportedAmount(parsed.estimatedGrams),
              servingDescription: reportedText(parsed.servingDescription),
              calories,
              proteinGrams: proteinG,
              carbsGrams: carbsG,
              fatGrams: fatG,
              confidenceScore: confidence === null ? null : Math.min(100, confidence),
            },
          });
        } catch (aiErr) {
          aiFailed = true;
          console.warn(
            'Gemini vision API error during meal analysis:',
            errorMessage(aiErr, String(aiErr)),
          );
        }
      }

      if (aiFailed) {
        return res.status(503).json({
          error: 'The photo reader is busy right now. Try again in a moment.',
        });
      }

      return res.status(422).json({
        error:
          'Could not resolve meal macronutrients. Retake photo with clear lighting and full plate visibility.',
      });
    } catch (err) {
      console.error('Error in /api/vision/meal-nutrients:', err);
      res.status(500).json({ error: errorMessage(err, 'Error analyzing meal photo') });
    }
  });
}

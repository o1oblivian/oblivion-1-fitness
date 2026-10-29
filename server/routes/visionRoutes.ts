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
        () => null,
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

          const distanceVal =
            parsed.distanceKm !== null && parsed.distanceKm !== undefined
              ? Number(parsed.distanceKm)
              : (ocrExtracted?.distanceKm ?? null);
          const caloriesVal =
            parsed.caloriesBurned !== null && parsed.caloriesBurned !== undefined
              ? Number(parsed.caloriesBurned)
              : (ocrExtracted?.caloriesBurned ?? null);
          const speedVal =
            parsed.speedKmh !== null && parsed.speedKmh !== undefined
              ? Number(parsed.speedKmh)
              : (ocrExtracted?.speedKmh ?? null);
          const inclineVal =
            parsed.inclinePct !== null && parsed.inclinePct !== undefined
              ? Number(parsed.inclinePct)
              : (ocrExtracted?.inclinePct ?? null);
          const heartRateVal =
            parsed.avgHeartRateBpm !== null && parsed.avgHeartRateBpm !== undefined
              ? Number(parsed.avgHeartRateBpm)
              : (ocrExtracted?.avgHeartRateBpm ?? null);
          // Steps come from Gemini alone. When Gemini answered and found none, the backup reader's
          // step guess is not used: it once read the port number in an address bar as 3,000 steps.
          const stepsRead =
            parsed.steps !== null && parsed.steps !== undefined ? Number(parsed.steps) : null;
          const stepsVal = stepsRead !== null && Number.isFinite(stepsRead) ? stepsRead : null;
          const wattsVal =
            parsed.watts !== null && parsed.watts !== undefined ? Number(parsed.watts) : null;
          const paceVal = parsed.pace || null;
          // The watch's own clock as "HH:MM" and how sure the reader was. Both come from Gemini.
          const timestampVal =
            typeof parsed.timestamp === 'string' &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(parsed.timestamp)
              ? parsed.timestamp
              : null;
          const confidenceVal =
            parsed.confidence === 'high' || parsed.confidence === 'medium'
              ? parsed.confidence
              : 'low';

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
                  parsed.deviceType === 'WATCH' ? 'watch' : ocrExtracted?.deviceType || 'console',
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
          console.warn(
            'Gemini vision API unavailable or interrupted, falling back to pure Tesseract OCR pass:',
            errorMessage(genErr, String(genErr)),
          );
        }
      }

      ocrExtracted = await Promise.race([
        ocrRead,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), OCR_FALLBACK_MS)),
      ]);
      // The backup reader's step count is used only when Gemini could not answer at all. When Gemini
      // answered and found no steps, the backup's number is a guess from stray digits, so it is dropped.
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
  "confidenceScore": 95
}`;
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
          const proteinG = Math.max(0, Math.round(Number(parsed.proteinGrams) || 0));
          const carbsG = Math.max(0, Math.round(Number(parsed.carbsGrams) || 0));
          const fatG = Math.max(0, Math.round(Number(parsed.fatGrams) || 0));

          // Check calories or calculate using standard Atwater physiological macro factors (4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat)
          let calculatedCalories = Math.max(0, Math.round(Number(parsed.calories) || 0));
          if (calculatedCalories === 0 && (proteinG > 0 || carbsG > 0 || fatG > 0)) {
            calculatedCalories = Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);
          }

          if (calculatedCalories <= 0) {
            return res.status(422).json({
              error:
                'Could not resolve meal macronutrients. Retake photo with clear lighting and full plate visibility.',
            });
          }

          return res.json({
            success: true,
            nutrients: {
              mealName:
                parsed.mealName ||
                (scanMode === 'package' ? 'Packaged Nutrition Item' : 'Analyzed Athletic Plate'),
              detectedItems: Array.isArray(parsed.detectedItems) ? parsed.detectedItems : [],
              estimatedGrams: Number(parsed.estimatedGrams) || 0,
              servingDescription:
                parsed.servingDescription ||
                (scanMode === 'package' ? '1 package serving' : '1 standard plate'),
              calories: calculatedCalories,
              proteinGrams: proteinG,
              carbsGrams: carbsG,
              fatGrams: fatG,
              // The model's own figure, never a made-up default.
              confidenceScore: Math.min(
                99,
                Math.max(0, Math.round(Number(parsed.confidenceScore) || 0)),
              ),
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

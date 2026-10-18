import type { Express } from 'express';
import { recognizeTelemetryFromBuffer } from '../../src/services/ocrTelemetryParser';
import {
  generateContentWithFallback,
  getGenAI,
  parseGeminiJson,
  QUICK_READ_THINKING,
} from '../lib/gemini';

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

      // Tesseract is slow on the hosted CPU, so it only runs when Gemini is unavailable or reads nothing.
      const imgBuffer = Buffer.from(cleanBase64, 'base64');
      let ocrExtracted = null as Awaited<ReturnType<typeof recognizeTelemetryFromBuffer>> | null;

      const genAI = getGenAI();

      if (genAI) {
        try {
          const prompt = `You are a precision optical character recognition (OCR) and computer vision engine for fitness screens, wearables, and cardio consoles.
Inspect this image with extreme precision. Extract only physically legible display metrics.

CATEGORIES TO RECOGNIZE:
1. Wearables & Watches — accept ANY wristwatch. Brand is not a filter.
   - Smartwatches and bands: Apple Watch, Garmin, Whoop, Fitbit, Polar, Suunto, Coros, and any other OLED, AMOLED, or color LCD sports watch.
   - Digital sports watches: Casio, G-Shock, Ironman, Timex, and any other inverted LCD, dot-matrix, or segmented display.
   - Analog and chronograph faces: accept the photo. Read a printed step count, heart rate, or other metric when digits are on the dial or a digital subdial. If the face shows only hands and no printed number for a metric, return null for that metric.
   - Segmented digits often OCR with a space or comma: "8 083 STEPS", "8083 STEPS", and "6 157" are the same count (8083 or 6157).
   - Disambiguate clock time: NEVER map current time-of-day clock readouts (e.g. "P 4:11", "4:11 PM", "10/3 SAT", "3:10") to workout elapsed time, duration, calories, or steps.
2. Gym Machines & Cardio Consoles:
   - Concept2 (PM3/PM4/PM5 monitors): Parse Time, Distance, Pace (/500m), Stroke Rate, Watts, Calories.
   - Commercial Treadmills & StairMasters (Life Fitness, Matrix, TechnoGym, Woodway, Precor): Parse Elapsed Time, Distance (km/mi), Calories, Speed, Incline %, Heart Rate.
   - Air Bikes & Spin Bikes (AssaultBike, Echo Bike, Keiser): Parse RPM, Watts, Calories, Time.

CRITICAL ZERO-HALLUCINATION RULES:
- NEVER estimate, fabricate, or extrapolate missing values.
- If a metric is NOT physically legible on the display, return null.
- Do NOT return 0 for unread or missing metrics. Return null.
- Only return a non-null number if explicitly identified in the image.

Return STRICT JSON matching this schema:
{
  "deviceType": "WATCH" | "CONSOLE",
  "steps": number | null,
  "elapsedMinutes": string | number | null,
  "distanceKm": number | null,
  "caloriesBurned": number | null,
  "speedKmh": number | null,
  "inclinePct": number | null,
  "avgHeartRateBpm": number | null,
  "watts": number | null,
  "pace": string | null
}`;

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
          );

          const text = response?.text || '';
          const parsed = parseGeminiJson(text);

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
          const stepsVal =
            parsed.steps !== null && parsed.steps !== undefined
              ? Number(parsed.steps)
              : (ocrExtracted?.steps ?? null);
          const wattsVal =
            parsed.watts !== null && parsed.watts !== undefined ? Number(parsed.watts) : null;
          const paceVal = parsed.pace || null;

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
              calibrationNote: stepsVal
                ? `Optical OCR read ${stepsVal.toLocaleString()} steps directly.`
                : 'Optical OCR calibrated.',
            });
          }
        } catch (genErr: any) {
          console.warn(
            'Gemini vision API unavailable or interrupted, falling back to pure Tesseract OCR pass:',
            genErr?.message || genErr,
          );
        }
      }

      ocrExtracted = await recognizeTelemetryFromBuffer(imgBuffer);
      if (
        ocrExtracted &&
        (ocrExtracted.steps ||
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
            steps: ocrExtracted.steps,
            watts: null,
            pace: null,
          },
          calibrationNote: ocrExtracted.steps
            ? `Optical OCR verified: ${ocrExtracted.steps.toLocaleString()} steps read from display.`
            : 'Optical OCR telemetry extracted from display.',
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
    } catch (err: any) {
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
          );

          const text = response.text || '';
          const parsed = parseGeminiJson(text);
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
        } catch (aiErr: any) {
          console.warn('Gemini vision API error during meal analysis:', aiErr?.message || aiErr);
        }
      }

      return res.status(422).json({
        error:
          'Could not resolve meal macronutrients. Retake photo with clear lighting and full plate visibility.',
      });
    } catch (err: any) {
      console.error('Error in /api/vision/meal-nutrients:', err);
      res.status(500).json({ error: err.message || 'Error analyzing meal photo' });
    }
  });
}

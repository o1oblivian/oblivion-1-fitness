import express from 'express';
import http from 'http';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { recognizeTelemetryFromBuffer } from './src/services/ocrTelemetryParser';
import {
  handleRevenueCatWebhook,
  handleSyncEntitlements,
} from './server/routes/billingWebhookHandler';
import { handleVerifyPose } from './server/routes/poseVerificationRoute';
import { registerStripeRoutes } from './server/routes/stripeRoutes';
import { deleteAccountData } from './server/lib/accountDeletion';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

function readImportMetaGeminiKey(): string {
  try {
    return String((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || '');
  } catch {
    return '';
  }
}

function getGeminiApiKey(explicitKey?: string): string {
  return (
    explicitKey ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    readImportMetaGeminiKey() ||
    (process.env as any).GEMINI_API_KEY_2 ||
    (process.env as any).VITE_GEMINI_API_KEY_2 ||
    ''
  );
}

let aiClient: GoogleGenAI | null = null;
function getGenAI(overrideKey?: string): GoogleGenAI | null {
  const activeKey = getGeminiApiKey(overrideKey);
  if (!activeKey) return null;
  if (aiClient && !overrideKey) return aiClient;
  try {
    const client = new GoogleGenAI({
      apiKey: activeKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    if (!overrideKey) aiClient = client;
    return client;
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI client:', e);
    return null;
  }
}

// Resilient Gemini generateContent caller with model fallback & exponential retry for 503/429 spikes
async function generateContentWithFallback(genAI: GoogleGenAI, contents: any[], config?: any): Promise<any> {
  const modelsToTry = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await genAI.models.generateContent({
          model,
          contents,
          config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err);
        if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available')) {
          break; // Dead model, skip immediately without waiting
        }
        const isTemporary = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('429') || errMsg.includes('quota');
        if (isTemporary && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        break; // try fallback model
      }
    }
  }

  throw lastError || new Error('All model attempts failed');
}

function parseGeminiJson(responseText: string): any {
  const cleaned = String(responseText || '').replace(/```json\n?|```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
}

// Built-in verified barcode database for popular athletic foods & supplements
const VERIFIED_BARCODES: Record<
  string,
  {
    name: string;
    brand: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    category: string;
  }
> = {
  '850003007011': {
    name: 'Core Power Elite Chocolate (42g Protein)',
    brand: 'Fairlife',
    portion: '1 bottle (414ml)',
    calories: 230,
    protein: 42,
    carbs: 8,
    fats: 3.5,
    category: 'drinks',
  },
  '888849000018': {
    name: 'Quest Nutrition Chocolate Chip Cookie Dough Bar',
    brand: 'Quest Nutrition',
    portion: '1 bar (60g)',
    calories: 200,
    protein: 21,
    carbs: 22,
    fats: 7,
    category: 'snack',
  },
  '7350083380004': {
    name: 'Caramel Cashew Protein Bar (20g Protein)',
    brand: 'Barebells',
    portion: '1 bar (55g)',
    calories: 200,
    protein: 20,
    carbs: 16,
    fats: 8,
    category: 'snack',
  },
  '036632074345': {
    name: 'Oikos Pro 20g Protein Greek Yogurt Cup',
    brand: 'Dannon Oikos',
    portion: '1 cup (150g)',
    calories: 140,
    protein: 20,
    carbs: 8,
    fats: 3,
    category: 'snack',
  },
  '052000328677': {
    name: 'Gatorade Zero Thirst Quencher Glacier Cherry',
    brand: 'Gatorade',
    portion: '1 bottle (591ml)',
    calories: 5,
    protein: 0,
    carbs: 1,
    fats: 0,
    category: 'drinks',
  },
  '748927028669': {
    name: 'Gold Standard 100% Whey Double Rich Chocolate',
    brand: 'Optimum Nutrition',
    portion: '1 scoop (30.4g)',
    calories: 120,
    protein: 24,
    carbs: 3,
    fats: 1.5,
    category: 'drinks',
  },
  '853841005012': {
    name: 'LMNT Recharge Electrolyte Drink Mix (Citrus Salt)',
    brand: 'LMNT',
    portion: '1 packet in 500ml water',
    calories: 10,
    protein: 0,
    carbs: 2,
    fats: 0,
    category: 'supplements',
  },
};

// Supplement database for online search
const SUPPLEMENT_KNOWLEDGE_BASE: Array<{
  name: string;
  category: string;
  clinicalDosage: string;
  timing: string;
  primaryBenefits: string;
  mechanismOfAction: string;
  synergyStack: string;
  safetyNote?: string;
}> = [
  {
    name: 'Creatine Monohydrate',
    category: 'Performance / Strength',
    clinicalDosage: '5g daily (Creapure micronized)',
    timing: 'Post-workout or morning with carbohydrates',
    primaryBenefits: 'Increases phosphocreatine cellular reserves, maximum force output, muscle cell hydration',
    mechanismOfAction: 'Rapidly resynthesizes ATP from ADP during high-intensity anaerobic contractions',
    synergyStack: 'Pairs synergistically with post-workout carbohydrates (30-50g) and Whey Protein for enhanced intramuscular uptake',
  },
  {
    name: 'Omega-3 Fish Oil (High EPA/DHA)',
    category: 'Recovery / Anti-inflammatory',
    clinicalDosage: '2,000mg - 3,000mg total EPA+DHA daily',
    timing: 'With a fat-containing meal (Breakfast or Dinner)',
    primaryBenefits: 'Reduces systemic delayed onset muscle soreness (DOMS), supports heart health, optimizes cellular membrane fluidity',
    mechanismOfAction: 'Incorporates into cell membrane phospholipids, displacing arachidonic acid and generating pro-resolving mediators (resolvins/protectins)',
    synergyStack: 'Stack with Vitamin D3 + K2 and Curcumin for full-spectrum systemic joint & tissue recovery',
  },
  {
    name: 'Magnesium Bisglycinate',
    category: 'Sleep / Nervous System',
    clinicalDosage: '300mg - 400mg elemental magnesium',
    timing: '30-45 minutes before sleep',
    primaryBenefits: 'Deep slow-wave sleep architecture, muscle relaxation, neurochemical calming, prevents nocturnal cramping',
    mechanismOfAction: 'Acts as natural NMDA receptor blocker and positive allosteric modulator of GABA-A receptors',
    synergyStack: 'Stack with L-Theanine (200mg) and Apigenin for non-habit forming deep sleep protocol',
  },
  {
    name: 'Vitamin D3 + K2 (MK-7)',
    category: 'Endocrine / Bone Mineral',
    clinicalDosage: '5,000 IU D3 + 100mcg K2 (as Menaquinone-7)',
    timing: 'Morning with healthy fats (e.g., eggs or avocado)',
    primaryBenefits: 'Maintains optimal free testosterone levels, boosts bone mineral density, optimizes immune resilience',
    mechanismOfAction: 'D3 acts as a steroid pre-hormone; K2 activates osteocalcin and MGP to shuttle calcium directly into bones away from arterial walls',
    synergyStack: 'Combine with dietary dietary fats and Zinc Picolinate for complete endocrine axis priming',
  },
  {
    name: 'L-Citrulline Malate 2:1',
    category: 'Blood Flow / Pumps',
    clinicalDosage: '6,000mg - 8,000mg pure Citrulline Malate',
    timing: '30-45 minutes pre-training',
    primaryBenefits: 'Supraphysiological vasodilation, increases muscular pump, buffers ammonia accumulation, delays fatigue',
    mechanismOfAction: 'Bypasses hepatic first-pass metabolism, elevating systemic L-Arginine plasma concentrations to stimulate endothelial nitric oxide synthase (eNOS)',
    synergyStack: 'Stack with Beta-Alanine (3.2g) and Himalayan Pink Salt (1g) for elite pre-workout pump and cellular hydration',
  },
  {
    name: 'Beta-Alanine',
    category: 'Endurance / Acidity Buffer',
    clinicalDosage: '3.2g - 6.4g daily (divided doses to limit paresthesia)',
    timing: 'Pre-workout or anytime during the day',
    primaryBenefits: 'Enhances capacity in the 60-240 second anaerobic endurance window, increases sprint repeats',
    mechanismOfAction: 'Rate-limiting precursor in carnosine synthesis, buffering intracellular hydrogen ion (H+) accumulation in working myocytes',
    synergyStack: 'Stack with Sodium Bicarbonate and Creatine for maximal repeated-sprint power output',
  },
  {
    name: 'Ashwagandha (KSM-66 Full Spectrum)',
    category: 'Adaptogen / Cortisol Modulation',
    clinicalDosage: '600mg daily (standardized to 5% withanolides)',
    timing: 'Evening with dinner or post-training',
    primaryBenefits: 'Blunts exercise-induced hypercortisolemia, stabilizes resting heart rate variability (HRV), promotes calm resilience',
    mechanismOfAction: 'Regulates hypothalamic-pituitary-adrenal (HPA) axis activity and balances circulating serum cortisol levels',
    synergyStack: 'Stack with Phosphatidylserine (PS) during intense high-volume training blocks to prevent CNS overreaching',
  },
  {
    name: 'Alpha-GPC (L-Alpha Glycerylphosphorylcholine)',
    category: 'Nootropic / Mind-Muscle Focus',
    clinicalDosage: '300mg - 600mg (50% yield)',
    timing: '30 minutes before heavy lifting or skill training',
    primaryBenefits: 'Heightened motor unit recruitment, explosive power output, razor-sharp cognitive focus',
    mechanismOfAction: 'Directly crosses the blood-brain barrier to serve as an immediate precursor for acetylcholine synthesis in neuromuscular junctions',
    synergyStack: 'Stack with Caffeine (150mg) and L-Theanine (150mg) for clean, jitter-free motor drive',
  },
  {
    name: 'Tactical Electrolyte Matrix (Sodium / Potassium / Magnesium)',
    category: 'Hydration / Cell Osmolytes',
    clinicalDosage: '1,000mg Sodium, 200mg Potassium, 60mg Magnesium per liter',
    timing: 'Intra-workout or first thing upon waking',
    primaryBenefits: 'Maintains blood plasma volume, prevents cramping, maximizes neural firing velocity, sustains cardiac output in heat',
    mechanismOfAction: 'Regulates cellular sodium-potassium ATP-ase pumps and vascular oncotic pressure',
    synergyStack: 'Add 10g Essential Amino Acids (EAAs) and 20g Cyclic Dextrin during intense workouts',
  },
  {
    name: 'Zinc Picolinate',
    category: 'Immunity / Androgen Support',
    clinicalDosage: '25mg - 30mg elemental zinc',
    timing: 'Evening with a meal (avoid taking with calcium)',
    primaryBenefits: 'Accelerates soft tissue repair, enzymatic cofactor for over 300 metabolic pathways, supports LH and testosterone synthesis',
    mechanismOfAction: 'Essential structural component of zinc-finger DNA transcription factors and superoxide dismutase (SOD)',
    synergyStack: 'Stack with Copper (1-2mg) on long cycles to maintain optimal copper-zinc plasma ratio',
  },
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const APP_ORIGINS = new Set(['https://localhost', 'http://localhost', 'capacitor://localhost', 'ionic://localhost']);
  app.use('/api', (req, res, next) => {
    const origin = String(req.headers.origin || '');
    if (APP_ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-gemini-key');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Image-analysis routes cost money per call. Cap how often one address can use them.
  app.set('trust proxy', 1);
  const scanHits = new Map<string, { count: number; resetAt: number }>();
  const SCAN_LIMIT_PER_MINUTE = 40;
  setInterval(() => {
    const now = Date.now();
    for (const [key, hit] of scanHits) if (hit.resetAt <= now) scanHits.delete(key);
  }, 60_000).unref();
  app.use(['/api/vision', '/api/fuel', '/api/cardio', '/api/workout'], (req, res, next) => {
    if (req.method !== 'POST') return next();
    const now = Date.now();
    const key = req.ip || 'unknown';
    const hit = scanHits.get(key);
    if (!hit || hit.resetAt <= now) {
      scanHits.set(key, { count: 1, resetAt: now + 60_000 });
      return next();
    }
    hit.count += 1;
    if (hit.count > SCAN_LIMIT_PER_MINUTE) {
      res.setHeader('Retry-After', String(Math.ceil((hit.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many scans. Wait a minute and try again.' });
    }
    return next();
  });

  // Configure JSON parser with larger limit and rawBody verification for Stripe webhooks
  app.use(
    express.json({
      limit: '50mb',
      verify: (req: any, _res, buf) => {
        if (req.originalUrl?.startsWith('/api/stripe/webhook')) {
          req.rawBody = buf;
        }
      },
    })
  );
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // =========================================================================
  // API ROUTES
  // =========================================================================

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Fuel OS Backend', time: new Date().toISOString() });
  });

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

          const response = await generateContentWithFallback(genAI, [
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
          ], { responseMimeType: 'application/json' });

          const text = response?.text || '';
          const parsed = parseGeminiJson(text);

            // Normalize elapsed time
            let normalizedElapsed: string | null = null;
            let elapsedMinsNumber: number | null = null;
            if (typeof parsed.elapsedMinutes === 'string' && parsed.elapsedMinutes.trim() !== '') {
              const timeParts = parsed.elapsedMinutes.split(':').map((p: string) => parseFloat(p.trim()));
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

            const distanceVal = parsed.distanceKm !== null && parsed.distanceKm !== undefined ? Number(parsed.distanceKm) : (ocrExtracted?.distanceKm ?? null);
            const caloriesVal = parsed.caloriesBurned !== null && parsed.caloriesBurned !== undefined ? Number(parsed.caloriesBurned) : (ocrExtracted?.caloriesBurned ?? null);
            const speedVal = parsed.speedKmh !== null && parsed.speedKmh !== undefined ? Number(parsed.speedKmh) : (ocrExtracted?.speedKmh ?? null);
            const inclineVal = parsed.inclinePct !== null && parsed.inclinePct !== undefined ? Number(parsed.inclinePct) : (ocrExtracted?.inclinePct ?? null);
            const heartRateVal = parsed.avgHeartRateBpm !== null && parsed.avgHeartRateBpm !== undefined ? Number(parsed.avgHeartRateBpm) : (ocrExtracted?.avgHeartRateBpm ?? null);
            const stepsVal = parsed.steps !== null && parsed.steps !== undefined ? Number(parsed.steps) : (ocrExtracted?.steps ?? null);
            const wattsVal = parsed.watts !== null && parsed.watts !== undefined ? Number(parsed.watts) : null;
            const paceVal = parsed.pace || null;

            const hasAnyMetric = distanceVal !== null || caloriesVal !== null || speedVal !== null || inclineVal !== null || heartRateVal !== null || stepsVal !== null || (elapsedMinsNumber !== null && elapsedMinsNumber > 0);
            if (hasAnyMetric) {
              return res.json({
                success: true,
                telemetry: {
                  deviceType: parsed.deviceType === 'WATCH' ? 'watch' : (ocrExtracted?.deviceType || 'console'),
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
                calibrationNote: stepsVal ? `Optical OCR read ${stepsVal.toLocaleString()} steps directly.` : 'Optical OCR calibrated.',
              });
            }
        } catch (genErr: any) {
          console.warn('Gemini vision API unavailable or interrupted, falling back to pure Tesseract OCR pass:', genErr?.message || genErr);
        }
      }

      ocrExtracted = await recognizeTelemetryFromBuffer(imgBuffer);
      if (ocrExtracted && (ocrExtracted.steps || ocrExtracted.distanceKm || ocrExtracted.caloriesBurned || ocrExtracted.elapsedMinutes > 0)) {
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
        calibrationNote: 'No readable numbers detected on image. Tap any metric to enter manually or retake photo.',
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
      const reqKey = (req.headers['x-gemini-key'] as string) || req.body?.geminiKey;
      const genAI = getGenAI(reqKey);

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
            { temperature: 0.0, responseMimeType: 'application/json' }
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
                error: 'Could not resolve meal macronutrients. Retake photo with clear lighting and full plate visibility.',
              });
            }

            return res.json({
              success: true,
              nutrients: {
                mealName: parsed.mealName || (scanMode === 'package' ? 'Packaged Nutrition Item' : 'Analyzed Athletic Plate'),
                detectedItems: Array.isArray(parsed.detectedItems) ? parsed.detectedItems : [],
                estimatedGrams: Number(parsed.estimatedGrams) || 0,
                servingDescription: parsed.servingDescription || (scanMode === 'package' ? '1 package serving' : '1 standard plate'),
                calories: calculatedCalories,
                proteinGrams: proteinG,
                carbsGrams: carbsG,
                fatGrams: fatG,
                // The model's own figure, never a made-up default.
                confidenceScore: Math.min(99, Math.max(0, Math.round(Number(parsed.confidenceScore) || 0))),
              },
            });
        } catch (aiErr: any) {
          console.warn('Gemini vision API error during meal analysis:', aiErr?.message || aiErr);
        }
      }

      return res.status(422).json({
        error: 'Could not resolve meal macronutrients. Retake photo with clear lighting and full plate visibility.',
      });
    } catch (err: any) {
      console.error('Error in /api/vision/meal-nutrients:', err);
      res.status(500).json({ error: err.message || 'Error analyzing meal photo' });
    }
  });

  // AI Biometric Pose Verification Route (Gemini Vision)
  app.post('/api/vision/verify-pose', (req, res) => handleVerifyPose(req, res, getGenAI));

  // 2. REAL BARCODE SCANNER & OPEN FOOD FACTS LOOKUP
  app.post('/api/fuel/scan-barcode', async (req, res) => {
    try {
      const { barcode } = req.body;
      if (!barcode || typeof barcode !== 'string') {
        return res.status(400).json({ error: 'Barcode number required' });
      }

      const cleanCode = barcode.trim().replace(/[^0-9]/g, '');

      // Check verified local database first
      if (VERIFIED_BARCODES[cleanCode]) {
        return res.json({
          success: true,
          found: true,
          source: 'O1 Verified Fitness Catalog',
          item: VERIFIED_BARCODES[cleanCode],
        });
      }

      // Query OpenFoodFacts API for genuine global food products
      try {
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanCode}.json`, {
          headers: { 'User-Agent': 'Oblivion1Fitness-FuelOS/1.0' },
        });

        if (offRes.ok) {
          const offData = await offRes.json();
          if (offData.status === 1 && offData.product) {
            const prod = offData.product;
            const nutriments = prod.nutriments || {};

            // Use one basis for every number: per serving when the registry has it, otherwise per 100 g.
            // Mixing the two would label 100 g figures as a serving.
            const perServing = Number(nutriments['energy-kcal_serving']) > 0 && Boolean(prod.serving_size);
            const suffix = perServing ? '_serving' : '_100g';
            const kcal = Number(nutriments[`energy-kcal${suffix}`]);
            if (!Number.isFinite(kcal) || kcal <= 0) {
              // The registry knows the product but not its nutrition. Do not invent calories.
              return res.json({ success: true, found: false, message: 'This product has no nutrition data. Enter it by hand.' });
            }
            const per = (key: string) => Math.round(Number(nutriments[`${key}${suffix}`] || 0) * 10) / 10;
            const item = {
              name: prod.product_name || prod.product_name_en || `Scanned Item (${cleanCode})`,
              brand: prod.brands || '',
              portion: perServing ? String(prod.serving_size) : '100g',
              calories: Math.round(kcal),
              protein: per('proteins'),
              carbs: per('carbohydrates'),
              fats: per('fat'),
              category: 'snack',
            };

            return res.json({
              success: true,
              found: true,
              source: 'OpenFoodFacts Global Registry',
              item,
            });
          }
        }
      } catch (fetchErr) {
        console.warn('OpenFoodFacts lookup network error:', fetchErr);
      }

      // If not in OFF, provide structured estimation
      return res.json({
        success: true,
        found: false,
        barcode: cleanCode,
        message: 'Barcode recognized but not yet mapped in global registry. Quick-log enabled.',
      });
    } catch (err: any) {
      console.error('Error in /api/fuel/scan-barcode:', err);
      res.status(500).json({ error: err.message || 'Internal server error during barcode lookup' });
    }
  });

  // Live branded search: OpenFoodFacts. Optional USDA FDC overlay for US when USDA_FDC_API_KEY is set.
  app.get('/api/fuel/live-food-search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const country = String(req.query.country || 'AU').toUpperCase();
      const category = String(req.query.category || 'protein').toLowerCase();
      const limit = Math.min(Number(req.query.limit) || 40, 100);

      if (!q) {
        return res.json({ success: true, items: [], source: 'none', live: false });
      }

      const items: any[] = [];
      const domainMap: Record<string, string> = {
        AU: 'au', US: 'us', GB: 'uk', DE: 'de', FR: 'fr',
        IT: 'it', ES: 'es', NL: 'nl', CA: 'ca', JP: 'jp',
        IN: 'in', BR: 'br', MX: 'mx', ZA: 'za', NZ: 'nz',
      };
      const offDomain = domainMap[country] || 'world';

      try {
        const offUrl = `https://${offDomain}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          q
        )}&search_simple=1&action=process&json=1&page_size=${Math.min(limit * 2, 40)}`;

        const offRes = await fetch(offUrl, {
          headers: {
            'User-Agent': 'Oblivion1Fitness-FuelOS/1.0 (o1oblivionfitness@gmail.com)',
            Accept: 'application/json',
          },
        });

        if (offRes.ok) {
          const offData = await offRes.json();
          if (Array.isArray(offData.products)) {
            for (const p of offData.products) {
              if (!p || (!p.product_name && !p.product_name_en)) continue;
              const name = (p.product_name || p.product_name_en || 'Food Item').trim();
              const brand = (p.brands || p.brand_owner || 'OpenFoodFacts').split(',')[0].trim();

              const rawKcal =
                p.nutriments?.['energy-kcal_100g'] ??
                p.nutriments?.['energy-kcal'] ??
                p.nutriments?.['energy-kcal_serving'] ??
                (p.nutriments?.['energy-kj_100g'] ? p.nutriments['energy-kj_100g'] / 4.184 : 0);

              const calories = Math.round(Number(rawKcal) || 0);
              const protein = Math.round((Number(p.nutriments?.proteins_100g ?? p.nutriments?.proteins ?? 0)) * 10) / 10;
              const carbs = Math.round((Number(p.nutriments?.carbohydrates_100g ?? p.nutriments?.carbohydrates ?? 0)) * 10) / 10;
              const fats = Math.round((Number(p.nutriments?.fat_100g ?? p.nutriments?.fat ?? 0)) * 10) / 10;

              if (calories <= 0 && protein <= 0 && carbs <= 0 && fats <= 0) continue;

              const rawServing = String(p.serving_size || '100g').trim();
              let servingGrams = 100;
              const match = rawServing.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
              if (match) {
                servingGrams = parseFloat(match[1]) || 100;
              }

              items.push({
                id: `off-${p.code || Math.random().toString(36).slice(2, 9)}`,
                name,
                brand,
                calories,
                protein,
                carbs,
                fats,
                servingSize: rawServing,
                servingGrams,
                category,
                country,
                source: 'openfoodfacts',
              });

              if (items.length >= limit) break;
            }
          }
        }
      } catch (offErr) {
        console.warn('OpenFoodFacts proxy search failed:', offErr);
      }

      const fdcKey = String(process.env.USDA_FDC_API_KEY || '').trim();
      if (fdcKey && country === 'US' && items.length < limit) {
        try {
          const fdcUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(fdcKey)}&query=${encodeURIComponent(q)}&pageSize=${Math.min(20, limit)}&dataType=Foundation,SR Legacy,Branded`;
          const fdcRes = await fetch(fdcUrl, { headers: { Accept: 'application/json' } });
          if (fdcRes.ok) {
            const fdcData = await fdcRes.json();
            const seen = new Set(items.map((it) => String(it.name).toLowerCase()));
            for (const food of fdcData.foods || []) {
              const name = String(food.description || '').trim();
              if (!name) continue;
              const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
              const pick = (names: string[]) => {
                const row = nutrients.find((n: any) => names.includes(String(n.nutrientName || n.nutrient?.name || '')));
                return Number(row?.value ?? row?.amount ?? 0) || 0;
              };
              const calories = Math.round(pick(['Energy', 'Energy (Atwater General Factors)', 'Calories']));
              const protein = Math.round(pick(['Protein']) * 10) / 10;
              const carbs = Math.round(pick(['Carbohydrate, by difference', 'Carbohydrate']) * 10) / 10;
              const fats = Math.round(pick(['Total lipid (fat)', 'Total fat (NLEA)', 'Fat']) * 10) / 10;
              if (calories <= 0 && protein <= 0 && carbs <= 0 && fats <= 0) continue;
              if (seen.has(name.toLowerCase())) continue;
              seen.add(name.toLowerCase());
              items.push({
                id: `usda-${food.fdcId}`,
                name,
                brand: food.brandOwner || food.brandName || 'USDA FDC',
                calories,
                protein,
                carbs,
                fats,
                servingSize: '100g',
                servingGrams: 100,
                category,
                country: 'US',
                source: 'usda',
              });
              if (items.length >= limit) break;
            }
          }
        } catch (fdcErr) {
          console.warn('USDA FDC overlay failed:', fdcErr);
        }
      }

      const sources = Array.from(new Set(items.map((it) => it.source).filter(Boolean)));
      res.json({
        success: true,
        items,
        source: sources.includes('usda') ? 'openfoodfacts+usda' : 'openfoodfacts',
        live: true,
      });
    } catch (err: any) {
      console.error('Error in /api/fuel/live-food-search:', err);
      res.status(500).json({ error: err.message || 'Error searching live food database' });
    }
  });

  // 4. SUPPLEMENT STACK DESIGN & ONLINE SEARCH
  app.get('/api/fuel/supplement-search', async (req, res) => {
    try {
      const query = String(req.query.q || '').trim().toLowerCase();

      // Filter existing knowledge base
      let results = SUPPLEMENT_KNOWLEDGE_BASE;
      if (query) {
        results = SUPPLEMENT_KNOWLEDGE_BASE.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.category.toLowerCase().includes(query) ||
            s.primaryBenefits.toLowerCase().includes(query) ||
            s.mechanismOfAction.toLowerCase().includes(query)
        );
      }

      // If user queries a supplement not in the base catalog, query Gemini for real biochemical profile
      if (results.length === 0 && query.length > 2) {
        const genAI = getGenAI();
        if (genAI) {
          try {
            const prompt = `You are a clinical pharmacologist and sports biochemist.
Provide an objective scientific profile for the dietary supplement or compound "${query}".
Respond ONLY with a valid JSON object matching this schema:
{
  "name": "${query.charAt(0).toUpperCase() + query.slice(1)}",
  "category": "e.g. Cognitive / Energy / Joint / Hormone",
  "clinicalDosage": "Standard evidence-based human dosage (e.g. 500mg daily)",
  "timing": "Optimal timing (e.g. Morning with meal, Pre-workout)",
  "primaryBenefits": "Primary evidence-backed performance or health outcome",
  "mechanismOfAction": "Biochemical pathway and physiological mechanism",
  "synergyStack": "Complementary compounds it stacks well with"
}`;

            const response = await generateContentWithFallback(genAI, [{ role: 'user', parts: [{ text: prompt }] }]);

            const text = response.text || '';
            const parsed = parseGeminiJson(text);
            return res.json({ success: true, supplements: [parsed], provider: 'gemini-clinical-search' });
          } catch (aiErr) {
            console.warn('Gemini supplement lookup fallback:', aiErr);
          }
        }
      }

      res.json({ success: true, supplements: results, provider: 'o1-pharmacopeia' });
    } catch (err: any) {
      console.error('Error in /api/fuel/supplement-search:', err);
      res.status(500).json({ error: err.message || 'Internal server error searching supplements' });
    }
  });

  // =========================================================================
  // REVENUECAT MOBILE STORE ENGINE (SECURE WEBHOOKS & ENTITLEMENT SYNC)
  // =========================================================================
  app.post('/api/revenuecat/webhook', handleRevenueCatWebhook);
  app.get('/api/billing/sync-entitlements', handleSyncEntitlements);

  app.post('/api/account/delete', async (req, res) => {
    try {
      const authHeader = String(req.headers.authorization || '');
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated.' });
      }
      if (!supabaseUrl || !serviceKey) {
        return res.status(503).json({ error: 'Account deletion is not configured.' });
      }
      const admin = createClient(supabaseUrl, serviceKey);
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      const uid = userData?.user?.id;
      if (userErr || !uid) {
        return res.status(401).json({ error: 'Not authenticated.' });
      }

      const result = await deleteAccountData(uid);
      if (!result.ok) return res.status(result.status).json({ error: result.error });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[account/delete] failed:', err?.message);
      return res.status(500).json({ error: 'Account deletion failed. Try again.' });
    }
  });

  // =========================================================================
  // STRIPE CONNECT & COACH PAYOUTS (every /api/stripe/* needs a Supabase Bearer JWT; webhook uses signature)
  // =========================================================================
  registerStripeRoutes(app);

  // =========================================================================
  // PUBLIC COMPLIANCE & LEGAL ROUTES (Google Play & Apple Review Standards)
  // =========================================================================
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));

  app.get(['/privacy', '/privacy.html', '/privacy-policy', '/privacy-policy.html'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(publicDir, 'privacy.html'));
  });

  app.get(
    ['/delete-account', '/delete-account.html', '/account-deletion', '/data-deletion'],
    (_req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(path.join(publicDir, 'delete-account.html'));
    }
  );

  app.get(['/terms', '/terms.html', '/terms-of-service', '/terms-of-use', '/eula'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(publicDir, 'terms.html'));
  });

  // =========================================================================
  // VITE MIDDLEWARE / STATIC ASSETS
  // =========================================================================
  const phoneHost = lanIPv4();
  const httpServer = http.createServer(app);
  if (process.env.NODE_ENV !== 'production') {
    const require = createRequire(import.meta.url);
    app.get('/preview-look', (_req, res) => {
      const clearing = _req.query.clear === '1';
      const previewPath = require.resolve('./scripts/preview.cjs');
      delete require.cache[previewPath];
      const pack = clearing ? null : require('./scripts/preview.cjs').bundle();
      const payload = JSON.stringify(pack || {}).replace(/</g, '\\u003c');
      res.type('html').send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview</title><body style="background:#000;color:#fff;font-family:sans-serif;padding:24px"><p>${clearing ? 'Preview rows removed. Returning to the app.' : 'Preview rows saved on this phone. Returning to the app.'}</p><script>
        const pack = ${payload};
        const drop = (key) => {
          const prev = JSON.parse(localStorage.getItem(key) || '[]');
          const list = Array.isArray(prev) ? prev.filter((row) => !String(row && row.id || '').startsWith('preview-')) : [];
          if (list.length) localStorage.setItem(key, JSON.stringify(list));
          else localStorage.removeItem(key);
        };
        if (${clearing ? 'true' : 'false'}) {
          ['o1fc_custom_coach_clients','o1fc_day_checkins_v1','o1_finished_workouts_v1','o1_coach_custom_programs','o1_coach_notes_local','o1_coach_messages_local','o1_buddy_local'].forEach(drop);
          localStorage.removeItem('o1_assigned_local');
          const backup = localStorage.getItem('o1_preview_link_backup');
          if (backup) localStorage.setItem('o1_my_coach', backup); else localStorage.removeItem('o1_my_coach');
          localStorage.removeItem('o1_preview_link_backup');
        } else {
          const keep = (key, rows) => {
            const prev = JSON.parse(localStorage.getItem(key) || '[]');
            const list = Array.isArray(prev) ? prev.filter((row) => !String(row && row.id || '').startsWith('preview-')) : [];
            localStorage.setItem(key, JSON.stringify(rows.concat(list)));
          };
          keep('o1fc_custom_coach_clients', pack.athletes);
          const day = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
          keep('o1fc_day_checkins_v1', pack.checkins.map((row) => Object.assign({}, row, { date: day })));
          keep('o1_finished_workouts_v1', pack.finished);
          keep('o1_coach_custom_programs', pack.programs);
          keep('o1_coach_notes_local', pack.notes);
          keep('o1_coach_messages_local', pack.messages);
          keep('o1_buddy_local', pack.buddies);
          if (localStorage.getItem('o1_preview_link_backup') == null) localStorage.setItem('o1_preview_link_backup', localStorage.getItem('o1_my_coach') || '');
          const photo = localStorage.getItem('o1_profile_avatar_url') || '';
          localStorage.setItem('o1_my_coach', JSON.stringify(Object.assign({}, pack.coach, { avatar: photo })));
          localStorage.setItem('o1_assigned_local', JSON.stringify(pack.assigned));
        }
        location.replace('/');
      </script></body>`);
    });
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: true,
        allowedHosts: true as const,
        hmr: process.env.DISABLE_HMR !== 'true',
        ws: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    process.stdout.write(`[O1 Fuel OS] Full-stack server active on http://0.0.0.0:${PORT}\n`);
    if (phoneHost) process.stdout.write(`[O1 Fuel OS] Phone: http://${phoneHost}:${PORT}/\n`);
  });
}

function lanIPv4(): string | null {
  const nets = os.networkInterfaces();
  const addresses: string[] = [];
  for (const list of Object.values(nets)) {
    for (const net of list || []) {
      const family = String(net.family);
      if ((family === 'IPv4' || family === '4') && !net.internal) addresses.push(net.address);
    }
  }
  return addresses.find((address) => address.startsWith('10.') || address.startsWith('192.168.'))
    || addresses.find((address) => !address.startsWith('169.254.'))
    || null;
}

startServer().catch((err) => {
  console.error('Failed to start Fuel OS server:', err);
});

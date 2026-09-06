import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CARDIO_OCR_PROMPT = `You are a world-class optical character recognition (OCR) and computer vision engine specialized in gym fitness cardio equipment for Oblivion 1 Fitness Club (O1FC).

Carefully examine this photograph of a cardio machine display or exercise console (e.g., Treadmill, StairMaster, Stationary Bike, Assault Air Bike, Concept2 Rower, Elliptical, Apple Watch, Garmin, Casio, etc.).

CRITICAL INSTRUCTIONS:
1. STRICT METRIC TRUTH (ABSOLUTELY ZERO FABRICATION OR HARDCODED FALLBACKS):
   - You MUST read the EXACT digital numerals physically visible on the screen.
   - Look specifically for:
     * Calories Burned: Numbers beside "CALORIES", "KCAL", "CAL", "TOTAL CALS" (e.g. "188 CALORIES" -> 188).
     * Duration / Elapsed Time: Time displays like "46:06", "01:57", "35:00", "00:32:15", "TIME", "ELAPSED".
       - If time is "46:06", that is 46 minutes and 6 seconds (~46.1 minutes, 2766 seconds).
       - Provide durationMinutes as a number (e.g. 46.1) and durationSeconds as total seconds (e.g. 2766).
     * Distance: Numbers beside "KM", "MI", "MILES", "DIST", "DISTANCE" (e.g. "1.85 KM" -> 1.85).
     * Speed / Pace: Look for "KM/H", "MPH", "SPEED", "PACE" (e.g. "2.4 KM/H" -> 2.4).
     * Incline / Level: Look for "INCLINE", "%", "LEVEL", "RESISTANCE" (e.g. 0.0, 1.0, 5).
     * Heart Rate: Look for "BPM", "HR", heart icon.
     * Steps: If visible on screen, extract stepsCount precisely.
     * Smartwatch / Pedometer Steps Calculation: If the screen displays daily steps (such as "5508 STEPS") but does NOT display calories or distance on that screen, calculate caloriesBurned using standard metabolic burn (~0.045 kcal/step), distanceKm (~0.000762 km/step), and durationMinutes (~100 steps/min).

2. MACHINE IDENTIFICATION:
   - Identify the machine apparatus: "treadmill", "stairmaster", "rower", "echo_bike", "elliptical", "outdoor_run", "outdoor_walk".
   - Brand name if visible (e.g., "LifeFitness", "Technogym", "Matrix", "Concept2", "Woodway", "Precor", "Casio", "Apple Watch", "Garmin").

3. NON-CARDIO OR UNREADABLE:
   - If the image does not show a fitness machine console or readable workout metrics, set "isCardioConsole": false and explain in "message".

Return ONLY a valid JSON object matching this schema:
{
  "isCardioConsole": true,
  "machineType": "treadmill",
  "detectedBrand": "LifeFitness",
  "caloriesBurned": 188,
  "durationMinutes": 46.1,
  "durationSeconds": 2766,
  "distanceKm": 1.85,
  "speedKmh": 2.4,
  "incline": 0.0,
  "heartRate": null,
  "stepsCount": null,
  "readings": {
    "calories": "188",
    "elapsed": "46:06",
    "distance": "1.85",
    "speed": "2.4"
  },
  "summary": "46:06 elapsed, 1.85 km, 188 calories burned at 2.4 km/h"
}`;

function jsonReply(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function analyzeConsoleImage(base64Image: string, mimeType: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY") || "";
  if (!apiKey) return null;

  const rawBase64 = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
  const geminiMime = mimeType || "image/jpeg";

  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: CARDIO_OCR_PROMPT }, { inlineData: { mimeType: geminiMime, data: rawBase64 } }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 2048, responseMimeType: "application/json" },
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textContent) throw new Error("Gemini returned no content");

      const jsonStr = textContent.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
      const parsed = JSON.parse(jsonStr);
      return parsed;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to process cardio console image");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method === "POST") {
      const body = await req.json();
      const { image, mimeType } = body;

      if (!image || typeof image !== "string") {
        return jsonReply({ success: false, message: "Missing 'image' field (base64 string)" }, 400);
      }

      try {
        const parsed = await analyzeConsoleImage(image, mimeType || "image/jpeg");
        if (parsed === null) {
          return jsonReply({
            success: false,
            message: "AI Vision is not configured on this server. Please enter metrics manually.",
          });
        }

        if (parsed.isCardioConsole === false) {
          return jsonReply({
            success: false,
            message: parsed.message || "No readable cardio machine screen detected. Please focus camera on the metrics display.",
          }, 422);
        }

        const durationMinutes = typeof parsed.durationMinutes === "number"
          ? Math.round(parsed.durationMinutes * 10) / 10
          : (parsed.durationSeconds ? Math.round((parsed.durationSeconds / 60) * 10) / 10 : 0);

        const caloriesBurned = typeof parsed.caloriesBurned === "number"
          ? Math.round(parsed.caloriesBurned)
          : 0;

        const distanceKm = typeof parsed.distanceKm === "number"
          ? Math.round(parsed.distanceKm * 100) / 100
          : undefined;

        const stepsCount = typeof parsed.stepsCount === "number"
          ? Math.round(parsed.stepsCount)
          : undefined;

        return jsonReply({
          success: true,
          result: {
            machineType: parsed.machineType || "treadmill",
            detectedBrand: parsed.detectedBrand || null,
            durationMinutes,
            caloriesBurned,
            distanceKm,
            stepsCount,
            summary: parsed.summary || `${durationMinutes} min • ${caloriesBurned} kcal`,
          },
        });
      } catch (err: any) {
        return jsonReply({
          success: false,
          message: `Could not analyze cardio console: ${err.message || err}`,
        }, 500);
      }
    }

    return jsonReply({ success: false, message: "Method not allowed" }, 405);
  } catch (err: any) {
    return jsonReply({ success: false, message: err.message || "Unexpected error" }, 500);
  }
});

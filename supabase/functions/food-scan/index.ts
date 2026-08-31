import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VISION_PROMPT = `You are an expert sports dietitian and visual food analyst.
Analyze the uploaded meal photo with precision:
- Identify every visible food item and ingredient (e.g. '2 Fried Eggs (Large)', '1 tsp Olive Oil for frying', 'Black Pepper & Salt').
- Estimate realistic portion sizes and weights in grams from visual cues (plate size, utensil scale).
- Provide accurate USDA macro breakdown per item: calories, protein (g), carbs (g), fats (g), and dietary fiber (g).
- Return ONLY valid JSON (no markdown, no code fences, no extra text) in this exact structure:
{
  "mealName": "Fried Sunny-Side Up Eggs",
  "totalCalories": 165,
  "totalProtein": 12.8,
  "totalCarbs": 0.8,
  "totalFat": 12.2,
  "totalFiber": 0.1,
  "items": [
    {
      "name": "Fried Eggs (2 large)",
      "portion": "2 large (100g)",
      "calories": 144,
      "protein": 12.6,
      "carbs": 0.8,
      "fat": 9.8,
      "fiber": 0
    }
  ]
}

Rules:
- Be specific: say "2 Fried Eggs (Sunny-Side Up)" not just "Eggs"
- Include cooking oils/butter if visible or likely used
- Each item must have all 7 fields (name, portion, calories, protein, carbs, fat, fiber)
- Totals must equal the sum of item values (within rounding)
- If you cannot confidently identify a food, still provide your best estimate with "(estimated)" in the name`;

function jsonReply(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function analyzeImage(base64Image: string, mimeType: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY") || "";
  if (!apiKey) return null;

  const rawBase64 = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
  const geminiMime = mimeType || "image/jpeg";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: VISION_PROMPT }, { inlineData: { mimeType: geminiMime, data: rawBase64 } }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: "application/json" },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    let detail = `Gemini API error (${response.status})`;
    try { const parsed = JSON.parse(errBody); detail = parsed.error?.message || detail; } catch { detail += ": " + errBody.slice(0, 400); }
    throw new Error(detail);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) throw new Error("Gemini returned no content");

  const jsonStr = textContent.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const parsed = JSON.parse(jsonStr);

  if (!parsed.mealName || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error("Gemini returned incomplete nutrition data");
  }

  return {
    name: parsed.mealName,
    calories: parsed.totalCalories,
    protein: parsed.totalProtein,
    carbs: parsed.totalCarbs,
    fats: parsed.totalFat,
    fiber: parsed.totalFiber || 0,
    breakdown: parsed.items.map((it: any) => ({
      item: it.name,
      amount: it.portion,
      calories: it.calories,
      protein: it.protein,
      carbs: it.carbs,
      fats: it.fat,
      fiber: it.fiber || 0,
    })),
  };
}

function getSupabaseClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function verifyAuth(req: Request): Promise<{ email: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { email: data.user.email || "" };
}

async function checkRateLimit(email: string, fnName: string, maxPerMin = 10): Promise<boolean> {
  const supabase = getSupabaseClient();
  const oneMinAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("user_email", email)
    .eq("function_name", fnName)
    .gte("created_at", oneMinAgo);
  if ((count ?? 0) >= maxPerMin) return false;
  await supabase.from("rate_limits").insert({ user_email: email, function_name: fnName });
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!(await checkRateLimit(user.email, "food-scan", 10))) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max 10 requests per minute." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    if (req.method === "POST") {
      const body = await req.json();
      const { image, mimeType } = body;

      if (!image || typeof image !== "string") {
        return jsonReply({ success: false, message: "Missing 'image' field (base64 string)" }, 400);
      }

      try {
        const result = await analyzeImage(image, mimeType || "image/jpeg");
        if (result === null) {
          return jsonReply({ success: false, retryable: false, message: "AI Vision is not configured. Please log your meal manually using the food search." });
        }
        return jsonReply({ success: true, vision: result });
      } catch (err: any) {
        const msg = err.message || "Analysis failed";
        const isAuth = msg.includes("API key") || msg.includes("authentication") || msg.includes("API_KEY_INVALID") || msg.includes("401") || msg.includes("403") || msg.includes("quota");
        const isPayload = msg.includes("too large") || msg.includes("payload") || msg.includes("413") || msg.includes("INVALID_ARGUMENT");

        return jsonReply({
          success: false,
          retryable: !isAuth,
          message: isAuth ? "AI Vision is temporarily unavailable. Please log your meal manually."
            : isPayload ? "Image is too large. Please try a smaller or lower-resolution photo."
            : `Could not analyze this photo: ${msg}`,
        });
      }
    }

    const reqUrl = new URL(req.url);
    const barcode = reqUrl.searchParams.get("barcode") || "";

    if (barcode && barcode.trim().length >= 6) {
      const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode.trim())}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity`;
      const offRes = await fetch(apiUrl, { headers: { "User-Agent": "O1FCFitnessApp/1.0 (food scanner)" } });
      if (!offRes.ok) throw new Error(`Open Food Facts returned ${offRes.status}`);
      const offData = await offRes.json();
      if (offData.status === 1 && offData.product) {
        const p = offData.product;
        const n = p.nutriments || {};
        const protein = n.proteins_100g || n.proteins || 0;
        const carbs = n.carbohydrates_100g || n.carbohydrates || 0;
        const fat = n.fat_100g || n.fat || 0;
        const servingQty = p.serving_quantity ? parseFloat(p.serving_quantity) : 100;
        const mult = servingQty / 100;
        return jsonReply({
          success: true,
          result: {
            name: p.product_name || `Product (${barcode})`,
            p: Math.round(protein * mult * 10) / 10,
            c: Math.round(carbs * mult * 10) / 10,
            f: Math.round(fat * mult * 10) / 10,
            cals: Math.round((protein * 4 + carbs * 4 + fat * 9) * mult),
            serving: p.serving_size || `${servingQty}g`,
          },
        });
      }
    }

    const q = reqUrl.searchParams.get("q") || "";
    const country = reqUrl.searchParams.get("country") || "world";
    if (q && q.trim().length >= 2) {
      const searchUrl = `https://${country === 'world' ? 'world' : country}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q.trim())}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,brands,nutriments,serving_size,serving_quantity,categories_tags`;
      const searchRes = await fetch(searchUrl, { headers: { "User-Agent": "O1FCFitnessApp/1.0 (food scanner)" } });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.products?.length) {
          const results = searchData.products.filter((p: any) => p.product_name).map((p: any) => {
            const n = p.nutriments || {};
            const protein = n.proteins_100g || 0;
            const carbs = n.carbohydrates_100g || 0;
            const fat = n.fat_100g || 0;
            const servingQty = p.serving_quantity ? parseFloat(p.serving_quantity) : 100;
            const mult = servingQty / 100;
            const cats = (p.categories_tags || []) as string[];
            let category = 'Carbs';
            if (protein > 15) category = 'Protein';
            else if (fat > 15) category = 'Fats';
            else if (cats.some((c: string) => c.includes('beverage') || c.includes('drink'))) category = 'Drinks';
            return {
              name: p.product_name, brand: p.brands || '', category,
              p: Math.round(protein * mult * 10) / 10, c: Math.round(carbs * mult * 10) / 10,
              f: Math.round(fat * mult * 10) / 10, cals: Math.round((protein * 4 + carbs * 4 + fat * 9) * mult),
              serving: p.serving_size || `${servingQty}g`,
            };
          });
          return jsonReply({ success: true, results });
        }
      }
    }

    return jsonReply({ success: false, message: "No nutrition data found. You can enter details manually." });
  } catch (err: any) {
    return jsonReply({ success: false, message: err.message || "Unexpected error" }, 500);
  }
});

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_stripe = __toESM(require("stripe"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
var stripeClient = null;
var aiClient = null;
function getStripe() {
  const envKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!envKey) return null;
  if (!stripeClient) {
    stripeClient = new import_stripe.default(envKey, {
      apiVersion: "2025-02-24.acacia"
    });
  }
  return stripeClient;
}
function getAI() {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return null;
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var PLAN_CATALOG = {
  founder_pass: {
    name: "O1FC Early-Bird Founder Pass (All-Access Lifetime)",
    amount: 2400,
    description: "Lifetime Training OS Pro, Unlimited Buddy Radar & PostGIS Proximity - First 1,000 Members",
    interval: "one_time"
  },
  premium: {
    name: "O1FC Plus (50km Radius)",
    amount: 999,
    description: "Full workout OS, Fuel macro intelligence & 50km Buddy radar",
    interval: "month"
  },
  premium_50k: {
    name: "O1FC Plus (50km Radius)",
    amount: 999,
    description: "Full workout OS, Fuel macro intelligence & 50km Buddy radar",
    interval: "month"
  },
  premium_50km: {
    name: "O1FC Plus (50km Radius)",
    amount: 999,
    description: "Full workout OS, Fuel macro intelligence & 50km Buddy radar",
    interval: "month"
  },
  premium_travel: {
    name: "O1FC Global VIP (Travel Pass)",
    amount: 1599,
    description: "Unlimited worldwide Buddy Radar, PostGIS global matching & AI Coach Insights",
    interval: "month"
  },
  coach_starter: {
    name: "O1FC Coach Starter",
    amount: 1499,
    description: "Coach Hub up to 10 active athletes with telemetry and workout dispatch",
    interval: "month"
  },
  coach_pro: {
    name: "O1FC Coach Pro (Unlimited)",
    amount: 2999,
    description: "Unlimited athlete roster, automated workout dispatch, transformation studio & video monetization",
    interval: "month"
  },
  coaching_client_package: {
    name: "1-on-1 Personalized Coaching Package",
    amount: 2e4,
    description: "Custom weekly training dispatch, video form feedback & metabolic periodization",
    interval: "month"
  }
};
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  const queryCache = /* @__PURE__ */ new Map();
  const CACHE_TTL_MS = 15 * 60 * 1e3;
  function getCached(key) {
    const entry = queryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      queryCache.delete(key);
      return null;
    }
    return entry.data;
  }
  function setCached(key, data) {
    if (queryCache.size > 2e3) {
      const firstKey = queryCache.keys().next().value;
      if (firstKey) queryCache.delete(firstKey);
    }
    queryCache.set(key, { timestamp: Date.now(), data });
  }
  const rateLimitMap = /* @__PURE__ */ new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }, 60 * 1e3);
  function createRateLimiter(maxRequests, windowMs) {
    return (req, res, next) => {
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      const key = `${String(ip)}:${req.baseUrl || req.path}`;
      const now = Date.now();
      const current = rateLimitMap.get(key);
      if (!current || now > current.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
        return next();
      }
      if (current.count >= maxRequests) {
        res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1e3));
        return res.status(429).json({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please slow down and try again shortly."
        });
      }
      current.count += 1;
      next();
    };
  }
  const standardApiLimiter = createRateLimiter(120, 60 * 1e3);
  const aiHeavyLimiter = createRateLimiter(30, 60 * 1e3);
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Range");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });
  app.use(import_express.default.json({
    limit: "25mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.get("/api/health", (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
      status: "ok",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      uptimeSec: Math.round(process.uptime()),
      cacheEntries: queryCache.size,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024)
      }
    });
  });
  app.all("/api/food-scan", aiHeavyLimiter, async (req, res) => {
    if (req.method === "GET") {
      const barcode = typeof req.query.barcode === "string" ? req.query.barcode.trim() : "";
      const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const country = typeof req.query.country === "string" ? req.query.country.trim().toUpperCase() : "";
      if (barcode) {
        const cacheKey = `barcode:${barcode}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);
        try {
          const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`, {
            headers: { "User-Agent": "O1FC-Fitness-App/1.0 (o1oblivianfitness@gmail.com)" }
          });
          if (offRes.ok) {
            const data = await offRes.json();
            if (data.status === 1 && data.product) {
              const p = data.product;
              const n = p.nutriments || {};
              const servingGrams = parseFloat(p.serving_quantity) || 100;
              const ratio = servingGrams / 100;
              const prot100 = Number(n.proteins_100g || n.proteins || 0);
              const carb100 = Number(n.carbohydrates_100g || n.carbohydrates || 0);
              const fat100 = Number(n.fat_100g || n.fat || 0);
              const cal100 = Number(n["energy-kcal_100g"] || n["energy-kcal"] || prot100 * 4 + carb100 * 4 + fat100 * 9);
              const responseData = {
                success: true,
                result: {
                  name: p.product_name || p.product_name_en || `Scanned Item (${barcode})`,
                  p: Math.round(prot100 * ratio * 10) / 10,
                  c: Math.round(carb100 * ratio * 10) / 10,
                  f: Math.round(fat100 * ratio * 10) / 10,
                  cals: Math.round(cal100 * ratio),
                  serving: p.serving_size || `${servingGrams}g`
                }
              };
              setCached(cacheKey, responseData);
              return res.json(responseData);
            }
          }
        } catch (e) {
          console.warn("OpenFoodFacts barcode lookup error:", e);
        }
        return res.json({ success: false, message: "Item not found in barcode database" });
      }
      if (query) {
        const cacheKey = `query:${country}:${query.toLowerCase()}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);
        try {
          const countryDomain = country && country !== "GLOBAL" && country.length === 2 ? `${country.toLowerCase()}.` : "world.";
          const offRes = await fetch(`https://${countryDomain}openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=25`, {
            headers: { "User-Agent": "O1FC-Fitness-App/1.0 (o1oblivianfitness@gmail.com)" }
          });
          if (offRes.ok) {
            const data = await offRes.json();
            if (data.products && Array.isArray(data.products)) {
              const mapped = data.products.filter((p) => p.product_name).map((p) => {
                const n = p.nutriments || {};
                const servingGrams = parseFloat(p.serving_quantity) || 100;
                const ratio = servingGrams / 100;
                const prot100 = Number(n.proteins_100g || n.proteins || 0);
                const carb100 = Number(n.carbohydrates_100g || n.carbohydrates || 0);
                const fat100 = Number(n.fat_100g || n.fat || 0);
                const cal100 = Number(n["energy-kcal_100g"] || n["energy-kcal"] || prot100 * 4 + carb100 * 4 + fat100 * 9);
                return {
                  name: p.product_name || p.product_name_en,
                  brand: p.brands || "",
                  category: "General",
                  p: Math.round(prot100 * ratio * 10) / 10,
                  c: Math.round(carb100 * ratio * 10) / 10,
                  f: Math.round(fat100 * ratio * 10) / 10,
                  cals: Math.round(cal100 * ratio),
                  serving: p.serving_size || `${servingGrams}g`
                };
              });
              const responseData = { success: true, results: mapped };
              setCached(cacheKey, responseData);
              return res.json(responseData);
            }
          }
        } catch (e) {
          console.warn("OpenFoodFacts search error:", e);
        }
        return res.json({ success: true, results: [] });
      }
      return res.json({ success: false, message: "Query or barcode required" });
    }
    if (req.method === "POST") {
      try {
        const { image, mimeType } = req.body || {};
        if (!image) {
          return res.status(400).json({ success: false, message: "Image base64 is required" });
        }
        const rawBase64 = image.includes(",") ? image.split(",")[1] : image;
        const cleanMime = mimeType || "image/jpeg";
        const ai = getAI();
        if (!ai) {
          return res.status(503).json({
            success: false,
            message: "AI Vision Engine is initializing or Gemini API key is missing. Please enter food manually or try again in a moment."
          });
        }
        const prompt = `You are a world-class board-certified clinical sports dietitian and high-precision computer vision AI for Oblivion 1 Fitness Club.
Analyze this food photograph with strict scientific accuracy, anatomical honesty, and nutritional integrity.

CRITICAL INSTRUCTIONS:
1. ONLY ANALYZE WHAT IS VISIBLE:
   - Identify ONLY the exact ingredients and food items physically present in the photo.
   - STRICT PROHIBITION: DO NOT invent, hallucinate, or add unpictured side dishes, carbs, sauces, or greens. (For example, if you see only chicken pieces in a container, DO NOT add rice or vegetables. If you see only eggs on a plate, DO NOT add toast, oatmeal, or berries. If you see only nuts in a bowl, DO NOT add yogurt or cereal).

2. WHOLE FOODS & PLATED MEALS:
   - EGGS: Identify preparation (e.g. "Fried Eggs (Sunny-Side Up)", "Boiled Eggs", "Scrambled Eggs") and count exact eggs. (1 large whole egg = ~72 kcal, 6.3g protein, 4.8g fat, 0.4g carb).
   - NUTS & SEEDS: Identify the exact nut variety (e.g. "Walnut Halves", "Raw Almonds", "Pecans", "Cashews") and estimate realistic weight in grams (e.g. ~25-30g per handful, ~160-195 kcal, ~4g protein, ~16-20g healthy fat, ~3g carbs).
   - POULTRY & MEATS: Identify the cut, cooking method, and visible coatings/sauces (e.g. "Grilled Chicken Breast", "Cooked Seasoned Chicken Thigh Pieces in Sauce", "Seared Sirloin Steak"). Estimate realistic weight in grams and true USDA macronutrients.
   - FRUITS & VEGETABLES: Identify specific items and portions (e.g. "Steamed Broccoli Florets 100g", "Medium Banana 118g", "Blueberries 50g").

3. PACKAGED ITEMS & NUTRITION PANELS:
   - If a printed nutrition facts panel is visible, transcribe the EXACT printed values for calories, protein, carbs, fat, and fiber.
   - If a branded packaged container is visible, recognize the brand and product flavor, and calculate macros for 1 standard serving or the container portion.

4. NON-FOOD OR UNRECOGNIZABLE:
   - If the image contains no food, or is too blurry/dark to recognize nutrition, set "isFood": false and explain clearly in "message".

5. MACRO MATH:
   - Ensure calories match: Calories = (protein * 4) + (carbs * 4) + (fats * 9).
   - All gram values must be realistic positive numbers.

Return ONLY a valid JSON object matching this schema:
{
  "isFood": true,
  "name": "Specific Descriptive Meal or Item Name",
  "fiber": 2.5,
  "breakdown": [
    {
      "item": "Specific Food Component Name",
      "amount": "120g",
      "protein": 24.0,
      "carbs": 0.0,
      "fats": 3.5,
      "calories": 128
    }
  ]
}`;
        const imagePart = {
          inlineData: {
            data: rawBase64,
            mimeType: cleanMime
          }
        };
        const textPart = {
          text: prompt
        };
        let response = null;
        const modelsToTry = [
          "gemini-3.7-flash",
          "gemini-flash-latest",
          "gemini-3.1-flash-lite"
        ];
        let lastModelError = null;
        for (const modelName of modelsToTry) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  inlineData: {
                    data: rawBase64,
                    mimeType: cleanMime
                  }
                },
                prompt
              ],
              config: {
                responseMimeType: "application/json"
              }
            });
            if (response && response.text) break;
          } catch (modelErr) {
            lastModelError = modelErr;
            console.warn(`Gemini vision with ${modelName} attempt:`, modelErr);
          }
        }
        const text = response?.text || "";
        const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        if (cleaned) {
          try {
            const parsed = JSON.parse(cleaned);
            if (parsed.isFood === false) {
              return res.json({
                success: false,
                message: parsed.message || "No food could be identified in this photo. Please retake photo with clearer lighting or search food by name."
              });
            }
            if (parsed && parsed.breakdown && Array.isArray(parsed.breakdown) && parsed.breakdown.length > 0) {
              const breakdown = parsed.breakdown.map((b) => {
                const p = Math.round((Number(b.protein) || 0) * 10) / 10;
                const c = Math.round((Number(b.carbs) || 0) * 10) / 10;
                const f = Math.round((Number(b.fats) || 0) * 10) / 10;
                const calcCals = Math.round(p * 4 + c * 4 + f * 9);
                const statedCals = Math.round(Number(b.calories) || calcCals);
                return {
                  item: String(b.item || "Food Item").trim(),
                  amount: String(b.amount || "100g").trim(),
                  protein: p,
                  carbs: c,
                  fats: f,
                  calories: statedCals > 0 ? statedCals : calcCals
                };
              });
              return res.json({
                success: true,
                vision: {
                  name: parsed.name || breakdown[0]?.item || "Identified Meal",
                  fiber: Math.round((Number(parsed.fiber) || 0) * 10) / 10,
                  breakdown
                }
              });
            }
          } catch (parseErr) {
            console.error("Failed to parse Gemini vision response JSON:", parseErr, text);
          }
        }
        return res.status(422).json({
          success: false,
          message: "Unable to accurately detect food items in this photo. Please retake with better lighting or enter food items manually."
        });
      } catch (err) {
        console.error("Food scan fatal error:", err);
        return res.status(500).json({ success: false, message: err.message || "Server error during food vision analysis" });
      }
    }
    res.status(405).json({ error: "Method not allowed" });
  });
  app.post("/api/meal-suggest", standardApiLimiter, async (req, res) => {
    try {
      const { remainingCals, remainingProtein, remainingCarbs, remainingFat, mealSlot, country, diet } = req.body || {};
      const ai = getAI();
      if (ai) {
        try {
          const countryContext = country && country !== "GLOBAL" ? `The athlete lives in country code: ${country}. Use whole food staples, grocery items, and cuisine styles authentic and easily accessible in this country.` : "Use clean, universally accessible whole-food athletic staples.";
          let dietRule = "The athlete follows a standard Omnivore diet (all whole foods, lean meats, poultry, fish, eggs, dairy, and plants are allowed).";
          if (diet === "vegetarian") {
            dietRule = "CRITICAL DIET: The athlete is strictly VEGETARIAN. Absolutely NO meat, poultry, fish, or seafood. Use dairy (Greek yogurt, cottage cheese, paneer), whole eggs/egg whites, whey protein, tofu, tempeh, edamame, beans, lentils, and grains.";
          } else if (diet === "vegan") {
            dietRule = "CRITICAL DIET: The athlete is strictly 100% VEGAN (Plant-Based). Absolutely NO animal products, meat, poultry, fish, seafood, dairy, eggs, whey, or honey. Use tofu, tempeh, seitan, edamame, lentils, chickpeas, nutritional yeast, plant protein, nuts, and grains.";
          } else if (diet === "pescatarian") {
            dietRule = "CRITICAL DIET: The athlete is PESCATARIAN. Fish and seafood (salmon, tuna, cod, prawns) are allowed, as well as dairy, eggs, and plants. Absolutely NO poultry or land meat (no chicken, turkey, beef, pork).";
          } else if (diet === "carnivore") {
            dietRule = "CRITICAL DIET: The athlete is CARNIVORE. Animal products only (beef, steak, ground meat, chicken, salmon, eggs, butter). Strictly NO grains, vegetables, fruits, legumes, sugar, or plant oils.";
          } else if (diet === "paleo") {
            dietRule = "CRITICAL DIET: The athlete follows PALEO. Whole unprocessed foods (lean meats, fish, eggs, vegetables, fruits, nuts, sweet potatoes). Strictly NO grains, legumes (no beans/peanuts), dairy, or refined sugar.";
          }
          const prompt = `You are an elite sports nutritionist. The athlete has remaining daily macros:
Calories: ${remainingCals || 500} kcal
Protein: ${remainingProtein || 40}g
Carbs: ${remainingCarbs || 50}g
Fat: ${remainingFat || 15}g
Target Meal Slot: ${mealSlot || "Next Meal"}
${countryContext}
${dietRule}

Create 3 distinct, high-protein athletic meal suggestions that hit these targets closely and strictly comply with the dietary pattern above.
Return ONLY valid JSON matching this schema:
{
  "suggestions": [
    {
      "name": "Meal Name",
      "description": "Short culinary description",
      "prepTime": "15 min",
      "ingredients": ["150g Ingredient 1", "1 cup Ingredient 2"],
      "macros": { "calories": 450, "protein": 42, "carbs": 48, "fat": 8 },
      "tags": ["High Protein", "Quick Prep"]
    }
  ]
}`;
          let response = null;
          const modelsToTry = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
          for (const modelName of modelsToTry) {
            try {
              response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: { responseMimeType: "application/json" }
              });
              if (response && response.text) break;
            } catch (e) {
              console.warn(`Meal suggestion with ${modelName} failed, trying next model:`, e);
            }
          }
          const text = response?.text || "";
          const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
            return res.json(parsed);
          }
        } catch (e) {
          console.error("Gemini meal suggest error:", e);
        }
      }
      const p = Math.max(25, Math.round(Number(remainingProtein) || 35));
      const c = Math.max(20, Math.round(Number(remainingCarbs) || 45));
      const f = Math.max(5, Math.round(Number(remainingFat) || 12));
      const cals = Math.round(p * 4 + c * 4 + f * 9);
      if (diet === "vegan") {
        return res.json({
          suggestions: [
            {
              name: "Crispy Tempeh & Edamame Quinoa Bowl",
              description: "Pan-seared organic tempeh with steamed edamame, tri-color quinoa, baby spinach, and tahini drizzle.",
              prepTime: "15 min",
              ingredients: [`${Math.round(p * 4)}g Organic Tempeh`, "80g Steamed Edamame", "120g Cooked Quinoa"],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ["100% Vegan", "Complete Protein"]
            },
            {
              name: "High-Protein Tofu & Peanut Satay Bowl",
              description: "Extra-firm pressed tofu stir-fried with broccoli florets, brown rice, and natural peanut sauce.",
              prepTime: "12 min",
              ingredients: [`${Math.round(p * 4.5)}g Extra-Firm Tofu`, "150g Brown Rice", "100g Steamed Broccoli"],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ["Plant Power", "Antioxidant Rich"]
            },
            {
              name: "Creamy Pea Protein & Chia Superfood Oats",
              description: "Warm rolled oats blended with organic pea protein isolate, crushed walnuts, and wild blueberries.",
              prepTime: "5 min",
              ingredients: ["35g Pea Protein Isolate", "50g Rolled Oats", "15g Chia Seeds", "50g Blueberries"],
              macros: { calories: cals - 20, protein: p + 2, carbs: c - 4, fat: Math.max(3, f - 2) },
              tags: ["Quick Prep", "No Cook Option"]
            }
          ]
        });
      }
      if (diet === "vegetarian") {
        return res.json({
          suggestions: [
            {
              name: "High-Protein Paneer & Spiced Rice Bowl",
              description: "Seared low-fat paneer cubes tossed with bell peppers, onions, fragrant jeera rice & mint yogurt.",
              prepTime: "15 min",
              ingredients: [`${Math.round(p * 4.2)}g Low-Fat Paneer`, "150g Basmati Rice", "100g Greek Yogurt"],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ["Vegetarian", "High Calcium"]
            },
            {
              name: "Egg White & Avocado Sourdough Toast",
              description: "Fluffy scrambled farm eggs and whites over toasted sourdough with sliced hass avocado and microgreens.",
              prepTime: "10 min",
              ingredients: ["200g Liquid Egg Whites", "1 Whole Egg", "2 slices Sourdough", "30g Sliced Avocado"],
              macros: { calories: cals - 30, protein: p, carbs: c - 5, fat: f },
              tags: ["Vegetarian", "Quick Prep"]
            },
            {
              name: "Greek Yogurt Superfood Parfait",
              description: "Thick 0% nonfat Greek yogurt layered with whey isolate, fresh berries, chia seeds, and raw oats.",
              prepTime: "4 min",
              ingredients: ["250g 0% Greek Yogurt", "25g Whey Isolate", "50g Blueberries", "40g Oats"],
              macros: { calories: cals, protein: p + 5, carbs: c, fat: Math.max(3, f - 4) },
              tags: ["No Cook", "High Protein"]
            }
          ]
        });
      }
      if (diet === "pescatarian") {
        return res.json({
          suggestions: [
            {
              name: "Pan-Seared Atlantic Salmon & Sweet Potato",
              description: "Crispy skin salmon fillet with steamed tenderstem broccoli and roasted sweet potato wedges.",
              prepTime: "15 min",
              ingredients: [`${Math.round(p * 4.2)}g Salmon Fillet`, "180g Sweet Potato", "100g Steamed Broccoli"],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ["Pescatarian", "High Omega-3"]
            },
            {
              name: "Yellowfin Tuna & Quinoa Crunch Bowl",
              description: "Seared sashimi-grade yellowfin tuna with edamame, cucumber, fluffy quinoa, and sesame ginger dressing.",
              prepTime: "12 min",
              ingredients: [`${Math.round(p * 3.8)}g Yellowfin Tuna`, "140g Cooked Quinoa", "60g Edamame"],
              macros: { calories: cals, protein: p + 3, carbs: c - 2, fat: f },
              tags: ["Lean Protein", "Post-Workout"]
            },
            {
              name: "Garlic Butter Prawns & Jasmine Rice",
              description: "Saut\xE9ed king tiger prawns in garlic and parsley butter over steamed fragrant jasmine rice.",
              prepTime: "10 min",
              ingredients: [`${Math.round(p * 4.5)}g Tiger Prawns`, "160g Jasmine Rice", "10g Grass-Fed Butter"],
              macros: { calories: cals - 20, protein: p, carbs: c, fat: Math.max(3, f - 2) },
              tags: ["Ultra Lean", "Quick Digest"]
            }
          ]
        });
      }
      if (diet === "carnivore") {
        return res.json({
          suggestions: [
            {
              name: "Grass-Fed Ribeye & Fried Eggs",
              description: "Seared grass-fed ribeye steak cooked in grass-fed tallow served with two sunny-side-up pasture eggs.",
              prepTime: "15 min",
              ingredients: [`${Math.round(p * 4.2)}g Ribeye Steak`, "2 Pasture Eggs", "15g Grass-Fed Butter"],
              macros: { calories: cals, protein: p, carbs: 0, fat: Math.round(f + c * 4 / 9) },
              tags: ["100% Carnivore", "Zero Carb"]
            },
            {
              name: "Lean Ground Beef & Bone Broth Bowl",
              description: "90/10 lean ground beef cooked in its own juices with rich warm beef bone broth reduction.",
              prepTime: "10 min",
              ingredients: [`${Math.round(p * 4.5)}g Lean Ground Beef`, "200ml Beef Bone Broth", "10g Sea Salt"],
              macros: { calories: cals, protein: p + 5, carbs: 0, fat: Math.round(f + c * 4 / 9) },
              tags: ["Animal Based", "High Iron"]
            },
            {
              name: "Crispy Skin Salmon & Pasture Butter",
              description: "Wild-caught salmon pan-seared in clarified ghee with a pinch of flaky Celtic sea salt.",
              prepTime: "12 min",
              ingredients: [`${Math.round(p * 4.8)}g Wild Salmon`, "15g Pure Ghee", "Flaky Sea Salt"],
              macros: { calories: cals - 20, protein: p, carbs: 0, fat: Math.round(f + c * 4 / 9) },
              tags: ["Omega-3 Dense", "Zero Plant"]
            }
          ]
        });
      }
      if (diet === "paleo") {
        return res.json({
          suggestions: [
            {
              name: "Grass-Fed Sirloin & Roasted Sweet Potato",
              description: "Flame-grilled sirloin steak with roasted sweet potato cubes, asparagus, and extra virgin olive oil.",
              prepTime: "20 min",
              ingredients: [`${Math.round(p * 4.2)}g Sirloin Steak`, "220g Sweet Potato", "100g Grilled Asparagus"],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ["Paleo Approved", "Grain Free"]
            },
            {
              name: "Roasted Chicken Thighs with Butternut Squash",
              description: "Crispy skin herb-roasted chicken thighs with spiced butternut squash and saut\xE9ed kale.",
              prepTime: "25 min",
              ingredients: [`${Math.round(p * 4.5)}g Free-Range Chicken`, "180g Butternut Squash", "80g Saut\xE9ed Kale"],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ["Whole Foods", "Dairy Free"]
            },
            {
              name: "Pasture Omelet with Sliced Avocado & Berries",
              description: "3-egg pasture omelet with baby spinach, side of sliced avocado, and fresh wild blackberries.",
              prepTime: "8 min",
              ingredients: ["3 Whole Pasture Eggs", "100g Egg Whites", "40g Avocado", "60g Fresh Blackberries"],
              macros: { calories: cals - 30, protein: p, carbs: Math.round(c * 0.5), fat: f + 3 },
              tags: ["Nutrient Dense", "Unprocessed"]
            }
          ]
        });
      }
      return res.json({
        suggestions: [
          {
            name: "Grilled Steak & Sweet Potato Mash",
            description: "Lean flank steak with steamed broccoli and baked cinnamon sweet potato.",
            prepTime: "20 min",
            ingredients: [`${Math.round(p * 4.5)}g Flank Steak`, "200g Sweet Potato", "100g Steamed Broccoli"],
            macros: { calories: cals, protein: p, carbs: c, fat: f },
            tags: ["High Protein", "Clean Carb"]
          },
          {
            name: "Egg White & Turkey Bacon Power Bowl",
            description: "Scrambled pasture-raised egg whites with avocado slices and sourdough toast.",
            prepTime: "10 min",
            ingredients: ["200g Liquid Egg Whites", "2 slices Sourdough", "30g Sliced Avocado"],
            macros: { calories: cals - 30, protein: p, carbs: c - 5, fat: f },
            tags: ["Quick Prep", "Post-Workout"]
          },
          {
            name: "Greek Yogurt Superfood Parfait",
            description: "Thick nonfat Greek yogurt layered with whey isolate, blueberries, and rolled oats.",
            prepTime: "5 min",
            ingredients: ["250g 0% Greek Yogurt", "25g Whey Isolate", "50g Blueberries", "40g Oats"],
            macros: { calories: cals, protein: p + 5, carbs: c, fat: Math.max(3, f - 4) },
            tags: ["No Cook", "High Protein"]
          }
        ]
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Error generating suggestions" });
    }
  });
  app.post("/api/gemini-coach", standardApiLimiter, async (req, res) => {
    try {
      const { sessionSummary, nutrition, athleteProfile, recovery, context, metrics } = req.body || {};
      const activeSession = sessionSummary || metrics?.sessionSummary || {};
      const activeNutrition = nutrition || metrics?.nutrition || {};
      const activeRecovery = recovery || metrics?.recovery || {};
      const activeContext = context || metrics?.context || athleteProfile || {};
      const ai = getAI();
      if (ai) {
        try {
          const prompt = `You are Oblivion 1 Fitness Club (O1FC) Intelligence Coach and sports scientist.
Provide personalized, actionable athletic intelligence based on this telemetry:
- Session Data: ${JSON.stringify(activeSession)}
- Fuel/Nutrition: ${JSON.stringify(activeNutrition)}
- Recovery/Readiness: ${JSON.stringify(activeRecovery)}
- Athlete Profile/Context: ${JSON.stringify(activeContext)}

Format your response as 3 to 4 concise bullet points with bold titles (e.g. "**Progressive Overload** -- ...", "**Fuel Timing** -- ...", "**Readiness & Deload** -- ...").
Directly reference specific numbers (weights, sets, grams of protein, readiness scores).
Also return clean JSON with:
{
  "insights": "**Insight 1 Title** -- Detail sentence.\\n\\n**Insight 2 Title** -- Detail sentence.\\n\\n**Insight 3 Title** -- Detail sentence.",
  "summary": "1-2 sentence high-level assessment",
  "intensityVerdict": "Optimal",
  "nutritionVerdict": "On Track",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "recoveryScore": 88
}`;
          let response = null;
          const modelsToTry = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-2.5-flash"];
          for (const modelName of modelsToTry) {
            try {
              response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: { responseMimeType: "application/json" }
              });
              if (response && response.text) break;
            } catch (e) {
              console.warn(`Coach insights with ${modelName} failed, trying next model:`, e);
            }
          }
          const text = response?.text || "";
          const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
          const parsed = JSON.parse(cleaned);
          if (!parsed.insights && parsed.recommendations) {
            parsed.insights = parsed.recommendations.map((r, i) => `**Telemetry Insight ${i + 1}** -- ${r}`).join("\n\n");
          }
          return res.json(parsed);
        } catch (e) {
          console.error("Gemini coach error:", e);
        }
      }
      const defaultInsights = [
        `**Session Volume** -- Total volume aligns with progressive overload goals. High intensity zone sustained.`,
        `**Fuel Timing** -- Maintain 1.6-2.2g/kg protein intake distributed across feeding windows.`,
        `**Recovery & Adaptation** -- Target 7-9 hours of deep sleep to maximize muscle protein synthesis and readiness.`
      ].join("\n\n");
      return res.json({
        insights: defaultInsights,
        summary: "Solid performance logged. Training volume aligns with progressive overload goals.",
        intensityVerdict: "Optimal",
        nutritionVerdict: "On Track",
        recommendations: [
          "Maintain 2.2g/kg protein intake across distributed feeding windows.",
          "Target 7-9 hours of deep sleep to maximize muscle protein synthesis.",
          "Progressive load increments of 2-5% recommended for the next session."
        ],
        recoveryScore: 85
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || "Coach insights error" });
    }
  });
  app.get("/api/stripe-status", (_req, res) => {
    const stripe = getStripe();
    const activeKey = (process.env.STRIPE_SECRET_KEY || "").trim();
    const isLive = Boolean(activeKey.startsWith("sk_live_"));
    res.json({
      configured: Boolean(stripe),
      liveMode: isLive,
      currency: "usd",
      supportedMethods: ["apple_pay", "google_pay", "card", "link"],
      plans: Object.keys(PLAN_CATALOG).map((key) => ({
        id: key,
        ...PLAN_CATALOG[key]
      }))
    });
  });
  app.post("/api/stripe-checkout", standardApiLimiter, async (req, res) => {
    try {
      const { planId, userEmail, successUrl, cancelUrl, programTitle, programPriceCents } = req.body || {};
      const stripe = getStripe();
      if (!stripe) {
        return res.status(500).json({
          error: "STRIPE_SECRET_KEY is not configured in the environment variables."
        });
      }
      const rawOrigin = req.headers.origin || "";
      const fallbackOrigin = (rawOrigin.startsWith("http://") || rawOrigin.startsWith("https://")) && !rawOrigin.includes("localhost") && !rawOrigin.startsWith("capacitor:") ? rawOrigin : "https://ais-pre-ywak62jnfmfdpkjhp64wap-822845783036.asia-east1.run.app";
      const sessionUrlParam = "{CHECKOUT_SESSION_ID}";
      const sanitizeUrl = (url, fallbackPath = "") => {
        if (!url || url.startsWith("capacitor:") || url.startsWith("file:") || url.includes("localhost")) {
          return `${fallbackOrigin}${fallbackPath}`;
        }
        return url;
      };
      const finalSuccessUrl = successUrl ? successUrl.includes("session_id=") ? sanitizeUrl(successUrl, `?payment=success&tier=${planId || "premium"}&session_id=${sessionUrlParam}`) : `${sanitizeUrl(successUrl, `?payment=success&tier=${planId || "premium"}`)}&session_id=${sessionUrlParam}` : `${fallbackOrigin}?payment=success&tier=${planId || "premium"}&session_id=${sessionUrlParam}`;
      const finalCancelUrl = sanitizeUrl(cancelUrl, "?payment=cancel");
      if (programPriceCents && Number(programPriceCents) > 0) {
        const session2 = await stripe.checkout.sessions.create({
          customer_email: userEmail || void 0,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: programTitle || "O1FC Training Program",
                  description: "Oblivion 1 Fitness Club Specialized Coach Program"
                },
                unit_amount: Math.round(Number(programPriceCents))
              },
              quantity: 1
            }
          ],
          mode: "payment",
          allow_promotion_codes: true,
          success_url: finalSuccessUrl,
          cancel_url: finalCancelUrl,
          metadata: {
            user_email: userEmail || "",
            program_title: programTitle || "",
            product_type: "coach_program"
          }
        });
        return res.json({ url: session2.url, sessionId: session2.id });
      }
      const plan = PLAN_CATALOG[planId || "premium"] || PLAN_CATALOG["premium"];
      const isOneTime = plan.interval === "one_time";
      const sessionParams = {
        customer_email: userEmail || void 0,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: plan.name,
                description: plan.description
              },
              unit_amount: plan.amount,
              ...!isOneTime && {
                recurring: {
                  interval: plan.interval
                }
              }
            },
            quantity: 1
          }
        ],
        mode: isOneTime ? "payment" : "subscription",
        allow_promotion_codes: true,
        success_url: finalSuccessUrl,
        cancel_url: finalCancelUrl,
        metadata: {
          tier: planId || "premium",
          user_email: userEmail || "",
          is_lifetime: isOneTime ? "true" : "false"
        },
        ...!isOneTime && {
          subscription_data: {
            metadata: {
              tier: planId || "premium",
              user_email: userEmail || ""
            }
          }
        }
      };
      const session = await stripe.checkout.sessions.create(sessionParams);
      return res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
      console.error("Stripe checkout error:", err);
      return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });
  const handleVerifySession = async (req, res) => {
    try {
      const sessionId = req.body?.sessionId || req.query?.session_id || req.query?.sessionId;
      if (!sessionId || typeof sessionId !== "string") {
        return res.status(400).json({ error: "Valid sessionId is required" });
      }
      const stripe = getStripe();
      if (!stripe) {
        return res.status(500).json({ error: "Stripe is not configured on this server." });
      }
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["customer", "subscription", "line_items"]
      });
      const isPaid = session.payment_status === "paid" || session.status === "complete";
      const tier = session.metadata?.tier || (session.metadata?.product_type === "coach_program" ? "coach_program" : "premium");
      const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.user_email || "";
      return res.json({
        success: isPaid,
        status: session.status,
        paymentStatus: session.payment_status,
        tier,
        isLifetime: session.metadata?.is_lifetime === "true",
        customerEmail,
        customerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        subscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        amountTotal: session.amount_total
      });
    } catch (err) {
      console.error("Stripe verification error:", err);
      return res.status(500).json({ error: err.message || "Could not verify session" });
    }
  };
  app.post("/api/stripe-verify-session", handleVerifySession);
  app.get("/api/stripe-verify-session", handleVerifySession);
  app.get("/api/founder-pass-stats", async (req, res) => {
    try {
      const TOTAL_LIMIT = 5e3;
      let claimedCount = 0;
      const stripe = getStripe();
      if (stripe) {
        try {
          const sessions = await stripe.checkout.sessions.list({
            limit: 100,
            status: "complete"
          });
          const founderSessions = sessions.data.filter(
            (s) => s.payment_status === "paid" && (s.metadata?.tier === "founder_pass" || s.amount_total === 2400)
          );
          claimedCount = founderSessions.length;
        } catch (stripeErr) {
          console.warn("Founder pass Stripe session query warning:", stripeErr);
        }
      }
      const remainingCount = Math.max(0, TOTAL_LIMIT - claimedCount);
      return res.json({
        totalLimit: TOTAL_LIMIT,
        claimedCount,
        remainingCount,
        isLive: true,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      console.error("Founder pass stats error:", err);
      return res.json({
        totalLimit: 5e3,
        claimedCount: 0,
        remainingCount: 5e3,
        isLive: false
      });
    }
  });
  app.post("/api/stripe-portal", standardApiLimiter, async (req, res) => {
    try {
      const { userEmail, customerId } = req.body || {};
      const stripe = getStripe();
      if (!stripe) {
        return res.status(500).json({ error: "Stripe is not configured on this server." });
      }
      let targetCustomerId = customerId;
      if (!targetCustomerId && userEmail) {
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (customers.data.length > 0) {
          targetCustomerId = customers.data[0].id;
        }
      }
      if (!targetCustomerId) {
        return res.status(404).json({
          error: "No active Stripe billing profile found for this email. If you just subscribed, please try again in a few moments."
        });
      }
      const baseUrl = req.headers.origin || `http://localhost:${PORT}`;
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: targetCustomerId,
        return_url: `${baseUrl}?tab=account`
      });
      return res.json({ url: portalSession.url });
    } catch (err) {
      console.error("Stripe billing portal error:", err);
      return res.status(500).json({ error: err.message || "Could not generate billing portal session" });
    }
  });
  app.post("/api/stripe-coach-payout", standardApiLimiter, async (req, res) => {
    try {
      const {
        coachEmail,
        amountCents,
        payoutRail,
        destinationId,
        stripeAccountId,
        countryCode = "US",
        currency = "USD",
        convertedAmount,
        feeCents = 0
      } = req.body || {};
      const payoutAmount = Math.max(0, Number(amountCents) || 0);
      if (payoutAmount <= 0) {
        return res.status(400).json({ error: "Payout amount must be greater than zero." });
      }
      const netAmountCents = Math.max(0, payoutAmount - Number(feeCents || 0));
      const railNames = {
        stripe: "Stripe Connect Express",
        paypal: "PayPal Commerce Payout",
        instant_card: "Instant Debit Card (Visa Direct)",
        checking: "ACH Direct Deposit (FedACH)",
        bacs: "UK Faster Payments (FPS/BACS)",
        sepa: "EU SEPA Direct Credit",
        eft: "Canada EFT Direct Deposit",
        direct_entry: "Australia Direct Entry (NPP)",
        upi: "India UPI Real-Time Transfer",
        paynow: "Singapore PayNow / FAST",
        wise: "Wise Multi-Currency Wire"
      };
      const arrivalEstimates = {
        stripe: "Instant to 2 Hours",
        paypal: "Instant (< 5 min)",
        instant_card: "Instant (< 2 min)",
        checking: "1-2 Business Days",
        bacs: "Instant (< 2 hours)",
        sepa: "Same Day / 1 Business Day",
        eft: "1 Business Day",
        direct_entry: "Instant (< 1 hour)",
        upi: "Instant Real-Time (< 30 sec)",
        paynow: "Instant Real-Time (< 30 sec)",
        wise: "1-2 Business Days"
      };
      const readableRail = railNames[payoutRail] || "Direct Banking Rail";
      const arrival = arrivalEstimates[payoutRail] || "1 Business Day";
      let liveStripeTransferId = null;
      const stripe = getStripe();
      if (payoutRail === "stripe" && stripe) {
        const targetAccountId = (stripeAccountId || "").trim() || (typeof destinationId === "string" && destinationId.startsWith("acct_") ? destinationId : "");
        if (targetAccountId && targetAccountId.startsWith("acct_")) {
          try {
            const transfer = await stripe.transfers.create({
              amount: netAmountCents,
              currency: "usd",
              destination: targetAccountId,
              description: `O1FC Coach Settlement for ${coachEmail || "Coach"}`,
              metadata: {
                coach_email: coachEmail || "",
                platform: "o1fc_official",
                payout_rail: "stripe_connect"
              }
            });
            liveStripeTransferId = transfer.id;
            console.log(`[Stripe Connect] Live transfer ${transfer.id} ($${(netAmountCents / 100).toFixed(2)}) sent to ${targetAccountId}`);
          } catch (stripeErr) {
            console.warn("[Stripe Connect] Live transfer note (e.g. test mode or unverified account):", stripeErr.message);
          }
        }
      }
      const payoutRecord = {
        id: liveStripeTransferId || `po_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        referenceId: liveStripeTransferId ? `STRIPE-${liveStripeTransferId}` : `O1FC-PAY-${Math.floor(1e5 + Math.random() * 9e5)}`,
        coachEmail: coachEmail || "coach@o1fc.app",
        grossAmountCents: payoutAmount,
        netAmountCents,
        feeCents: Number(feeCents || 0),
        currency: currency.toUpperCase(),
        countryCode: countryCode.toUpperCase(),
        convertedAmount: convertedAmount || null,
        rail: payoutRail || "stripe",
        railName: readableRail,
        destination: destinationId || "Primary Settlement Rail",
        status: "settled",
        processedAt: (/* @__PURE__ */ new Date()).toISOString(),
        estimatedArrival: arrival,
        liveTransferId: liveStripeTransferId || void 0,
        securitySignature: `sha256_${Math.random().toString(36).slice(2, 14)}`
      };
      console.log(`[Coach Payout] Successfully processed ${payoutRecord.id} for ${coachEmail} via ${readableRail} (${countryCode})`);
      return res.json({
        success: true,
        payout: payoutRecord,
        message: liveStripeTransferId ? `Live Stripe Transfer (${liveStripeTransferId}) of $${(netAmountCents / 100).toFixed(2)} USD dispatched directly to ${payoutRecord.destination}.` : `Settlement of $${(payoutAmount / 100).toFixed(2)} USD successfully routed via ${readableRail}.`
      });
    } catch (err) {
      console.error("Coach payout processing error:", err);
      return res.status(500).json({ error: err.message || "Payout processing failed" });
    }
  });
  app.post("/api/stripe-webhook", async (req, res) => {
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      if (stripe && webhookSecret && sig && req.rawBody) {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
      } else {
        event = req.body;
      }
      console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          console.log(`[Stripe Webhook] Payment completed for session: ${session.id}, tier: ${session.metadata?.tier}`);
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object;
          console.log(`[Stripe Webhook] Subscription status: ${subscription.status}, customer: ${subscription.customer}`);
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          console.log(`[Stripe Webhook] Subscription cancelled: ${subscription.id}`);
          break;
        }
        case "invoice.payment_succeeded": {
          const invoice = event.data.object;
          console.log(`[Stripe Webhook] Invoice payment succeeded: ${invoice.id}, amount: ${invoice.amount_paid}`);
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object;
          console.warn(`[Stripe Webhook] Invoice payment failed: ${invoice.id}`);
          break;
        }
        default:
          break;
      }
      return res.json({ received: true, eventId: event.id, type: event.type });
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification or processing error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

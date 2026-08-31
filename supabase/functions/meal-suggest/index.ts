import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MealSuggestion {
  name: string;
  description: string;
  prepTime: string;
  ingredients: string[];
  macros: { calories: number; protein: number; carbs: number; fat: number };
  tags: string[];
}

function generateFallbackMeals(remainingCals: number, remainingProtein: number, remainingCarbs: number, remainingFat: number, mealSlot?: string): { suggestions: MealSuggestion[] } {
  const mealBank: MealSuggestion[] = [
    { name: "Grilled Chicken & Rice Bowl", description: "Seasoned chicken breast over jasmine rice with steamed broccoli and soy-ginger glaze", prepTime: "15 min", ingredients: ["180g chicken breast", "150g cooked rice", "100g broccoli", "1 tsp soy sauce", "1 tsp sesame oil"], macros: { calories: 480, protein: 42, carbs: 48, fat: 10 }, tags: ["high-protein", "meal-prep-friendly"] },
    { name: "Greek Yogurt Protein Bowl", description: "Thick Greek yogurt layered with honey, almonds, and berries", prepTime: "3 min", ingredients: ["250g Greek yogurt (0%)", "20g almonds", "80g mixed berries", "1 tsp honey"], macros: { calories: 310, protein: 30, carbs: 28, fat: 10 }, tags: ["high-protein", "quick", "snack"] },
    { name: "Salmon & Sweet Potato", description: "Pan-seared salmon fillet with roasted sweet potato and asparagus", prepTime: "20 min", ingredients: ["150g salmon fillet", "200g sweet potato", "100g asparagus", "1 tsp olive oil", "lemon wedge"], macros: { calories: 520, protein: 38, carbs: 42, fat: 18 }, tags: ["omega-3", "balanced"] },
    { name: "Egg White & Avocado Toast", description: "Fluffy egg whites on sourdough with mashed avocado and everything seasoning", prepTime: "8 min", ingredients: ["5 egg whites", "2 slices sourdough bread", "60g avocado", "everything seasoning"], macros: { calories: 380, protein: 28, carbs: 35, fat: 14 }, tags: ["quick", "breakfast"] },
    { name: "Turkey Mince Stir-Fry", description: "Lean turkey mince with bell peppers, onions, and rice noodles in chilli-garlic sauce", prepTime: "12 min", ingredients: ["200g turkey mince (lean)", "100g bell peppers", "80g rice noodles", "1 tbsp chilli-garlic sauce"], macros: { calories: 450, protein: 44, carbs: 38, fat: 10 }, tags: ["high-protein", "quick"] },
    { name: "Tuna & Quinoa Salad", description: "Tuna chunks tossed with quinoa, cucumber, tomato, and lemon-herb dressing", prepTime: "10 min", ingredients: ["150g canned tuna (drained)", "120g cooked quinoa", "80g cucumber", "60g cherry tomatoes", "1 tbsp olive oil"], macros: { calories: 420, protein: 40, carbs: 30, fat: 14 }, tags: ["high-protein", "no-cook"] },
    { name: "Protein Smoothie", description: "Creamy banana-peanut butter smoothie with whey protein and oat milk", prepTime: "3 min", ingredients: ["30g whey protein", "1 banana", "15g peanut butter", "250ml oat milk", "ice"], macros: { calories: 380, protein: 32, carbs: 40, fat: 12 }, tags: ["quick", "post-workout", "liquid"] },
    { name: "Cottage Cheese & Fruit Plate", description: "Creamy cottage cheese with pineapple chunks, walnuts, and a drizzle of honey", prepTime: "2 min", ingredients: ["200g cottage cheese", "80g pineapple", "15g walnuts", "1 tsp honey"], macros: { calories: 290, protein: 26, carbs: 22, fat: 10 }, tags: ["quick", "snack", "high-protein"] },
  ];

  const scored = mealBank.map((meal) => {
    const calDiff = Math.abs(meal.macros.calories - remainingCals);
    const protDiff = Math.abs(meal.macros.protein - remainingProtein);
    const score = calDiff * 0.5 + protDiff * 3;
    return { meal, score };
  });

  scored.sort((a, b) => a.score - b.score);
  return { suggestions: scored.slice(0, 3).map((s) => s.meal) };
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

function validateMealInput(body: any): string | null {
  if (!body || typeof body !== "object") return "Request body must be a JSON object";
  if (typeof body.remainingCals !== "number" || body.remainingCals < 0 || body.remainingCals > 10000) return "remainingCals must be 0-10000";
  if (body.remainingProtein !== undefined && (typeof body.remainingProtein !== "number" || body.remainingProtein < 0 || body.remainingProtein > 1000)) return "remainingProtein must be 0-1000";
  if (body.remainingCarbs !== undefined && (typeof body.remainingCarbs !== "number" || body.remainingCarbs < 0 || body.remainingCarbs > 2000)) return "remainingCarbs must be 0-2000";
  if (body.remainingFat !== undefined && (typeof body.remainingFat !== "number" || body.remainingFat < 0 || body.remainingFat > 1000)) return "remainingFat must be 0-1000";
  if (body.mealSlot !== undefined && typeof body.mealSlot !== "string") return "mealSlot must be a string";
  if (body.preferences !== undefined && typeof body.preferences !== "string") return "preferences must be a string";
  if (body.recentMeals !== undefined && !Array.isArray(body.recentMeals)) return "recentMeals must be an array";
  return null;
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

  if (!(await checkRateLimit(user.email, "meal-suggest", 10))) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max 10 requests per minute." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const validationError = validateMealInput(body);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { remainingCals, remainingProtein, remainingCarbs, remainingFat, mealSlot, preferences, recentMeals } = body;

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (apiKey) {
      try {
        const prompt = `You are a sports dietitian AI. The athlete needs to fill their remaining macro budget for their next meal.

REMAINING BUDGET:
- Calories: ${remainingCals} kcal
- Protein: ${remainingProtein}g
- Carbs: ${remainingCarbs}g
- Fat: ${remainingFat}g

MEAL SLOT: ${mealSlot || 'Any'}
${preferences ? `PREFERENCES/RESTRICTIONS: ${preferences}` : ''}
${recentMeals?.length ? `RECENT MEALS (avoid repetition): ${recentMeals.join(', ')}` : ''}

Suggest exactly 3 meal options that fit within this budget. Each meal should:
- Be practical to prepare (under 20 min) or easily available
- Hit the protein target as closely as possible (prioritize protein)
- Include specific portion sizes in grams/ml
- Be real food combinations (not just "chicken and rice" -- be specific and appetizing)

Return ONLY valid JSON (no markdown, no code fences):
{
  "suggestions": [
    {
      "name": "Meal name",
      "description": "Brief appetizing description",
      "prepTime": "X min",
      "ingredients": ["200g ingredient 1", "100g ingredient 2"],
      "macros": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
      "tags": ["high-protein", "quick", etc]
    }
  ]
}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 800, topP: 0.9 },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleaned);
          return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch (_aiErr) {
        // fall through
      }
    }

    const result = generateFallbackMeals(remainingCals, remainingProtein, remainingCarbs, remainingFat, mealSlot);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

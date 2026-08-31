import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AthleteMetrics {
  sessionSummary: {
    exercises: { name: string; muscle: string; topWeight: number; topReps: number; sets: number; volume: number }[];
    totalVolume: number;
    totalSets: number;
    avgRPE: number;
    intensityZone: string;
    estimatedCalsBurned: number;
  };
  nutrition: {
    caloriesEaten: number;
    calorieTarget: number;
    proteinEaten: number;
    proteinTarget: number;
    carbsEaten: number;
    carbsTarget: number;
    fatEaten: number;
    fatTarget: number;
    mealCount: number;
  };
  recovery: {
    bodyweight: number | null;
    bodyweightDelta: number | null;
    readinessScore: number;
    weeklyTrainingDays: number;
    avgSessionVolume: number;
    volumeTrend: string;
    macroConsistency: number | null;
  };
  context: {
    dayOfWeek: string;
    scheduledWorkout: string;
    athleteName: string;
    sport: string;
  };
}

function generateFallbackInsights(m: AthleteMetrics): string {
  const tips: string[] = [];

  if (m.sessionSummary.totalSets > 0) {
    const volumeT = (m.sessionSummary.totalVolume / 1000).toFixed(1);
    const avgT = (m.recovery.avgSessionVolume / 1000).toFixed(1);
    if (m.sessionSummary.totalVolume > m.recovery.avgSessionVolume * 1.2) {
      tips.push(`**Volume Spike Alert** -- Today's session hit ${volumeT}T vs your average of ${avgT}T. That's a 20%+ jump. Consider lighter volume tomorrow to prevent overreaching.`);
    } else {
      tips.push(`**Session Volume** -- ${volumeT}T across ${m.sessionSummary.totalSets} sets (avg RPE ${m.sessionSummary.avgRPE.toFixed(1)}). Solid work within your normal training envelope.`);
    }
  }

  if (m.recovery.bodyweight) {
    const protPerKg = m.nutrition.proteinEaten / m.recovery.bodyweight;
    if (protPerKg < 1.6) {
      const deficit = Math.round(m.nutrition.proteinTarget - m.nutrition.proteinEaten);
      tips.push(`**Protein Priority** -- You're at ${protPerKg.toFixed(2)}g/kg (${m.nutrition.proteinEaten}g eaten). Target 1.6-2.2g/kg for optimal muscle protein synthesis. ${deficit > 0 ? `You need ~${deficit}g more today.` : ''}`);
    } else {
      tips.push(`**Protein Status** -- ${m.nutrition.proteinEaten}g consumed (${protPerKg.toFixed(2)}g/kg). You're in the optimal range for recovery.`);
    }
  }

  const calPct = m.nutrition.calorieTarget > 0 ? Math.round((m.nutrition.caloriesEaten / m.nutrition.calorieTarget) * 100) : 0;
  if (calPct < 70 && m.nutrition.mealCount >= 2) {
    const remaining = m.nutrition.calorieTarget - m.nutrition.caloriesEaten;
    tips.push(`**Fuel Deficit** -- Only ${calPct}% of daily target consumed (~${remaining} kcal remaining). Prioritize a protein-rich meal in the next 2 hours to support recovery.`);
  } else if (calPct > 110) {
    tips.push(`**Surplus Noted** -- You're ${calPct - 100}% over your calorie target. If this isn't a planned refeed, adjust portions at your next meal.`);
  }

  if (m.recovery.readinessScore < 50) {
    tips.push(`**Recovery Watch** -- Readiness score is ${m.recovery.readinessScore}/100. Consider a deload session, mobility work, or an extra rest day. Sleep and hydration are your priorities.`);
  }

  if (m.recovery.macroConsistency !== null && m.recovery.macroConsistency < 60) {
    tips.push(`**Consistency Gap** -- 7-day nutrition adherence is ${Math.round(m.recovery.macroConsistency)}%. Consistent fueling drives better results than perfect single days. Focus on hitting within 10% of targets daily.`);
  }

  if (tips.length === 0) {
    tips.push(`**On Track** -- Training and nutrition are well-aligned today. Keep hitting your targets and maintain your current training frequency of ${m.recovery.weeklyTrainingDays} days/week.`);
  }

  return tips.slice(0, 5).join('\n\n');
}

function buildPrompt(m: AthleteMetrics): string {
  const lines: string[] = [];
  lines.push(`ATHLETE: ${m.context.athleteName || "User"} | Sport: ${m.context.sport || "General Fitness"}`);
  lines.push(`DAY: ${m.context.dayOfWeek} | Scheduled: ${m.context.scheduledWorkout || "Not set"}`);
  lines.push("");

  if (m.sessionSummary.totalSets > 0) {
    lines.push("== TODAY'S SESSION ==");
    lines.push(`Total Volume: ${(m.sessionSummary.totalVolume / 1000).toFixed(1)} metric tons | Sets: ${m.sessionSummary.totalSets} | Avg RPE: ${m.sessionSummary.avgRPE.toFixed(1)} | Zone: ${m.sessionSummary.intensityZone}`);
    lines.push(`Est. Burn: ~${m.sessionSummary.estimatedCalsBurned} kcal`);
    lines.push("Exercises:");
    m.sessionSummary.exercises.forEach(ex => {
      lines.push(`  - ${ex.name} (${ex.muscle}): ${ex.topWeight}kg x ${ex.topReps} | ${ex.sets} sets | Vol: ${(ex.volume / 1000).toFixed(2)}T`);
    });
    lines.push("");
  } else {
    lines.push("== NO WORKOUT LOGGED TODAY ==");
    lines.push("");
  }

  lines.push("== NUTRITION TODAY ==");
  lines.push(`Calories: ${m.nutrition.caloriesEaten} / ${m.nutrition.calorieTarget} kcal (${m.nutrition.calorieTarget > 0 ? Math.round((m.nutrition.caloriesEaten / m.nutrition.calorieTarget) * 100) : 0}%)`);
  lines.push(`Protein: ${m.nutrition.proteinEaten}g / ${m.nutrition.proteinTarget}g | Carbs: ${m.nutrition.carbsEaten}g / ${m.nutrition.carbsTarget}g | Fat: ${m.nutrition.fatEaten}g / ${m.nutrition.fatTarget}g`);
  lines.push(`Meals logged: ${m.nutrition.mealCount}`);
  if (m.recovery.bodyweight) {
    const protPerKg = m.nutrition.proteinEaten / m.recovery.bodyweight;
    lines.push(`Protein per kg BW: ${protPerKg.toFixed(2)}g/kg`);
  }
  lines.push("");

  lines.push("== RECOVERY & TRENDS ==");
  if (m.recovery.bodyweight) {
    lines.push(`Bodyweight: ${m.recovery.bodyweight.toFixed(1)}kg${m.recovery.bodyweightDelta !== null ? ` (${m.recovery.bodyweightDelta > 0 ? '+' : ''}${m.recovery.bodyweightDelta.toFixed(1)}kg recent trend)` : ''}`);
  }
  lines.push(`Readiness Score: ${m.recovery.readinessScore}/100`);
  lines.push(`Training Frequency: ${m.recovery.weeklyTrainingDays} days/week`);
  lines.push(`Avg Session Volume: ${(m.recovery.avgSessionVolume / 1000).toFixed(1)}T | Trend: ${m.recovery.volumeTrend}`);
  if (m.recovery.macroConsistency !== null) {
    lines.push(`Nutrition Consistency (7d): ${Math.round(m.recovery.macroConsistency)}%`);
  }
  lines.push("");
  lines.push("Provide 3-5 specific, actionable coaching recommendations based on this data. Format each as a short bold title followed by 1-2 sentences of detail.");

  return lines.join("\n");
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

function validateMetrics(m: any): string | null {
  if (!m || typeof m !== "object") return "metrics must be an object";
  if (m.sessionSummary && typeof m.sessionSummary !== "object") return "sessionSummary must be an object";
  if (m.nutrition && typeof m.nutrition !== "object") return "nutrition must be an object";
  if (m.recovery && typeof m.recovery !== "object") return "recovery must be an object";
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

  if (!(await checkRateLimit(user.email, "gemini-coach", 10))) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max 10 requests per minute." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { metrics } = (await req.json()) as { metrics: AthleteMetrics };
    const validationError = validateMetrics(metrics);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (apiKey) {
      try {
        const systemPrompt = `You are an elite sports performance coach and nutritionist AI embedded in a fitness intelligence app called "Oblivion Fitness Club". You analyze real training telemetry and provide personalized, actionable recommendations.

Your persona: Direct, evidence-based, motivating but never generic. Reference specific numbers from the athlete's data. Use sports science terminology naturally (RPE, TRIMP, MPS, progressive overload, periodization).

Rules:
- Be concise: 3-5 bullet-point recommendations max
- Each recommendation must reference SPECIFIC data from the athlete's session
- Include one recovery/next-session recommendation
- Include one nutrition-timing recommendation relevant to their current intake
- If the athlete trained today, give post-workout specific advice (carb reload targets, protein timing windows)
- If volume is spiking vs average, flag injury risk
- If protein is under 1.6g/kg, prioritize that warning
- Use metric units (kg, kcal)
- Never be generic -- tie every recommendation to their actual numbers`;

        const userPrompt = buildPrompt(metrics);
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 600, topP: 0.9 },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (text) {
            return new Response(
              JSON.stringify({ insights: text }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch (_aiErr) {
        // AI failed, fall through to fallback
      }
    }

    const insights = generateFallbackInsights(metrics);
    return new Response(
      JSON.stringify({ insights, fallback: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

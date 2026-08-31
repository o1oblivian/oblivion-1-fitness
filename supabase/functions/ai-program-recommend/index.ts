import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IntakeData {
  clientEmail: string;
  goal: string;
  experienceLevel: string;
  trainingDaysPerWeek: number;
  whyNow: string;
  currentSupplements: string;
  dietPreferences: string;
  injuriesLimitations: string;
  dailyStepGoal: number;
  currentDailySteps: number;
  timelineGoal: string;
  desiredServices: string[];
  snapshotData: {
    workouts?: { totalSessions: number; avgPerWeek: number; recentPRs: string[] };
    nutrition?: { avgCalories: number; avgProtein: number; adherencePct: number };
    sleep?: { avgHours: number; qualityScore: number };
    bodyweight?: { current: number; trend: string; changeKg: number };
    steps?: { avgDaily: number };
  };
}

function generateFallbackProgram(intake: IntakeData) {
  const days = intake.trainingDaysPerWeek || 4;
  const level = (intake.experienceLevel || 'intermediate').toLowerCase();
  const goal = (intake.goal || 'build muscle').toLowerCase();
  const isBegin = level.includes('begin');
  const isCut = goal.includes('fat') || goal.includes('cut') || goal.includes('lose');
  const isBulk = goal.includes('muscle') || goal.includes('bulk') || goal.includes('mass');
  const baseCals = isCut ? 1800 : isBulk ? 2800 : 2200;
  const bw = intake.snapshotData?.bodyweight?.current || 80;
  const protTarget = Math.round(bw * (isCut ? 2.2 : 1.8));

  const splits: Record<number, { split: string; days: any[] }> = {
    3: { split: "Full Body 3x/week", days: [
      { day: "Day 1", focus: "Full Body A", exercises: [{ name: "Barbell Back Squat", sets: isBegin ? 3 : 4, reps: isBegin ? "8-10" : "6-8", notes: "Focus on depth and bracing" }, { name: "Bench Press", sets: isBegin ? 3 : 4, reps: "8-10", notes: "Control the eccentric" }, { name: "Bent Over Row", sets: 3, reps: "8-12", notes: "Squeeze at top" }, { name: "Overhead Press", sets: 3, reps: "8-10", notes: "Strict form" }, { name: "Romanian Deadlift", sets: 3, reps: "10-12", notes: "Stretch hamstrings" }] },
      { day: "Day 2", focus: "Full Body B", exercises: [{ name: "Deadlift", sets: isBegin ? 3 : 4, reps: "5-6", notes: "Belt optional, brace hard" }, { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", notes: "Full range of motion" }, { name: "Pull-Ups / Lat Pulldown", sets: 3, reps: "8-12", notes: "Full stretch at bottom" }, { name: "Leg Press", sets: 3, reps: "10-15", notes: "Feet shoulder width" }, { name: "Lateral Raises", sets: 3, reps: "12-15", notes: "Light and controlled" }] },
      { day: "Day 3", focus: "Full Body C", exercises: [{ name: "Front Squat", sets: 3, reps: "8-10", notes: "Upright torso" }, { name: "Dumbbell Bench Press", sets: 3, reps: "10-12", notes: "Squeeze at top" }, { name: "Cable Row", sets: 3, reps: "10-12", notes: "Pull to belly button" }, { name: "Walking Lunges", sets: 3, reps: "12 each", notes: "Step through fully" }, { name: "Face Pulls", sets: 3, reps: "15-20", notes: "External rotation" }] },
    ] },
    4: { split: "Upper/Lower 4x/week", days: [
      { day: "Day 1", focus: "Upper A (Push focus)", exercises: [{ name: "Bench Press", sets: 4, reps: "6-8", notes: "Progressive overload weekly" }, { name: "Overhead Press", sets: 3, reps: "8-10", notes: "Strict form" }, { name: "Bent Over Row", sets: 4, reps: "8-10", notes: "Match pulling to pressing" }, { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", notes: "Control the negative" }, { name: "Lateral Raises", sets: 3, reps: "12-15", notes: "Light, high reps" }, { name: "Tricep Pushdowns", sets: 3, reps: "12-15", notes: "Full extension" }] },
      { day: "Day 2", focus: "Lower A (Quad focus)", exercises: [{ name: "Barbell Back Squat", sets: 4, reps: "6-8", notes: "Hit parallel or below" }, { name: "Romanian Deadlift", sets: 3, reps: "10-12", notes: "Hip hinge pattern" }, { name: "Leg Press", sets: 3, reps: "10-15", notes: "Full ROM" }, { name: "Leg Curl", sets: 3, reps: "10-12", notes: "Control both phases" }, { name: "Calf Raises", sets: 4, reps: "12-15", notes: "Pause at bottom stretch" }] },
      { day: "Day 3", focus: "Upper B (Pull focus)", exercises: [{ name: "Pull-Ups / Weighted Pull-Ups", sets: 4, reps: "6-10", notes: "Full dead hang" }, { name: "Dumbbell Bench Press", sets: 3, reps: "10-12", notes: "Neutral or slight incline" }, { name: "Cable Row", sets: 4, reps: "10-12", notes: "Squeeze shoulder blades" }, { name: "Dumbbell Shoulder Press", sets: 3, reps: "10-12", notes: "Seated or standing" }, { name: "Bicep Curls", sets: 3, reps: "10-12", notes: "No swinging" }, { name: "Face Pulls", sets: 3, reps: "15-20", notes: "External rotation at top" }] },
      { day: "Day 4", focus: "Lower B (Hip/Posterior focus)", exercises: [{ name: "Deadlift", sets: 4, reps: "5-6", notes: "Reset each rep" }, { name: "Bulgarian Split Squats", sets: 3, reps: "10 each", notes: "Deep stretch" }, { name: "Hip Thrust", sets: 3, reps: "10-12", notes: "Pause at top" }, { name: "Walking Lunges", sets: 3, reps: "12 each", notes: "Controlled steps" }, { name: "Calf Raises", sets: 4, reps: "12-15", notes: "Variety of stances" }] },
    ] },
    5: { split: "Push/Pull/Legs + Upper/Lower", days: [
      { day: "Day 1", focus: "Push", exercises: [{ name: "Bench Press", sets: 4, reps: "6-8", notes: "Main pressing movement" }, { name: "Overhead Press", sets: 3, reps: "8-10", notes: "Strict form" }, { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", notes: "Upper chest focus" }, { name: "Lateral Raises", sets: 4, reps: "12-15", notes: "Side delt priority" }, { name: "Tricep Dips / Pushdowns", sets: 3, reps: "10-12", notes: "Lockout each rep" }] },
      { day: "Day 2", focus: "Pull", exercises: [{ name: "Deadlift or Barbell Row", sets: 4, reps: "5-8", notes: "Alternate weekly" }, { name: "Pull-Ups / Lat Pulldown", sets: 4, reps: "8-12", notes: "Full stretch" }, { name: "Cable Row", sets: 3, reps: "10-12", notes: "Horizontal pull" }, { name: "Face Pulls", sets: 3, reps: "15-20", notes: "Rear delt health" }, { name: "Bicep Curls", sets: 3, reps: "10-12", notes: "Control the negative" }] },
      { day: "Day 3", focus: "Legs", exercises: [{ name: "Barbell Back Squat", sets: 4, reps: "6-8", notes: "Main compound" }, { name: "Romanian Deadlift", sets: 3, reps: "10-12", notes: "Posterior chain" }, { name: "Leg Press", sets: 3, reps: "12-15", notes: "Quad focus" }, { name: "Leg Curl", sets: 3, reps: "10-12", notes: "Hamstring isolation" }, { name: "Calf Raises", sets: 4, reps: "12-15", notes: "Full ROM" }] },
      { day: "Day 4", focus: "Upper Hypertrophy", exercises: [{ name: "Dumbbell Bench Press", sets: 3, reps: "10-12", notes: "Mind-muscle connection" }, { name: "Chest-Supported Row", sets: 3, reps: "10-12", notes: "No momentum" }, { name: "Arnold Press", sets: 3, reps: "10-12", notes: "Rotation pattern" }, { name: "Cable Flyes", sets: 3, reps: "12-15", notes: "Peak contraction" }, { name: "Hammer Curls", sets: 3, reps: "10-12", notes: "Brachialis" }] },
      { day: "Day 5", focus: "Lower Hypertrophy", exercises: [{ name: "Front Squat", sets: 3, reps: "8-10", notes: "Quad dominant" }, { name: "Hip Thrust", sets: 4, reps: "10-12", notes: "Glute driver" }, { name: "Walking Lunges", sets: 3, reps: "12 each", notes: "Step through" }, { name: "Leg Extension", sets: 3, reps: "12-15", notes: "Isolation" }, { name: "Seated Calf Raises", sets: 4, reps: "15-20", notes: "Soleus focused" }] },
    ] },
  };

  const selectedSplit = splits[Math.min(Math.max(days, 3), 5)] || splits[4];

  return {
    programName: isCut ? "Lean Shred Protocol" : isBulk ? "Hypertrophy Builder" : "Athletic Performance Plan",
    summary: `A ${selectedSplit.split} program designed for your ${level} experience level, targeting ${goal}. Structured for progressive overload with ${days} training days per week.`,
    duration_weeks: 8,
    training: { split: selectedSplit.split, days: selectedSplit.days, progressionModel: isBegin ? "Add 2.5kg to compound lifts each week when all sets are completed at the top of the rep range." : "Double progression: increase reps within range, then add weight when hitting top of range for all sets.", deloadProtocol: "Every 4th week: reduce volume by 40% (keep intensity). Drop sets to 2 per exercise, maintain weight." },
    nutrition: { dailyCalories: baseCals, macros: { protein_g: protTarget, carbs_g: Math.round((baseCals - protTarget * 4 - bw * 0.8 * 9) / 4), fat_g: Math.round(bw * 0.8) }, mealTiming: "Pre-workout: 30-60g carbs + 20g protein 60-90 min before. Post-workout: 30-40g protein + 40-60g carbs within 2 hours.", supplements: ["Creatine Monohydrate 5g daily", "Whey Protein 25-40g post-workout", "Vitamin D3 2000-4000IU", "Omega-3 Fish Oil 2-3g EPA+DHA"] },
    weeklyCardio: { type: isCut ? "Moderate incline walking + 1 HIIT session" : "Low-impact Zone 2 (walking, cycling)", frequency: isCut ? "4-5 sessions" : "2-3 sessions", duration: isCut ? "30-45 min steady state, 15-20 min HIIT" : "20-30 minutes" },
    recoveryProtocol: { sleepTarget: "7-9 hours per night", mobilityWork: "10 min daily: hip flexor stretch, thoracic extensions, shoulder CARs", stepsTarget: intake.dailyStepGoal || 8000 },
    coachNotes: intake.injuriesLimitations ? `Note: You mentioned "${intake.injuriesLimitations}". Substitute any exercises that aggravate this area.` : "No injuries noted. Focus on proper form and progressive overload.",
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

function validateIntake(intake: any): string | null {
  if (!intake || typeof intake !== "object") return "intake must be an object";
  if (typeof intake.goal !== "string" || intake.goal.length === 0 || intake.goal.length > 200) return "goal must be a non-empty string (max 200 chars)";
  if (typeof intake.experienceLevel !== "string") return "experienceLevel must be a string";
  if (typeof intake.trainingDaysPerWeek !== "number" || intake.trainingDaysPerWeek < 1 || intake.trainingDaysPerWeek > 7) return "trainingDaysPerWeek must be 1-7";
  if (intake.injuriesLimitations && typeof intake.injuriesLimitations !== "string") return "injuriesLimitations must be a string";
  if (intake.dietPreferences && typeof intake.dietPreferences !== "string") return "dietPreferences must be a string";
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

  if (!(await checkRateLimit(user.email, "ai-program-recommend", 10))) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max 10 requests per minute." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { intake } = (await req.json()) as { intake: IntakeData };
    const vErr = validateIntake(intake);
    if (vErr) {
      return new Response(
        JSON.stringify({ error: vErr }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (apiKey) {
      try {
        const systemPrompt = `You are an elite fitness programming AI for "Oblivion Fitness Club". Given a client's consultation intake data, generate a COMPLETE structured training program AND nutrition plan tailored to their goals. Return ONLY valid JSON with fields: programName, summary, duration_weeks, training (split, days with exercises, progressionModel, deloadProtocol), nutrition (dailyCalories, macros, mealTiming, supplements), weeklyCardio (type, frequency, duration), recoveryProtocol (sleepTarget, mobilityWork, stepsTarget), coachNotes.`;

        const userPrompt = `CLIENT: ${intake.clientEmail} | Goal: ${intake.goal} | Level: ${intake.experienceLevel} | Days/wk: ${intake.trainingDaysPerWeek} | Timeline: ${intake.timelineGoal} | Diet: ${intake.dietPreferences || 'None'} | Injuries: ${intake.injuriesLimitations || 'None'} | Steps goal: ${intake.dailyStepGoal} (current: ${intake.currentDailySteps}) | BW: ${intake.snapshotData?.bodyweight?.current || 'unknown'}kg`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 4096, topP: 0.9, responseMimeType: "application/json" },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const recommendation = JSON.parse(rawText);
          return new Response(JSON.stringify({ recommendation }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch (_aiErr) { /* fall through */ }
    }

    const recommendation = generateFallbackProgram(intake);
    return new Response(JSON.stringify({ recommendation, fallback: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

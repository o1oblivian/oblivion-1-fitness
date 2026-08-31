import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    // Find all pending schedule entries for today where enrollment is auto + active
    const { data: pendingSessions, error: fetchErr } = await supabase
      .from("program_schedule")
      .select(`
        id,
        enrollment_id,
        athlete_email,
        program_id,
        week_number,
        day_number,
        exercises,
        focus_label,
        scheduled_date
      `)
      .eq("scheduled_date", today)
      .eq("dispatched", false);

    if (fetchErr) throw fetchErr;
    if (!pendingSessions || pendingSessions.length === 0) {
      return new Response(
        JSON.stringify({ dispatched: 0, message: "No sessions due today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let dispatchedCount = 0;
    const errors: string[] = [];

    for (const session of pendingSessions) {
      // Verify enrollment is auto and active
      const { data: enrollment } = await supabase
        .from("program_enrollments")
        .select("dispatch_mode, status, coach_email")
        .eq("id", session.enrollment_id)
        .maybeSingle();

      if (!enrollment || enrollment.dispatch_mode !== "auto" || enrollment.status !== "active") {
        continue;
      }

      const dispatchId = `disp_${crypto.randomUUID()}`;

      const { error: insertErr } = await supabase
        .from("dispatched_workouts")
        .insert({
          id: dispatchId,
          coachid: enrollment.coach_email,
          coachname: enrollment.coach_email.split("@")[0],
          clientids: [session.athlete_email],
          clientnames: [session.athlete_email.split("@")[0]],
          title: `${session.focus_label || "Workout"} - Week ${session.week_number} Day ${session.day_number}`,
          routinecategory: session.focus_label || "Program",
          scheduledday: "Today",
          scheduleddate: today,
          exercises: session.exercises,
          notes: "Auto-dispatched from program schedule",
          status: "Dispatched",
        });

      if (insertErr) {
        errors.push(`Session ${session.id}: ${insertErr.message}`);
        continue;
      }

      await supabase
        .from("program_schedule")
        .update({
          dispatched: true,
          dispatched_at: new Date().toISOString(),
          dispatch_ref_id: dispatchId,
        })
        .eq("id", session.id);

      dispatchedCount++;
    }

    return new Response(
      JSON.stringify({
        dispatched: dispatchedCount,
        total_pending: pendingSessions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

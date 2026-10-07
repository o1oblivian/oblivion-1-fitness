import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';

/**
 * Service to manage direct synchronization between user_telemetry
 * in Supabase and the active in-memory step store / hero dial.
 */
export async function syncDailyStepsToSupabase(steps: number): Promise<void> {
  const safeSteps = Math.max(0, steps);

  // 1. Immediately update local store & hero dial
  useTelemetryStore.getState().setStepCount(safeSteps);

  // 2. Persist to Supabase
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return;

    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const nowIso = now.toISOString();

    // Upsert into user_telemetry table
    const { error: teleErr } = await supabase.from('user_telemetry').upsert(
      [
        {
          user_id: userId,
          client_id: userId,
          date: dateKey,
          daily_steps: safeSteps,
          step_count: safeSteps,
          updated_at: nowIso,
        },
      ],
      { onConflict: 'user_id,date' }
    );

    if (teleErr) {
      // Fallback: try daily_metrics
      await supabase.from('daily_metrics').upsert(
        [
          {
            user_id: userId,
            date: dateKey,
            daily_steps: safeSteps,
            updated_at: nowIso,
          },
        ],
        { onConflict: 'user_id,date' }
      );
    }
  } catch (err) {
    console.warn('[UserTelemetryService] Sync notice:', err);
  }
}

/**
 * Hydrates today's daily steps from Supabase into the telemetry store.
 * Defaults to 0 if no reading has been logged.
 */
export async function hydrateDailyStepsFromSupabase(): Promise<number> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return 0;

    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('user_telemetry')
      .select('daily_steps, step_count')
      .or(`user_id.eq.${userId},client_id.eq.${userId}`)
      .eq('date', dateKey)
      .maybeSingle();

    if (!error && data) {
      const steps = Number(data.daily_steps ?? data.step_count) || 0;
      useTelemetryStore.getState().setStepCount(steps);
      return steps;
    }
  } catch (err) {
    console.warn('[UserTelemetryService] Hydration notice:', err);
  }

  // Default to existing store reading or 0
  const existing = useTelemetryStore.getState().stepCount || 0;
  return existing;
}

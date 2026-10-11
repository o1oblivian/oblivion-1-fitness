import { supabase } from './supabaseClient';
import { syncEngine } from './syncEngine';
import { AthleteTelemetryRecord } from '../types/database';

export async function dispatchAthleteTelemetry(
  athleteId: string,
  telemetry: { steps?: number; activeCals?: number; readinessScore?: number }
): Promise<void> {
  const payload: AthleteTelemetryRecord = {
    athlete_id: athleteId,
    steps: telemetry.steps ?? 0,
    active_cals: telemetry.activeCals ?? 0,
    readiness_score: telemetry.readinessScore ?? 90,
    updated_at: new Date().toISOString(),
  };

  await syncEngine.dispatchMutation({
    table: 'athlete_telemetry',
    operation: 'UPSERT',
    payload,
  });
}

export function subscribeToCoachDirectives(
  athleteId: string,
  onDirectiveOrRoutineChanged: (payload: any) => void
): () => void {
  const channel = supabase
    .channel(`athlete-coach-pipeline-${athleteId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assigned_workouts',
        filter: `athlete_id=eq.${athleteId}`,
      },
      (payload) => {
        onDirectiveOrRoutineChanged(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assigned_workouts',
        filter: `client_id=eq.${athleteId}`,
      },
      (payload) => {
        onDirectiveOrRoutineChanged(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'coach_clients',
        filter: `client_id=eq.${athleteId}`,
      },
      (payload) => {
        onDirectiveOrRoutineChanged(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

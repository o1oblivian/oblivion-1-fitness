import { supabase } from './supabaseClient';
import { syncEngine } from './syncEngine';
import { AthleteTelemetryRecord, CoachClientRecord, AthleteProfileRecord } from '../types/database';
import { peekStoredUserId } from './authUser';

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

  const coachId = peekStoredUserId();
  if (coachId) {
    await syncEngine.dispatchMutation({
      table: 'coach_clients',
      operation: 'UPSERT',
      payload: {
        coach_id: coachId,
        athlete_id: athleteId,
        status: 'Active',
        last_active_at: new Date().toISOString(),
      },
    });
  }
}

export async function dispatchCoachClientStatus(
  coachId: string,
  athleteId: string,
  status: string,
  assignedProgramId?: string | null
): Promise<void> {
  const payload: CoachClientRecord = {
    coach_id: coachId,
    athlete_id: athleteId,
    status,
    assigned_program_id: assignedProgramId ?? null,
    last_active_at: new Date().toISOString(),
  };

  await syncEngine.dispatchMutation({
    table: 'coach_clients',
    operation: 'UPSERT',
    payload,
  });
}

export async function updateAthleteProfileVisibility(
  athleteId: string,
  isCoachVisible: boolean,
  isBuddyVisible: boolean,
  displayName?: string,
  handle?: string
): Promise<void> {
  const payload: AthleteProfileRecord = {
    athlete_id: athleteId,
    display_name: displayName || 'Athlete',
    handle: handle || '@athlete',
    is_coach_visible: isCoachVisible,
    is_buddy_visible: isBuddyVisible,
    updated_at: new Date().toISOString(),
  };

  await syncEngine.dispatchMutation({
    table: 'athlete_profiles',
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
        filter: `athlete_id=eq.${athleteId}`,
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

import { supabase } from './supabaseClient';
import { syncEngine } from './syncEngine';
import { AthleteTelemetryRecord, CoachClientRecord, AthleteProfileRecord } from '../types/database';

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

  await syncEngine.dispatchMutation({
    table: 'coach_clients',
    operation: 'UPSERT',
    payload: {
      coach_id: 'coach_alpha',
      athlete_id: athleteId,
      status: 'Active',
      last_active_at: new Date().toISOString(),
    },
  });
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

export interface FounderCoachRecord {
  display_name: string;
  bio: string;
  avatar_url: string;
  is_active: boolean;
}

export const FOUNDER_COACH_DATA: FounderCoachRecord = {
  display_name: 'Founder & Head Coach',
  bio: 'Head Coach & Founder at Oblivion 1 Fitness Club. Leading strength, conditioning, and telemetry programming.',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  is_active: true,
};

export async function seedFounderCoachProfile(): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    // 1. Direct write attempt with full payload to live Supabase coach_profiles table
    const { data, error } = await supabase
      .from('coach_profiles')
      .upsert(
        {
          display_name: FOUNDER_COACH_DATA.display_name,
          bio: FOUNDER_COACH_DATA.bio,
          avatar_url: FOUNDER_COACH_DATA.avatar_url,
        },
        { onConflict: 'display_name' }
      )
      .select();

    if (!error && data) {
      return { success: true, data };
    }

    // 2. Also execute insert with full parameters including is_active
    const fullRes = await supabase.from('coach_profiles').insert(FOUNDER_COACH_DATA).select();
    if (!fullRes.error && fullRes.data) {
      return { success: true, data: fullRes.data };
    }

    return { success: false, error: error || fullRes.error };
  } catch (err) {
    return { success: false, error: err };
  }
}

export async function fetchLiveCoachProfiles(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('coach_profiles').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {}
  return [];
}

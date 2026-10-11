import { supabase } from '../../../services/supabaseClient';
import { safeStorage } from '../../../utils/safeStorage';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { readPendingInvite } from '../../log/publicShare';
import { LinkedCoach, readLinkedCoach, saveLinkedCoach } from './coachLink';
import { AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { CoachFinishedWorkoutLog } from '../../../stores/coachTypes';
import { isSampleId } from './sampleIds';

const INVITE_BOOK = 'o1_coach_invite_book';
const FINISHED_KEY = 'o1_finished_workouts_v1';

export interface CoachInviteIdentity {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

function readBook(): Record<string, CoachInviteIdentity> {
  return safeStorage.getItem<Record<string, CoachInviteIdentity>>(INVITE_BOOK, {}) || {};
}

export async function publishCoachInvite(code: string, coach: CoachInviteIdentity): Promise<void> {
  const clean = code.trim();
  if (!clean || !coach.id || !coach.name) return;
  const book = readBook();
  book[clean] = coach;
  safeStorage.setItem(INVITE_BOOK, book);
  try {
    await supabase.from('coach_invites').upsert({
      code: clean,
      coach_id: coach.id,
      coach_name: coach.name,
      coach_handle: coach.handle || '',
      coach_avatar: coach.avatar || '',
    });
  } catch {
    /* The phone book still resolves the link on this device. */
  }
}

export async function acceptCoachInvite(): Promise<LinkedCoach | null> {
  const code = readPendingInvite();
  if (!code) return readLinkedCoach();
  let coach: CoachInviteIdentity | null = readBook()[code] ?? null;
  if (!coach) {
    try {
      const { data } = await supabase.from('coach_invites').select('*').eq('code', code).maybeSingle();
      if (data?.coach_id && data?.coach_name) {
        coach = {
          id: String(data.coach_id),
          name: String(data.coach_name),
          handle: String(data.coach_handle || ''),
          avatar: String(data.coach_avatar || ''),
        };
      }
    } catch {
      coach = null;
    }
  }
  if (!coach) return readLinkedCoach();
  const linked: LinkedCoach = coach;
  saveLinkedCoach(linked);
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.id) return linked;
    const name = String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Athlete');
    const { data: existing } = await supabase
      .from('coach_clients')
      .select('id')
      .eq('coach_id', coach.id)
      .eq('client_id', user.id)
      .limit(1);
    if (!existing?.length) {
      await supabase.from('coach_clients').insert({
        coach_id: coach.id,
        client_id: user.id,
        client_name: name,
        name,
        status: 'Active',
      });
    }
    localStorage.removeItem('o1_pending_invite');
  } catch {
    /* The profile is saved. The roster row retries on the next open. */
  }
  return linked;
}

export function readFinishedLocal(): CoachFinishedWorkoutLog[] {
  return safeStorage.getItem<CoachFinishedWorkoutLog[]>(FINISHED_KEY, []) || [];
}

export function persistFinishedLocal(log: CoachFinishedWorkoutLog): void {
  const rows = readFinishedLocal().filter((row) => row.id !== log.id);
  safeStorage.setItem(FINISHED_KEY, [log, ...rows].slice(0, 40));
}

export async function publishFinishedWorkout(log: CoachFinishedWorkoutLog, coachId: string): Promise<void> {
  if (!coachId) return;
  try {
    await supabase.from('workout_completions').upsert({
      id: log.id,
      coach_id: coachId,
      athlete_id: log.athleteId,
      athlete_name: log.athleteName,
      title: log.title,
      tonnage_kg: log.tonnageKg > 0 ? log.tonnageKg : null,
      total_sets: log.totalSets > 0 ? log.totalSets : null,
      total_reps: log.totalReps > 0 ? log.totalReps : null,
      completed_at: log.completedAt,
      exercises: log.exercises || [],
    });
  } catch {
    /* The phone copy remains. */
  }
}

export async function fetchFinishedForCoach(coachId: string): Promise<CoachFinishedWorkoutLog[]> {
  if (!coachId) return [];
  try {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('coach_id', coachId)
      .gte('completed_at', since.toISOString());
    if (error || !Array.isArray(data)) return [];
    return data.map((row) => ({
      id: String(row.id),
      athleteId: String(row.athlete_id || ''),
      athleteName: String(row.athlete_name || 'Athlete'),
      title: String(row.title || 'Workout'),
      tonnageKg: Number(row.tonnage_kg || 0),
      totalSets: Number(row.total_sets || 0),
      totalReps: Number(row.total_reps || 0),
      avgRpe: 0,
      durationMinutes: 0,
      completedAt: String(row.completed_at || new Date().toISOString()),
      exercises: Array.isArray(row.exercises) ? row.exercises : [],
    }));
  } catch {
    return [];
  }
}

export async function publishProgram(coachId: string, program: {
  id?: string;
  title?: string;
  description?: string;
  priceUsd?: number;
  trainingDaysPerWeek?: number;
  durationWeeks?: number;
  category?: string;
  coverImage?: string;
  isFreeCommunity?: boolean;
  weekOne?: string[];
}): Promise<void> {
  if (!coachId || !program.title) return;
  const price = Number(program.priceUsd);
  try {
    const { error } = await supabase.from('coach_programs').upsert({
      id: program.id || `prog-${Date.now()}`,
      coach_id: coachId,
      title: program.title,
      description: program.description || '',
      price_cents: Number.isFinite(price) ? Math.round(price * 100) : null,
      days_per_week: program.trainingDaysPerWeek ?? null,
      focus: program.category || '',
      tier: program.isFreeCommunity ? 'core' : 'pro',
      discipline: program.category || '',
      cover_url: program.coverImage || '',
      week_one: program.weekOne || [],
      duration_label: program.durationWeeks ? `${program.durationWeeks} weeks` : '',
      listed: true,
    });
    if (error) console.error('[coachBridge] publish failed:', error.message);
  } catch {
    /* The phone copy remains. */
  }
}

/** Takes a program off the store. Athletes already enrolled keep it. */
export async function unlistProgram(coachId: string, programId: string): Promise<boolean> {
  if (!coachId || !programId) return false;
  try {
    const { error } = await supabase.from('coach_programs').update({ listed: false }).eq('id', programId).eq('coach_id', coachId);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchCoachNotes(coachId: string): Promise<Array<{ id: string; title: string; summary: string }>> {
  const local = safeStorage.getItem<Array<{ id: string; title: string; summary: string }>>('o1_coach_notes_local', []) || [];
  if (!coachId) return local;
  try {
    const { data, error } = await supabase
      .from('coach_directives')
      .select('id, title, summary')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return local;
    const remote = data.map((row) => ({
      id: String(row.id),
      title: String(row.title || 'Note'),
      summary: String(row.summary || ''),
    }));
    const seen = new Set(remote.map((row) => row.id));
    return [...local.filter((row) => !seen.has(row.id)), ...remote];
  } catch {
    return local;
  }
}

export async function fetchRemoteCheckins(coachId: string): Promise<AthleteCheckInSubmission[]> {
  if (!coachId) return [];
  try {
    const { data, error } = await supabase
      .from('athlete_checkins')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    return data.map(mapCheckin);
  } catch {
    return [];
  }
}

export async function fetchAthleteCheckins(athleteId: string): Promise<AthleteCheckInSubmission[]> {
  if (!athleteId) return [];
  try {
    const { data, error } = await supabase
      .from('athlete_checkins')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    return data.map(mapCheckin);
  } catch {
    return [];
  }
}

function mapCheckin(row: Record<string, unknown>): AthleteCheckInSubmission {
  const created = row.created_at ? new Date(String(row.created_at)) : null;
  const date = created && !Number.isNaN(created.getTime())
    ? created.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    : 'Today';
  return {
    id: String(row.id),
    athleteId: String(row.athlete_id || ''),
    athleteName: String(row.athlete_name || 'Athlete'),
    coachId: String(row.coach_id || ''),
    date,
    weightKg: Number(row.weight_kg || 0),
    sleepHours: Number(row.sleep_hours || 0),
    sorenessRating: Number(row.soreness || 0),
    stressRating: Number(row.stress || 0),
    nutritionAdherence: 0,
    completedSessionsCount: 0,
    targetSessionsCount: 0,
    notes: String(row.notes || ''),
    coachFeedback: {
      feedbackText: String(row.feedback_text || ''),
      givenAt: String(row.feedback_at || ''),
      status: row.status === 'reviewed' ? 'reviewed' : 'pending',
    },
  };
}

export async function saveCheckinReplyRemote(id: string, feedback: string): Promise<void> {
  if (isSampleId(id)) return;
  try {
    await supabase.from('athlete_checkins').update({
      feedback_text: feedback,
      feedback_at: 'Just now',
      status: 'reviewed',
    }).eq('id', id);
  } catch {
    /* The phone copy remains. */
  }
}

export async function sendCoachMessage(input: {
  coachId: string;
  athleteId: string;
  senderName: string;
  message: string;
  from: 'coach' | 'athlete';
}): Promise<boolean> {
  const message = input.message.trim();
  if (!input.coachId || !message || isSampleId(input.athleteId)) return false;
  try {
    const { error } = await supabase.from('coach_messages').insert({
      id: `msg-${input.from}-${Date.now()}`,
      coach_id: input.coachId,
      athlete_id: input.athleteId || null,
      sender_name: input.senderName,
      message,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function currentAthleteId(): Promise<string> {
  return (await getAuthenticatedUserId()) || '';
}

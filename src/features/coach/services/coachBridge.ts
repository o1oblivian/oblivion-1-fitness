import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { readPendingInvite } from '../../log/publicShare';
import { LinkedCoach, clearLinkedCoach, readLinkedCoach, saveLinkedCoach } from './coachLink';
import { AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { CoachFinishedWorkoutLog } from '../../../stores/coachTypes';
import { isSampleId } from './sampleIds';
import { isValidUuid } from './coachService';
import { ensureCoachCard } from './coachPublicProfile';
import { fetchCoachCard } from './coachDirectory';
import { buildProgramPlan, weekOneLines } from './programPlan';
import type { ProgramFormData } from '../components/programCreator/types';
import {
  PROGRAM_COLUMNS,
  StorefrontProgram,
  mapProgramRow,
  withProgramContent,
} from '../../reels/services/coachStorefront';

export interface CoachInviteIdentity {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

/** Registers an invite code so any athlete who opens the link can resolve the coach. */
export async function publishCoachInvite(
  code: string,
  coach: CoachInviteIdentity,
): Promise<boolean> {
  const clean = code.trim();
  if (!clean || !isValidUuid(coach.id) || !coach.name) return false;
  const { error } = await supabase.from('coach_invites').upsert({
    code: clean,
    coach_id: coach.id,
    coach_name: coach.name,
    coach_handle: coach.handle || '',
    coach_avatar: coach.avatar || '',
  });
  if (error) console.warn('[coachBridge] invite publish failed:', error.message);
  return !error;
}

export async function acceptCoachInvite(): Promise<LinkedCoach | null> {
  const code = readPendingInvite();
  if (!code) return readLinkedCoach();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.id) return readLinkedCoach();
  const meta = user.user_metadata ?? {};
  const name = String(meta.full_name || meta.name || user.email?.split('@')[0] || 'Athlete');
  const avatar = typeof meta.avatar_url === 'string' ? meta.avatar_url : '';
  const { data, error } = await supabase.rpc('join_coach_by_invite', {
    invite_code: code,
    display_name: name,
    avatar,
  });
  const row = (data ?? null) as {
    coach_id?: string;
    coach_name?: string;
    coach_handle?: string;
    coach_avatar?: string;
  } | null;
  if (error || !row?.coach_id || !row.coach_name) return readLinkedCoach();
  const coach: LinkedCoach = {
    id: String(row.coach_id),
    name: String(row.coach_name),
    handle: String(row.coach_handle || ''),
    avatar: String(row.coach_avatar || ''),
  };
  localStorage.removeItem('o1_pending_invite');
  saveLinkedCoach(coach);
  return coach;
}

/**
 * The coach the signed-in athlete is linked to in `coach_clients`, newest link first.
 * `{ coach: null }` means no link; null means the lookup failed.
 */
export async function fetchMyLinkedCoach(): Promise<{ coach: LinkedCoach | null } | null> {
  const me = await getAuthenticatedUserId();
  if (!isValidUuid(me)) return { coach: null };
  const { data, error } = await supabase
    .from('coach_clients')
    .select('coach_id')
    .eq('client_id', me as string)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !Array.isArray(data)) return null;
  const coachId = data[0]?.coach_id ? String(data[0].coach_id) : '';
  if (!coachId) {
    clearLinkedCoach();
    return { coach: null };
  }
  const card = await fetchCoachCard(coachId);
  const linked = readLinkedCoach();
  const coach: LinkedCoach = card
    ? { id: coachId, name: card.name, handle: card.handle, avatar: card.avatar }
    : {
        id: coachId,
        name: linked?.id === coachId ? linked.name : 'Your coach',
        handle: '',
        avatar: linked?.id === coachId ? linked.avatar : '',
      };
  saveLinkedCoach(coach);
  return { coach };
}

type Summary = Record<string, unknown>;

function workoutSummary(log: CoachFinishedWorkoutLog): Summary {
  return {
    athleteName: log.athleteName,
    athleteAvatar: log.athleteAvatar || '',
    title: log.title,
    tonnageKg: log.tonnageKg,
    totalSets: log.totalSets,
    totalReps: log.totalReps,
    avgRpe: log.avgRpe,
    durationMinutes: log.durationMinutes,
    exercises: log.exercises || [],
  };
}

export function mapCompletionRow(row: {
  id: unknown;
  athlete_id?: unknown;
  submitted_at?: unknown;
  metrics_summary?: unknown;
}): CoachFinishedWorkoutLog {
  const s = (
    row.metrics_summary && typeof row.metrics_summary === 'object' ? row.metrics_summary : {}
  ) as Summary;
  const num = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);
  return {
    id: String(row.id),
    athleteId: String(row.athlete_id || ''),
    athleteName: String(s.athleteName || 'Athlete'),
    athleteAvatar: s.athleteAvatar ? String(s.athleteAvatar) : undefined,
    title: String(s.title || 'Workout'),
    tonnageKg: num(s.tonnageKg),
    totalSets: num(s.totalSets),
    totalReps: num(s.totalReps),
    avgRpe: num(s.avgRpe),
    durationMinutes: num(s.durationMinutes),
    completedAt: String(row.submitted_at || ''),
    feedback: s.coachFeedback ? String(s.coachFeedback) : undefined,
    feedbackGivenAt: s.coachFeedbackAt ? String(s.coachFeedbackAt) : undefined,
    exercises: Array.isArray(s.exercises)
      ? (s.exercises as CoachFinishedWorkoutLog['exercises'])
      : [],
  };
}

const COMPLETION_COLUMNS = 'id, athlete_id, submitted_at, metrics_summary';

/** Sends a finished session to the athlete's coach. The id must be a UUID. */
export async function publishFinishedWorkout(
  log: CoachFinishedWorkoutLog,
  coachId: string,
): Promise<boolean> {
  if (!isValidUuid(coachId) || !isValidUuid(log.id) || !isValidUuid(log.athleteId)) return false;
  const { error } = await supabase.from('workout_completions').upsert({
    id: log.id,
    coach_id: coachId,
    athlete_id: log.athleteId,
    metrics_summary: workoutSummary(log),
    submitted_at: log.completedAt,
  });
  if (error) console.warn('[coachBridge] workout publish failed:', error.message);
  return !error;
}

/** Sessions the coach's athletes finished in the last week, newest first. Null when they could not be loaded. */
export async function fetchFinishedForCoach(
  coachId: string,
): Promise<CoachFinishedWorkoutLog[] | null> {
  if (!isValidUuid(coachId)) return [];
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('workout_completions')
    .select(COMPLETION_COLUMNS)
    .eq('coach_id', coachId)
    .gte('submitted_at', since)
    .order('submitted_at', { ascending: false })
    .limit(40);
  if (error || !Array.isArray(data)) return null;
  return data.map(mapCompletionRow);
}

/** The athlete's own recent sessions, with any coach reply. */
export async function fetchMyFinishedWorkouts(
  athleteId: string,
): Promise<CoachFinishedWorkoutLog[] | null> {
  if (!isValidUuid(athleteId)) return [];
  const { data, error } = await supabase
    .from('workout_completions')
    .select(COMPLETION_COLUMNS)
    .eq('athlete_id', athleteId)
    .order('submitted_at', { ascending: false })
    .limit(20);
  if (error || !Array.isArray(data)) return null;
  return data.map(mapCompletionRow);
}

/** Stores the coach's reply on the session so the athlete sees it with the workout. */
export async function saveWorkoutFeedback(
  coachId: string,
  workoutId: string,
  feedback: string,
): Promise<boolean> {
  if (!isValidUuid(coachId) || !isValidUuid(workoutId)) return false;
  const { data, error } = await supabase
    .from('workout_completions')
    .select('metrics_summary')
    .eq('id', workoutId)
    .eq('coach_id', coachId)
    .maybeSingle();
  if (error || !data) return false;
  const summary = (
    data.metrics_summary && typeof data.metrics_summary === 'object' ? data.metrics_summary : {}
  ) as Summary;
  const res = await supabase
    .from('workout_completions')
    .update({
      metrics_summary: {
        ...summary,
        coachFeedback: feedback,
        coachFeedbackAt: new Date().toISOString(),
      },
      approval_status: 'approved',
    })
    .eq('id', workoutId)
    .eq('coach_id', coachId);
  return !res.error;
}

/** The coach's listed programs, newest first. Null when they could not be loaded. */
export async function fetchOwnPrograms(coachId: string): Promise<StorefrontProgram[] | null> {
  if (!isValidUuid(coachId)) return [];
  const { data, error } = await supabase
    .from('coach_programs')
    .select(PROGRAM_COLUMNS)
    .eq('coach_id', coachId)
    .eq('listed', true)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !Array.isArray(data)) return null;
  return (await withProgramContent(data as Record<string, unknown>[])).map(mapProgramRow);
}

/** Saves the whole program, every week, day and exercise, so enrolled athletes receive the real plan. */
export async function publishProgram(
  coachId: string,
  coachName: string,
  form: ProgramFormData,
): Promise<StorefrontProgram | null> {
  const title = form.title.trim();
  if (!isValidUuid(coachId) || !title) return null;
  if (!(await ensureCoachCard(coachName))) return null;
  const plan = buildProgramPlan(form);
  const weekOne = weekOneLines(plan);
  const price = form.isFreeCommunity
    ? 0
    : Math.round(Math.max(0, form.priceUsd) * (100 - form.discountPercent));
  const { data, error } = await supabase
    .from('coach_programs')
    .insert({
      id: crypto.randomUUID(),
      coach_id: coachId,
      title,
      description: plan.overview || form.description.trim(),
      split_type: form.category,
      weeks_duration: form.durationWeeks,
      program_data: plan,
      is_template: false,
      price_cents: price,
      days_per_week: form.trainingDaysPerWeek,
      focus: form.category,
      tier: form.difficulty,
      discipline: form.category,
      cover_url: form.coverImage || '',
      week_one: weekOne,
      duration_label: `${form.durationWeeks} ${form.durationWeeks === 1 ? 'week' : 'weeks'}`,
      split_label:
        plan.weeks[0]?.days
          .map((day) => day.splitFocus)
          .filter(Boolean)
          .join(' / ') || '',
      listed: true,
    })
    .select(PROGRAM_COLUMNS)
    .single();
  if (error || !data) {
    if (error) console.warn('[coachBridge] program publish failed:', error.message);
    return null;
  }
  return mapProgramRow({
    ...(data as Record<string, unknown>),
    week_one: weekOne,
    program_data: plan,
  });
}

/** Takes a program off the store. Athletes already enrolled keep it. */
export async function unlistProgram(coachId: string, programId: string): Promise<boolean> {
  if (!isValidUuid(coachId) || !programId) return false;
  const { data, error } = await supabase
    .from('coach_programs')
    .update({ listed: false })
    .eq('id', programId)
    .eq('coach_id', coachId)
    .select('id');
  return !error && Array.isArray(data) && data.length > 0;
}

/** Notes the linked coach sent to all clients, newest first. Null when they could not be loaded. */
export async function fetchCoachNotes(
  coachId: string,
): Promise<Array<{ id: string; title: string; summary: string; createdAt: string }> | null> {
  if (!isValidUuid(coachId)) return [];
  const { data, error } = await supabase
    .from('coach_directives')
    .select('id, title, summary, created_at')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error || !Array.isArray(data)) return null;
  return data.map((row) => ({
    id: String(row.id),
    title: String(row.title || 'Note'),
    summary: String(row.summary || ''),
    createdAt: String(row.created_at || ''),
  }));
}

/** Null when the check-ins could not be loaded. */
export async function fetchRemoteCheckins(
  coachId: string,
): Promise<AthleteCheckInSubmission[] | null> {
  if (!isValidUuid(coachId)) return [];
  const { data, error } = await supabase
    .from('athlete_checkins')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error || !Array.isArray(data)) return null;
  return data.map(mapCheckin);
}

/** Null when the check-ins could not be loaded. */
export async function fetchAthleteCheckins(
  athleteId: string,
): Promise<AthleteCheckInSubmission[] | null> {
  if (!isValidUuid(athleteId)) return [];
  const { data, error } = await supabase
    .from('athlete_checkins')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error || !Array.isArray(data)) return null;
  return data.map(mapCheckin);
}

function shortDate(iso: unknown): string {
  const date = iso ? new Date(String(iso)) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    : '';
}

export function mapCheckin(row: Record<string, unknown>): AthleteCheckInSubmission {
  return {
    id: String(row.id),
    athleteId: String(row.athlete_id || ''),
    athleteName: String(row.athlete_name || 'Athlete'),
    coachId: String(row.coach_id || ''),
    date: shortDate(row.created_at),
    createdAt: String(row.created_at || ''),
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
      givenAt: shortDate(row.feedback_at),
      status: row.status === 'reviewed' ? 'reviewed' : 'pending',
    },
  };
}

/** The athlete's own check-in for their coach. */
export async function submitCheckin(row: {
  athleteId: string;
  athleteName: string;
  coachId: string;
  weightKg: number | null;
  sleepHours: number | null;
  soreness: number | null;
  stress: number | null;
  notes: string;
}): Promise<AthleteCheckInSubmission | null> {
  if (!isValidUuid(row.athleteId) || !isValidUuid(row.coachId)) return null;
  const { data, error } = await supabase
    .from('athlete_checkins')
    .insert({
      id: crypto.randomUUID(),
      athlete_id: row.athleteId,
      athlete_name: row.athleteName,
      coach_id: row.coachId,
      weight_kg: row.weightKg,
      sleep_hours: row.sleepHours,
      soreness: row.soreness,
      stress: row.stress,
      notes: row.notes.trim(),
    })
    .select('*')
    .single();
  if (error || !data) return null;
  return mapCheckin(data as Record<string, unknown>);
}

export async function saveCheckinReplyRemote(id: string, feedback: string): Promise<boolean> {
  if (!id || isSampleId(id)) return false;
  const { data, error } = await supabase
    .from('athlete_checkins')
    .update({ feedback_text: feedback, feedback_at: new Date().toISOString(), status: 'reviewed' })
    .eq('id', id)
    .select('id');
  return !error && Array.isArray(data) && data.length > 0;
}

export async function sendCoachMessage(input: {
  coachId: string;
  athleteId: string;
  senderName: string;
  message: string;
  from: 'coach' | 'athlete';
}): Promise<boolean> {
  const message = input.message.trim();
  if (!isValidUuid(input.coachId) || !isValidUuid(input.athleteId) || !message) return false;
  const { error } = await supabase.from('coach_messages').insert({
    id: `msg-${input.from}-${crypto.randomUUID()}`,
    coach_id: input.coachId,
    athlete_id: input.athleteId,
    sender_name: input.senderName,
    message,
  });
  return !error;
}

import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { enrollCoachClient, isValidUuid } from '../../coach/services/coachService';
import { saveLinkedCoach } from '../../coach/services/coachLink';
import { mockProgramRows } from '../../../services/devMocks';

export interface StorefrontStats {
  followers: number | null;
  following: boolean;
  rating: number | null;
  reviewCount: number;
  years: number | null;
  capacity: number | null;
  athletes: number | null;
  monthlyPriceCents: number | null;
}

export interface StorefrontProgram {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  discipline: string;
  weeks: string;
  daysPerWeek: number | null;
  level: string;
  split: string;
  equipment: string;
  priceCents: number | null;
  weekOne: string[];
}

export interface ProgramCoach {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

export const PROGRAMS_EVENT = 'o1-programs-changed';

export interface CoachingApplication {
  id: string;
  coachId: string;
  coachName: string;
  coachHandle: string;
  coachAvatar: string;
  athleteId: string;
  athleteName: string;
  intake: Record<string, string>;
  goal: string;
  programId: string | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export const EMPTY_STATS: StorefrontStats = {
  followers: null,
  following: false,
  rating: null,
  reviewCount: 0,
  years: null,
  capacity: null,
  athletes: null,
  monthlyPriceCents: null,
};

function numberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function weekLines(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (typeof row === 'string') return row;
      if (row && typeof row === 'object') {
        const day = row as Record<string, unknown>;
        return String(day.title || day.focus || day.name || '');
      }
      return '';
    })
    .filter(Boolean);
}

export async function fetchStorefrontStats(coachId: string): Promise<StorefrontStats> {
  if (!coachId) return EMPTY_STATS;
  const me = await getAuthenticatedUserId();
  const [followRes, mineRes, reviewRes, frontRes, athleteRes] = await Promise.all([
    supabase.from('coach_follows').select('coach_id', { count: 'exact', head: true }).eq('coach_id', coachId),
    isValidUuid(me)
      ? supabase.from('coach_follows').select('coach_id').eq('coach_id', coachId).eq('follower_id', me as string).limit(1)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('coach_reviews').select('stars').eq('coach_id', coachId),
    supabase.from('coach_storefronts').select('years_coaching, capacity, monthly_price_cents').eq('coach_id', coachId).maybeSingle(),
    supabase.from('coaching_applications').select('id', { count: 'exact', head: true }).eq('coach_id', coachId).eq('status', 'accepted'),
  ]);
  const stars = Array.isArray(reviewRes.data) ? reviewRes.data.map((row: { stars: number }) => Number(row.stars)).filter(Number.isFinite) : [];
  const front = (frontRes.data ?? null) as { years_coaching?: number; capacity?: number; monthly_price_cents?: number } | null;
  return {
    followers: followRes.error ? null : followRes.count ?? null,
    following: Array.isArray(mineRes.data) && mineRes.data.length > 0,
    rating: stars.length ? stars.reduce((sum, n) => sum + n, 0) / stars.length : null,
    reviewCount: stars.length,
    years: numberOrNull(front?.years_coaching),
    capacity: numberOrNull(front?.capacity),
    athletes: athleteRes.error ? null : athleteRes.count ?? null,
    monthlyPriceCents: numberOrNull(front?.monthly_price_cents),
  };
}

export async function isFollowing(coachId: string): Promise<boolean> {
  const me = await getAuthenticatedUserId();
  if (!isValidUuid(me) || !coachId) return false;
  const { data } = await supabase.from('coach_follows').select('coach_id').eq('coach_id', coachId).eq('follower_id', me as string).limit(1);
  return Array.isArray(data) && data.length > 0;
}

export const FOLLOW_EVENT = 'o1-coach-follow';

export async function setFollowing(coachId: string, follow: boolean): Promise<boolean> {
  const me = await getAuthenticatedUserId();
  if (!isValidUuid(me) || !coachId || me === coachId) return false;
  const res = follow
    ? await supabase.from('coach_follows').insert({ follower_id: me, coach_id: coachId })
    : await supabase.from('coach_follows').delete().eq('follower_id', me as string).eq('coach_id', coachId);
  const ok = !res.error || res.error.code === '23505';
  if (ok) window.dispatchEvent(new CustomEvent(FOLLOW_EVENT, { detail: { coachId, following: follow } }));
  return ok;
}

export async function fetchStorefrontPrograms(coachId: string): Promise<StorefrontProgram[]> {
  if (!coachId) return [];
  const [own, catalog] = await Promise.all([
    supabase.from('coach_programs').select('*').eq('coach_id', coachId).eq('listed', true),
    supabase.from('program_catalog').select('*').eq('catalog_coach_id', coachId).eq('active', true).order('sort_order'),
  ]);
  const rows = [
    ...(Array.isArray(own.data) ? own.data : []),
    ...(Array.isArray(catalog.data) ? catalog.data : []),
    ...mockProgramRows().filter((row) => row.catalog_coach_id === coachId),
  ] as Record<string, unknown>[];
  return uniquePrograms(rows).map(mapProgramRow);
}

export function uniquePrograms(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const id = String(row.id || '');
    if (!id || !row.title || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function mapProgramRow(row: Record<string, unknown>): StorefrontProgram {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description || row.focus || ''),
    coverUrl: String(row.cover_url || ''),
    discipline: String(row.discipline || ''),
    weeks: String(row.duration_label || ''),
    daysPerWeek: numberOrNull(row.days_per_week),
    level: String(row.tier || ''),
    split: String(row.split_label || ''),
    equipment: String(row.equipment || ''),
    priceCents: numberOrNull(row.price_cents),
    weekOne: weekLines(row.week_one),
  };
}

export function enrollmentRow(athleteId: string, coach: ProgramCoach, program: StorefrontProgram) {
  return {
    athlete_id: athleteId,
    program_id: program.id,
    coach_id: coach.id,
    status: 'active',
    closed_at: null,
    title: program.title,
    description: program.description,
    cover_url: program.coverUrl,
    discipline: program.discipline,
    duration_label: program.weeks,
    days_per_week: program.daysPerWeek,
    tier: program.level,
    split_label: program.split,
    equipment: program.equipment,
    week_one: program.weekOne,
    coach_name: coach.name,
    coach_handle: coach.handle,
    coach_avatar: coach.avatar,
  };
}

export async function enrollInProgram(coach: ProgramCoach, program: StorefrontProgram): Promise<'enrolled' | 'signed-out' | 'failed'> {
  const me = await getAuthenticatedUserId();
  if (!isValidUuid(me)) return 'signed-out';
  const { error } = await supabase
    .from('program_enrollments')
    .upsert(enrollmentRow(me as string, coach, program), { onConflict: 'athlete_id,program_id' });
  if (error) return 'failed';
  window.dispatchEvent(new CustomEvent(PROGRAMS_EVENT));
  return 'enrolled';
}

export async function submitApplication(input: {
  coachId: string;
  coachName: string;
  coachHandle: string;
  coachAvatar: string;
  athleteName: string;
  intake: Record<string, string>;
  goal: string;
  programId?: string | null;
}): Promise<boolean> {
  const me = await getAuthenticatedUserId();
  if (!isValidUuid(me) || !input.coachId || !input.goal.trim()) return false;
  const { error } = await supabase.from('coaching_applications').insert({
    coach_id: input.coachId,
    coach_name: input.coachName,
    coach_handle: input.coachHandle,
    coach_avatar: input.coachAvatar,
    athlete_id: me,
    athlete_name: input.athleteName,
    intake: input.intake,
    goal: input.goal.trim(),
    program_id: input.programId || null,
  });
  return !error;
}

function mapApplication(row: Record<string, unknown>): CoachingApplication {
  const intake = row.intake && typeof row.intake === 'object' ? (row.intake as Record<string, unknown>) : {};
  return {
    id: String(row.id),
    coachId: String(row.coach_id || ''),
    coachName: String(row.coach_name || ''),
    coachHandle: String(row.coach_handle || ''),
    coachAvatar: String(row.coach_avatar || ''),
    athleteId: String(row.athlete_id || ''),
    athleteName: String(row.athlete_name || ''),
    intake: Object.fromEntries(Object.entries(intake).map(([key, value]) => [key, String(value ?? '')])),
    goal: String(row.goal || ''),
    programId: row.program_id ? String(row.program_id) : null,
    status: (row.status as CoachingApplication['status']) || 'pending',
    createdAt: String(row.created_at || ''),
  };
}

export async function fetchMyApplication(coachId: string): Promise<CoachingApplication | null> {
  const me = await getAuthenticatedUserId();
  if (!isValidUuid(me) || !coachId) return null;
  const { data } = await supabase
    .from('coaching_applications')
    .select('*')
    .eq('athlete_id', me as string)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })
    .limit(1);
  return Array.isArray(data) && data[0] ? mapApplication(data[0]) : null;
}

export async function fetchCoachApplications(coachId: string): Promise<CoachingApplication[]> {
  if (!isValidUuid(coachId)) return [];
  const { data } = await supabase
    .from('coaching_applications')
    .select('*')
    .eq('coach_id', coachId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return Array.isArray(data) ? data.map(mapApplication) : [];
}

export async function decideApplication(application: CoachingApplication, accept: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('coaching_applications')
    .update({ status: accept ? 'accepted' : 'declined', decided_at: new Date().toISOString() })
    .eq('id', application.id);
  if (error) return false;
  if (accept) {
    try {
      await enrollCoachClient(application.coachId, {
        id: application.athleteId,
        client_id: application.athleteId,
        name: application.athleteName || 'Athlete',
        handle: '',
        status: 'Need Routine',
        readiness: null,
        volume: null,
      });
    } catch {
      /* The accepted application still links the athlete from their side. */
    }
  }
  return true;
}

export async function adoptAcceptedCoach(): Promise<boolean> {
  const me = await getAuthenticatedUserId();
  if (!isValidUuid(me)) return false;
  const { data } = await supabase
    .from('coaching_applications')
    .select('*')
    .eq('athlete_id', me as string)
    .eq('status', 'accepted')
    .order('decided_at', { ascending: false })
    .limit(1);
  const row = Array.isArray(data) && data[0] ? mapApplication(data[0]) : null;
  if (!row) return false;
  saveLinkedCoach({ id: row.coachId, name: row.coachName, handle: row.coachHandle, avatar: row.coachAvatar });
  return true;
}

export async function saveStorefront(input: { years: number | null; capacity: number | null; monthlyPriceCents: number | null }): Promise<boolean> {
  const me = await getAuthenticatedUserId();
  if (!isValidUuid(me)) return false;
  const { error } = await supabase.from('coach_storefronts').upsert({
    coach_id: me,
    years_coaching: input.years,
    capacity: input.capacity,
    monthly_price_cents: input.monthlyPriceCents,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useReelsStore } from '../../../stores/useReelsStore';
import { isValidUuid } from './coachService';
import { mockProgramRows } from '../../../services/devMocks';
import {
  PROGRAMS_EVENT,
  ProgramCoach,
  StorefrontProgram,
  enrollmentRow,
  mapProgramRow,
  uniquePrograms,
} from '../../reels/services/coachStorefront';

export interface EnrolledProgram extends StorefrontProgram {
  coach: ProgramCoach;
  status: 'active' | 'closed';
  enrolledAt: string;
  closedAt: string | null;
}

export interface BrowseProgram extends StorefrontProgram {
  coach: ProgramCoach;
}

const BROWSE_LIMIT = 30;

async function programRowsById(ids: string[]): Promise<Map<string, Record<string, unknown>>> {
  const byId = new Map<string, Record<string, unknown>>();
  if (!ids.length) return byId;
  const [own, catalog] = await Promise.all([
    supabase.from('coach_programs').select('*').in('id', ids),
    supabase.from('program_catalog').select('*').in('id', ids),
  ]);
  for (const row of [...(own.data ?? []), ...(catalog.data ?? []), ...mockProgramRows()] as Record<string, unknown>[]) {
    if (row?.id && ids.includes(String(row.id))) byId.set(String(row.id), row);
  }
  return byId;
}

/** Paid programs are granted when the coach accepts the application; the athlete's side records the enrollment. */
async function adoptAcceptedPrograms(me: string, enrolled: Set<string>): Promise<boolean> {
  const { data, error } = await supabase
    .from('coaching_applications')
    .select('coach_id, coach_name, coach_handle, coach_avatar, program_id')
    .eq('athlete_id', me)
    .eq('status', 'accepted')
    .not('program_id', 'is', null);
  if (error || !Array.isArray(data)) return false;
  const pending = data.filter((row) => row.program_id && !enrolled.has(String(row.program_id)));
  if (!pending.length) return false;
  const programs = await programRowsById(pending.map((row) => String(row.program_id)));
  const rows = pending
    .filter((row) => programs.has(String(row.program_id)))
    .map((row) =>
      enrollmentRow(
        me,
        { id: String(row.coach_id), name: row.coach_name || '', handle: row.coach_handle || '', avatar: row.coach_avatar || '' },
        mapProgramRow(programs.get(String(row.program_id)) as Record<string, unknown>),
      ),
    );
  if (!rows.length) return false;
  const res = await supabase.from('program_enrollments').upsert(rows, { onConflict: 'athlete_id,program_id' });
  return !res.error;
}

function mapEnrollment(row: Record<string, unknown>, fallback?: Record<string, unknown>): EnrolledProgram {
  const base = mapProgramRow({ ...(fallback ?? {}), ...row, id: row.program_id, title: row.title || fallback?.title || '' });
  return {
    ...base,
    priceCents: null,
    coach: {
      id: String(row.coach_id || ''),
      name: String(row.coach_name || ''),
      handle: String(row.coach_handle || ''),
      avatar: String(row.coach_avatar || ''),
    },
    status: row.status === 'closed' ? 'closed' : 'active',
    enrolledAt: String(row.created_at || ''),
    closedAt: row.closed_at ? String(row.closed_at) : null,
  };
}

/** Null when the member is signed out or the table is unavailable, so the UI can tell "none yet" from "can't load". */
export async function fetchMyPrograms(): Promise<EnrolledProgram[] | null> {
  const me = await getAuthenticatedUserId();
  if (!isValidUuid(me)) return null;
  const load = () =>
    supabase.from('program_enrollments').select('*').eq('athlete_id', me as string).order('created_at', { ascending: true });
  let { data, error } = await load();
  if (error || !Array.isArray(data)) return null;
  if (await adoptAcceptedPrograms(me as string, new Set(data.map((row) => String(row.program_id))))) {
    ({ data, error } = await load());
    if (error || !Array.isArray(data)) return null;
  }
  const rows = data as Record<string, unknown>[];
  const missing = rows.filter((row) => !row.title).map((row) => String(row.program_id));
  const fallback = await programRowsById(missing);
  return rows
    .map((row) => mapEnrollment(row, fallback.get(String(row.program_id))))
    .filter((program) => program.title);
}

export async function setProgramStatus(programId: string, status: 'active' | 'closed'): Promise<boolean> {
  const me = await getAuthenticatedUserId();
  if (!isValidUuid(me) || !programId) return false;
  const { error } = await supabase
    .from('program_enrollments')
    .update({ status, closed_at: status === 'closed' ? new Date().toISOString() : null })
    .eq('athlete_id', me as string)
    .eq('program_id', programId);
  if (error) return false;
  window.dispatchEvent(new CustomEvent(PROGRAMS_EVENT));
  return true;
}

export async function fetchBrowsePrograms(): Promise<BrowseProgram[]> {
  const [own, catalog] = await Promise.all([
    supabase.from('coach_programs').select('*').eq('listed', true).limit(BROWSE_LIMIT),
    supabase.from('program_catalog').select('*').eq('active', true).not('catalog_coach_id', 'is', null).order('sort_order').limit(BROWSE_LIMIT),
  ]);
  const rows = uniquePrograms([...(own.data ?? []), ...(catalog.data ?? []), ...mockProgramRows()] as Record<string, unknown>[]);
  const coachIdOf = (row: Record<string, unknown>) => String(row.coach_id || row.catalog_coach_id || '');

  const coaches = new Map<string, ProgramCoach>();
  for (const reel of useReelsStore.getState().reels) {
    const c = reel.coach;
    if (c?.id && !coaches.has(c.id)) coaches.set(c.id, { id: c.id, name: c.name, handle: c.handle, avatar: c.avatar });
  }
  const unknown = [...new Set(rows.map(coachIdOf).filter((id) => id && !coaches.has(id)))];
  if (unknown.length) {
    const { data } = await supabase.from('coach_profiles').select('id, display_name, avatar_url').in('id', unknown);
    for (const p of (data ?? []) as Record<string, unknown>[]) {
      const name = String(p.display_name || '');
      if (!p.id || !name) continue;
      coaches.set(String(p.id), { id: String(p.id), name, handle: '', avatar: String(p.avatar_url || '') });
    }
  }

  return rows.flatMap((row) => {
    const coach = coaches.get(coachIdOf(row));
    return coach ? [{ ...mapProgramRow(row), coach }] : [];
  });
}

import { supabase } from '../../../services/supabaseClient';
import { DirectiveItem } from '../types/coachDirectives';
import { AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { CoachEarningsTransaction } from '../../../types';
import { safeStorage } from '../../../utils/safeStorage';
import { WORKOUT_BLUEPRINTS } from '../../../data/workoutBlueprints';
import { isSampleId } from './sampleIds';

export interface Athlete {
  id: string;
  client_id?: string;
  name: string;
  handle: string;
  status: 'Active' | 'Inactive' | 'Check-in' | 'Need Routine';
  readiness: number | null;
  volume: number | null;
  avatar?: string;
  lastActive?: string;
  sets?: number;
  prs?: number;
  sleepHours?: number;
  soreness?: string;
  fuelPct?: number | null;
  cycle?: string;
}

const STORAGE_COACH_CLIENTS = 'o1fc_custom_coach_clients';

type Row = Record<string, unknown>;

const text = (value: unknown, fallback = ''): string => (value == null || value === '' ? fallback : String(value));

function finiteOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export const isValidUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

// 1. Genuine athlete roster query (custom coach clients + Supabase coach_clients)
export async function fetchCoachClients(coachId: string = ''): Promise<Athlete[]> {
  const localClients = (safeStorage.getItem<Athlete[]>(STORAGE_COACH_CLIENTS, []) || []).filter(
    (athlete) => !String(athlete.id).startsWith('preview-'),
  );

  if (!isValidUuid(coachId)) {
    return localClients;
  }

  try {
    const rosterRes = await supabase
      .from('athlete_roster')
      .select('client_id, id, client_name, name, handle, status, readiness, volume, avatar, last_active_at')
      .eq('coach_id', coachId);
    const clientsRes = (!rosterRes.data || rosterRes.data.length === 0)
      ? await supabase
          .from('coach_clients')
          .select('client_id, id, client_name, name, handle, status, readiness, volume, avatar, last_active_at')
          .eq('coach_id', coachId)
      : rosterRes;
    const data = clientsRes.data;
    const error = clientsRes.error;

    if (error) {
      console.error('[coachService] roster query failed:', error.message);
      return localClients;
    }
    if (!data || data.length === 0) {
      return localClients;
    }

    const remoteAthletes: Athlete[] = (data as Row[]).map((row, idx) => ({
      id: text(row.id || row.client_id, `athlete-${idx}`),
      client_id: text(row.client_id || row.id, `athlete-${idx}`),
      name: text(row.name || row.client_name, 'Unnamed client'),
      handle: text(row.handle),
      status: (text(row.status) as Athlete['status']) || 'Active',
      readiness: finiteOrNull(row.readiness),
      volume: finiteOrNull(row.volume),
      avatar: row.avatar ? String(row.avatar) : undefined,
      lastActive: row.last_active_at ? new Date(String(row.last_active_at)).toLocaleDateString() : '--',
    }));

    // Merge without duplicates by id
    const seenIds = new Set(localClients.map((a) => a.id));
    const merged = [...localClients];
    for (const r of remoteAthletes) {
      if (!seenIds.has(r.id)) {
        merged.push(r);
      }
    }
    return merged;
  } catch (err) {
    console.debug('[coachService] fetchCoachClients query caught:', err);
    return localClients;
  }
}

// 2. Direct Supabase directive signals query (coach_directives / coach_broadcasts)
const CANNED_NOTES = new Set(['thursday squat', 'sleep first', 'sharp knee', 'eat before', 'lighter week']);

const BLUEPRINT_TITLES = new Set(WORKOUT_BLUEPRINTS.map((row) => row.title.trim().toLowerCase()));
const SYNTHESIZED_TITLE = /^o1fc .+ • /;

function programTitles(): Set<string> {
  const stored = safeStorage.getItem<{ title?: string }[]>('o1_coach_custom_programs', []) || [];
  return new Set(
    (Array.isArray(stored) ? stored : [])
      .map((row) => String(row?.title || '').trim().toLowerCase())
      .filter(Boolean),
  );
}

export function liveDirectives(rows: DirectiveItem[]): DirectiveItem[] {
  const programs = programTitles();
  return rows.filter((row) => {
    const title = row.title.trim().toLowerCase();
    return !String(row.id).startsWith('preview-')
      && !CANNED_NOTES.has(title)
      && !BLUEPRINT_TITLES.has(title)
      && !SYNTHESIZED_TITLE.test(title)
      && !programs.has(title);
  });
}

export async function fetchCoachDirectives(coachId: string = ''): Promise<DirectiveItem[]> {
  const local = liveDirectives(safeStorage.getItem<DirectiveItem[]>(LOCAL_NOTES_KEY, []) || []);
  if (!isValidUuid(coachId)) return local;

  try {
    const { data, error } = await supabase
      .from('coach_directives')
      .select('id, tag, title, summary, affected_count, priority, badge_style')
      .eq('coach_id', coachId);

    if (error || !data || data.length === 0) {
      // Fallback check on broadcasts
      const broadcastRes = await supabase
        .from('coach_broadcasts')
        .select('id, tag, title, message, affected_count, priority')
        .eq('coach_id', coachId);

      if (!broadcastRes.error && Array.isArray(broadcastRes.data) && broadcastRes.data.length > 0) {
        return liveDirectives((broadcastRes.data as Row[]).map((b) => ({
          id: text(b.id),
          tag: text(b.tag, 'TRAINING') as DirectiveItem['tag'],
          title: text(b.title, 'Broadcast'),
          summary: text(b.message || b.summary),
          affectedCount: Number(b.affected_count || 1),
          priority: text(b.priority, 'HIGH') as DirectiveItem['priority'],
          badgeStyle: 'bg-red-950/60 text-red-400 border-red-800/60',
        })));
      }

      return local;
    }

    const remote: DirectiveItem[] = (data as Row[]).map((d) => ({
      id: text(d.id),
      tag: text(d.tag, 'TRAINING') as DirectiveItem['tag'],
      title: text(d.title, 'Note'),
      summary: text(d.summary),
      affectedCount: Number(d.affected_count || 0),
      priority: text(d.priority, 'HIGH') as DirectiveItem['priority'],
      badgeStyle: text(d.badge_style, 'bg-red-950/60 text-red-400 border-red-800/60'),
    }));
    const seen = new Set(remote.map((row) => row.id));
    return liveDirectives([...local.filter((row) => !seen.has(row.id)), ...remote]);
  } catch (err) {
    console.debug('[coachService] fetchCoachDirectives query caught:', err);
    return local;
  }
}

// 3. Direct Supabase earnings & transactions query (coach_earnings / transactions)
export async function fetchCoachEarnings(coachId: string = ''): Promise<CoachEarningsTransaction[]> {
  if (!isValidUuid(coachId)) return [];

  try {
    const { data, error } = await supabase
      .from('coach_earnings')
      .select('id, athlete_name, plan, amount, created_at, status')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }

    return (data as Row[]).map((t) => {
      const status = text(t.status).toUpperCase();
      return {
        id: text(t.id),
        athleteName: text(t.athlete_name, 'Athlete'),
        plan: text(t.plan, 'Coaching'),
        amount: Number(t.amount || 0),
        date: t.created_at ? new Date(String(t.created_at)).toLocaleDateString() : 'Recent',
        status: status === 'PENDING' || status === 'REFUNDED' ? status : 'COMPLETED',
      };
    });
  } catch (err) {
    console.debug('[coachService] fetchCoachEarnings live query error, returning empty:', err);
    return [];
  }
}

// 4. Direct Supabase inbox messages query (coach_messages)
function liveMessages<T extends { id: string; athleteId?: string }>(rows: T[]): T[] {
  return rows.filter((row) => !isSampleId(row.id) && !isSampleId(row.athleteId));
}

export interface CoachMessage {
  id: string;
  sender: string;
  time: string;
  message: string;
  athleteId: string;
  /** Older rows carry no author marker; callers resolve them by sender name. */
  from: 'coach' | 'athlete' | null;
}

function messageAuthor(id: string): CoachMessage['from'] {
  if (id.startsWith('msg-coach-')) return 'coach';
  if (id.startsWith('msg-athlete-')) return 'athlete';
  return null;
}

/** Newest first. Pass `athleteId` to load a single conversation. */
export async function fetchCoachMessages(coachId: string = '', athleteId = ''): Promise<CoachMessage[]> {
  const stored = safeStorage.getItem<Omit<CoachMessage, 'from'>[]>(LOCAL_MESSAGES_KEY, []) || [];
  const local = liveMessages(stored.map((row) => ({ ...row, from: messageAuthor(row.id) })))
    .filter((row) => !athleteId || row.athleteId === athleteId);
  if (!isValidUuid(coachId)) return local;

  try {
    let query = supabase
      .from('coach_messages')
      .select('id, sender_name, message, created_at, athlete_id')
      .eq('coach_id', coachId);
    if (athleteId) query = query.eq('athlete_id', athleteId);
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return local;
    }

    const remote: CoachMessage[] = (data as Row[]).map((m) => ({
      id: String(m.id),
      sender: text(m.sender_name),
      time: m.created_at ? new Date(String(m.created_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      message: text(m.message),
      athleteId: String(m.athlete_id || ''),
      from: messageAuthor(String(m.id)),
    }));
    const seen = new Set(remote.map((row) => row.id));
    return liveMessages([...local.filter((row) => !seen.has(row.id)), ...remote]);
  } catch (err) {
    console.debug('[coachService] fetchCoachMessages live query error, returning empty:', err);
    return local;
  }
}

export type { CoachEarningsTransaction } from '../../../types';

export async function enrollCoachClient(coachId: string, athlete: Athlete): Promise<Athlete> {
  if (!isValidUuid(coachId)) {
    throw new Error('Sign in as coach to enroll athletes.');
  }
  const row = {
    coach_id: coachId,
    client_id: athlete.client_id || athlete.id,
    client_name: athlete.name,
    name: athlete.name,
    handle: athlete.handle,
    status: athlete.status,
    readiness: athlete.readiness,
    volume: athlete.volume,
    last_active_at: new Date().toISOString(),
  };
  const roster = await supabase.from('athlete_roster').insert([row]).select();
  if (roster.error) {
    const clients = await supabase.from('coach_clients').insert([row]).select();
    if (clients.error) throw new Error(clients.error.message);
  }
  return athlete;
}

const CHECKIN_STORAGE_KEY = 'o1fc_day_checkins_v1';
const LOCAL_MESSAGES_KEY = 'o1_coach_messages_local';
const LOCAL_NOTES_KEY = 'o1_coach_notes_local';

export function readStoredCheckins(): AthleteCheckInSubmission[] {
  return safeStorage.getItem<AthleteCheckInSubmission[]>(CHECKIN_STORAGE_KEY, []) || [];
}

export function writeStoredCheckins(rows: AthleteCheckInSubmission[]): void {
  safeStorage.setItem(CHECKIN_STORAGE_KEY, rows);
}

export async function saveCheckinRemote(row: AthleteCheckInSubmission): Promise<void> {
  if (isSampleId(row.id) || isSampleId(row.athleteId)) return;
  try {
    await supabase.from('athlete_checkins').upsert({
      id: row.id,
      athlete_id: row.athleteId || null,
      athlete_name: row.athleteName,
      coach_id: row.coachId || null,
      weight_kg: row.weightKg || null,
      sleep_hours: row.sleepHours || null,
      soreness: row.sorenessRating || null,
      stress: row.stressRating || null,
      notes: row.notes || '',
    });
  } catch {
    /* The phone copy is the record until this table exists. */
  }
}

export async function publishCoachNote(coachId: string, note: DirectiveItem): Promise<boolean> {
  if (!isValidUuid(coachId)) return false;
  try {
    const { error } = await supabase.from('coach_directives').insert({
      id: note.id,
      coach_id: coachId,
      tag: note.tag,
      title: note.title,
      summary: note.summary,
      affected_count: note.affectedCount,
      priority: note.priority,
    });
    return !error;
  } catch {
    return false;
  }
}

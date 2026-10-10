import { supabase } from '../../../services/supabaseClient';
import { DirectiveItem } from '../types/coachDirectives';
import { AthleteCheckInSubmission } from '../types/coachPlatformTypes';
import { CoachEarningsTransaction, SquadAthlete } from '../../../types';
import { safeStorage } from '../../../utils/safeStorage';
import { WORKOUT_BLUEPRINTS } from '../../../data/workoutBlueprints';

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

    const remoteAthletes = data.map((row: any, idx: number) => ({
      id: row.id || row.client_id || `athlete-${idx}`,
      client_id: row.client_id || row.id || `athlete-${idx}`,
      name: row.name || row.client_name || 'Unnamed client',
      handle: row.handle || '',
      status: (row.status as Athlete['status']) || 'Active',
      readiness: finiteOrNull(row.readiness),
      volume: finiteOrNull(row.volume),
      avatar: row.avatar,
      lastActive: row.last_active_at ? new Date(row.last_active_at).toLocaleDateString() : '--',
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
        return broadcastRes.data.map((b: any) => ({
          id: b.id,
          tag: b.tag || 'TRAINING',
          title: b.title || 'Broadcast Signal',
          summary: b.message || b.summary || '',
          affectedCount: Number(b.affected_count || 1),
          priority: b.priority || 'HIGH',
          badgeStyle: 'bg-red-950/60 text-red-400 border-red-800/60',
        }));
      }

      return local;
    }

    const remote = data.map((d: any) => ({
      id: d.id,
      tag: d.tag || 'TRAINING',
      title: d.title || 'Directive Signal',
      summary: d.summary || '',
      affectedCount: Number(d.affected_count || 0),
      priority: d.priority || 'HIGH',
      badgeStyle: d.badge_style || 'bg-red-950/60 text-red-400 border-red-800/60',
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

    return data.map((t: any) => ({
      id: t.id,
      athleteName: t.athlete_name || 'Athlete Member',
      plan: t.plan || 'Coaching Retainer',
      amount: Number(t.amount || 0),
      date: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recent',
      status: (t.status?.toUpperCase() === 'PENDING' || t.status?.toUpperCase() === 'REFUNDED') ? t.status.toUpperCase() : 'COMPLETED',
    }));
  } catch (err) {
    console.debug('[coachService] fetchCoachEarnings live query error, returning empty:', err);
    return [];
  }
}

// 4. Direct Supabase inbox messages query (coach_messages)
function liveMessages<T extends { id: string; athleteId?: string }>(rows: T[]): T[] {
  return rows.filter((row) => !String(row.id).startsWith('preview-') && !String(row.athleteId || '').startsWith('preview-'));
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

    const remote: CoachMessage[] = data.map((m: any) => ({
      id: String(m.id),
      sender: m.sender_name || '',
      time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      message: m.message || '',
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

// 5. Direct Squad Review query built from actual coach clients
export async function fetchReviewSquad(coachId: string = ''): Promise<SquadAthlete[]> {
  const clients = await fetchCoachClients(coachId);
  return clients.map((c) => ({
    id: c.id,
    callsign: c.handle.replace(/^@/, '').toUpperCase(),
    name: c.name,
    tier: 'Tier 1 Operator' as const,
    status: c.status as any,
    statusColor: ((c.readiness ?? 0) < 60 ? 'crimson' : (c.readiness ?? 0) < 80 ? 'amber' : 'cyan') as any,
    heartRate: 0,
    cnsStrain: 0,
    recoveryScore: c.readiness ?? 0,
    lastCheckIn: c.lastActive || '--',
    currentProtocol: '',
    tempoScore: 0,
  }));
}

/**
 * Batch Protocol Dispatch: inserts assigned workouts into assigned_workouts table.
 */
export async function dispatchWorkoutsToAthletes(
  selectedAthleteIds: string[],
  coachId: string,
  workoutTitle: string,
  exercises: any[]
): Promise<any> {
  if (!coachId || !isValidUuid(coachId)) {
    throw new Error('Sign in as coach to dispatch.');
  }
  const payload = selectedAthleteIds.map((targetClientId) => ({
    coach_id: coachId,
    client_id: targetClientId,
    athlete_id: targetClientId,
    title: workoutTitle,
    exercises: exercises,
    workout_data: { title: workoutTitle, exercises: exercises },
    status: 'pending',
    assigned_date: new Date().toISOString(),
  }));

  try {
    const { data, error } = await supabase.from('assigned_workouts').insert(payload);
    if (error) throw new Error(error.message);
    return data || payload;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Dispatch failed');
  }
}

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

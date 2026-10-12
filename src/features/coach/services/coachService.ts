import { supabase } from '../../../services/supabaseClient';
import { DirectiveItem } from '../types/coachDirectives';
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

type Row = Record<string, unknown>;

const text = (value: unknown, fallback = ''): string => (value == null || value === '' ? fallback : String(value));

export const isValidUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

const ROSTER_COLUMNS = 'id, client_id, client_name, client_avatar, status, created_at';

function mapRosterRow(row: Row): Athlete {
  const clientId = text(row.client_id);
  return {
    id: clientId || text(row.id),
    client_id: clientId,
    name: text(row.client_name, 'Athlete'),
    handle: '',
    status: 'Active',
    readiness: null,
    volume: null,
    avatar: row.client_avatar ? String(row.client_avatar) : undefined,
    lastActive: row.created_at ? `Joined ${new Date(String(row.created_at)).toLocaleDateString()}` : undefined,
  };
}

export const ROSTER_PAGE = 50;

/** One page of active clients linked to this coach, newest first. Null when the roster could not be loaded. */
export async function fetchCoachClients(coachId: string, offset = 0): Promise<Athlete[] | null> {
  if (!isValidUuid(coachId)) return [];
  const { data, error } = await supabase
    .from('coach_clients')
    .select(ROSTER_COLUMNS)
    .eq('coach_id', coachId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .order('client_id', { ascending: true })
    .range(offset, offset + ROSTER_PAGE - 1);
  if (error || !Array.isArray(data)) {
    if (error) console.warn('[coachService] roster query failed:', error.message);
    return null;
  }
  return (data as Row[]).map(mapRosterRow);
}

/** Links an athlete to a coach. Safe to call twice; the pair is unique. */
export async function linkCoachClient(coachId: string, client: { id: string; name: string; avatar?: string }): Promise<boolean> {
  if (!isValidUuid(coachId) || !isValidUuid(client.id)) return false;
  const { error } = await supabase.from('coach_clients').upsert(
    {
      coach_id: coachId,
      client_id: client.id,
      client_name: client.name || 'Athlete',
      client_avatar: client.avatar || null,
      status: 'active',
    },
    { onConflict: 'coach_id,client_id' },
  );
  if (error) console.warn('[coachService] link client failed:', error.message);
  return !error;
}

const BLUEPRINT_TITLES = new Set(WORKOUT_BLUEPRINTS.map((row) => row.title.trim().toLowerCase()));
const SYNTHESIZED_TITLE = /^o1fc .+ • /;

/** Hides rows older builds wrote automatically (blueprint titles, synthesized dispatches). */
export function liveDirectives(rows: DirectiveItem[]): DirectiveItem[] {
  return rows.filter((row) => {
    const title = row.title.trim().toLowerCase();
    return !BLUEPRINT_TITLES.has(title) && !SYNTHESIZED_TITLE.test(title);
  });
}

const NOTE_BADGE = 'bg-o1-sheet text-o1-text border-white/[0.07]';

function mapDirective(d: Row): DirectiveItem {
  return {
    id: text(d.id),
    tag: text(d.tag, 'TRAINING') as DirectiveItem['tag'],
    title: text(d.title, 'Note'),
    summary: text(d.summary),
    affectedCount: Number(d.affected_count || 0),
    priority: text(d.priority, 'NORMAL') as DirectiveItem['priority'],
    badgeStyle: NOTE_BADGE,
    createdAt: d.created_at ? String(d.created_at) : undefined,
  };
}

/** Newest first. Null when the notes could not be loaded. */
export async function fetchCoachDirectives(coachId: string): Promise<DirectiveItem[] | null> {
  if (!isValidUuid(coachId)) return [];
  const { data, error } = await supabase
    .from('coach_directives')
    .select('id, tag, title, summary, affected_count, priority, created_at')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !Array.isArray(data)) {
    if (error) console.warn('[coachService] notes query failed:', error.message);
    return null;
  }
  return liveDirectives((data as Row[]).map(mapDirective));
}

export async function publishCoachNote(coachId: string, note: DirectiveItem): Promise<DirectiveItem | null> {
  if (!isValidUuid(coachId)) return null;
  const { data, error } = await supabase
    .from('coach_directives')
    .insert({
      id: note.id,
      coach_id: coachId,
      tag: note.tag,
      title: note.title,
      summary: note.summary,
      affected_count: note.affectedCount,
      priority: note.priority,
    })
    .select('id, tag, title, summary, affected_count, priority, created_at')
    .single();
  if (error || !data) return null;
  return mapDirective(data as Row);
}

export async function updateCoachNote(coachId: string, id: string, patch: { tag: DirectiveItem['tag']; title: string; summary: string }): Promise<boolean> {
  if (!isValidUuid(coachId) || !id) return false;
  const { data, error } = await supabase
    .from('coach_directives')
    .update(patch)
    .eq('id', id)
    .eq('coach_id', coachId)
    .select('id');
  return !error && Array.isArray(data) && data.length > 0;
}

export async function deleteCoachNote(coachId: string, id: string): Promise<boolean> {
  if (!isValidUuid(coachId) || !id) return false;
  const { error } = await supabase.from('coach_directives').delete().eq('id', id).eq('coach_id', coachId);
  return !error;
}

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
  createdAt: string;
}

function messageAuthor(id: string): CoachMessage['from'] {
  if (id.startsWith('msg-coach-')) return 'coach';
  if (id.startsWith('msg-athlete-')) return 'athlete';
  return null;
}

export function mapCoachMessage(m: Row): CoachMessage {
  return {
    id: String(m.id),
    sender: text(m.sender_name),
    time: m.created_at ? new Date(String(m.created_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    message: text(m.message),
    athleteId: String(m.athlete_id || ''),
    from: messageAuthor(String(m.id)),
    createdAt: m.created_at ? String(m.created_at) : '',
  };
}

/** Newest first: the latest 50 lines of one conversation, or the latest 200 across the inbox. Null when it could not be loaded. */
export async function fetchCoachMessages(coachId: string, athleteId = ''): Promise<CoachMessage[] | null> {
  if (!isValidUuid(coachId)) return [];
  let query = supabase
    .from('coach_messages')
    .select('id, sender_name, message, created_at, athlete_id')
    .eq('coach_id', coachId);
  if (athleteId) query = query.eq('athlete_id', athleteId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(athleteId ? 50 : 200);
  if (error || !Array.isArray(data)) return null;
  return liveMessages((data as Row[]).map(mapCoachMessage));
}

/** The newest note the coach sent each athlete, keyed by athlete id. */
export async function fetchLatestCoachFeedback(coachId: string): Promise<Record<string, string>> {
  if (!isValidUuid(coachId)) return {};
  const { data, error } = await supabase
    .from('coach_messages')
    .select('id, athlete_id, message, created_at')
    .eq('coach_id', coachId)
    .like('id', 'msg-coach-%')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error || !Array.isArray(data)) return {};
  const latest: Record<string, string> = {};
  for (const row of data as Row[]) {
    const athleteId = text(row.athlete_id);
    if (athleteId && !(athleteId in latest)) latest[athleteId] = text(row.message);
  }
  return latest;
}
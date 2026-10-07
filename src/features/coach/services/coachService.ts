import { supabase } from '../../../services/supabaseClient';
import { DirectiveItem } from '../types/coachDirectives';
import { CoachEarningsTransaction, SquadAthlete } from '../../../types';
import { safeStorage } from '../../../utils/safeStorage';

export interface Athlete {
  id: string;
  client_id?: string;
  name: string;
  handle: string;
  status: 'Active' | 'Inactive' | 'Check-in' | 'Need Routine';
  readiness: number;
  volume: number;
  avatar?: string;
  lastActive?: string;
}

const STORAGE_COACH_CLIENTS = 'o1fc_custom_coach_clients';

const isValidUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

// 1. Genuine athlete roster query (custom coach clients + Supabase coach_clients)
export async function fetchCoachClients(coachId: string = ''): Promise<Athlete[]> {
  const localClients = safeStorage.getItem<Athlete[]>(STORAGE_COACH_CLIENTS, []) || [];

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
      name: row.name || row.client_name || `Athlete ${idx + 1}`,
      handle: row.handle || `@athlete_${idx + 1}`,
      status: (row.status as Athlete['status']) || 'Active',
      readiness: Number(row.readiness ?? 85),
      volume: Number(row.volume ?? 12500),
      avatar: row.avatar,
      lastActive: row.last_active_at ? new Date(row.last_active_at).toLocaleDateString() : 'Recently',
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
export async function fetchCoachDirectives(coachId: string = ''): Promise<DirectiveItem[]> {
  if (!isValidUuid(coachId)) return [];

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

      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      tag: d.tag || 'TRAINING',
      title: d.title || 'Directive Signal',
      summary: d.summary || '',
      affectedCount: Number(d.affected_count || 0),
      priority: d.priority || 'HIGH',
      badgeStyle: d.badge_style || 'bg-red-950/60 text-red-400 border-red-800/60',
    }));
  } catch (err) {
    console.debug('[coachService] fetchCoachDirectives query caught:', err);
    return [];
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
export async function fetchCoachMessages(coachId: string = ''): Promise<Array<{ id: string; sender: string; time: string; message: string }>> {
  if (!isValidUuid(coachId)) return [];

  try {
    const { data, error } = await supabase
      .from('coach_messages')
      .select('id, sender_name, message, created_at')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((m: any) => ({
      id: m.id,
      sender: m.sender_name || 'Athlete',
      time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      message: m.message || '',
    }));
  } catch (err) {
    console.debug('[coachService] fetchCoachMessages live query error, returning empty:', err);
    return [];
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
    statusColor: (c.readiness < 60 ? 'crimson' : c.readiness < 80 ? 'amber' : 'cyan') as any,
    heartRate: 72,
    cnsStrain: 8.0,
    recoveryScore: c.readiness,
    lastCheckIn: c.lastActive || 'Recently',
    currentProtocol: 'Active Coaching Protocol',
    tempoScore: 90,
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

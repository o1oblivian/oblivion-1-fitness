import { supabase, isSupabaseConfigured } from './supabase';
import { deltaSyncQueue, LRUMemoryCache } from './scaleEngine';

const coachFeedLRU = new LRUMemoryCache<string, CoachFeedEntry[]>(100);

export interface CoachFeedEntry {
  id: string;
  user_email: string;
  athlete_name: string;
  athlete_handle: string;
  volume: string;
  title: string;
  date_label: string;
  time_ago: string;
  approved: boolean;
  duration: string;
  readiness: number;
  exercises: {
    name: string;
    sets: { weight: number | string; reps: number | string; rpe: number | string }[];
    hasVideo: boolean;
    coachNote: string;
  }[];
}

const LOCAL_KEY = (email: string) => `o1fc_coach_feed_${email}`;

function getLocal(email: string): CoachFeedEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY(email)) || '[]');
  } catch { return []; }
}

function saveLocal(email: string, entries: CoachFeedEntry[]) {
  localStorage.setItem(LOCAL_KEY(email), JSON.stringify(entries));
}

export async function saveCoachFeedEntry(
  entry: Omit<CoachFeedEntry, 'id'>,
): Promise<CoachFeedEntry> {
  const local: CoachFeedEntry = { ...entry, id: `local_${Date.now()}` };

  deltaSyncQueue.enqueue('coach_activity_logs', 'INSERT', {
    user_email: entry.user_email,
    athlete_name: entry.athlete_name,
    athlete_handle: entry.athlete_handle,
    volume: entry.volume,
    title: entry.title,
    date_label: entry.date_label,
    time_ago: entry.time_ago,
    approved: entry.approved,
    duration: entry.duration,
    readiness: entry.readiness,
    exercises: entry.exercises,
  });

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('coach_activity_logs')
      .insert({
        user_email: entry.user_email,
        athlete_name: entry.athlete_name,
        athlete_handle: entry.athlete_handle,
        volume: entry.volume,
        title: entry.title,
        date_label: entry.date_label,
        time_ago: entry.time_ago,
        approved: entry.approved,
        duration: entry.duration,
        readiness: entry.readiness,
        exercises: entry.exercises,
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      const saved: CoachFeedEntry = {
        id: data.id,
        user_email: data.user_email,
        athlete_name: data.athlete_name,
        athlete_handle: data.athlete_handle,
        volume: data.volume,
        title: data.title,
        date_label: data.date_label,
        time_ago: data.time_ago,
        approved: data.approved,
        duration: data.duration,
        readiness: data.readiness,
        exercises: data.exercises as CoachFeedEntry['exercises'],
      };
      const locals = getLocal(entry.user_email);
      locals.unshift(saved);
      saveLocal(entry.user_email, locals.slice(0, 100));
      coachFeedLRU.set(entry.user_email, locals.slice(0, 100));
      return saved;
    }
  }

  const locals = getLocal(entry.user_email);
  locals.unshift(local);
  saveLocal(entry.user_email, locals.slice(0, 100));
  coachFeedLRU.set(entry.user_email, locals.slice(0, 100));
  return local;
}

export async function loadCoachFeed(
  email: string,
  limit = 50,
): Promise<CoachFeedEntry[]> {
  const cached = coachFeedLRU.get(email);
  if (cached && cached.length > 0) {
    return cached.slice(0, limit);
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('coach_activity_logs')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      const entries: CoachFeedEntry[] = data.map(d => ({
        id: d.id,
        user_email: d.user_email,
        athlete_name: d.athlete_name,
        athlete_handle: d.athlete_handle,
        volume: d.volume,
        title: d.title,
        date_label: d.date_label,
        time_ago: d.time_ago,
        approved: d.approved,
        duration: d.duration,
        readiness: d.readiness,
        exercises: d.exercises as CoachFeedEntry['exercises'],
      }));
      saveLocal(email, entries.slice(0, 100));
      coachFeedLRU.set(email, entries.slice(0, 100));
      return entries;
    }
  }

  const locals = getLocal(email);
  coachFeedLRU.set(email, locals);
  return locals;
}

export async function updateCoachLogApproval(
  email: string,
  logId: string,
  approved: boolean,
): Promise<void> {
  deltaSyncQueue.enqueue('coach_activity_logs', 'UPDATE', { id: logId, approved });

  if (isSupabaseConfigured()) {
    await supabase
      .from('coach_activity_logs')
      .update({ approved })
      .eq('id', logId);
  }
  const locals = getLocal(email);
  const entry = locals.find(e => e.id === logId);
  if (entry) {
    entry.approved = approved;
    saveLocal(email, locals);
    coachFeedLRU.set(email, locals);
  }
}

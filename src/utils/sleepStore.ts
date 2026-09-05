import { supabase, isSupabaseConfigured } from './supabase';

export interface SleepLogEntry {
  id: string;
  user_email: string;
  log_date: string;
  bedtime: string;
  wake_time: string;
  duration_minutes: number;
  quality: number;
  notes: string;
  created_at: string;
}

const LOCAL_KEY = (email: string) => `o1fc_sleep_logs_${email}`;

function getLocal(email: string): SleepLogEntry[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY(email)) || '[]'); } catch { return []; }
}

function saveLocal(email: string, entries: SleepLogEntry[]) {
  localStorage.setItem(LOCAL_KEY(email), JSON.stringify(entries));
}

export function calcDurationMinutes(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return wakeMins - bedMins;
}

export async function loadSleepLogs(email: string, limit = 365): Promise<SleepLogEntry[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_email', email)
      .order('log_date', { ascending: false })
      .limit(limit);
    if (!error && data && data.length > 0) {
      const entries: SleepLogEntry[] = data.map(d => ({
        id: d.id,
        user_email: d.user_email,
        log_date: d.log_date,
        bedtime: d.bedtime || '',
        wake_time: d.wake_time || '',
        duration_minutes: Number(d.duration_minutes),
        quality: Number(d.quality),
        notes: d.notes || '',
        created_at: d.created_at,
      }));
      saveLocal(email, entries);
      return entries;
    }
  }
  return getLocal(email);
}

export async function upsertSleepLog(
  email: string,
  logDate: string,
  bedtime: string,
  wakeTime: string,
  quality: number,
  notes = '',
): Promise<SleepLogEntry | null> {
  const duration_minutes = calcDurationMinutes(bedtime, wakeTime);
  const entry: SleepLogEntry = {
    id: `local_${Date.now()}`,
    user_email: email,
    log_date: logDate,
    bedtime,
    wake_time: wakeTime,
    duration_minutes,
    quality,
    notes,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('sleep_logs')
      .upsert(
        { user_email: email, log_date: logDate, bedtime, wake_time: wakeTime, duration_minutes, quality, notes },
        { onConflict: 'user_email,log_date' },
      )
      .select()
      .maybeSingle();
    if (!error && data) {
      const saved: SleepLogEntry = {
        id: data.id,
        user_email: data.user_email,
        log_date: data.log_date,
        bedtime: data.bedtime || '',
        wake_time: data.wake_time || '',
        duration_minutes: Number(data.duration_minutes),
        quality: Number(data.quality),
        notes: data.notes || '',
        created_at: data.created_at,
      };
      const locals = getLocal(email).filter(e => e.log_date !== logDate);
      locals.unshift(saved);
      locals.sort((a, b) => b.log_date.localeCompare(a.log_date));
      saveLocal(email, locals);
      return saved;
    }
  }

  const locals = getLocal(email).filter(e => e.log_date !== logDate);
  locals.unshift(entry);
  locals.sort((a, b) => b.log_date.localeCompare(a.log_date));
  saveLocal(email, locals);
  return entry;
}

export async function deleteSleepLog(email: string, id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('sleep_logs').delete().eq('id', id);
  }
  saveLocal(email, getLocal(email).filter(e => e.id !== id));
}

import { supabase, isSupabaseConfigured } from './supabase';

export interface DailyStepEntry {
  id: string;
  user_email: string;
  log_date: string;
  steps: number;
  goal: number;
  created_at: string;
}

const LOCAL_KEY = (email: string) => `o1fc_daily_steps_${email}`;
const OFFLINE_QUEUE_KEY = 'o1fc_steps_offline_queue';

interface QueuedStepSave { email: string; logDate: string; steps: number; goal: number; }

function getLocal(email: string): DailyStepEntry[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY(email)) || '[]'); } catch { return []; }
}

function saveLocal(email: string, entries: DailyStepEntry[]) {
  localStorage.setItem(LOCAL_KEY(email), JSON.stringify(entries));
}

function getOfflineQueue(): QueuedStepSave[] {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); } catch { return []; }
}

function saveOfflineQueue(queue: QueuedStepSave[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function flushStepsOfflineQueue(): Promise<void> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;
  const remaining: QueuedStepSave[] = [];
  for (const item of queue) {
    try {
      const { error } = await supabase
        .from('daily_steps')
        .upsert(
          { user_email: item.email, log_date: item.logDate, steps: item.steps, goal: item.goal },
          { onConflict: 'user_email,log_date' },
        );
      if (error) throw error;
    } catch {
      remaining.push(item);
    }
  }
  saveOfflineQueue(remaining);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushStepsOfflineQueue(); });
}

export async function loadDailySteps(email: string, limit = 365): Promise<DailyStepEntry[]> {
  if (isSupabaseConfigured() && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('daily_steps')
        .select('*')
        .eq('user_email', email)
        .order('log_date', { ascending: false })
        .limit(limit);
      if (!error && data && data.length > 0) {
        const entries: DailyStepEntry[] = data.map(d => ({
          id: d.id,
          user_email: d.user_email,
          log_date: d.log_date,
          steps: Number(d.steps),
          goal: Number(d.goal),
          created_at: d.created_at,
        }));
        saveLocal(email, entries);
        return entries;
      }
    } catch {}
  }
  return getLocal(email);
}

export async function upsertDailySteps(
  email: string,
  logDate: string,
  steps: number,
  goal = 10000,
): Promise<DailyStepEntry | null> {
  const entry: DailyStepEntry = {
    id: `local_${Date.now()}`,
    user_email: email,
    log_date: logDate,
    steps,
    goal,
    created_at: new Date().toISOString(),
  };

  // Always save locally first
  const locals = getLocal(email).filter(e => e.log_date !== logDate);
  locals.unshift(entry);
  locals.sort((a, b) => b.log_date.localeCompare(a.log_date));
  saveLocal(email, locals);

  if (!isSupabaseConfigured() || !navigator.onLine) {
    const queue = getOfflineQueue().filter(q => !(q.email === email && q.logDate === logDate));
    queue.push({ email, logDate, steps, goal });
    saveOfflineQueue(queue);
    return entry;
  }

  try {
    const { data, error } = await supabase
      .from('daily_steps')
      .upsert(
        { user_email: email, log_date: logDate, steps, goal },
        { onConflict: 'user_email,log_date' },
      )
      .select()
      .maybeSingle();
    if (!error && data) {
      const saved: DailyStepEntry = {
        id: data.id,
        user_email: data.user_email,
        log_date: data.log_date,
        steps: Number(data.steps),
        goal: Number(data.goal),
        created_at: data.created_at,
      };
      const updated = getLocal(email).filter(e => e.log_date !== logDate);
      updated.unshift(saved);
      updated.sort((a, b) => b.log_date.localeCompare(a.log_date));
      saveLocal(email, updated);
      return saved;
    }
  } catch {
    const queue = getOfflineQueue().filter(q => !(q.email === email && q.logDate === logDate));
    queue.push({ email, logDate, steps, goal });
    saveOfflineQueue(queue);
  }

  return entry;
}

export async function deleteDailySteps(email: string, id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('daily_steps').delete().eq('id', id);
  }
  saveLocal(email, getLocal(email).filter(e => e.id !== id));
}

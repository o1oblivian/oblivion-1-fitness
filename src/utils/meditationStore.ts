import { supabase, isSupabaseConfigured } from './supabase';

export interface MeditationEntry {
  id: string;
  user_email: string;
  completed_at: string;
  duration_secs: number;
  soundscape: string;
  notes: string;
  created_at: string;
}

const LOCAL_KEY = (email: string) => `o1fc_meditation_sessions_${email}`;

function getLocal(email: string): MeditationEntry[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY(email)) || '[]'); } catch { return []; }
}

function saveLocal(email: string, entries: MeditationEntry[]) {
  localStorage.setItem(LOCAL_KEY(email), JSON.stringify(entries));
}

export async function loadMeditationSessions(email: string, limit = 50): Promise<MeditationEntry[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_email', email)
      .order('completed_at', { ascending: false })
      .limit(limit);
    if (!error && data && data.length > 0) {
      const entries: MeditationEntry[] = data.map(d => ({
        id: d.id,
        user_email: d.user_email,
        completed_at: d.completed_at,
        duration_secs: Number(d.duration_secs),
        soundscape: d.soundscape || '',
        notes: d.notes || '',
        created_at: d.created_at,
      }));
      saveLocal(email, entries);
      return entries;
    }
  }
  return getLocal(email);
}

export async function saveMeditationSession(
  email: string,
  durationSecs: number,
  soundscape = '',
  notes = '',
): Promise<MeditationEntry | null> {
  const entry: MeditationEntry = {
    id: `local_${Date.now()}`,
    user_email: email,
    completed_at: new Date().toISOString(),
    duration_secs: durationSecs,
    soundscape,
    notes,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('meditation_sessions')
      .insert({
        user_email: email,
        completed_at: entry.completed_at,
        duration_secs: durationSecs,
        soundscape,
        notes,
      })
      .select()
      .maybeSingle();
    if (!error && data) {
      const saved: MeditationEntry = {
        id: data.id,
        user_email: data.user_email,
        completed_at: data.completed_at,
        duration_secs: Number(data.duration_secs),
        soundscape: data.soundscape || '',
        notes: data.notes || '',
        created_at: data.created_at,
      };
      const locals = getLocal(email);
      locals.unshift(saved);
      saveLocal(email, locals);
      return saved;
    }
  }

  const locals = getLocal(email);
  locals.unshift(entry);
  saveLocal(email, locals);
  return entry;
}

export async function deleteMeditationSession(email: string, id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('meditation_sessions').delete().eq('id', id);
  }
  saveLocal(email, getLocal(email).filter(e => e.id !== id));
}

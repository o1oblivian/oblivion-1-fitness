import { supabase, isSupabaseConfigured } from './supabase';
import type { ExerciseLog } from '../types';

export interface QuickWorkoutShape {
  title: string;
  durationMin: number;
  intensity: 'Low' | 'Moderate' | 'High';
  exercises: { name: string; durationSecs: number; reps?: string }[];
}

export interface CompletedSession {
  id: string;
  user_email: string;
  title: string;
  completed_at: string;
  duration_secs: number;
  total_volume_kg: number;
  total_sets: number;
  avg_rpe: number;
  exercises: {
    name: string;
    sets: { weight: number; reps: number; rpe: number }[];
  }[];
}

const LOCAL_KEY = (email: string) => `o1fc_completed_sessions_${email}`;

function getLocalSessions(email: string): CompletedSession[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY(email)) || '[]');
  } catch { return []; }
}

function saveLocalSessions(email: string, sessions: CompletedSession[]) {
  localStorage.setItem(LOCAL_KEY(email), JSON.stringify(sessions));
}

export function buildSessionFromLogs(
  email: string,
  logs: ExerciseLog[],
  durationSecs: number,
  titleOverride?: string,
): Omit<CompletedSession, 'id'> {
  let totalVol = 0;
  let totalSets = 0;
  let rpeSum = 0;
  let rpeCount = 0;

  const exercises = logs.map(l => {
    const sets = l.sets.map(s => {
      const w = Number(s.weight) || 0;
      const r = Number(s.reps) || 0;
      const rpe = Number(s.rpe) || 0;
      totalVol += w * r;
      totalSets++;
      if (rpe > 0) { rpeSum += rpe; rpeCount++; }
      return { weight: w, reps: r, rpe };
    });
    return { name: l.exerciseName, sets };
  });

  const title = titleOverride ||
    (logs.length > 0
      ? logs.map(l => l.exerciseName).slice(0, 2).join(' / ').toUpperCase()
      : 'POWER SESSION');

  return {
    user_email: email,
    title,
    completed_at: new Date().toISOString(),
    duration_secs: durationSecs,
    total_volume_kg: Math.round(totalVol * 100) / 100,
    total_sets: totalSets,
    avg_rpe: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : 0,
    exercises,
  };
}

export function buildSessionFromQuickWorkout(
  email: string,
  workout: QuickWorkoutShape,
): Omit<CompletedSession, 'id'> {
  const durationSecs = workout.durationMin * 60;
  const exercises = workout.exercises
    .filter(e => e.name.toLowerCase() !== 'rest')
    .map(e => ({
      name: e.name,
      sets: [{ weight: 0, reps: e.reps ? parseInt(e.reps) || 1 : 1, rpe: 0 }],
    }));

  return {
    user_email: email,
    title: `QUICK STRIKE: ${workout.title.toUpperCase()}`,
    completed_at: new Date().toISOString(),
    duration_secs: durationSecs,
    total_volume_kg: 0,
    total_sets: exercises.length,
    avg_rpe: workout.intensity === 'High' ? 8.0 : workout.intensity === 'Moderate' ? 6.0 : 4.0,
    exercises,
  };
}

export async function saveCompletedSession(
  session: Omit<CompletedSession, 'id'>,
  onCloudFail?: () => void,
): Promise<CompletedSession | null> {
  const local: CompletedSession = { ...session, id: `local_${Date.now()}` };

  if (isSupabaseConfigured() && navigator.onLine) {
    const { data, error } = await supabase
      .from('completed_sessions')
      .insert({
        user_email: session.user_email,
        title: session.title,
        completed_at: session.completed_at,
        duration_secs: session.duration_secs,
        total_volume_kg: session.total_volume_kg,
        total_sets: session.total_sets,
        avg_rpe: session.avg_rpe,
        exercises: session.exercises,
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      const saved: CompletedSession = {
        id: data.id,
        user_email: data.user_email,
        title: data.title,
        completed_at: data.completed_at,
        duration_secs: data.duration_secs,
        total_volume_kg: Number(data.total_volume_kg),
        total_sets: data.total_sets,
        avg_rpe: Number(data.avg_rpe),
        exercises: data.exercises as CompletedSession['exercises'],
      };
      const locals = getLocalSessions(session.user_email);
      locals.unshift(saved);
      saveLocalSessions(session.user_email, locals);
      return saved;
    }
    if (error && onCloudFail) onCloudFail();
  } else if (onCloudFail) {
    onCloudFail();
  }

  const locals = getLocalSessions(session.user_email);
  locals.unshift(local);
  saveLocalSessions(session.user_email, locals);
  return local;
}

export async function loadCompletedSessions(
  email: string,
  limit = 50,
): Promise<CompletedSession[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('completed_sessions')
      .select('*')
      .eq('user_email', email)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      const sessions: CompletedSession[] = data.map(d => ({
        id: d.id,
        user_email: d.user_email,
        title: d.title,
        completed_at: d.completed_at,
        duration_secs: d.duration_secs,
        total_volume_kg: Number(d.total_volume_kg),
        total_sets: d.total_sets,
        avg_rpe: Number(d.avg_rpe),
        exercises: d.exercises as CompletedSession['exercises'],
      }));
      saveLocalSessions(email, sessions);
      return sessions;
    }
  }

  return getLocalSessions(email);
}

export async function deleteCompletedSession(
  email: string,
  sessionId: string,
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    await supabase.from('completed_sessions').delete().eq('id', sessionId);
  }
  const locals = getLocalSessions(email).filter(s => s.id !== sessionId);
  saveLocalSessions(email, locals);
  return true;
}

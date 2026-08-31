import { supabase, isSupabaseConfigured, storageAdapter } from './supabase';
import { deltaSyncQueue } from './scaleEngine';

export interface DispatchedExercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  targetLoad: string; // e.g. "80 kg", "RPE 8"
  notes?: string;
}

export interface DispatchedWorkout {
  id: string;
  coachId: string;
  coachName: string;
  clientIds: string[]; // array of client handles/keys (e.g. ['alex', 'sarah'])
  clientNames?: string[];
  title: string;
  routineCategory: string; // e.g. 'Push', 'Pull', 'Legs', 'Hyrox', 'Custom'
  scheduledDay: string; // 'Today', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  scheduledDate: string; // YYYY-MM-DD
  exercises: DispatchedExercise[];
  notes?: string;
  status: 'Dispatched' | 'In Progress' | 'Completed';
  createdAt: string;
}

const STORAGE_KEY = 'coach_dispatched_workouts_v2';

// In-memory initial seed if empty
const INITIAL_DISPATCHED_WORKOUTS: DispatchedWorkout[] = [];

export async function getDispatchedWorkouts(coachId?: string, limit = 100): Promise<DispatchedWorkout[]> {
  // 1. Try Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('dispatched_workouts')
        .select('*')
        .order('createdat', { ascending: false })
        .limit(limit);

      if (coachId) {
        query = query.eq('coachid', coachId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          coachId: row.coachid,
          coachName: row.coachname,
          clientIds: row.clientids || [],
          clientNames: row.clientnames || [],
          title: row.title,
          routineCategory: row.routinecategory,
          scheduledDay: row.scheduledday,
          scheduledDate: row.scheduleddate,
          exercises: row.exercises || [],
          notes: row.notes,
          status: row.status,
          createdAt: row.createdat,
        })) as DispatchedWorkout[];
      }
    } catch (e) {
      console.warn('Supabase fetch note:', e);
    }
  }

  // 2. Fallback to storageAdapter (localStorage/AsyncStorage)
  const stored = await storageAdapter.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Parse stored workouts error:', e);
    }
  }

  // Save initial seed if nothing found
  await storageAdapter.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DISPATCHED_WORKOUTS));
  return INITIAL_DISPATCHED_WORKOUTS;
}

export async function dispatchWorkout(workout: Omit<DispatchedWorkout, 'id' | 'createdAt' | 'status'>): Promise<DispatchedWorkout> {
  const newWorkout: DispatchedWorkout = {
    ...workout,
    id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: 'Dispatched',
    createdAt: new Date().toISOString()
  };

  // Enqueue in 100M-scale delta sync queue
  deltaSyncQueue.enqueue('dispatched_workouts', 'INSERT', {
    id: newWorkout.id,
    coachid: newWorkout.coachId,
    coachname: newWorkout.coachName,
    clientids: newWorkout.clientIds,
    clientnames: newWorkout.clientNames,
    title: newWorkout.title,
    routinecategory: newWorkout.routineCategory,
    scheduledday: newWorkout.scheduledDay,
    scheduleddate: newWorkout.scheduledDate,
    exercises: newWorkout.exercises,
    notes: newWorkout.notes,
    status: newWorkout.status,
    createdat: newWorkout.createdAt,
    updatedat: newWorkout.createdAt,
  });

  // 1. Get existing
  const currentWorkouts = await getDispatchedWorkouts();
  const updated = [newWorkout, ...currentWorkouts];

  // 2. Save locally
  await storageAdapter.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 200)));

  // 3. Save to Supabase table if available
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('dispatched_workouts').insert([{
        id: newWorkout.id,
        coachid: newWorkout.coachId,
        coachname: newWorkout.coachName,
        clientids: newWorkout.clientIds,
        clientnames: newWorkout.clientNames,
        title: newWorkout.title,
        routinecategory: newWorkout.routineCategory,
        scheduledday: newWorkout.scheduledDay,
        scheduleddate: newWorkout.scheduledDate,
        exercises: newWorkout.exercises,
        notes: newWorkout.notes,
        status: newWorkout.status,
        createdat: newWorkout.createdAt,
        updatedat: newWorkout.createdAt,
      }]);
    } catch (e) {
      console.warn('Supabase insert fallback:', e);
    }
  }

  // 4. Dispatch custom browser event for instant real-time tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dispatched_workouts_updated', { detail: newWorkout }));
  }

  return newWorkout;
}

export async function getDispatchedWorkoutsForClient(clientKeyOrName: string): Promise<DispatchedWorkout[]> {
  const all = await getDispatchedWorkouts();
  const normalizedSearch = clientKeyOrName.toLowerCase();

  return all.filter((w) =>
    w.clientIds.some(
      (id) =>
        id.toLowerCase() === normalizedSearch ||
        id.toLowerCase().includes(normalizedSearch)
    ) ||
    (w.clientNames &&
      w.clientNames.some((n) => n.toLowerCase().includes(normalizedSearch)))
  );
}

export interface LiveWorkoutLog {
  id?: string;
  workout_id: string;
  client_email: string;
  exercise_name: string;
  set_number: number;
  weight_kg: number;
  reps_completed: number;
  rpe: number;
  notes?: string;
  completed_at?: string;
}

export async function logLiveExercisePerformance(log: LiveWorkoutLog): Promise<LiveWorkoutLog> {
  const localId = log.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    ...log,
    id: localId,
    completed_at: log.completed_at || new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('live_workout_logs').insert([{
        workout_id: log.workout_id,
        client_email: log.client_email,
        exercise_name: log.exercise_name,
        set_number: log.set_number,
        weight_kg: log.weight_kg,
        reps_completed: log.reps_completed,
        rpe: log.rpe,
        notes: log.notes,
        completed_at: record.completed_at,
      }]);
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase live log insert error:', e);
    }
  }

  const logsKey = `live_logs_${record.workout_id}`;
  const raw = await storageAdapter.getItem(logsKey);
  let existing: LiveWorkoutLog[] = [];
  if (raw) {
    try {
      existing = JSON.parse(raw);
    } catch (e) {
      existing = [];
    }
  }
  existing.push(record);
  await storageAdapter.setItem(logsKey, JSON.stringify(existing));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('live_workout_logged', { detail: record }));
  }

  return record;
}

export async function fetchLiveWorkoutLogs(workoutId: string): Promise<LiveWorkoutLog[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('live_workout_logs')
        .select('*')
        .eq('workout_id', workoutId)
        .order('completed_at', { ascending: true });
      if (!error && data) return data as LiveWorkoutLog[];
    } catch (e) {
      console.warn('Supabase fetch live logs error:', e);
    }
  }

  const logsKey = `live_logs_${workoutId}`;
  const raw = await storageAdapter.getItem(logsKey);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function subscribeToDispatchedWorkoutsRealtime(onUpdate: (workout: DispatchedWorkout) => void) {
  if (!isSupabaseConfigured()) return null;

  try {
    const channel = supabase
      .channel('dispatched_workouts_channel')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'dispatched_workouts' },
        (payload: any) => {
          if (payload.new) {
            onUpdate(payload.new as DispatchedWorkout);
          }
        }
      )
      .subscribe();

    return channel;
  } catch (e) {
    console.warn('Realtime subscription error:', e);
    return null;
  }
}


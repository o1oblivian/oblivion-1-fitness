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

let _dispatchedMemoryCache: { timestamp: number; data: DispatchedWorkout[] } | null = null;
const CACHE_TTL_MS = 2000;

export function invalidateDispatchedCache() {
  _dispatchedMemoryCache = null;
}

export async function getDispatchedWorkouts(coachId?: string, limit = 2000, forceRefresh = false): Promise<DispatchedWorkout[]> {
  // Check memory cache if not forcing refresh and no specific coach filter
  if (!forceRefresh && !coachId && _dispatchedMemoryCache && (Date.now() - _dispatchedMemoryCache.timestamp < CACHE_TTL_MS)) {
    return _dispatchedMemoryCache.data.slice(0, limit);
  }

  let results: DispatchedWorkout[] = [];

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
        results = data.map((row: any) => ({
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

  // 2. Fallback to storageAdapter if Supabase returned nothing
  if (results.length === 0) {
    const stored = await storageAdapter.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          if (coachId) {
            results = parsed.filter((w) => w.coachId === coachId).slice(0, limit);
          } else {
            results = parsed.slice(0, limit);
          }
        }
      } catch (e) {
        console.error('Parse stored workouts error:', e);
      }
    }
  }

  if (results.length === 0 && !coachId) {
    results = INITIAL_DISPATCHED_WORKOUTS;
  }

  if (!coachId) {
    _dispatchedMemoryCache = { timestamp: Date.now(), data: results };
  }

  return results;
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
  const currentWorkouts = await getDispatchedWorkouts(undefined, 2000);
  const updated = [newWorkout, ...currentWorkouts.filter((w) => w.id !== newWorkout.id)];

  // 2. Save locally (up to 2000 capacity)
  await storageAdapter.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 2000)));
  invalidateDispatchedCache();

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

export async function getDispatchedWorkoutsForClient(clientKeyOrName: string, limit = 2000): Promise<DispatchedWorkout[]> {
  const all = await getDispatchedWorkouts(undefined, limit);
  const normalizedSearch = clientKeyOrName.trim().toLowerCase();
  if (!normalizedSearch) return [];

  return all.filter((w) =>
    w.clientIds.some((id) => {
      const normId = id.trim().toLowerCase();
      return normId === normalizedSearch || (normalizedSearch.length >= 3 && normId.includes(normalizedSearch));
    }) ||
    (w.clientNames &&
      w.clientNames.some((n) => {
        const normN = n.trim().toLowerCase();
        return normN === normalizedSearch || (normalizedSearch.length >= 3 && normN.includes(normalizedSearch));
      }))
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
      if (!error && data && data.length > 0) return data as LiveWorkoutLog[];
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

export interface WorkoutSubmission {
  id: string;
  workoutId?: string;
  coachId?: string;
  athleteName: string;
  athleteEmail?: string;
  avatar: string;
  title: string;
  volume: string;
  duration: string;
  status: 'pending' | 'approved';
  exercises: string[];
  hasVideo: boolean;
  videoUrl?: string;
  notes?: string;
  submittedAt?: string;
}

export const COACH_SUBMISSIONS_STORAGE_KEY = 'o1fc_coach_workout_submissions_v2';

export async function submitWorkoutForCoachReview(
  submission: Omit<WorkoutSubmission, 'id' | 'status' | 'submittedAt'> & { id?: string; status?: 'pending' | 'approved' }
): Promise<WorkoutSubmission> {
  const newSubmission: WorkoutSubmission = {
    id: submission.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...submission,
    status: submission.status || 'pending',
    submittedAt: new Date().toISOString(),
  };

  const existing = await getCoachWorkoutSubmissions();
  const updated = [newSubmission, ...existing.filter((s) => s.id !== newSubmission.id)];
  await storageAdapter.setItem(COACH_SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated.slice(0, 2000)));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('coach_workout_submission_created', { detail: newSubmission }));
  }

  return newSubmission;
}

export async function getCoachWorkoutSubmissions(coachId?: string): Promise<WorkoutSubmission[]> {
  const raw = await storageAdapter.getItem(COACH_SUBMISSIONS_STORAGE_KEY);
  let list: WorkoutSubmission[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) list = [];
  if (coachId) {
    return list.filter((s) => !s.coachId || s.coachId === coachId);
  }
  return list;
}

export async function approveCoachWorkoutSubmission(submissionId: string): Promise<boolean> {
  const list = await getCoachWorkoutSubmissions();
  let found = false;
  const updated = list.map((s) => {
    if (s.id === submissionId) {
      found = true;
      return { ...s, status: 'approved' as const };
    }
    return s;
  });
  if (found) {
    await storageAdapter.setItem(COACH_SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coach_workout_submission_approved', { detail: { id: submissionId } }));
    }
  }
  return found;
}

export interface CoachPRAlert {
  id: string;
  athleteEmail: string;
  athleteName: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  timestamp: string;
  acknowledged?: boolean;
}

export const COACH_PR_ALERTS_STORAGE_KEY = 'o1fc_coach_pr_alerts_v1';

export async function dispatchCoachPRAlert(
  alert: Omit<CoachPRAlert, 'id' | 'timestamp'>
): Promise<CoachPRAlert> {
  const newAlert: CoachPRAlert = {
    ...alert,
    id: `pr_alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  };

  const existing = await getCoachPRAlerts();
  const updated = [newAlert, ...existing.filter((a) => a.id !== newAlert.id)].slice(0, 100);
  await storageAdapter.setItem(COACH_PR_ALERTS_STORAGE_KEY, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('coach_pr_alert_created', { detail: newAlert }));
  }

  return newAlert;
}

export async function getCoachPRAlerts(): Promise<CoachPRAlert[]> {
  const raw = await storageAdapter.getItem(COACH_PR_ALERTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function acknowledgeCoachPRAlert(alertId: string): Promise<void> {
  const list = await getCoachPRAlerts();
  const updated = list.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a));
  await storageAdapter.setItem(COACH_PR_ALERTS_STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('coach_pr_alert_updated', { detail: { id: alertId } }));
  }
}




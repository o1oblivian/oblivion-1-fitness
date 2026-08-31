import { supabase, isSupabaseConfigured } from './supabase';

export interface TandemPair {
  id: string;
  user_a: string;
  user_b: string | null;
  invite_code: string;
  status: 'pending' | 'active' | 'dissolved';
  created_at: string;
  paired_at: string | null;
}

export interface TandemGoal {
  id: string;
  pair_id: string;
  title: string;
  target_value: number;
  current_value_a: number;
  current_value_b: number;
  unit: string;
  deadline: string | null;
  completed: boolean;
  created_at: string;
}

export interface TandemWorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

export interface TandemWorkout {
  id: string;
  pair_id: string;
  sender_id: string;
  receiver_id: string;
  title: string;
  exercises: TandemWorkoutExercise[];
  notes: string | null;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  created_at: string;
  completed_at: string | null;
}

export interface TandemActivityEntry {
  id: string;
  pair_id: string;
  user_id: string;
  activity_type: 'workout_logged' | 'goal_contribution' | 'streak_check';
  description: string;
  created_at: string;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createTandemPair(): Promise<{ pair: TandemPair | null; error: string | null }> {
  if (!isSupabaseConfigured()) return { pair: null, error: 'Not configured' };
  const code = generateInviteCode();
  const { data, error } = await supabase
    .from('tandem_pairs')
    .insert({ invite_code: code })
    .select()
    .maybeSingle();
  if (error) return { pair: null, error: error.message };
  return { pair: data as TandemPair, error: null };
}

export async function joinTandemPair(code: string): Promise<{ pair: TandemPair | null; error: string | null }> {
  if (!isSupabaseConfigured()) return { pair: null, error: 'Not configured' };

  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return { pair: null, error: 'Not authenticated' };

  const { data: existing, error: fetchErr } = await supabase
    .from('tandem_pairs')
    .select('*')
    .eq('invite_code', code.toUpperCase())
    .eq('status', 'pending')
    .maybeSingle();

  if (fetchErr) return { pair: null, error: fetchErr.message };
  if (!existing) return { pair: null, error: 'Invalid or expired code' };
  if (existing.user_a === userId) return { pair: null, error: 'Cannot pair with yourself' };

  const { data, error } = await supabase
    .from('tandem_pairs')
    .update({ user_b: userId, status: 'active', paired_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select()
    .maybeSingle();

  if (error) return { pair: null, error: error.message };
  return { pair: data as TandemPair, error: null };
}

export async function getActivePair(): Promise<TandemPair | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase
    .from('tandem_pairs')
    .select('*')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  return data as TandemPair | null;
}

export async function getPendingPair(): Promise<TandemPair | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase
    .from('tandem_pairs')
    .select('*')
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();
  return data as TandemPair | null;
}

export async function dissolvePair(pairId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase
    .from('tandem_pairs')
    .update({ status: 'dissolved' })
    .eq('id', pairId);
  return !error;
}

// Goals
export async function fetchTandemGoals(pairId: string): Promise<TandemGoal[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase
    .from('tandem_goals')
    .select('*')
    .eq('pair_id', pairId)
    .eq('completed', false)
    .order('created_at', { ascending: false });
  return (data || []) as TandemGoal[];
}

export async function createTandemGoal(pairId: string, title: string, targetValue: number, unit: string, deadline?: string): Promise<TandemGoal | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase
    .from('tandem_goals')
    .insert({ pair_id: pairId, title, target_value: targetValue, unit, deadline: deadline || null })
    .select()
    .maybeSingle();
  return data as TandemGoal | null;
}

export async function contributeToGoal(goalId: string, isUserA: boolean, amount: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const col = isUserA ? 'current_value_a' : 'current_value_b';
  const { data: goal } = await supabase
    .from('tandem_goals')
    .select('*')
    .eq('id', goalId)
    .maybeSingle();
  if (!goal) return false;

  const newVal = (isUserA ? goal.current_value_a : goal.current_value_b) + amount;
  const totalNew = (isUserA ? newVal + goal.current_value_b : goal.current_value_a + newVal);
  const completed = totalNew >= goal.target_value;

  const update: Record<string, unknown> = { [col]: newVal };
  if (completed) update.completed = true;

  const { error } = await supabase
    .from('tandem_goals')
    .update(update)
    .eq('id', goalId);
  return !error;
}

// Workouts
export async function sendWorkoutToPartner(
  pairId: string,
  receiverId: string,
  title: string,
  exercises: TandemWorkoutExercise[],
  notes?: string
): Promise<TandemWorkout | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase
    .from('tandem_workouts')
    .insert({ pair_id: pairId, receiver_id: receiverId, title, exercises, notes: notes || null })
    .select()
    .maybeSingle();
  return data as TandemWorkout | null;
}

export async function fetchReceivedWorkouts(pairId: string): Promise<TandemWorkout[]> {
  if (!isSupabaseConfigured()) return [];
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return [];

  const { data } = await supabase
    .from('tandem_workouts')
    .select('*')
    .eq('pair_id', pairId)
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false });
  return (data || []) as TandemWorkout[];
}

export async function fetchSentWorkouts(pairId: string): Promise<TandemWorkout[]> {
  if (!isSupabaseConfigured()) return [];
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return [];

  const { data } = await supabase
    .from('tandem_workouts')
    .select('*')
    .eq('pair_id', pairId)
    .eq('sender_id', userId)
    .order('created_at', { ascending: false });
  return (data || []) as TandemWorkout[];
}

export async function updateWorkoutStatus(workoutId: string, status: 'accepted' | 'completed' | 'declined'): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const update: Record<string, unknown> = { status };
  if (status === 'completed') update.completed_at = new Date().toISOString();
  const { error } = await supabase
    .from('tandem_workouts')
    .update(update)
    .eq('id', workoutId);
  return !error;
}

// Activity
export async function logTandemActivity(pairId: string, activityType: string, description: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase
    .from('tandem_activity')
    .insert({ pair_id: pairId, activity_type: activityType, description });
  return !error;
}

export async function fetchTandemActivity(pairId: string, limit = 20): Promise<TandemActivityEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase
    .from('tandem_activity')
    .select('*')
    .eq('pair_id', pairId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []) as TandemActivityEntry[];
}

export async function getPartnerProfile(partnerId: string): Promise<{ email: string; name: string; profile_image?: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase
    .from('user_profiles')
    .select('email, display_name, profile_image')
    .eq('id', partnerId)
    .maybeSingle();
  if (data) return { email: data.email, name: data.display_name || data.email, profile_image: data.profile_image || undefined };
  return null;
}

export async function searchByHandleOrCode(query: string): Promise<{ userId: string; name: string; handle: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const cleaned = query.replace(/^@/, '').trim().toUpperCase();
  if (!cleaned) return null;

  const { data: byHandle } = await supabase
    .from('user_profiles')
    .select('id, display_name, handle')
    .ilike('handle', cleaned)
    .maybeSingle();
  if (byHandle) return { userId: byHandle.id, name: byHandle.display_name || byHandle.handle || cleaned, handle: byHandle.handle || '' };

  const { data: byCode } = await supabase
    .from('user_profiles')
    .select('id, display_name, handle')
    .eq('invite_code', cleaned)
    .maybeSingle();
  if (byCode) return { userId: byCode.id, name: byCode.display_name || byCode.handle || cleaned, handle: byCode.handle || '' };

  return null;
}

export async function pairWithUser(targetUserId: string): Promise<{ pair: TandemPair | null; error: string | null }> {
  if (!isSupabaseConfigured()) return { pair: null, error: 'Not configured' };
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return { pair: null, error: 'Not authenticated' };
  if (userId === targetUserId) return { pair: null, error: 'Cannot pair with yourself' };

  const existing = await getActivePair();
  if (existing) return { pair: null, error: 'Already paired with someone' };

  const code = generateInviteCode();
  const { data, error } = await supabase
    .from('tandem_pairs')
    .insert({ invite_code: code, user_b: targetUserId, status: 'active', paired_at: new Date().toISOString() })
    .select()
    .maybeSingle();
  if (error) return { pair: null, error: error.message };
  return { pair: data as TandemPair, error: null };
}

import { supabase, isSupabaseConfigured } from './supabase';

export type DispatchMode = 'auto' | 'manual';
export type EnrollmentStatus = 'active' | 'paused' | 'completed';

export interface ProgramEnrollment {
  id: string;
  athlete_email: string;
  program_id: string;
  coach_email: string;
  dispatch_mode: DispatchMode;
  start_date: string;
  training_days: string[];
  current_week: number;
  current_day: number;
  status: EnrollmentStatus;
  created_at: string;
}

export interface ScheduleEntry {
  id: string;
  enrollment_id: string;
  athlete_email: string;
  program_id: string;
  week_number: number;
  day_number: number;
  scheduled_date: string;
  exercises: any[];
  focus_label: string;
  dispatched: boolean;
  dispatched_at: string | null;
  dispatch_ref_id: string | null;
  created_at: string;
}

export interface TrainingTimeSlot {
  id: string;
  athlete_email: string;
  day_of_week: string;
  time_slot: string;
  notify_before_minutes: number;
  created_at: string;
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getNextWeekday(from: Date, targetDay: number): Date {
  const current = from.getDay();
  let diff = targetDay - current;
  if (diff <= 0) diff += 7;
  return addDays(from, diff);
}

function buildScheduleDates(startDate: string, trainingDays: string[], totalSessions: number): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const dayNumbers = trainingDays.map(d => WEEKDAY_MAP[d]).filter(n => n !== undefined);
  dayNumbers.sort((a, b) => a - b);

  if (dayNumbers.length === 0) return dates;

  let cursor = start;
  const startDayNum = start.getDay();
  const firstSlotIdx = dayNumbers.findIndex(d => d >= startDayNum);

  if (firstSlotIdx !== -1 && dayNumbers[firstSlotIdx] === startDayNum) {
    dates.push(new Date(cursor));
  }

  while (dates.length < totalSessions) {
    let found = false;
    for (const dayNum of dayNumbers) {
      const next = getNextWeekday(cursor, dayNum);
      if (next > cursor || (next.getTime() === cursor.getTime() && dates.length === 0)) {
        if (next > cursor) {
          cursor = next;
          dates.push(new Date(cursor));
          found = true;
          if (dates.length >= totalSessions) break;
        }
      }
    }
    if (!found) {
      cursor = addDays(cursor, 1);
    }
  }

  return dates;
}

export async function createEnrollment(params: {
  athleteEmail: string;
  programId: string;
  coachEmail: string;
  dispatchMode: DispatchMode;
  startDate: string;
  trainingDays: string[];
  programContent: any[];
}): Promise<ProgramEnrollment | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: enrollment, error } = await supabase
    .from('program_enrollments')
    .insert({
      athlete_email: params.athleteEmail,
      program_id: params.programId,
      coach_email: params.coachEmail,
      dispatch_mode: params.dispatchMode,
      start_date: params.startDate,
      training_days: params.trainingDays,
    })
    .select('*')
    .single();

  if (error || !enrollment) return null;

  if (params.dispatchMode === 'auto') {
    await generateSchedule(enrollment as ProgramEnrollment, params.programContent);
  }

  return enrollment as ProgramEnrollment;
}

export async function generateSchedule(
  enrollment: ProgramEnrollment,
  programContent: any[]
): Promise<void> {
  const sessions: { week: number; day: number; exercises: any[]; focus: string }[] = [];

  programContent.forEach((week: any, wIdx: number) => {
    const days = week.days || [];
    days.forEach((day: any, dIdx: number) => {
      sessions.push({
        week: wIdx + 1,
        day: dIdx + 1,
        exercises: day.exercises || [],
        focus: day.focus || day.label || '',
      });
    });
  });

  if (sessions.length === 0) return;

  const dates = buildScheduleDates(
    enrollment.start_date,
    enrollment.training_days,
    sessions.length
  );

  const rows = sessions.map((s, i) => ({
    enrollment_id: enrollment.id,
    athlete_email: enrollment.athlete_email,
    program_id: enrollment.program_id,
    week_number: s.week,
    day_number: s.day,
    scheduled_date: dates[i] ? dates[i].toISOString().split('T')[0] : enrollment.start_date,
    exercises: s.exercises,
    focus_label: s.focus,
    dispatched: false,
  }));

  await supabase.from('program_schedule').insert(rows);
}

export async function getEnrollment(athleteEmail: string, programId: string): Promise<ProgramEnrollment | null> {
  if (!isSupabaseConfigured()) return null;

  const { data } = await supabase
    .from('program_enrollments')
    .select('*')
    .eq('athlete_email', athleteEmail)
    .eq('program_id', programId)
    .eq('status', 'active')
    .maybeSingle();

  return data as ProgramEnrollment | null;
}

export async function getAthleteEnrollments(athleteEmail: string): Promise<ProgramEnrollment[]> {
  if (!isSupabaseConfigured()) return [];

  const { data } = await supabase
    .from('program_enrollments')
    .select('*')
    .eq('athlete_email', athleteEmail)
    .order('created_at', { ascending: false });

  return (data || []) as ProgramEnrollment[];
}

export async function updateDispatchMode(enrollmentId: string, mode: DispatchMode): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.from('program_enrollments').update({ dispatch_mode: mode }).eq('id', enrollmentId);
}

export async function updateGlobalDispatchMode(athleteEmail: string, mode: DispatchMode): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase
    .from('program_enrollments')
    .update({ dispatch_mode: mode })
    .eq('athlete_email', athleteEmail)
    .eq('status', 'active');
}

export async function getSchedule(enrollmentId: string): Promise<ScheduleEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data } = await supabase
    .from('program_schedule')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('scheduled_date', { ascending: true });

  return (data || []) as ScheduleEntry[];
}

export async function getTodaysPendingSessions(athleteEmail: string): Promise<ScheduleEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('program_schedule')
    .select('*')
    .eq('athlete_email', athleteEmail)
    .eq('scheduled_date', today)
    .eq('dispatched', false);

  return (data || []) as ScheduleEntry[];
}

// --- Training Time Slots ---

export async function getTimeSlots(athleteEmail: string): Promise<TrainingTimeSlot[]> {
  if (!isSupabaseConfigured()) return [];

  const { data } = await supabase
    .from('training_time_slots')
    .select('*')
    .eq('athlete_email', athleteEmail)
    .order('day_of_week');

  return (data || []) as TrainingTimeSlot[];
}

export async function upsertTimeSlot(
  athleteEmail: string,
  dayOfWeek: string,
  timeSlot: string,
  notifyMinutes: number = 60
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  await supabase
    .from('training_time_slots')
    .upsert(
      {
        athlete_email: athleteEmail,
        day_of_week: dayOfWeek,
        time_slot: timeSlot,
        notify_before_minutes: notifyMinutes,
      },
      { onConflict: 'athlete_email,day_of_week' }
    );
}

export async function removeTimeSlot(athleteEmail: string, dayOfWeek: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  await supabase
    .from('training_time_slots')
    .delete()
    .eq('athlete_email', athleteEmail)
    .eq('day_of_week', dayOfWeek);
}

// --- Auto-Dispatch (client-side trigger on app open) ---

export async function runAutoDispatchForAthlete(athleteEmail: string): Promise<number> {
  const pending = await getTodaysPendingSessions(athleteEmail);
  if (pending.length === 0) return 0;

  let dispatched = 0;

  for (const session of pending) {
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('dispatch_mode, coach_email')
      .eq('id', session.enrollment_id)
      .maybeSingle();

    if (!enrollment || enrollment.dispatch_mode !== 'auto') continue;

    const dispatchId = `disp_${crypto.randomUUID()}`;
    const { error } = await supabase.from('dispatched_workouts').insert({
      id: dispatchId,
      coachid: enrollment.coach_email,
      coachname: enrollment.coach_email.split('@')[0],
      clientids: [athleteEmail],
      clientnames: [athleteEmail.split('@')[0]],
      title: `${session.focus_label || 'Workout'} - Week ${session.week_number} Day ${session.day_number}`,
      routinecategory: session.focus_label || 'Program',
      scheduledday: 'Today',
      scheduleddate: session.scheduled_date,
      exercises: session.exercises,
      notes: 'Auto-dispatched from program schedule',
      status: 'Dispatched',
    });

    if (!error) {
      await supabase
        .from('program_schedule')
        .update({ dispatched: true, dispatched_at: new Date().toISOString(), dispatch_ref_id: dispatchId })
        .eq('id', session.id);
      dispatched++;
    }
  }

  return dispatched;
}

// --- Completion & Progressive Unlock ---

export async function markSessionCompleted(sessionId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('program_schedule')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', sessionId);

  return !error;
}

export async function getEnrollmentProgress(enrollmentId: string): Promise<{
  sessions: ScheduleEntry[];
  completedCount: number;
  totalCount: number;
  nextUnlockedIndex: number;
}> {
  const sessions = await getSchedule(enrollmentId);
  const completedCount = sessions.filter((s: any) => s.completed).length;
  const nextUnlockedIndex = completedCount;

  return {
    sessions,
    completedCount,
    totalCount: sessions.length,
    nextUnlockedIndex,
  };
}

export async function getAthleteActivePrograms(athleteEmail: string): Promise<{
  enrollment: ProgramEnrollment;
  sessions: (ScheduleEntry & { completed?: boolean; completed_at?: string | null })[];
  nextUnlockedIndex: number;
}[]> {
  if (!isSupabaseConfigured()) return [];

  const enrollments = await getAthleteEnrollments(athleteEmail);
  const active = enrollments.filter(e => e.status === 'active');

  const results: {
    enrollment: ProgramEnrollment;
    sessions: (ScheduleEntry & { completed?: boolean; completed_at?: string | null })[];
    nextUnlockedIndex: number;
  }[] = [];

  for (const enrollment of active) {
    const { data } = await supabase
      .from('program_schedule')
      .select('*')
      .eq('enrollment_id', enrollment.id)
      .order('week_number', { ascending: true })
      .order('day_number', { ascending: true });

    const sessions = (data || []) as (ScheduleEntry & { completed?: boolean; completed_at?: string | null })[];
    const completedCount = sessions.filter(s => s.completed).length;

    results.push({
      enrollment,
      sessions,
      nextUnlockedIndex: completedCount,
    });
  }

  return results;
}

export async function getCoachClientProgress(coachEmail: string): Promise<{
  enrollment: ProgramEnrollment;
  sessions: (ScheduleEntry & { completed?: boolean; completed_at?: string | null })[];
  completedCount: number;
  totalCount: number;
}[]> {
  if (!isSupabaseConfigured()) return [];

  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('*')
    .eq('coach_email', coachEmail)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (!enrollments || enrollments.length === 0) return [];

  const results: {
    enrollment: ProgramEnrollment;
    sessions: (ScheduleEntry & { completed?: boolean; completed_at?: string | null })[];
    completedCount: number;
    totalCount: number;
  }[] = [];

  for (const enrollment of enrollments) {
    const { data } = await supabase
      .from('program_schedule')
      .select('*')
      .eq('enrollment_id', (enrollment as ProgramEnrollment).id)
      .order('week_number', { ascending: true })
      .order('day_number', { ascending: true });

    const sessions = (data || []) as (ScheduleEntry & { completed?: boolean; completed_at?: string | null })[];
    const completedCount = sessions.filter(s => s.completed).length;

    results.push({
      enrollment: enrollment as ProgramEnrollment,
      sessions,
      completedCount,
      totalCount: sessions.length,
    });
  }

  return results;
}

// --- Notification helpers ---

export function getNextNotificationTime(slots: TrainingTimeSlot[]): { dayOfWeek: string; time: string; minutesBefore: number } | null {
  if (slots.length === 0) return null;

  const now = new Date();
  const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySlot = slots.find(s => s.day_of_week === currentDay);
  if (todaySlot) {
    const [h, m] = todaySlot.time_slot.split(':').map(Number);
    const slotMinutes = h * 60 + m;
    const notifyAt = slotMinutes - todaySlot.notify_before_minutes;
    if (notifyAt > currentMinutes) {
      return { dayOfWeek: currentDay, time: todaySlot.time_slot, minutesBefore: todaySlot.notify_before_minutes };
    }
  }

  return null;
}

export function shouldShowPreWorkoutNotification(slots: TrainingTimeSlot[]): boolean {
  if (slots.length === 0) return false;

  const now = new Date();
  const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySlot = slots.find(s => s.day_of_week === currentDay);
  if (!todaySlot) return false;

  const [h, m] = todaySlot.time_slot.split(':').map(Number);
  const slotMinutes = h * 60 + m;
  const notifyAt = slotMinutes - todaySlot.notify_before_minutes;

  return currentMinutes >= notifyAt && currentMinutes < notifyAt + 5;
}

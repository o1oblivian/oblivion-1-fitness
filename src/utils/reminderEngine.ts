import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import { getTimeSlots, shouldShowPreWorkoutNotification, runAutoDispatchForAthlete } from '@/utils/programScheduleStore';

interface ActiveReminder {
  id: string;
  title: string;
  type: string;
  body?: string;
}

export async function checkDueReminders(userEmail: string): Promise<ActiveReminder[]> {
  if (!isSupabaseConfigured() || !userEmail) return [];

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  const windowStart = new Date(now.getTime() - 5 * 60 * 1000);
  const startTime = `${String(windowStart.getHours()).padStart(2, '0')}:${String(windowStart.getMinutes()).padStart(2, '0')}:00`;

  const { data } = await supabase
    .from('user_reminders')
    .select('id, title, type, body, time_of_day, last_fired_at')
    .eq('user_email', userEmail)
    .eq('enabled', true)
    .contains('days_of_week', [currentDay])
    .gte('time_of_day', startTime)
    .lte('time_of_day', currentTime);

  if (!data || data.length === 0) return [];

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const due = data.filter(r => !r.last_fired_at || r.last_fired_at < todayStart);

  if (due.length > 0) {
    const ids = due.map(r => r.id);
    await supabase
      .from('user_reminders')
      .update({ last_fired_at: now.toISOString() })
      .in('id', ids);
  }

  return due.map(r => ({ id: r.id, title: r.title, type: r.type, body: r.body || undefined }));
}

let intervalId: ReturnType<typeof setInterval> | null = null;
let preWorkoutFiredToday = false;
let autoDispatchRanToday = false;

export function startReminderPolling(
  userEmail: string,
  onReminder: (reminder: ActiveReminder) => void,
  intervalMs = 60_000
) {
  stopReminderPolling();
  preWorkoutFiredToday = false;
  autoDispatchRanToday = false;

  async function poll() {
    const due = await checkDueReminders(userEmail);
    due.forEach(r => onReminder(r));

    // Run auto-dispatch once per session on app open
    if (!autoDispatchRanToday) {
      autoDispatchRanToday = true;
      runAutoDispatchForAthlete(userEmail).catch(() => {});
    }

    // Check pre-workout notification
    if (!preWorkoutFiredToday) {
      try {
        const slots = await getTimeSlots(userEmail);
        if (shouldShowPreWorkoutNotification(slots)) {
          preWorkoutFiredToday = true;
          const now = new Date();
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
          const slot = slots.find(s => s.day_of_week === dayName);
          onReminder({
            id: 'pre-workout-' + Date.now(),
            title: 'Workout in 1 hour',
            type: 'pre_workout',
            body: slot ? `Your session is scheduled for ${slot.time_slot.slice(0, 5)}. Time to fuel up and warm up.` : 'Get ready for your scheduled session.',
          });
        }
      } catch {}
    }
  }

  poll();
  intervalId = setInterval(poll, intervalMs);
}

export function stopReminderPolling() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function showBrowserNotification(title: string, body?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body || undefined,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    });
  }
}

import { readAthleteSettingsSnapshot } from '../utils/athleteSettingsSnapshot';

const REMINDERS_KEY = 'o1fc_scheduled_reminders_v1';

function msUntilTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function armAthleteReminders(): () => void {
  const timers: number[] = [];
  const settings = readAthleteSettingsSnapshot();
  if (!settings.preWorkoutReminder || !settings.osPushEnabled) return () => {};
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return () => {};
  }
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (!raw) return () => {};
    const parsed = JSON.parse(raw) as { workoutTime?: string; recoveryTime?: string };
    if (parsed.workoutTime) {
      const wait = msUntilTime(parsed.workoutTime);
      if (wait > 0 && wait < 36 * 60 * 60 * 1000) {
        timers.push(
          window.setTimeout(() => {
            try {
              new Notification('Oblivion 1 Fitness Club', { body: 'Pre-workout window — session starts soon.' });
            } catch {
              /* ignore */
            }
          }, Math.max(1000, wait - 30 * 60 * 1000)),
        );
      }
    }
    if (parsed.recoveryTime) {
      const wait = msUntilTime(parsed.recoveryTime);
      if (wait > 0 && wait < 36 * 60 * 60 * 1000) {
        timers.push(
          window.setTimeout(() => {
            try {
              new Notification('Oblivion 1 Fitness Club', { body: 'Evening recovery — hydrate and log sleep.' });
            } catch {
              /* ignore */
            }
          }, wait),
        );
      }
    }
  } catch {
    /* ignore */
  }
  return () => timers.forEach((id) => window.clearTimeout(id));
}

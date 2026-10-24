import { Capacitor } from '@capacitor/core';
import type { Weekday } from '@capacitor/local-notifications';
import {
  readAthleteSettingsSnapshot,
  type AthleteSettingsSnapshot,
} from '../utils/athleteSettingsSnapshot';
import { NATIVE_PROMPT_TIMEOUT_MS, withNativeTimeout } from '../utils/nativeTimeout';
import { safeStorage } from '../utils/safeStorage';
import { BODY_STATUS_EVENT, readBodyStatus } from '../features/bodyStatus/bodyStatus';

/** Reminders are scheduled by the phone itself. Nothing is sent to a server. */
const REMINDERS_KEY = 'o1fc_scheduled_reminders_v1';
const CHANGED_EVENT = 'o1fc_reminders_changed';
const CHANNEL_ID = 'o1fc-reminders';
const TITLE = 'Oblivion 1';
const ID_MIN = 7000;
const ID_MAX = 7999;
const DAY_MS = 24 * 60 * 60 * 1000;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const REMINDER_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const SUNDAY_FIRST = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const HYDRATION_START_HOUR = 8;
export const HYDRATION_END_HOUR = 20;
export const PRE_WORKOUT_LEAD_MIN = 30;

export interface ReminderConfig {
  workoutTime: string;
  recoveryOn: boolean;
  recoveryTime: string;
  hydrationOn: boolean;
  hydrationHours: number;
  /** A Monday-morning nudge to step on the scale. On unless the athlete turns it off. */
  weighInOn: boolean;
  weighInTime: string;
  selectedDays: string[];
}

export const DEFAULT_REMINDERS: ReminderConfig = {
  workoutTime: '06:30',
  recoveryOn: true,
  recoveryTime: '21:00',
  hydrationOn: false,
  hydrationHours: 2,
  weighInOn: true,
  weighInTime: '07:00',
  selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
};

export function readReminderConfig(): ReminderConfig {
  const saved = safeStorage.getItem<Record<string, unknown> | null>(REMINDERS_KEY, null) || {};
  const time = (value: unknown, fallback: string) =>
    typeof value === 'string' && HHMM.test(value) ? value : fallback;
  const hours = Math.round(Number(saved.hydrationHours));
  return {
    workoutTime: time(saved.workoutTime, DEFAULT_REMINDERS.workoutTime),
    recoveryOn:
      typeof saved.recoveryOn === 'boolean' ? saved.recoveryOn : DEFAULT_REMINDERS.recoveryOn,
    recoveryTime: time(saved.recoveryTime, DEFAULT_REMINDERS.recoveryTime),
    hydrationOn:
      typeof saved.hydrationOn === 'boolean' ? saved.hydrationOn : DEFAULT_REMINDERS.hydrationOn,
    hydrationHours: hours >= 1 && hours <= 4 ? hours : DEFAULT_REMINDERS.hydrationHours,
    weighInOn: typeof saved.weighInOn === 'boolean' ? saved.weighInOn : DEFAULT_REMINDERS.weighInOn,
    weighInTime: time(saved.weighInTime, DEFAULT_REMINDERS.weighInTime),
    selectedDays: Array.isArray(saved.selectedDays)
      ? REMINDER_DAYS.filter((day) => (saved.selectedDays as unknown[]).includes(day))
      : DEFAULT_REMINDERS.selectedDays,
  };
}

export function saveReminderConfig(config: ReminderConfig): void {
  safeStorage.setItem(REMINDERS_KEY, config);
  notifyRemindersChanged();
}

/** Call after any setting that affects reminders so the phone's schedule is rebuilt. */
export function notifyRemindersChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGED_EVENT));
}

export interface PlannedReminder {
  id: number;
  body: string;
  /** 0 = Sunday. Absent means every day. */
  weekday?: number;
  hour: number;
  minute: number;
}

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function planReminders(
  settings: Pick<AthleteSettingsSnapshot, 'osPushEnabled' | 'preWorkoutReminder'>,
  config: ReminderConfig,
  /** True while the athlete is resting, sick or injured: no nudge to train. */
  holdWorkouts = false,
): PlannedReminder[] {
  if (!settings.osPushEnabled) return [];
  const plan: PlannedReminder[] = [];
  if (settings.preWorkoutReminder && !holdWorkouts) {
    for (const day of config.selectedDays) {
      let weekday = SUNDAY_FIRST.indexOf(day);
      if (weekday < 0) continue;
      let at = minutesOf(config.workoutTime) - PRE_WORKOUT_LEAD_MIN;
      if (at < 0) {
        at += 24 * 60;
        weekday = (weekday + 6) % 7;
      }
      plan.push({
        id: ID_MIN + weekday,
        body: `Your workout starts in ${PRE_WORKOUT_LEAD_MIN} minutes.`,
        weekday,
        hour: Math.floor(at / 60),
        minute: at % 60,
      });
    }
  }
  if (config.recoveryOn) {
    const at = minutesOf(config.recoveryTime);
    plan.push({
      id: ID_MIN + 100,
      body: 'Wind down. Log your sleep and how you feel.',
      hour: Math.floor(at / 60),
      minute: at % 60,
    });
  }
  if (config.weighInOn) {
    const at = minutesOf(config.weighInTime);
    plan.push({
      id: ID_MIN + 101,
      body: 'Step on the scale and log your weight.',
      weekday: 1,
      hour: Math.floor(at / 60),
      minute: at % 60,
    });
  }
  if (config.hydrationOn) {
    for (
      let hour = HYDRATION_START_HOUR;
      hour <= HYDRATION_END_HOUR;
      hour += config.hydrationHours
    ) {
      plan.push({ id: ID_MIN + 200 + hour, body: 'Time for a glass of water.', hour, minute: 0 });
    }
  }
  return plan;
}

export type ReminderPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * Wrapped in an object on purpose: a Capacitor plugin returned straight from an async function is
 * treated as a promise, which sends a `then` call to the phone that is never answered.
 */
async function nativePlugin() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return { plugin: LocalNotifications };
}

/** Reads the phone's notification permission; with `ask`, shows the system prompt when allowed to. */
export async function reminderPermission(ask: boolean): Promise<ReminderPermission> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { plugin } = await nativePlugin();
      const status = ask
        ? await withNativeTimeout(
            plugin.requestPermissions(),
            'The notification permission prompt did not answer.',
            NATIVE_PROMPT_TIMEOUT_MS,
          )
        : await withNativeTimeout(
            plugin.checkPermissions(),
            'The phone did not report the notification permission.',
          );
      return status.display === 'granted'
        ? 'granted'
        : status.display === 'denied'
          ? 'denied'
          : 'prompt';
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    const state =
      ask && Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
    return state === 'granted' ? 'granted' : state === 'denied' ? 'denied' : 'prompt';
  } catch {
    return 'unsupported';
  }
}

async function applyNative(plan: PlannedReminder[]): Promise<void> {
  const { plugin } = await nativePlugin();
  const pending = await withNativeTimeout(plugin.getPending(), 'The phone did not list reminders.');
  const ours = pending.notifications.filter((n) => n.id >= ID_MIN && n.id <= ID_MAX);
  if (ours.length > 0) {
    await withNativeTimeout(
      plugin.cancel({ notifications: ours.map((n) => ({ id: n.id })) }),
      'The phone did not clear old reminders.',
    );
  }
  if (plan.length === 0) return;
  const permission = await withNativeTimeout(
    plugin.checkPermissions(),
    'The phone did not report the notification permission.',
  );
  if (permission.display !== 'granted') return;
  if (Capacitor.getPlatform() === 'android') {
    await withNativeTimeout(
      plugin.createChannel({ id: CHANNEL_ID, name: 'Reminders', importance: 3, visibility: 1 }),
      'The phone did not create the reminder channel.',
    );
  }
  const scheduled = plugin.schedule({
    notifications: plan.map((item) => ({
      id: item.id,
      title: TITLE,
      body: item.body,
      channelId: CHANNEL_ID,
      schedule: {
        on: {
          ...(item.weekday === undefined ? {} : { weekday: (item.weekday + 1) as Weekday }),
          hour: item.hour,
          minute: item.minute,
        },
        allowWhileIdle: true,
      },
    })),
  });
  await withNativeTimeout(scheduled, 'The phone did not save the reminders.');
}

function nextOccurrence(item: PlannedReminder, now: Date): number {
  for (let offset = 0; offset <= 7; offset++) {
    const at = new Date(now);
    at.setDate(now.getDate() + offset);
    at.setHours(item.hour, item.minute, 0, 0);
    if (at.getTime() <= now.getTime()) continue;
    if (item.weekday !== undefined && at.getDay() !== item.weekday) continue;
    return at.getTime();
  }
  return Number.POSITIVE_INFINITY;
}

/** Browsers only show reminders while the app is open, so arm the next day's worth of timers. */
function applyWeb(plan: PlannedReminder[]): number[] {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  )
    return [];
  const now = new Date();
  return plan.flatMap((item) => {
    const wait = nextOccurrence(item, now) - now.getTime();
    if (!(wait > 0 && wait <= DAY_MS)) return [];
    return [
      window.setTimeout(() => {
        try {
          new Notification(TITLE, { body: item.body });
        } catch {
          /* blocked after arming */
        }
      }, wait),
    ];
  });
}

let nativeQueue: Promise<void> = Promise.resolve();

function queueNative(plan: PlannedReminder[]): Promise<void> {
  nativeQueue = nativeQueue
    .then(() => applyNative(plan))
    .catch((err) => console.warn('[Reminders] Schedule notice:', err));
  return nativeQueue;
}

/** Removes every reminder this app scheduled, e.g. on sign out. Never blocks sign-out if the plugin stalls. */
export function clearReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve();
  return Promise.race([queueNative([]), new Promise<void>((resolve) => setTimeout(resolve, 1500))]);
}

/** Keeps the phone's reminders in line with Settings for as long as the app shell is mounted. */
export function armAthleteReminders(): () => void {
  if (typeof window === 'undefined') return () => {};
  const native = Capacitor.isNativePlatform();
  let timers: number[] = [];

  const apply = () => {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
    const body = readBodyStatus();
    const plan = planReminders(
      readAthleteSettingsSnapshot(),
      readReminderConfig(),
      body.status !== 'ready',
    );
    if (native) void queueNative(plan);
    else timers = applyWeb(plan);
  };
  const onVisible = () => {
    if (!native && document.visibilityState === 'visible') apply();
  };

  apply();
  window.addEventListener(CHANGED_EVENT, apply);
  window.addEventListener(BODY_STATUS_EVENT, apply);
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    timers.forEach((id) => window.clearTimeout(id));
    window.removeEventListener(CHANGED_EVENT, apply);
    window.removeEventListener(BODY_STATUS_EVENT, apply);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

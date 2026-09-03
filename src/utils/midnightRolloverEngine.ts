import { buildSessionFromLogs, saveCompletedSession } from './sessionVaultStore';
import { getStoredWorkoutLogs, clearActiveWorkoutLogs } from './workoutLogsStore';
import { ExerciseLog, DailyMeals } from '../types';

const LAST_ROLLOVER_KEY = 'o1fc_last_midnight_rollover_date';
const DAILY_ARCHIVE_KEY = (email: string) => `o1fc_daily_archives_${email}`;

export interface DailyArchiveSnapshot {
  date: string;
  userEmail: string;
  archivedAt: string;
  totalVolumeKg: number;
  totalSets: number;
  sessionCount: number;
  mealCount: number;
  stepsCount: number;
}

/**
 * Returns formatted YYYY-MM-DD for local timezone
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the previous date string (YYYY-MM-DD)
 */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

/**
 * Run automatic midnight rollover
 * Auto-archives uncommitted workouts, snapshots daily data, and prepares a fresh slate.
 */
export async function executeMidnightRollover(
  userEmail: string,
  getActiveLogs?: () => ExerciseLog[],
  onNotify?: (msg: string) => void,
  getDailyMeals?: () => DailyMeals
): Promise<{ success: boolean; archived: boolean; message: string }> {
  if (!userEmail) return { success: false, archived: false, message: 'No user email' };

  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

  try {
    let uncommittedLogs: ExerciseLog[] = [];

    // 1. Check in-memory logs provider
    if (getActiveLogs) {
      uncommittedLogs = getActiveLogs();
    }

    // 2. Check localStorage fallback if empty
    if (!uncommittedLogs || uncommittedLogs.length === 0) {
      try {
        const raw = localStorage.getItem('o1fc_active_logs_v2') || localStorage.getItem('lumina_active_logs');
        if (raw) {
          uncommittedLogs = JSON.parse(raw);
        }
      } catch {
        uncommittedLogs = [];
      }
    }

    // Filter to sets that actually have data
    const validLogs = (uncommittedLogs || []).filter(
      (l) => l.sets && l.sets.some((s) => (Number(s.reps) || 0) > 0 || (Number(s.weight) || 0) > 0)
    );

    let sessionSaved = false;
    if (validLogs.length > 0) {
      // Auto-commit yesterday's session to vault
      const session = buildSessionFromLogs(
        userEmail,
        validLogs,
        1800, // 30 min default if timer wasn't running
        `MIDNIGHT ARCHIVE: ${yesterdayStr}`
      );
      // Mark completion timestamp at 23:59:59 of yesterday
      const yesterdayEnd = new Date();
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 0);
      session.completed_at = yesterdayEnd.toISOString();

      await saveCompletedSession(session);
      clearActiveWorkoutLogs(userEmail);
      localStorage.removeItem('o1fc_active_logs_v2');
      sessionSaved = true;
    }

    // 3. Count meals if provided
    let mealCount = 0;
    if (getDailyMeals) {
      try {
        const m = getDailyMeals();
        if (m) mealCount = Object.values(m).flat().length;
      } catch {
        // ignore
      }
    }

    // 4. Snapshot daily archive entry
    const archiveRecord: DailyArchiveSnapshot = {
      date: yesterdayStr,
      userEmail,
      archivedAt: new Date().toISOString(),
      totalVolumeKg: validLogs.reduce(
        (acc, l) => acc + l.sets.reduce((sAcc, s) => sAcc + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0),
        0
      ),
      totalSets: validLogs.reduce((acc, l) => acc + l.sets.length, 0),
      sessionCount: sessionSaved ? 1 : 0,
      mealCount,
      stepsCount: 0,
    };

    try {
      const prevArchives: DailyArchiveSnapshot[] = JSON.parse(
        localStorage.getItem(DAILY_ARCHIVE_KEY(userEmail)) || '[]'
      );
      // Prevent duplicate archive entries for the same date
      const filtered = prevArchives.filter((a) => a.date !== yesterdayStr);
      filtered.unshift(archiveRecord);
      localStorage.setItem(DAILY_ARCHIVE_KEY(userEmail), JSON.stringify(filtered.slice(0, 365)));
    } catch {
      // ignore
    }

    // Record today as the last rolled-over date
    localStorage.setItem(LAST_ROLLOVER_KEY, todayStr);

    // Dispatch global event for views to refresh
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('o1fc-midnight-rollover', {
          detail: {
            today: todayStr,
            yesterday: yesterdayStr,
            sessionSaved,
          },
        })
      );
    }

    if (sessionSaved && onNotify) {
      onNotify(`Midnight Auto-Log: Yesterday's workout archived to History Vault.`);
    }

    return {
      success: true,
      archived: sessionSaved,
      message: `Rollover complete for ${todayStr}`,
    };
  } catch (err: any) {
    console.error('Midnight rollover execution error:', err);
    return { success: false, archived: false, message: err?.message || 'Rollover failed' };
  }
}

/**
 * Continuous Midnight Rollover Watcher & Scheduler
 */
let watcherInterval: ReturnType<typeof setInterval> | null = null;

export function startMidnightRolloverScheduler(
  userEmail: string,
  getActiveLogs?: () => ExerciseLog[],
  onNotify?: (msg: string) => void,
  getDailyMeals?: () => DailyMeals
): () => void {
  stopMidnightRolloverScheduler();
  if (!userEmail) return () => {};

  const check = () => {
    const todayStr = getLocalDateString();
    const lastDate = localStorage.getItem(LAST_ROLLOVER_KEY);

    // If day changed, trigger rollover immediately
    if (lastDate && lastDate !== todayStr) {
      executeMidnightRollover(userEmail, getActiveLogs, onNotify, getDailyMeals);
    } else if (!lastDate) {
      // First boot on a device: initialize last rollover to today
      localStorage.setItem(LAST_ROLLOVER_KEY, todayStr);
    }
  };

  // Immediate check on boot
  check();

  // Polling every 30 seconds to catch exact midnight crossing
  watcherInterval = setInterval(check, 30_000);

  // Also check whenever browser tab / app resumes from background
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      check();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', check);

  return () => {
    stopMidnightRolloverScheduler();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('focus', check);
  };
}

export function stopMidnightRolloverScheduler(): void {
  if (watcherInterval !== null) {
    clearInterval(watcherInterval);
    watcherInterval = null;
  }
}

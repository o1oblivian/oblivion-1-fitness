import { CardioMachineEntry } from '../types/cardio';

const CARDIO_STORAGE_KEY = 'ofc_cardio_machine_logs_v1';
export const CARDIO_UPDATED_EVENT = 'ofc_cardio_updated';

// 0% Fake templates - strictly genuine athlete logged cardio/step sessions
export const INITIAL_CARDIO_LOGS: CardioMachineEntry[] = [];

export function isToday(timestamp?: number, dateStr?: string): boolean {
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  // 1. Authoritative check: numeric timestamp
  if (timestamp && Number.isFinite(timestamp) && timestamp > 0) {
    const d = new Date(timestamp);
    return (
      d.getFullYear() === todayY &&
      d.getMonth() === todayM &&
      d.getDate() === todayD
    );
  }

  // 2. ISO calendar date check (e.g. "2026-09-04")
  if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
    return y === todayY && (m - 1) === todayM && d === todayD;
  }

  return false;
}

export function formatCardioDate(timestamp?: number, dateStr?: string): string {
  let dateObj: Date | null = null;

  if (timestamp && Number.isFinite(timestamp) && timestamp > 0) {
    dateObj = new Date(timestamp);
  } else if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
    dateObj = new Date(y, m - 1, d);
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 1 && diffDays < 7) {
      return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (dateStr && dateStr !== 'Today') {
    return dateStr;
  }
  return 'Today';
}

export function getCardioLogs(): CardioMachineEntry[] {
  try {
    const raw = localStorage.getItem(CARDIO_STORAGE_KEY);
    if (!raw) return [];
    const parsed: CardioMachineEntry[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out legacy mock data IDs (c-1, c-2, c-3)
    let hasChanges = false;
    const sanitized = parsed.filter((l) => l.id !== 'c-1' && l.id !== 'c-2' && l.id !== 'c-3');
    if (sanitized.length !== parsed.length) hasChanges = true;

    // Self-heal: ensure genuine date format & calculate calories & distance if 0
    const healed = sanitized.map((entry) => {
      const steps = entry.stepsCount || 0;
      let cals = entry.caloriesBurned;
      let dist = entry.distanceKm;
      let mins = entry.durationMinutes;

      if (steps > 0 && (!cals || cals === 0)) {
        cals = Math.round(steps * 0.045);
        hasChanges = true;
      }
      if (steps > 0 && (!dist || dist === 0)) {
        dist = Math.round(steps * 0.000762 * 100) / 100;
        hasChanges = true;
      }
      if (steps > 0 && (!mins || mins === 0)) {
        mins = Math.round(steps / 100);
        hasChanges = true;
      }

      // If entry has a timestamp and date is the static string 'Today', heal it to actual ISO date
      let entryDate = entry.date;
      if (entry.timestamp && (!entryDate || entryDate === 'Today')) {
        entryDate = new Date(entry.timestamp).toISOString().slice(0, 10);
        hasChanges = true;
      }

      return {
        ...entry,
        date: entryDate,
        caloriesBurned: cals,
        distanceKm: dist,
        durationMinutes: mins,
      };
    });

    if (hasChanges) {
      localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(healed));
    }
    return healed;
  } catch {
    return [];
  }
}

export function getTodayCardioTotals(): {
  totalSteps: number;
  totalCalories: number;
  totalDistance: number;
  totalDuration: number;
} {
  const logs = getCardioLogs();
  let totalSteps = 0;
  let totalCalories = 0;
  let totalDistance = 0;
  let totalDuration = 0;

  logs.forEach((log) => {
    if (isToday(log.timestamp, log.date)) {
      totalSteps += (log.stepsCount || 0);
      totalCalories += (log.caloriesBurned || 0);
      totalDistance += (log.distanceKm || 0);
      totalDuration += (log.durationMinutes || 0);
    }
  });

  return {
    totalSteps,
    totalCalories: Math.round(totalCalories),
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalDuration: Math.round(totalDuration),
  };
}

export function saveCardioLog(entry: Omit<CardioMachineEntry, 'id' | 'timestamp'>): CardioMachineEntry {
  const logs = getCardioLogs();
  
  // Calculate burn from steps if not supplied
  let finalCals = entry.caloriesBurned;
  let finalDist = entry.distanceKm;
  let finalMins = entry.durationMinutes;
  const steps = entry.stepsCount || 0;

  if (steps > 0 && (!finalCals || finalCals === 0)) {
    finalCals = Math.round(steps * 0.045);
  }
  if (steps > 0 && (!finalDist || finalDist === 0)) {
    finalDist = Math.round(steps * 0.000762 * 100) / 100;
  }
  if (steps > 0 && (!finalMins || finalMins === 0)) {
    finalMins = Math.round(steps / 100);
  }

  const now = Date.now();
  const dateStr = entry.date && entry.date !== 'Today'
    ? entry.date
    : new Date(now).toISOString().slice(0, 10);

  const newEntry: CardioMachineEntry = {
    ...entry,
    date: dateStr,
    durationMinutes: finalMins,
    distanceKm: finalDist,
    caloriesBurned: finalCals,
    id: `cardio-${now}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now,
  };

  const updated = [newEntry, ...logs];
  try {
    localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CARDIO_UPDATED_EVENT, { detail: newEntry }));
    }
  } catch (err) {
    console.error('Failed to persist cardio entry:', err);
  }
  return newEntry;
}

export function deleteCardioLog(id: string): void {
  const logs = getCardioLogs();
  const filtered = logs.filter((l) => l.id !== id);
  try {
    localStorage.setItem(CARDIO_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CARDIO_UPDATED_EVENT, { detail: { id, deleted: true } }));
    }
  } catch (err) {
    console.error('Failed to delete cardio entry:', err);
  }
}

export function subscribeCardioUpdates(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => listener();
  window.addEventListener(CARDIO_UPDATED_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CARDIO_UPDATED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

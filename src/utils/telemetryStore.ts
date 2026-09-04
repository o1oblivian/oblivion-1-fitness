import { supabase, isSupabaseConfigured } from './supabase';
import { AthleteTelemetry, DailyMacroLog } from '../types';
import { ATHLETE_TELEMETRY, getAthleteTelemetryByCoachLog, EMAIL_BY_ATHLETE } from '../data/athleteTelemetry';

// ─── Email mapping ───────────────────────────────────────────────
// The coach view identifies athletes by display name; the DB uses email.
// This map lives in athleteTelemetry.ts so both modules stay in sync.

export function getEmailForAthlete(athleteName: string): string {
  return EMAIL_BY_ATHLETE[athleteName] || 'path.patel.fit@ofc.app';
}

// ─── DB row types ────────────────────────────────────────────────

interface DailyMacroRow {
  record_date: string;
  calories: number;
  calorie_target: number;
  protein: number;
  protein_target: number;
  carbs: number;
  carbs_target: number;
  fat: number;
  fat_target: number;
  hydration: number;
  hydration_target: number;
}

interface BodyweightRow {
  record_date: string;
  weight_kg: number;
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatDateLabel(dateStr: string, todayStr: string, yesterdayStr: string): string {
  if (dateStr === todayStr) return 'TODAY';
  if (dateStr === yesterdayStr) return 'YESTERDAY';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

function dateLabelForWeek(weekIndex: number, totalWeeks: number): string {
  return `W${totalWeeks - weekIndex}`;
}

// ─── Local Daily Macro Storage ──────────────────────────────────
export const LOCAL_MACROS_KEY = (email: string) => `o1fc_daily_macros_${email.toLowerCase().trim()}`;
export const GLOBAL_MACROS_KEY = 'o1fc_daily_macros';

export function getLocalDailyMacros(userEmail: string, days = 7): DailyMacroLog[] {
  const email = userEmail.toLowerCase().trim();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let list: DailyMacroLog[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_MACROS_KEY(email)) || localStorage.getItem(GLOBAL_MACROS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed.map((m: any) => ({
          date: m.date || m.record_date || today,
          dateLabel: formatDateLabel(m.date || m.record_date || today, today, yesterday),
          calories: Number(m.calories) || 0,
          calorieTarget: Number(m.calorieTarget || m.calorie_target) || 3000,
          protein: Number(m.protein) || 0,
          proteinTarget: Number(m.proteinTarget || m.protein_target) || 180,
          carbs: Number(m.carbs) || 0,
          carbsTarget: Number(m.carbsTarget || m.carbs_target) || 300,
          fat: Number(m.fat) || 0,
          fatTarget: Number(m.fatTarget || m.fat_target) || 70,
          hydration: Number(m.hydration) || 0,
          hydrationTarget: Number(m.hydrationTarget || m.hydration_target) || 3,
        }));
      }
    }
  } catch {}

  // Check if today's local meals cache has food logged that can populate or update today's macro
  try {
    const todayCacheRaw = localStorage.getItem(`o1fc_meals_cache_${email}_${today}`);
    if (todayCacheRaw) {
      const meals = JSON.parse(todayCacheRaw);
      let tCals = 0, tP = 0, tC = 0, tF = 0;
      Object.values(meals || {}).flat().forEach((item: any) => {
        tCals += Number(item.cals) || 0;
        tP += Number(item.p) || 0;
        tC += Number(item.c) || 0;
        tF += Number(item.f) || 0;
      });
      if (tCals > 0 || tP > 0) {
        const existingIdx = list.findIndex(m => m.date === today);
        const todayEntry: DailyMacroLog = {
          date: today,
          dateLabel: 'TODAY',
          calories: Math.round(tCals),
          calorieTarget: 3000,
          protein: Math.round(tP),
          proteinTarget: 180,
          carbs: Math.round(tC),
          carbsTarget: 300,
          fat: Math.round(tF),
          fatTarget: 70,
          hydration: 0,
          hydrationTarget: 3,
        };
        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...todayEntry };
        } else {
          list.unshift(todayEntry);
        }
      }
    }
  } catch {}

  // Sort descending by date and limit
  list.sort((a, b) => b.date.localeCompare(a.date));
  return list.slice(0, days);
}

export function saveDailyMacroRecord(userEmail: string, macroLog: Partial<DailyMacroLog>): void {
  if (!userEmail) return;
  const email = userEmail.toLowerCase().trim();
  const today = new Date().toISOString().split('T')[0];
  const date = macroLog.date || today;

  try {
    const existing = getLocalDailyMacros(email, 30);
    const idx = existing.findIndex(m => m.date === date);
    const entry: DailyMacroLog = {
      date,
      dateLabel: formatDateLabel(date, today, new Date(Date.now() - 86400000).toISOString().split('T')[0]),
      calories: Math.round(macroLog.calories || 0),
      calorieTarget: Math.round(macroLog.calorieTarget || 3000),
      protein: Math.round(macroLog.protein || 0),
      proteinTarget: Math.round(macroLog.proteinTarget || 180),
      carbs: Math.round(macroLog.carbs || 0),
      carbsTarget: Math.round(macroLog.carbsTarget || 300),
      fat: Math.round(macroLog.fat || 0),
      fatTarget: Math.round(macroLog.fatTarget || 70),
      hydration: Number(macroLog.hydration) || 0,
      hydrationTarget: Number(macroLog.hydrationTarget) || 3,
    };

    if (idx >= 0) {
      existing[idx] = entry;
    } else {
      existing.unshift(entry);
    }
    existing.sort((a, b) => b.date.localeCompare(a.date));
    const serialized = JSON.stringify(existing.slice(0, 30));
    localStorage.setItem(LOCAL_MACROS_KEY(email), serialized);
    // Also sync to global key for Consultation/Weekly modals
    localStorage.setItem(GLOBAL_MACROS_KEY, serialized);
  } catch {}
}

// ─── Live fetch functions ────────────────────────────────────────

/**
 * Fetch the last N days of macro logs for an athlete from Supabase with local fallback.
 * Always guarantees valid local data even if DB is unavailable or table does not exist.
 */
export async function fetchDailyMacros(userEmail: string, days = 7): Promise<DailyMacroLog[]> {
  if (!userEmail) return [];
  const email = userEmail.toLowerCase().trim();
  const localList = getLocalDailyMacros(email, days);

  if (!isSupabaseConfigured()) return localList;

  try {
    const { data, error } = await supabase
      .from('daily_macros')
      .select('record_date, calories, calorie_target, protein, protein_target, carbs, carbs_target, fat, fat_target, hydration, hydration_target')
      .eq('user_email', email)
      .order('record_date', { ascending: false })
      .limit(days);

    if (error || !data || data.length === 0) {
      return localList;
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const cloudList: DailyMacroLog[] = (data as DailyMacroRow[]).map((row) => ({
      date: row.record_date,
      dateLabel: formatDateLabel(row.record_date, today, yesterday),
      calories: row.calories,
      calorieTarget: row.calorie_target,
      protein: row.protein,
      proteinTarget: row.protein_target,
      carbs: row.carbs,
      carbsTarget: row.carbs_target,
      fat: row.fat,
      fatTarget: row.fat_target,
      hydration: Number(row.hydration),
      hydrationTarget: Number(row.hydration_target),
    }));

    // Merge: prioritize cloud entries, but keep today's local if cloud doesn't have it
    const cloudDates = new Set(cloudList.map(c => c.date));
    const merged = [...cloudList];
    for (const loc of localList) {
      if (!cloudDates.has(loc.date)) {
        merged.push(loc);
      }
    }
    merged.sort((a, b) => b.date.localeCompare(a.date));
    return merged.slice(0, days);
  } catch {
    return localList;
  }
}

/**
 * Fetch weekly bodyweight logs for an athlete from Supabase.
 * Returns up to `weeks` entries, oldest first.
 */
export async function fetchBodyweightHistory(
  userEmail: string,
  weeks = 8
): Promise<{ week: string; weight: number }[]> {
  if (!isSupabaseConfigured() || !userEmail) return [];
  const email = userEmail.toLowerCase().trim();

  const { data, error } = await supabase
    .from('bodyweight_logs')
    .select('record_date, weight_kg')
    .eq('user_email', email)
    .order('record_date', { ascending: true })
    .limit(weeks);

  if (error || !data || data.length === 0) return [];

  const rows = data as BodyweightRow[];
  const total = rows.length;
  return rows.map((row, i) => ({
    week: dateLabelForWeek(i, total),
    weight: Number(row.weight_kg),
  }));
}

/**
 * Build a complete AthleteTelemetry object by merging the static session/PR
 * data with live macro and bodyweight data from Supabase. Falls back to the
 * hardcoded mock values if the DB is unreachable.
 */
export async function fetchLiveTelemetry(athleteName: string): Promise<AthleteTelemetry> {
  const base = getAthleteTelemetryByCoachLog(athleteName);
  const email = getEmailForAthlete(athleteName);

  const [liveMacros, liveBodyweight] = await Promise.all([
    fetchDailyMacros(email, 7),
    fetchBodyweightHistory(email, 8),
  ]);

  return {
    ...base,
    macroHistory: liveMacros.length > 0 ? liveMacros : base.macroHistory,
    bodyweightHistory: liveBodyweight.length > 0 ? liveBodyweight : base.bodyweightHistory,
  };
}

/**
 * Synchronous accessor that returns the static telemetry immediately.
 * Use this for the initial render before live data loads.
 */
export function getStaticTelemetry(athleteName: string): AthleteTelemetry {
  return getAthleteTelemetryByCoachLog(athleteName);
}

export { ATHLETE_TELEMETRY };

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

// ─── Live fetch functions ────────────────────────────────────────

/**
 * Fetch the last N days of macro logs for an athlete from Supabase.
 * Returns an empty array if the DB is unavailable.
 */
export async function fetchDailyMacros(userEmail: string, days = 7): Promise<DailyMacroLog[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('daily_macros')
    .select('record_date, calories, calorie_target, protein, protein_target, carbs, carbs_target, fat, fat_target, hydration, hydration_target')
    .eq('user_email', userEmail)
    .order('record_date', { ascending: false })
    .limit(days);

  if (error || !data || data.length === 0) return [];

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return (data as DailyMacroRow[]).map((row) => ({
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
}

/**
 * Fetch weekly bodyweight logs for an athlete from Supabase.
 * Returns up to `weeks` entries, oldest first.
 */
export async function fetchBodyweightHistory(
  userEmail: string,
  weeks = 8
): Promise<{ week: string; weight: number }[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('bodyweight_logs')
    .select('record_date, weight_kg')
    .eq('user_email', userEmail)
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

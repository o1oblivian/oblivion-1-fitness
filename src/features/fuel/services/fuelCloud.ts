import { supabase } from '../../../services/supabaseClient';

export type FuelSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drinks' | 'supplements';
export const FUEL_SLOTS: FuelSlot[] = ['breakfast', 'lunch', 'dinner', 'snack', 'drinks', 'supplements'];

export interface CloudMeal {
  id: string;
  slot: FuelSlot;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export type SupplementTiming = 'Morning' | 'Pre-Workout' | 'Post-Workout' | 'Evening' | 'Anytime';
export type SupplementUnit = 'mg' | 'g' | 'mcg' | 'IU' | 'caps' | 'tabs' | 'scoop' | 'ml';
export type SupplementEvidence = 'strong' | 'moderate' | 'limited';

export interface SupplementItem {
  id: string;
  name: string;
  /** Display string, e.g. "5 g". Derived from amount + unit when those are present. */
  dosage: string;
  timing: SupplementTiming;
  category: string;
  amount?: number;
  unit?: SupplementUnit;
  caffeineMg?: number;
  evidence?: SupplementEvidence;
  benefits?: string;
  synergy?: string;
}

export interface Electrolytes {
  sodium: number;
  potassium: number;
  magnesium: number;
}

export interface FuelProfilePatch {
  calorie_target?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fats_g?: number | null;
  hydration_target_ml?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  age_years?: number | null;
  sex?: 'male' | 'female' | null;
  country?: string | null;
  diet?: string | null;
  supplement_stack?: SupplementItem[];
}

export interface FuelDayPatch {
  water_ml?: number;
  burned_kcal?: number;
  electrolytes?: Electrolytes;
  supplements_taken?: string[];
}

export interface FuelSnapshot {
  profile: (FuelProfilePatch & { user_id: string }) | null;
  day: (FuelDayPatch & { calories: number; protein: number; carbs: number; fats: number }) | null;
  meals: CloudMeal[];
}

/** The athlete's calendar day, never UTC: a 7am breakfast in Sydney belongs to today. */
export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function asSlot(value: unknown): FuelSlot {
  const slot = String(value || '').toLowerCase();
  return (FUEL_SLOTS as string[]).includes(slot) ? (slot as FuelSlot) : 'snack';
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchFuelSnapshot(userId: string, dateKey: string): Promise<FuelSnapshot | null> {
  const [profileRes, dayRes, mealRes] = await Promise.all([
    supabase.from('fuel_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('fuel_days').select('*').eq('user_id', userId).eq('date_key', dateKey).maybeSingle(),
    supabase
      .from('meal_logs')
      .select('id, meal_type, name, calories, protein, carbs, fats, created_at')
      .eq('user_id', userId)
      .eq('date', dateKey)
      .order('created_at', { ascending: true }),
  ]);
  if (profileRes.error || dayRes.error || mealRes.error) {
    console.warn('[FuelCloud] Snapshot unavailable:', profileRes.error?.message || dayRes.error?.message || mealRes.error?.message);
    return null;
  }
  const meals: CloudMeal[] = (mealRes.data || []).map((row) => ({
    id: String(row.id),
    slot: asSlot(row.meal_type),
    name: String(row.name || ''),
    calories: num(row.calories),
    protein: num(row.protein),
    carbs: num(row.carbs),
    fats: num(row.fats),
  }));
  return { profile: profileRes.data || null, day: dayRes.data || null, meals };
}

export interface FuelDayTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

/** Daily totals for [fromKey, toKey] summed from meal_logs, keyed by local date. Days with no meals are absent. */
export async function fetchFuelWeek(userId: string, fromKey: string, toKey: string): Promise<Record<string, FuelDayTotals> | null> {
  const { data, error } = await supabase
    .from('meal_logs')
    .select('date, calories, protein, carbs, fats')
    .eq('user_id', userId)
    .gte('date', fromKey)
    .lte('date', toKey);
  if (error) {
    console.warn('[FuelCloud] Week unavailable:', error.message);
    return null;
  }
  const out: Record<string, FuelDayTotals> = {};
  for (const row of data || []) {
    const key = String(row.date);
    const t = out[key] ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };
    out[key] = {
      calories: t.calories + num(row.calories),
      protein: Math.round((t.protein + num(row.protein)) * 10) / 10,
      carbs: Math.round((t.carbs + num(row.carbs)) * 10) / 10,
      fats: Math.round((t.fats + num(row.fats)) * 10) / 10,
    };
  }
  return out;
}

export async function upsertFuelProfile(userId: string, patch: FuelProfilePatch): Promise<boolean> {
  const { error } = await supabase
    .from('fuel_profiles')
    .upsert([{ user_id: userId, ...patch, updated_at: new Date().toISOString() }], { onConflict: 'user_id' });
  if (error) console.warn('[FuelCloud] Profile save failed:', error.message);
  return !error;
}

export async function upsertFuelDay(userId: string, dateKey: string, patch: FuelDayPatch): Promise<boolean> {
  const { error } = await supabase
    .from('fuel_days')
    .upsert([{ user_id: userId, date_key: dateKey, ...patch, updated_at: new Date().toISOString() }], { onConflict: 'user_id,date_key' });
  if (error) console.warn('[FuelCloud] Day save failed:', error.message);
  return !error;
}

export interface MealRow {
  id: string;
  user_id: string;
  date: string;
  meal_type: FuelSlot;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  created_at: string;
}

export function toMealRow(userId: string, dateKey: string, meal: CloudMeal): MealRow {
  return {
    id: meal.id,
    user_id: userId,
    date: dateKey,
    meal_type: meal.slot,
    name: meal.name.slice(0, 200) || 'Food',
    calories: Math.round(num(meal.calories)),
    protein: Math.round(num(meal.protein) * 10) / 10,
    carbs: Math.round(num(meal.carbs) * 10) / 10,
    fats: Math.round(num(meal.fats) * 10) / 10,
    created_at: new Date().toISOString(),
  };
}

/** Totals in fuel_days are recalculated by a database trigger in the same transaction. */
export async function insertMealRow(row: MealRow): Promise<boolean> {
  const { error } = await supabase.from('meal_logs').upsert([row], { onConflict: 'id' });
  if (error) console.warn('[FuelCloud] Meal save failed:', error.message);
  return !error;
}

export async function deleteMealRow(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('meal_logs').delete().eq('id', id).eq('user_id', userId);
  if (error) console.warn('[FuelCloud] Meal delete failed:', error.message);
  return !error;
}

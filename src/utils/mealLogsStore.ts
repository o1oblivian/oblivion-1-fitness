import { supabase, isSupabaseConfigured } from './supabase';
import type { DailyMeals, LoggedMealItem } from '../types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'drinks'] as const;
const OFFLINE_QUEUE_KEY = 'o1fc_meal_offline_queue';

interface QueuedMealSave {
  userEmail: string;
  meals: DailyMeals;
  logDate: string;
  queuedAt: number;
}

function getOfflineQueue(): QueuedMealSave[] {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); } catch { return []; }
}

function saveOfflineQueue(queue: QueuedMealSave[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function enqueueOfflineSave(userEmail: string, meals: DailyMeals, logDate: string) {
  const queue = getOfflineQueue().filter(
    q => !(q.userEmail === userEmail && q.logDate === logDate)
  );
  queue.push({ userEmail, meals, logDate, queuedAt: Date.now() });
  saveOfflineQueue(queue);
}

export async function flushMealOfflineQueue(): Promise<void> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;
  const remaining: QueuedMealSave[] = [];
  for (const item of queue) {
    try {
      await saveMealsToCloudDirect(item.userEmail, item.meals, item.logDate);
    } catch {
      remaining.push(item);
    }
  }
  saveOfflineQueue(remaining);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushMealOfflineQueue(); });
}

async function saveMealsToCloudDirect(userEmail: string, meals: DailyMeals, logDate: string): Promise<void> {
  const email = userEmail.toLowerCase();
  const rows: any[] = [];
  for (const mealType of MEAL_TYPES) {
    const items = meals[mealType] || [];
    for (const item of items) {
      rows.push({
        id: item.id,
        user_email: email,
        log_date: logDate,
        meal_type: mealType,
        food_name: item.name,
        calories: item.cals || 0,
        protein: item.p || 0,
        carbs: item.c || 0,
        fat: item.f || 0,
        quantity: typeof item.weight === 'number' ? item.weight : parseFloat(String(item.weight)) || 1,
        unit: 'g',
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from('meal_logs')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);

    const currentIds = rows.map(r => r.id);
    const { data: existing } = await supabase
      .from('meal_logs')
      .select('id')
      .eq('user_email', email)
      .eq('log_date', logDate);

    if (existing) {
      const toDelete = existing.filter(e => !currentIds.includes(e.id)).map(e => e.id);
      if (toDelete.length > 0) {
        await supabase.from('meal_logs').delete().in('id', toDelete);
      }
    }
  } else {
    const { error } = await supabase.from('meal_logs').delete().eq('user_email', email).eq('log_date', logDate);
    if (error) throw new Error(error.message);
  }
}

export async function saveMealsToCloud(userEmail: string, meals: DailyMeals, logDate?: string): Promise<void> {
  if (!isSupabaseConfigured() || !userEmail) return;
  const date = logDate || new Date().toISOString().split('T')[0];

  if (!navigator.onLine) {
    enqueueOfflineSave(userEmail, meals, date);
    return;
  }

  try {
    await saveMealsToCloudDirect(userEmail, meals, date);
  } catch {
    enqueueOfflineSave(userEmail, meals, date);
  }
}

export async function loadMealsFromCloud(userEmail: string, logDate?: string): Promise<DailyMeals | null> {
  if (!isSupabaseConfigured() || !userEmail) return null;
  const date = logDate || new Date().toISOString().split('T')[0];
  const email = userEmail.toLowerCase();

  try {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_email', email)
      .eq('log_date', date);

    if (error || !data || data.length === 0) return null;

    const meals: DailyMeals = { breakfast: [], lunch: [], dinner: [], snack: [], drinks: [] };
    for (const row of data) {
      const item: LoggedMealItem = {
        id: row.id,
        name: row.food_name,
        weight: row.quantity || 1,
        p: row.protein || 0,
        c: row.carbs || 0,
        f: row.fat || 0,
        cals: row.calories || 0,
      };
      const type = row.meal_type as keyof DailyMeals;
      if (meals[type]) {
        meals[type].push(item);
      } else {
        meals.snack.push(item);
      }
    }
    return meals;
  } catch {
    return null;
  }
}

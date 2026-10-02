import { supabase } from '../../../services/supabaseClient';
import { FuelMeals, MealItem } from '../store/useFuelStore';
import { safeStorage } from '../../../utils/sanitizers';

const FUEL_STORAGE_KEY = 'o1fc_fuel_state_v5';

export async function hydrateFuelFromSupabase(
  onHydrate: (meals: FuelMeals, calorieTarget?: number) => void
): Promise<void> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || (typeof window !== 'undefined' && localStorage.getItem('o1fc_user_id')) || 'default-athlete';
    const now = new Date();
    const todayDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const startIso = `${todayDateKey}T00:00:00.000Z`;

    // 1. Fetch today's meal_logs and nutrition_logs simultaneously
    const [{ data: mealRows }, { data: nutRows }] = await Promise.all([
      supabase.from('meal_logs').select('*').eq('user_id', userId).gte('created_at', startIso).order('created_at', { ascending: true }),
      supabase.from('nutrition_logs').select('*').eq('user_id', userId).gte('created_at', startIso).order('created_at', { ascending: true }),
    ]);

    const allRows = [...(Array.isArray(mealRows) ? mealRows : []), ...(Array.isArray(nutRows) ? nutRows : [])];

    if (allRows.length > 0) {
      const cloudMeals: FuelMeals = { breakfast: [], lunch: [], dinner: [], snack: [], drinks: [], supplements: [] };
      const seenIds = new Set<string>();

      for (const row of allRows) {
        const rowId = row.id || `meal-${Math.random().toString(36).slice(2, 7)}`;
        if (seenIds.has(rowId)) continue;
        seenIds.add(rowId);

        const slotKey = (row.meal_slot || row.meal_type || 'breakfast').toLowerCase() as keyof FuelMeals;
        const validSlot: keyof FuelMeals = cloudMeals[slotKey] !== undefined ? slotKey : 'breakfast';
        const item: MealItem = {
          id: rowId,
          name: row.food_name || row.meal_name || row.name || 'Food item',
          calories: Number(row.calories) || 0,
          protein: Number(row.protein ?? row.protein_g ?? 0),
          carbs: Number(row.carbs ?? row.carbs_g ?? 0),
          fats: Number(row.fat ?? row.fats ?? row.fat_g ?? 0),
        };
        cloudMeals[validSlot].push(item);
      }

      const { data: macroRow } = await supabase.from('daily_macros').select('*').eq('user_id', userId).eq('date', todayDateKey).maybeSingle();
      const calorieTarget = macroRow?.calorie_target ? Number(macroRow.calorie_target) : undefined;
      onHydrate(cloudMeals, calorieTarget);
      return;
    }

    // 2. Fallback: check local storage cached state
    const saved = safeStorage.getItem<any>(FUEL_STORAGE_KEY, null);
    if (saved && saved.meals && typeof saved.meals === 'object') {
      const hasLocalMeals = Object.values(saved.meals).some((arr) => Array.isArray(arr) && arr.length > 0);
      if (hasLocalMeals) onHydrate(saved.meals, saved.calorieTarget);
    }
  } catch (err) {
    console.warn('[FuelHydration] Supabase query notice, keeping local cache:', err);
  }
}

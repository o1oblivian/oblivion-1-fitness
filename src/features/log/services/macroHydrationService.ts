import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useTelemetryHistoryStore } from '../store/useTelemetryHistoryStore';
import { useLogStore } from '../../../stores/useLogStore';
import { useFuelStore, FuelMeals } from '../../fuel/store/useFuelStore';

/**
 * Hydrates past 7 days nutritional telemetry from public.daily_macros
 * and public.meal_logs for the authenticated athlete.
 */
export async function hydrateMacrosFromSupabase(): Promise<void> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return;

    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 14);
    const minDateKey = minDate.toISOString().slice(0, 10);
    const todayKey = new Date().toISOString().slice(0, 10);

    // 1. Fetch from daily_macros
    const { data: macroRows } = await supabase
      .from('daily_macros')
      .select('*')
      .or(`user_id.eq.${userId},client_id.eq.${userId}`)
      .gte('date', minDateKey)
      .order('date', { ascending: false });

    if (Array.isArray(macroRows) && macroRows.length > 0) {
      for (const m of macroRows) {
        if (!m.date) continue;
        const cal = Number(m.calories) || 0;
        const p = Number(m.protein) || 0;
        const c = Number(m.carbs) || 0;
        const f = Number(m.fat ?? m.fats ?? 60);

        useTelemetryHistoryStore.getState().updateDayRecord(m.date, 'nutrition', {
          hasData: cal > 0 || p > 0,
          calories: cal,
          calorieTarget: Number(m.calorie_target) || 2200,
          proteinG: p,
          proteinTargetG: Number(m.protein_target) || 165,
          carbsG: c,
          carbsTargetG: Number(m.carbs_target) || 250,
          fatsG: f,
          fatsTargetG: Number(m.fat_target ?? m.fats_target ?? 60),
        });

        if (m.date === todayKey) {
          useLogStore.getState().updateSubModule('nutrition', {
            caloriesConsumed: cal,
            caloriesTarget: Number(m.calorie_target) || 2200,
            proteinG: p,
            proteinTargetG: Number(m.protein_target) || 165,
            carbsG: c,
            carbsTargetG: Number(m.carbs_target) || 250,
            fatsG: f,
            fatsTargetG: Number(m.fat_target ?? m.fats_target ?? 60),
          });
        }
      }
    }

    // 2. Fetch individual meal_logs for detail aggregation
    const { data: mealRows } = await supabase
      .from('meal_logs')
      .select('*')
      .or(`user_id.eq.${userId},client_id.eq.${userId}`)
      .gte('created_at', `${minDateKey}T00:00:00.000Z`)
      .order('created_at', { ascending: true });

    if (Array.isArray(mealRows) && mealRows.length > 0) {
      const todayMeals: FuelMeals = {
        breakfast: [], lunch: [], dinner: [], snack: [], drinks: [], supplements: []
      };

      for (const item of mealRows) {
        const itemDate = (item.created_at || '').slice(0, 10);
        if (itemDate === todayKey) {
          const slot = (item.meal_slot || 'breakfast').toLowerCase() as keyof FuelMeals;
          if (todayMeals[slot]) {
            todayMeals[slot].push({
              id: item.id || `meal-${Math.random().toString(36).slice(2, 7)}`,
              name: item.food_name || item.name || 'Food item',
              calories: Number(item.calories) || 0,
              protein: Number(item.protein) || 0,
              carbs: Number(item.carbs) || 0,
              fats: Number(item.fat ?? item.fats ?? 0),
            });
          }
        }
      }

      // Sync to useFuelStore if currently empty
      const currentMeals = useFuelStore.getState().meals;
      const curCount = Object.values(currentMeals).reduce((acc, arr) => acc + arr.length, 0);
      const todayCount = Object.values(todayMeals).reduce((acc, arr) => acc + arr.length, 0);
      if (curCount === 0 && todayCount > 0) {
        useFuelStore.setState((prev) => ({ ...prev, meals: todayMeals }));
      }
    }
  } catch (err) {
    console.warn('[MacroHydration] Query notice:', err);
  }
}

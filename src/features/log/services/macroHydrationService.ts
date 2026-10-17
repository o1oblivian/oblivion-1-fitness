import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useTelemetryHistoryStore } from '../store/useTelemetryHistoryStore';
import { useLogStore } from '../../../stores/useLogStore';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { FUEL_SLOTS, FuelSlot, localDateKey } from '../../fuel/services/fuelCloud';
import { isForgotten } from './dayLogService';

const HISTORY_DAYS = 14;

function slotFor(value: unknown): FuelSlot {
  const slot = String(value || '');
  return (FUEL_SLOTS as string[]).includes(slot) ? (slot as FuelSlot) : 'snack';
}

function categoryFor(slot: FuelSlot): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' {
  if (slot === 'breakfast') return 'Breakfast';
  if (slot === 'dinner') return 'Dinner';
  if (slot === 'lunch') return 'Lunch';
  return 'Snacks';
}

/** Rebuilds the last two weeks of nutrition history from fuel_days + meal_logs, keyed by local calendar date. */
export async function hydrateMacrosFromSupabase(): Promise<void> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return;

    await useFuelStore.getState().hydrate();

    const since = new Date();
    since.setDate(since.getDate() - HISTORY_DAYS);
    const minDateKey = localDateKey(since);
    const todayKey = localDateKey();

    const [daysRes, mealsRes] = await Promise.all([
      supabase
        .from('fuel_days')
        .select('date_key, calories, protein, carbs, fats')
        .eq('user_id', userId)
        .gte('date_key', minDateKey),
      supabase
        .from('meal_logs')
        .select('id, date, meal_type, name, calories, protein, carbs, fats, created_at')
        .eq('user_id', userId)
        .gte('date', minDateKey)
        .order('created_at', { ascending: true }),
    ]);
    if (daysRes.error || mealsRes.error) {
      console.warn(
        '[MacroHydration] Query notice:',
        daysRes.error?.message || mealsRes.error?.message,
      );
      return;
    }

    const mealsByDay = new Map<string, NonNullable<typeof mealsRes.data>>();
    for (const row of mealsRes.data || []) {
      const key = String(row.date || '');
      mealsByDay.set(key, [...(mealsByDay.get(key) || []), row]);
    }

    const fuel = useFuelStore.getState();
    const history = useTelemetryHistoryStore.getState();
    for (const day of daysRes.data || []) {
      const dateKey = String(day.date_key).slice(0, 10);
      if (dateKey === todayKey || isForgotten(dateKey, 'nutrition')) continue;
      const meals = mealsByDay.get(dateKey) || [];
      const calories = Number(day.calories) || 0;
      history.updateDayRecord(
        dateKey,
        'nutrition',
        {
          hasData: calories > 0 || meals.length > 0,
          calories,
          calorieTarget: fuel.calorieTarget ?? 0,
          proteinG: Number(day.protein) || 0,
          proteinTargetG: fuel.targetProteinG ?? 0,
          carbsG: Number(day.carbs) || 0,
          carbsTargetG: fuel.targetCarbsG ?? 0,
          fatsG: Number(day.fats) || 0,
          fatsTargetG: fuel.targetFatsG ?? 0,
          meals: meals.map((m) => ({
            name: String(m.name || ''),
            category: categoryFor(slotFor(m.meal_type)),
            slot: slotFor(m.meal_type),
            calories: Number(m.calories) || 0,
            proteinG: Number(m.protein) || 0,
            carbsG: Number(m.carbs) || 0,
            fatsG: Number(m.fats) || 0,
          })),
        },
        { skipCloud: true },
      );
    }

    const today = useFuelStore.getState();
    const totals = Object.values(today.meals)
      .flat()
      .reduce(
        (acc, m) => ({
          cal: acc.cal + m.calories,
          p: acc.p + m.protein,
          c: acc.c + m.carbs,
          f: acc.f + m.fats,
        }),
        { cal: 0, p: 0, c: 0, f: 0 },
      );
    useLogStore.getState().updateSubModule('nutrition', {
      caloriesConsumed: Math.round(totals.cal),
      caloriesTarget: today.calorieTarget ?? 0,
      proteinG: Math.round(totals.p * 10) / 10,
      proteinTargetG: today.targetProteinG ?? 0,
      carbsG: Math.round(totals.c * 10) / 10,
      carbsTargetG: today.targetCarbsG ?? 0,
      fatsG: Math.round(totals.f * 10) / 10,
      fatsTargetG: today.targetFatsG ?? 0,
      hydrationLiters: today.hydrationCurrentL,
    });
  } catch (err) {
    console.warn('[MacroHydration] Query notice:', err);
  }
}

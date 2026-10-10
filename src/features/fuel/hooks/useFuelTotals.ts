import { useMemo } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { FuelMeals, MealItem } from '../store/useFuelStore';
import { SlotKey } from '../constants/fuelConstants';

function finite(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export interface VerifiedFoodItem {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion?: string;
}

interface UseFuelTotalsProps {
  meals: FuelMeals;
  calorieTarget: number;
  burnedKcal: number;
  removeMealItem: (slot: SlotKey, itemId: string) => void;
  addMealItem: (slot: SlotKey, item: MealItem) => void;
  showToast: (msg: string) => void;
}

export function useFuelTotals({
  meals,
  calorieTarget,
  burnedKcal,
  removeMealItem,
  addMealItem,
  showToast,
}: UseFuelTotalsProps) {
  const totals = useMemo(() => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    (Object.keys(meals) as SlotKey[]).forEach((slot) => {
      const items = meals[slot] || [];
      items.forEach((item) => {
        totalCalories += finite(item.calories);
        totalProtein += finite(item.protein);
        totalCarbs += finite(item.carbs);
        totalFats += finite(item.fats);
      });
    });

    const netCalories = finite(totalCalories);
    const target = finite(calorieTarget);
    const burned = finite(burnedKcal);
    const remainingCalories = Math.max(0, target - netCalories + burned);
    const progressPercent =
      target > 0 ? Math.min(100, Math.round((netCalories / target) * 100)) : 0;

    return {
      totalCalories,
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFats: Math.round(totalFats * 10) / 10,
      remainingCalories,
      progressPercent,
    };
  }, [meals, calorieTarget, burnedKcal]);

  const handleDeleteItem = (slot: SlotKey, itemId: string, itemName: string) => {
    tactileEngine.triggerSelectionBuzz();
    removeMealItem(slot, itemId);
    showToast(`Removed ${itemName}`);
  };

  const handleLogVerifiedPreset = (slot: SlotKey, item: VerifiedFoodItem) => {
    tactileEngine.playPRCelebration();
    const newItem: MealItem = {
      id: `verified-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fats: item.fats,
    };

    addMealItem(slot, newItem);
    showToast(`Added ${item.name} (${item.calories} kcal) to ${slot}`);
  };

  return {
    totals,
    handleDeleteItem,
    handleLogVerifiedPreset,
  };
}

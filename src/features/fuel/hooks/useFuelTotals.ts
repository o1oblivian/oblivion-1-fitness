import { useMemo } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { FuelMeals } from '../store/useFuelStore';
import { SlotKey } from '../constants/fuelConstants';
import { energyBalance, sumMacros } from '../utils/fuelMath';

interface UseFuelTotalsProps {
  meals: FuelMeals;
  calorieTarget: number | null;
  burnedKcal: number;
  removeMealItem: (slot: SlotKey, itemId: string) => void;
  showToast: (msg: string) => void;
}

export function useFuelTotals({
  meals,
  calorieTarget,
  burnedKcal,
  removeMealItem,
  showToast,
}: UseFuelTotalsProps) {
  const totals = useMemo(() => sumMacros(Object.values(meals).flat()), [meals]);
  const balance = energyBalance(calorieTarget, totals.calories, burnedKcal);

  const handleDeleteItem = (slot: SlotKey, itemId: string, itemName: string) => {
    tactileEngine.triggerSelectionBuzz();
    removeMealItem(slot, itemId);
    showToast(`Removed ${itemName}`);
  };

  return { totals, balance, handleDeleteItem };
}

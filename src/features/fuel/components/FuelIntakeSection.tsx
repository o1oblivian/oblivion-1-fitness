import React from 'react';
import { ChevronUp } from 'lucide-react';
import { FuelMeals, MealItem } from '../store/useFuelStore';
import { MEAL_SLOTS, SlotKey } from '../constants/fuelConstants';
import { FuelIntakeSlotCard } from './FuelIntakeSlotCard';

interface FuelIntakeSectionProps {
  isIntakeExpanded: boolean;
  onToggleIntake: () => void;
  meals: FuelMeals;
  onDeleteItem: (slot: SlotKey, itemId: string, itemName: string) => void;
  onOpenAddFoodModal: (categoryLabel: string) => void;
  onOpenVoiceModal: (slot: SlotKey) => void;
  onOpenScanModal: (slot: SlotKey) => void;
  onQuickAddItem?: (slot: SlotKey, item: MealItem) => void;
}

export const FuelIntakeSection: React.FC<FuelIntakeSectionProps> = ({
  isIntakeExpanded,
  onToggleIntake,
  meals,
  onDeleteItem,
  onOpenAddFoodModal,
  onOpenVoiceModal,
  onOpenScanModal,
  onQuickAddItem,
}) => {
  const totalLoggedCalories = Object.values(meals).reduce(
    (acc: number, items: MealItem[] | undefined) =>
      acc + (items || []).reduce((slotAcc: number, it: MealItem) => slotAcc + (Number(it.calories) || 0), 0),
    0
  );

  return (
    <section id="verified-intake-categories" className="space-y-3 select-none">
      {/* Intake Section Header with Live Calorie Counter */}
      <div
        onClick={onToggleIntake}
        className="flex items-center justify-between px-1 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Intake
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            {totalLoggedCalories.toLocaleString()} kcal logged
          </span>
        </div>

        <button
          type="button"
          aria-label="Toggle intake slots"
          className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 transition-colors shadow-2xs cursor-pointer"
        >
          <ChevronUp
            className={`w-4 h-4 transition-transform duration-200 ${
              isIntakeExpanded ? '' : 'rotate-180'
            }`}
          />
        </button>
      </div>

      {isIntakeExpanded &&
        MEAL_SLOTS.map((slot) => (
          <FuelIntakeSlotCard
            key={slot.key}
            slot={slot}
            items={meals[slot.key] || []}
            onDeleteItem={onDeleteItem}
            onOpenAddFoodModal={onOpenAddFoodModal}
            onOpenVoiceModal={onOpenVoiceModal}
            onOpenScanModal={onOpenScanModal}
            onQuickAddItem={onQuickAddItem}
          />
        ))}
    </section>
  );
};

export default FuelIntakeSection;

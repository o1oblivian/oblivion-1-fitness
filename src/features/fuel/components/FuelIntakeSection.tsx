import React from 'react';
import { ChevronUp } from 'lucide-react';
import { FuelMeals } from '../store/useFuelStore';
import { MEAL_SLOTS, SlotKey } from '../constants/fuelConstants';
import { FuelIntakeSlotCard } from './FuelIntakeSlotCard';

interface FuelIntakeSectionProps {
  isIntakeExpanded: boolean;
  onToggleIntake: () => void;
  meals: FuelMeals;
  slotTargets: Partial<Record<SlotKey, number>> | null;
  onDeleteItem: (slot: SlotKey, itemId: string, itemName: string) => void;
  onOpenAddFoodModal: (categoryLabel: string) => void;
  onOpenScanModal: (slot: SlotKey) => void;
}

export const FuelIntakeSection: React.FC<FuelIntakeSectionProps> = ({
  isIntakeExpanded,
  onToggleIntake,
  meals,
  slotTargets,
  onDeleteItem,
  onOpenAddFoodModal,
  onOpenScanModal,
}) => {
  const filledSlots = MEAL_SLOTS.filter((slot) => (meals[slot.key] || []).length > 0).length;

  return (
    <section id="verified-intake-categories" className="space-y-3 select-none">
      <button
        type="button"
        onClick={onToggleIntake}
        aria-expanded={isIntakeExpanded}
        className="w-full flex items-center justify-between px-1 cursor-pointer bg-transparent border-0"
      >
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold text-o1-text">Intake</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tabular-nums border border-white/[0.08] text-o1-muted">
            {filledSlots}/{MEAL_SLOTS.length} logged
          </span>
        </span>
        <span className="w-7 h-7 rounded-full border border-white/[0.08] flex items-center justify-center text-o1-muted">
          <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isIntakeExpanded ? '' : 'rotate-180'}`} />
        </span>
      </button>

      {isIntakeExpanded &&
        MEAL_SLOTS.map((slot) => (
          <FuelIntakeSlotCard
            key={slot.key}
            slot={slot}
            targetKcal={slotTargets?.[slot.key] ?? null}
            items={meals[slot.key] || []}
            onDeleteItem={onDeleteItem}
            onOpenAddFoodModal={onOpenAddFoodModal}
            onOpenScanModal={onOpenScanModal}
          />
        ))}
    </section>
  );
};

export default FuelIntakeSection;

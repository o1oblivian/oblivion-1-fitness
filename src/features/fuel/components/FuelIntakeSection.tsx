import React from 'react';
import { Camera, ChevronUp } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { FuelMeals } from '../store/useFuelStore';
import { MEAL_SLOTS, SlotKey, slotForHour } from '../constants/fuelConstants';
import { FuelIntakeSlotCard } from './FuelIntakeSlotCard';

interface FuelIntakeSectionProps {
  isIntakeExpanded: boolean;
  onToggleIntake: () => void;
  meals: FuelMeals;
  slotTargets: Partial<Record<SlotKey, number>> | null;
  onDeleteItem: (slot: SlotKey, itemId: string, itemName: string) => void;
  onOpenAddFoodModal: (categoryLabel: string) => void;
  onOpenScanModal: (slot: SlotKey) => void;
  /** Last row of the list; stays reachable when Intake is collapsed. */
  footer?: React.ReactNode;
}

export const FuelIntakeSection: React.FC<FuelIntakeSectionProps> = ({
  isIntakeExpanded,
  onToggleIntake,
  meals,
  slotTargets,
  onDeleteItem,
  onOpenAddFoodModal,
  onOpenScanModal,
  footer,
}) => {
  const scanSlotKey = slotForHour(new Date().getHours());
  const scanSlot = MEAL_SLOTS.find((s) => s.key === scanSlotKey) ?? MEAL_SLOTS[0];

  return (
    <section id="verified-intake-categories" className="space-y-3 select-none">
      <button
        type="button"
        onClick={onToggleIntake}
        aria-expanded={isIntakeExpanded}
        className="w-full flex items-center justify-between px-1 cursor-pointer bg-transparent border-0"
      >
        <span className="text-o1-title font-semibold text-o1-text">Intake</span>
        <span className="w-7 h-7 rounded-full border border-white/[0.08] flex items-center justify-center text-o1-muted">
          <ChevronUp
            className={`w-4 h-4 transition-transform duration-200 ${isIntakeExpanded ? '' : 'rotate-180'}`}
          />
        </span>
      </button>

      {isIntakeExpanded && (
        <>
          <button
            id="btn-scan-meal"
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenScanModal(scanSlot.key);
            }}
            aria-label={`Scan a meal for ${scanSlot.label}`}
            className="w-full min-h-[48px] rounded-2xl border border-o1-crimson/60 bg-o1-surface hover:bg-o1-sheet active:scale-[0.99] transition flex items-center justify-center gap-2 text-o1-control font-semibold text-o1-text cursor-pointer"
          >
            <Camera className="w-5 h-5 stroke-[1.5] text-o1-text" />
            Scan meal
            <span className="font-normal text-o1-muted">· {scanSlot.label}</span>
          </button>

          <div className="rounded-2xl bg-o1-surface border border-white/[0.09] divide-y divide-white/[0.07] overflow-hidden">
            {MEAL_SLOTS.map((slot) => (
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
            {footer}
          </div>
        </>
      )}
      {!isIntakeExpanded && footer ? (
        <div className="rounded-2xl bg-o1-surface border border-white/[0.09] overflow-hidden">
          {footer}
        </div>
      ) : null}
    </section>
  );
};

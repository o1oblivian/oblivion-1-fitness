import React from 'react';
import { Plus, Trash2, Camera } from 'lucide-react';
import { StillThumb } from '../../../components/StillThumb';
import { tactileEngine } from '../../../services/tactileEngine';
import { MealItem } from '../store/useFuelStore';
import { MealSlotConfig, SlotKey } from '../constants/fuelConstants';
import { foodStill } from '../utils/foodStill';

const SLOT_NOTE: Partial<Record<SlotKey, string>> = {
  drinks: 'Hydration & electrolytes',
  supplements: 'Vitamins & minerals',
};

/**
 * A bare 16px icon in muted silver. The padding with an equal negative margin gives an 8px touch margin
 * on every side without moving the icon, so the visible gap between two icons stays the row's 12px.
 */
const ACTION_BUTTON =
  'p-2 -m-2 flex items-center justify-center text-o1-muted hover:text-o1-text active:opacity-60 transition-colors cursor-pointer';

function g(n: number): string {
  return `${Math.round(n * 10) / 10}`;
}

interface FuelIntakeSlotCardProps {
  slot: MealSlotConfig;
  items: MealItem[];
  /** kcal for this slot; 0 = day target reached; null = targets not set. */
  targetKcal: number | null;
  onDeleteItem: (slot: SlotKey, itemId: string, itemName: string) => void;
  onOpenAddFoodModal: (categoryLabel: string) => void;
  onOpenScanModal: (slot: SlotKey) => void;
}

/** One row of the grouped Intake list. The parent supplies the card and the dividers. */
export const FuelIntakeSlotCard: React.FC<FuelIntakeSlotCardProps> = ({
  slot,
  items,
  targetKcal,
  onDeleteItem,
  onOpenAddFoodModal,
  onOpenScanModal,
}) => {
  const totalKcal = items.reduce((sum, it) => sum + (Number(it.calories) || 0), 0);
  const hasItems = items.length > 0;
  const note = SLOT_NOTE[slot.key];
  const subtitle =
    note ??
    (targetKcal == null
      ? 'Target --'
      : targetKcal === 0
        ? 'Day target reached'
        : `Target ~${Math.round(targetKcal).toLocaleString()} kcal`);

  return (
    <div id={`intake-slot-${slot.key}`} className="px-3.5 py-2">
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 flex items-center justify-center shrink-0 ${slot.accent}`}>
          {slot.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-o1-control font-semibold leading-tight text-o1-text">{slot.label}</h3>
          <p className="text-o1-caption text-o1-muted tabular-nums truncate">{subtitle}</p>
        </div>
        {hasItems ? (
          <span className="shrink-0 text-right text-o1-body font-semibold tabular-nums text-o1-text">
            {Math.round(totalKcal).toLocaleString()}{' '}
            <span className="text-o1-label font-normal text-o1-muted">kcal</span>
          </span>
        ) : null}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenScanModal(slot.key);
            }}
            aria-label={`Scan food for ${slot.label}`}
            className={ACTION_BUTTON}
          >
            <Camera className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            id={`btn-add-${slot.key}`}
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenAddFoodModal(slot.label);
            }}
            aria-label={`Add food to ${slot.label}`}
            className={ACTION_BUTTON}
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {hasItems && (
        <ul className="mt-2 mb-1 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 pl-3.5 pr-2 py-2.5 rounded-2xl bg-o1-well border border-white/[0.07]"
            >
              <StillThumb src={foodStill(item)} />
              <div className="min-w-0 flex-1">
                <span className="block text-o1-body font-medium text-o1-text truncate">
                  {item.name}
                </span>
                <span className="block text-o1-caption tabular-nums mt-0.5 text-o1-muted">
                  <span className="text-o1-text">
                    {Math.round(Number(item.calories) || 0)} kcal
                  </span>
                  {' · '}
                  <span className="text-o1-crimson">{g(Number(item.protein) || 0)}g P</span>
                  {' · '}
                  <span className="text-o1-yellow">{g(Number(item.carbs) || 0)}g C</span>
                  {' · '}
                  <span className="text-o1-olive">{g(Number(item.fats) || 0)}g F</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteItem(slot.key, item.id, item.name)}
                aria-label={`Remove ${item.name}`}
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-o1-muted hover:text-o1-crimson transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

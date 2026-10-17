import React from 'react';
import { Plus, Trash2, Camera } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { MealItem } from '../store/useFuelStore';
import { MealSlotConfig, SlotKey } from '../constants/fuelConstants';

const SLOT_NOTE: Partial<Record<SlotKey, string>> = {
  drinks: 'Hydration & electrolytes',
  supplements: 'Vitamins & minerals',
};

const ICON_BUTTON =
  'w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors active:scale-95 cursor-pointer';

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

export const FuelIntakeSlotCard: React.FC<FuelIntakeSlotCardProps> = ({
  slot,
  items,
  targetKcal,
  onDeleteItem,
  onOpenAddFoodModal,
  onOpenScanModal,
}) => {
  const total = items.reduce(
    (acc, it) => ({
      calories: acc.calories + (Number(it.calories) || 0),
      protein: acc.protein + (Number(it.protein) || 0),
      carbs: acc.carbs + (Number(it.carbs) || 0),
      fats: acc.fats + (Number(it.fats) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
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
    <div id={`intake-slot-${slot.key}`} className="bg-o1-canvas border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3.5 py-1.5 bg-o1-text">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`flex items-center justify-center shrink-0 ${slot.accent}`}>{slot.icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black">{slot.label}</h3>
            <p className="text-[11px] text-black/60 tabular-nums truncate">{subtitle}</p>
          </div>
        </div>
        <div className="text-right shrink-0 tabular-nums">
          <span className="o1-unread block text-sm font-semibold text-black">
            {hasItems ? Math.round(total.calories).toLocaleString() : '--'} <span className="text-[10px] font-normal text-black/60">kcal</span>
          </span>
          {hasItems && (
            <span className="block text-[10px] font-semibold">
              <span className="text-o1-crimson">{g(total.protein)}P</span>
              <span className="text-black/40"> · </span>
              <span className="text-amber-700">{g(total.carbs)}C</span>
              <span className="text-black/40"> · </span>
              <span className="text-emerald-700">{g(total.fats)}F</span>
            </span>
          )}
        </div>
      </div>

      {hasItems && (
        <ul className="px-3 pt-3 pb-1 space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 pl-3 pr-1.5 py-2 rounded-xl bg-o1-surface border border-white/[0.05]">
              <div className="min-w-0">
                <span className="block text-xs font-medium text-o1-text truncate">{item.name}</span>
                <span className="block text-[11px] tabular-nums mt-0.5">
                  <span className="text-o1-text">{Math.round(Number(item.calories) || 0)} kcal</span>
                  <span className="text-o1-muted"> · </span>
                  <span className="text-o1-crimson">{g(Number(item.protein) || 0)}g P</span>
                  <span className="text-o1-muted"> · </span>
                  <span className="text-amber-500">{g(Number(item.carbs) || 0)}g C</span>
                  <span className="text-o1-muted"> · </span>
                  <span className="text-emerald-500">{g(Number(item.fats) || 0)}g F</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteItem(slot.key, item.id, item.name)}
                aria-label={`Remove ${item.name}`}
                className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-o1-muted hover:text-o1-crimson transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          <button
            id={`btn-add-${slot.key}`}
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenAddFoodModal(slot.label);
            }}
            aria-label={`Add food to ${slot.label}`}
            className={`${ICON_BUTTON} ${slot.accent}`}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenScanModal(slot.key);
          }}
          aria-label={`Scan food for ${slot.label}`}
          className={`${ICON_BUTTON} ${slot.accent}`}
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};



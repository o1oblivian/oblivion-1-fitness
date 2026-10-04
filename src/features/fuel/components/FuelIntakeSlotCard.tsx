import React from 'react';
import { Plus, Trash2, Mic, Camera, Zap } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { MealItem } from '../store/useFuelStore';
import { MealSlotConfig, SlotKey } from '../constants/fuelConstants';

interface QuickPreset {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const SLOT_CONTEXT_DATA: Record<
  SlotKey,
  {
    subtitle: string;
    presets: QuickPreset[];
  }
> = {
  breakfast: {
    subtitle: 'Morning Priming · Target: ~25% Daily',
    presets: [
      { name: '3 Whole Eggs (Poached)', calories: 210, protein: 18, carbs: 2, fats: 15 },
      { name: 'Oatmeal & Berries (60g)', calories: 220, protein: 8, carbs: 42, fats: 3 },
      { name: 'Whey Isolate Shake', calories: 130, protein: 26, carbs: 2, fats: 1.5 },
    ],
  },
  lunch: {
    subtitle: 'Midday Power · Target: ~35% Daily',
    presets: [
      { name: 'Grilled Chicken Breast (180g)', calories: 240, protein: 46, carbs: 0, fats: 5 },
      { name: 'Jasmine Rice (150g)', calories: 195, protein: 4, carbs: 44, fats: 0.5 },
      { name: 'Avocado Greens Salad', calories: 180, protein: 2, carbs: 8, fats: 16 },
    ],
  },
  dinner: {
    subtitle: 'Recovery & Synthesis · Target: ~30% Daily',
    presets: [
      { name: 'Atlantic Salmon Fillet (180g)', calories: 340, protein: 36, carbs: 0, fats: 21 },
      { name: 'Roasted Sweet Potato (200g)', calories: 175, protein: 3, carbs: 41, fats: 0.3 },
      { name: 'Steamed Broccoli & Garlic', calories: 55, protein: 4, carbs: 10, fats: 0.6 },
    ],
  },
  snack: {
    subtitle: 'Intra-Workout & Protein Snacking',
    presets: [
      { name: 'Greek Yogurt 0% (200g)', calories: 120, protein: 20, carbs: 8, fats: 0 },
      { name: 'O1 Clean Protein Bar', calories: 210, protein: 21, carbs: 22, fats: 6 },
      { name: 'Raw Almonds (30g)', calories: 170, protein: 6, carbs: 6, fats: 15 },
    ],
  },
  drinks: {
    subtitle: 'Hydration & Electrolytes Balance',
    presets: [
      { name: 'Electrolyte Mineral Mix', calories: 15, protein: 0, carbs: 4, fats: 0 },
      { name: 'Iced Black Americano', calories: 5, protein: 0.5, carbs: 1, fats: 0 },
      { name: 'Post-Workout BCAA Shake', calories: 45, protein: 10, carbs: 1, fats: 0 },
    ],
  },
  supplements: {
    subtitle: 'Daily Micronutrients & Vitamins',
    presets: [
      { name: 'Creatine Monohydrate (5g)', calories: 0, protein: 0, carbs: 0, fats: 0 },
      { name: 'Omega-3 Fish Oil (2 caps)', calories: 20, protein: 0, carbs: 0, fats: 2 },
      { name: 'Athletic Multivitamin', calories: 0, protein: 0, carbs: 0, fats: 0 },
    ],
  },
};

interface FuelIntakeSlotCardProps {
  slot: MealSlotConfig;
  items: MealItem[];
  onDeleteItem: (slot: SlotKey, itemId: string, itemName: string) => void;
  onOpenAddFoodModal: (categoryLabel: string) => void;
  onOpenVoiceModal: (slot: SlotKey) => void;
  onOpenScanModal: (slot: SlotKey) => void;
  onQuickAddItem?: (slot: SlotKey, item: MealItem) => void;
}

export const FuelIntakeSlotCard: React.FC<FuelIntakeSlotCardProps> = ({
  slot,
  items,
  onDeleteItem,
  onOpenAddFoodModal,
  onOpenVoiceModal,
  onOpenScanModal,
  onQuickAddItem,
}) => {
  const slotCalories = items.reduce((acc, it) => acc + (Number(it.calories) || 0), 0);
  const slotProtein = items.reduce((acc, it) => acc + (Number(it.protein) || 0), 0);
  const slotCarbs = items.reduce((acc, it) => acc + (Number(it.carbs) || 0), 0);
  const slotFats = items.reduce((acc, it) => acc + (Number(it.fats) || 0), 0);

  const hasItems = items.length > 0;
  const context = SLOT_CONTEXT_DATA[slot.key] || {
    subtitle: 'Daily Nutrition Slot',
    presets: [],
  };

  const handleQuickAdd = (preset: QuickPreset) => {
    tactileEngine.triggerImpactPulse();
    if (onQuickAddItem) {
      onQuickAddItem(slot.key, {
        id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: preset.name,
        calories: preset.calories,
        protein: preset.protein,
        carbs: preset.carbs,
        fats: preset.fats,
      });
    } else {
      onOpenAddFoodModal(slot.label);
    }
  };

  return (
    <div
      id={`intake-slot-${slot.key}`}
      className="bg-white dark:bg-[#121214] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl transition-all overflow-hidden shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700"
    >
      {/* Top Header: Icon + Meal Name + Subtitle on Left, Calories & Macro Badges on Right */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${slot.iconBg}`}>
            {slot.icon}
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">
              {slot.label}
            </h3>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
              {context.subtitle}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-black font-mono text-neutral-900 dark:text-white block">
            {slotCalories} <span className="text-[10px] text-neutral-400 font-normal">kcal</span>
          </span>
          {hasItems && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 justify-end">
              <span className="text-[#C4121A] font-bold">{Math.round(slotProtein)}P</span>
              <span>·</span>
              <span className="text-amber-500 font-bold">{Math.round(slotCarbs)}C</span>
              <span>·</span>
              <span className="text-sky-500 font-bold">{Math.round(slotFats)}F</span>
            </div>
          )}
        </div>
      </div>

      {/* Middle Area: Items List OR Interactive 1-Tap Quick Suggestions */}
      <div className="border-t border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#151518]/50">
        {hasItems ? (
          <div className="p-3 space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800 text-xs shadow-2xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate block">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                    <span className="text-neutral-900 dark:text-white font-bold">
                      {item.calories} kcal
                    </span>
                    <span>•</span>
                    <span className="text-[#C4121A] font-semibold">{item.protein}g P</span>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{item.carbs}g C</span>
                    <span>•</span>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">{item.fats}g F</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteItem(slot.key, item.id, item.name)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>1-Tap Quick Suggestions:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {context.presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickAdd(preset)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-[#202026] border border-neutral-200/90 dark:border-neutral-800 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs group"
                >
                  <Plus className="w-3 h-3 text-neutral-400 group-hover:text-[#C4121A] transition-colors" />
                  <span>{preset.name}</span>
                  <span className="font-mono text-[10px] text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 font-semibold">
                    {preset.calories} kcal
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar: [+ Add Item] & [Mic] on Left, [Camera] on Right */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-white dark:bg-[#121214]">
        <div className="flex items-center gap-2">
          <button
            id={`btn-add-${slot.key}`}
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenAddFoodModal(slot.label);
            }}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#18181b] hover:bg-neutral-50 dark:hover:bg-[#222228] text-xs font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Plus className={`w-3.5 h-3.5 stroke-[2.5] ${slot.plusColor}`} />
            <span>Add Item</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenVoiceModal(slot.key);
            }}
            className="w-8 h-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#18181b] hover:bg-neutral-50 dark:hover:bg-[#222228] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Voice Log"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenScanModal(slot.key);
          }}
          className="w-8 h-8 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#18181b] hover:bg-neutral-50 dark:hover:bg-[#222228] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
          title="Camera & Barcode Scan"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FuelIntakeSlotCard;

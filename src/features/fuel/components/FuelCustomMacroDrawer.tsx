import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { sanitizeNumericInput } from '../../../utils/numberInputUtils';
import { MealItem } from '../store/useFuelStore';
import { SlotKey, CATEGORIES } from '../constants/fuelConstants';

interface FuelCustomMacroDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMealItem: (slot: SlotKey, item: MealItem) => void;
  showToast: (msg: string) => void;
}

export const FuelCustomMacroDrawer: React.FC<FuelCustomMacroDrawerProps> = ({
  isOpen,
  onClose,
  onAddMealItem,
  showToast,
}) => {
  const [customSlot, setCustomSlot] = useState<SlotKey>('breakfast');
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFats, setCustomFats] = useState('');

  if (!isOpen) return null;

  const handleAddCustomEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      showToast('Please enter an item name');
      return;
    }

    const kcal = parseFloat(customCalories) || 0;
    const p = parseFloat(customProtein) || 0;
    const c = parseFloat(customCarbs) || 0;
    const f = parseFloat(customFats) || 0;

    const newItem: MealItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      calories: Math.round(kcal),
      protein: Math.round(p * 10) / 10,
      carbs: Math.round(c * 10) / 10,
      fats: Math.round(f * 10) / 10,
    };

    onAddMealItem(customSlot, newItem);
    tactileEngine.triggerSelectionBuzz();
    showToast(`Added ${newItem.name} (${newItem.calories} kcal) to ${customSlot}`);

    // Reset form
    setCustomName('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFats('');
    onClose();
  };

  return (
    <form
      onSubmit={handleAddCustomEntry}
      className="bg-o1-card border border-white/[0.07] rounded-2xl p-2.5 shadow-xs space-y-2 animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
        <span className="text-xs font-bold uppercase text-neutral-100">
          Custom Macro Entry
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-[10px] font-mono font-bold uppercase text-neutral-400 mb-1">
          Target Slot
        </label>
        <select
          value={customSlot}
          onChange={(e) => setCustomSlot(e.target.value as SlotKey)}
          className="w-full h-9 px-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-neutral-200 focus:outline-none focus:border-red-600"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-mono font-bold uppercase text-neutral-400 mb-1">
          Item Name
        </label>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="e.g. Sourdough French Toast"
          className="w-full h-9 px-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono text-neutral-200 focus:outline-none focus:border-red-600"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-[9px] font-mono font-bold uppercase text-neutral-400 mb-0.5">
            Calories
          </label>
          <input
            type="number"
            value={customCalories}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCustomCalories(sanitizeNumericInput(e.target.value))}
            placeholder="kcal"
            className="w-full h-8 px-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-neutral-100 focus:outline-none focus:border-red-600"
          />
        </div>
        <div>
          <label className="block text-[9px] font-mono font-bold uppercase text-red-400 mb-0.5">
            Protein (g)
          </label>
          <input
            type="number"
            step="0.1"
            value={customProtein}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCustomProtein(sanitizeNumericInput(e.target.value))}
            placeholder="P (g)"
            className="w-full h-8 px-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-neutral-100 focus:outline-none focus:border-red-600"
          />
        </div>
        <div>
          <label className="block text-[9px] font-mono font-bold uppercase text-amber-400 mb-0.5">
            Carbs (g)
          </label>
          <input
            type="number"
            step="0.1"
            value={customCarbs}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCustomCarbs(sanitizeNumericInput(e.target.value))}
            placeholder="C (g)"
            className="w-full h-8 px-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-neutral-100 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-[9px] font-mono font-bold uppercase text-sky-400 mb-0.5">
            Fats (g)
          </label>
          <input
            type="number"
            step="0.1"
            value={customFats}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setCustomFats(sanitizeNumericInput(e.target.value))}
            placeholder="F (g)"
            className="w-full h-8 px-2 rounded-xl bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-neutral-100 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2.5 rounded-xl bg-zinc-100 hover:opacity-90 text-neutral-950 font-semibold text-xs tracking-wide flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>Commit Custom Item</span>
      </button>
    </form>
  );
};

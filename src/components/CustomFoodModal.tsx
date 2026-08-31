import React, { useState, useEffect } from 'react';
import { X, UtensilsCrossed, Check } from 'lucide-react';
import { FoodItem } from '../types';
import { getSmartDefault, recordSmartInput } from '../utils/frequencyDefaults';
import { FoodCategoryIcon } from './FoodCategoryIcon';

interface CustomFoodModalProps {
  isOpen: boolean;
  initialQuery?: string;
  onSaveFood: (food: FoodItem) => void;
  onClose: () => void;
}

export const CustomFoodModal: React.FC<CustomFoodModalProps> = ({
  isOpen,
  initialQuery = '',
  onSaveFood,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const [name, setName] = useState(initialQuery);
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Protein');
  const [p, setP] = useState(() => {
    const def = getSmartDefault('custom_food_p', 0);
    return def !== 0 ? String(def) : '0';
  });
  const [c, setC] = useState(() => {
    const def = getSmartDefault('custom_food_c', 0);
    return def !== 0 ? String(def) : '0';
  });
  const [f, setF] = useState(() => {
    const def = getSmartDefault('custom_food_f', 0);
    return def !== 0 ? String(def) : '0';
  });

  if (!isOpen) return null;

  const categories = [
    'Protein',
    'Carbs',
    'Fats',
    'Fast Food',
    'Drinks',
  ];

  const handleSave = () => {
    if (!name.trim()) return;
    const parsedP = parseFloat(p) || 0;
    const parsedC = parseFloat(c) || 0;
    const parsedF = parseFloat(f) || 0;
    recordSmartInput('custom_food_p', parsedP);
    recordSmartInput('custom_food_c', parsedC);
    recordSmartInput('custom_food_f', parsedF);
    onSaveFood({
      icon: '',
      name: name.trim(),
      brand: brand.trim() || undefined,
      category,
      p: parsedP,
      c: parsedC,
      f: parsedF,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[160] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-t-[1.75rem] sm:rounded-3xl shadow-2xl border-t sm:border border-zinc-200/80/90 dark:border-zinc-800/80 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pt-2.5 pb-2 px-4 flex flex-col items-center border-b border-zinc-200/80/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
          <div className="w-9 h-1.5 rounded-full bg-stone-300 dark:bg-zinc-700/80 mb-2 sm:hidden" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200/70 dark:border-red-850 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <UtensilsCrossed className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-white tracking-tight leading-tight">
                  Add Custom Food Item
                </h3>
                <p className="text-[11px] text-stone-400 dark:text-zinc-400 font-sans leading-none mt-0.5">
                  Macronutrient profile per 100g / serving
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-nude-close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body - Inset Grouped */}
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1">
          <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80/80 dark:border-zinc-800/80 rounded-2xl p-3.5 space-y-3 shadow-2xs">
            <div>
              <label className="text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                Item Name
              </label>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-850 border border-zinc-200/80/70 dark:border-zinc-750/70 flex items-center justify-center shrink-0">
                  <FoodCategoryIcon category={category} name={name} className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grilled Chicken Breast"
                  className="flex-1 bg-zinc-50/80 dark:bg-zinc-800/70 border border-zinc-200/80/80 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-stone-400 dark:focus:border-zinc-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Brand / Source (Optional)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Homemade, Brand"
                  className="w-full bg-zinc-50/80 dark:bg-zinc-800/70 border border-zinc-200/80/80 dark:border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-stone-400 dark:focus:border-zinc-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-50/80 dark:bg-zinc-800/70 border border-zinc-200/80/80 dark:border-zinc-700/80 rounded-xl px-2.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-stone-400 dark:focus:border-zinc-500 font-semibold cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Macro Inputs */}
            <div>
              <label className="text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                Macronutrients (Grams)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-50/80 dark:bg-zinc-800/70 border border-zinc-200/80/80 dark:border-zinc-700/80 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-red-500 dark:text-red-400 block uppercase tracking-wider">
                    Protein
                  </span>
                  <input
                    type="number"
                    value={p}
                    onChange={(e) => setP(e.target.value)}
                    className="w-full bg-transparent text-center font-bold text-sm text-zinc-900 dark:text-white outline-none mt-1"
                  />
                </div>
                <div className="bg-zinc-50/80 dark:bg-zinc-800/70 border border-zinc-200/80/80 dark:border-zinc-700/80 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400 block uppercase tracking-wider">
                    Carbs
                  </span>
                  <input
                    type="number"
                    value={c}
                    onChange={(e) => setC(e.target.value)}
                    className="w-full bg-transparent text-center font-bold text-sm text-zinc-900 dark:text-white outline-none mt-1"
                  />
                </div>
                <div className="bg-zinc-50/80 dark:bg-zinc-800/70 border border-zinc-200/80/80 dark:border-zinc-700/80 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 block uppercase tracking-wider">
                    Fats
                  </span>
                  <input
                    type="number"
                    value={f}
                    onChange={(e) => setF(e.target.value)}
                    className="w-full bg-transparent text-center font-bold text-sm text-zinc-900 dark:text-white outline-none mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-200/80/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-2.5 bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold rounded-xl text-xs shadow-xs transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Item</span>
          </button>
        </div>
      </div>
    </div>
  );
};


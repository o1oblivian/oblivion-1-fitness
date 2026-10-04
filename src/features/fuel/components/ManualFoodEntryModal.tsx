import React, { useState, useEffect } from 'react';
import { X, Plus, Database, Check, Flame, Beef, Wheat, Apple, Coffee } from 'lucide-react';
import { FoodCategoryType, FoodItemRecord } from '../../../services/foodData/types';
import { saveCustomFood } from '../../../services/customFoodDatabase';
import { tactileEngine } from '../../../services/tactileEngine';
import { sanitizeNumericInput } from '../../../utils/numberInputUtils';
import { MealCategory } from '../../../types';
import { ExtendedMealCategory } from './MealCategoryCards';

interface ManualFoodEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: FoodCategoryType;
  currentMealCategory: ExtendedMealCategory | MealCategory;
  countryMarket?: string;
  onFoodSaved: (food: FoodItemRecord, logToMeal: boolean) => void;
}

const CATEGORY_OPTIONS: { id: FoodCategoryType; label: string; icon: React.ReactNode }[] = [
  { id: 'protein', label: 'Protein', icon: <Beef className="w-3.5 h-3.5 text-red-500" /> },
  { id: 'carbs', label: 'Carbs', icon: <Wheat className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'fats', label: 'Fats', icon: <Apple className="w-3.5 h-3.5 text-green-500" /> },
  { id: 'drinks', label: 'Drinks', icon: <Coffee className="w-3.5 h-3.5 text-sky-500" /> },
];

export const ManualFoodEntryModal: React.FC<ManualFoodEntryModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'protein',
  currentMealCategory,
  countryMarket = 'AU',
  onFoodSaved,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<FoodCategoryType>(defaultCategory);
  const [servingGrams, setServingGrams] = useState('100');
  const [servingSizeDesc, setServingSizeDesc] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [savePermanently, setSavePermanently] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setBrand('');
      setCategory(defaultCategory);
      setServingGrams('100');
      setServingSizeDesc('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      setSavePermanently(true);
      setErrorMsg(null);
    }
  }, [isOpen, defaultCategory]);

  if (!isOpen) return null;

  const validateAndBuildRecord = (): FoodItemRecord | null => {
    if (!name.trim()) {
      setErrorMsg('Please enter a food name');
      return null;
    }

    const gramsNum = parseFloat(servingGrams);
    if (isNaN(gramsNum) || gramsNum <= 0) {
      setErrorMsg('Please enter a valid portion weight in grams');
      return null;
    }

    const kcalNum = parseFloat(calories) || 0;
    const pNum = parseFloat(protein) || 0;
    const cNum = parseFloat(carbs) || 0;
    const fNum = parseFloat(fats) || 0;

    if (kcalNum === 0 && pNum === 0 && cNum === 0 && fNum === 0) {
      setErrorMsg('Please enter calories or macronutrients');
      return null;
    }

    // Auto-calculate calories if user entered macros but left calories blank
    const calculatedKcal = kcalNum > 0 ? kcalNum : Math.round(pNum * 4 + cNum * 4 + fNum * 9);

    const servingStr = servingSizeDesc.trim()
      ? `${servingSizeDesc.trim()} (${Math.round(gramsNum)}g)`
      : `${Math.round(gramsNum)}g`;

    const record: FoodItemRecord = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      brand: brand.trim() || 'My Foods',
      calories: Math.round(calculatedKcal),
      protein: Math.round(pNum * 10) / 10,
      carbs: Math.round(cNum * 10) / 10,
      fats: Math.round(fNum * 10) / 10,
      serving_size: servingStr,
      serving_grams: Math.round(gramsNum),
      category,
      country: countryMarket,
      is_custom: true,
    };

    return record;
  };

  const handleSubmit = (logToMeal: boolean) => {
    const record = validateAndBuildRecord();
    if (!record) return;

    tactileEngine.triggerImpactPulse();

    // Permanently store in custom food catalog database
    if (savePermanently) {
      saveCustomFood(record);
    }

    onFoodSaved(record, logToMeal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#C4121A] flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/60 shadow-2xs">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 leading-tight">
                Manual Food Entry
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                Portion weight & permanent database storage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181b] dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Food Name & Brand */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
              Food Item Name <span className="text-[#C4121A]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="e.g. Kangaroo Mince 5-Star, Protein Pancake"
              className="w-full h-10 px-3 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-[#C4121A]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
              Brand / Source <span className="text-[10px] text-neutral-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Macro Organic, Homemade, Local Cafe"
              className="w-full h-10 px-3 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-[#C4121A]"
            />
          </div>
        </div>

        {/* Category Pill Selector */}
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1.5">
            Category
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setCategory(opt.id);
                }}
                className={`py-2 px-1 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                  category === opt.id
                    ? 'bg-red-500/10 border-[#C4121A] text-[#C4121A] font-bold shadow-2xs'
                    : 'bg-neutral-50 dark:bg-[#18181b] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {opt.icon}
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Weight & Portion Size */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
              Serving Weight (g / ml) <span className="text-[#C4121A]">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                value={servingGrams}
                onChange={(e) => setServingGrams(e.target.value)}
                placeholder="100"
                className="w-full h-10 px-3 pr-8 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C4121A]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-mono">
                g
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
              Portion Desc <span className="text-[10px] text-neutral-400 font-normal">(e.g. 1 scoop)</span>
            </label>
            <input
              type="text"
              value={servingSizeDesc}
              onChange={(e) => setServingSizeDesc(e.target.value)}
              placeholder="e.g. 1 fillet, 1 scoop"
              className="w-full h-10 px-3 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-[#C4121A]"
            />
          </div>
        </div>

        {/* Nutritional Facts Grid */}
        <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181b]/70 border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
            <span>Nutritional Profile (Per Serving)</span>
            <span className="text-[10px] text-neutral-400 lowercase">for {servingGrams || 100}g</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* Calories */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#C4121A]" />
                <span>Kcal</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={calories}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCalories(sanitizeNumericInput(e.target.value))}
                placeholder="0"
                className="w-full h-9 px-2 text-center rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C4121A]"
              />
            </div>

            {/* Protein */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-red-600 dark:text-red-400 mb-1 text-center">
                Protein (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={protein}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setProtein(sanitizeNumericInput(e.target.value))}
                placeholder="0"
                className="w-full h-9 px-2 text-center rounded-xl bg-white dark:bg-[#121214] border border-red-200 dark:border-red-950/60 text-xs font-mono font-bold text-red-600 dark:text-red-400 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Carbs */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 mb-1 text-center">
                Carbs (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={carbs}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCarbs(sanitizeNumericInput(e.target.value))}
                placeholder="0"
                className="w-full h-9 px-2 text-center rounded-xl bg-white dark:bg-[#121214] border border-amber-200 dark:border-amber-950/60 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Fats */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-sky-600 dark:text-sky-400 mb-1 text-center">
                Fats (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={fats}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFats(sanitizeNumericInput(e.target.value))}
                placeholder="0"
                className="w-full h-9 px-2 text-center rounded-xl bg-white dark:bg-[#121214] border border-sky-200 dark:border-sky-950/60 text-xs font-mono font-bold text-sky-600 dark:text-sky-400 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Permanent Database Storage Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-neutral-100/80 dark:bg-[#18181b]/80 border border-neutral-200 dark:border-neutral-800 cursor-pointer">
          <input
            type="checkbox"
            checked={savePermanently}
            onChange={(e) => setSavePermanently(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-[#C4121A] focus:ring-[#C4121A] border-neutral-300 dark:border-neutral-700 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#C4121A]" />
              <span>Permanently store in database</span>
            </span>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Save this food permanently so it appears in your future searches and 1-tap logging.
            </p>
          </div>
        </label>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="w-full sm:flex-1 h-11 rounded-2xl bg-[#C4121A] hover:bg-[#a50f16] active:bg-[#800C11] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save &amp; Log To {currentMealCategory}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto px-4 h-11 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181b] dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
          >
            Save To Database Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualFoodEntryModal;

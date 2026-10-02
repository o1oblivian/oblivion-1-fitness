import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Loader2, Database } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { SlotKey, CATEGORIES } from '../constants/fuelConstants';
import { queryFoodCatalog, FoodItemRecord, getRegionalDatabaseInfo } from '../../../services/foodCatalogService';
import { useFuelStore } from '../store/useFuelStore';

interface FuelPresetsModalProps {
  activePresetCategory: SlotKey | null;
  onClose: () => void;
  onLogVerifiedPreset: (slot: SlotKey, item: any) => void;
}

function slotToFoodCategory(slot: SlotKey): 'protein' | 'carbs' | 'fats' | 'fastfood' | 'drinks' {
  if (slot === 'drinks') return 'drinks';
  if (slot === 'snack') return 'fats';
  if (slot === 'lunch') return 'carbs';
  if (slot === 'dinner') return 'protein';
  return 'protein';
}

export const FuelPresetsModal: React.FC<FuelPresetsModalProps> = ({
  activePresetCategory,
  onClose,
  onLogVerifiedPreset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<FoodItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const store = useFuelStore();
  const countryMarket = store.countryMarket || 'AU';
  const regionalDbInfo = getRegionalDatabaseInfo(countryMarket);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!activePresetCategory) {
      setFoods([]);
      setSearchQuery('');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const cat = slotToFoodCategory(activePresetCategory);
        const results = await queryFoodCatalog({
          query: searchQuery,
          category: cat,
          country: countryMarket || 'AU',
          limit: 150,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setFoods(results);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setFoods([]);
          setIsLoading(false);
        }
      }
    }, searchQuery ? 250 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activePresetCategory, searchQuery, countryMarket]);

  if (!activePresetCategory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <span className="text-[10px] font-mono text-[#C4121A] font-bold uppercase tracking-wider flex items-center gap-1.5 truncate">
              <Database className="w-3 h-3 shrink-0" />
              <span className="truncate">{regionalDbInfo.fullName}</span>
            </span>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wide">
              {CATEGORIES.find((c) => c.key === activePresetCategory)?.label} Catalog
            </h3>
          </div>
          <button
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${CATEGORIES.find((c) => c.key === activePresetCategory)?.label} items...`}
            className="w-full h-10 pl-9 pr-8 rounded-2xl bg-neutral-50 dark:bg-[#08080a] border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-800 dark:text-white focus:outline-none focus:border-[#C4121A]"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#C4121A]" />
          )}
        </div>

        {/* Database Items List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 max-h-[360px]">
          {isLoading && foods.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#C4121A]" />
              <span>Querying {regionalDbInfo.name} database ({regionalDbInfo.shortName})...</span>
            </div>
          ) : foods.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-400 dark:text-neutral-500">
              No verified items match &quot;{searchQuery}&quot;
            </div>
          ) : (
            foods.map((food) => (
              <div
                key={food.id}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                      {food.name}
                    </h4>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                      {food.calories} kcal
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                    {food.serving_size || `${food.serving_grams || 100}g`} • {food.brand}
                  </p>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400 mt-1">
                    <span className="text-red-600 dark:text-red-500 font-bold">{food.protein}g P</span>
                    <span>•</span>
                    <span className="text-amber-500 font-bold">{food.carbs}g C</span>
                    <span>•</span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">{food.fats}g F</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.playPRCelebration();
                    onLogVerifiedPreset(activePresetCategory, {
                      id: food.id,
                      name: food.name,
                      portion: food.serving_size || `${food.serving_grams || 100}g`,
                      calories: food.calories,
                      protein: food.protein,
                      carbs: food.carbs,
                      fats: food.fats,
                    });
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl bg-[#C4121A] hover:bg-[#a60f16] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Log</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quick close button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};

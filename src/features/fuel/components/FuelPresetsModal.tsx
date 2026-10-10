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
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none animate-in fade-in duration-150">
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] p-3.5 shadow-xl space-y-3 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
          <div>
            <span className="text-[10px] font-mono text-o1-crimson font-bold tracking-wider flex items-center gap-1.5 truncate">
              <Database className="w-3 h-3 shrink-0" />
              <span className="truncate">{regionalDbInfo.fullName}</span>
            </span>
            <h3 className="font-bold text-sm text-white tracking-wide">
              {CATEGORIES.find((c) => c.key === activePresetCategory)?.label} Catalog
            </h3>
          </div>
          <button
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
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
            className="w-full h-10 pl-9 pr-8 rounded-2xl bg-black border border-white/[0.07] text-xs font-mono text-white focus:outline-none focus:border-o1-crimson"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-o1-crimson" />
          )}
        </div>

        {/* Database Items List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 max-h-[360px]">
          {isLoading && foods.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-o1-crimson" />
              <span>Querying {regionalDbInfo.name} database ({regionalDbInfo.shortName})...</span>
            </div>
          ) : foods.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500">
              No verified items match &quot;{searchQuery}&quot;
            </div>
          ) : (
            foods.map((food) => (
              <div
                key={food.id}
                className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between gap-3 hover:border-white/[0.14] transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-white truncate">
                      {food.name}
                    </h4>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-neutral-300 font-bold">
                      {food.calories} kcal
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-400 truncate mt-0.5">
                    {food.serving_size || `${food.serving_grams || 100}g`} • {food.brand}
                  </p>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400 mt-1">
                    <span className="text-o1-crimson font-bold">{food.protein}g P</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">{food.carbs}g C</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">{food.fats}g F</span>
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
                  className="px-3 py-2 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white font-mono text-xs font-bold tracking-wider flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
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
          className="w-full py-2.5 rounded-2xl bg-white/[0.08] hover:bg-neutral-700 text-neutral-300 font-mono text-xs font-bold tracking-wider transition-all cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};

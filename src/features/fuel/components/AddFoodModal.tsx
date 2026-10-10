import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  Plus,
  Flame,
  ChevronDown,
  Apple,
  Coffee,
  Beef,
  Wheat,
  Loader2,
  Database,
  Utensils,
} from 'lucide-react';
import { MealCategory, MealFoodItem } from '../../../types';
import { ExtendedMealCategory } from './MealCategoryCards';
import { useFuelStore } from '../store/useFuelStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { FoodPortionDialModal } from './FoodPortionDialModal';
import { ClientCountryMarketModal, COUNTRIES } from './ClientCountryMarketModal';
import { queryFoodCatalog, FoodItemRecord, getRegionalDatabaseInfo } from '../../../services/foodCatalogService';
import { FoodCategoryType } from '../../../services/foodData/types';
import { ManualFoodEntryModal } from './ManualFoodEntryModal';
import { foodMatchesDietSafe } from '../utils/dietFoodFilter';

interface AddFoodModalProps {
  category: ExtendedMealCategory | MealCategory;
  isOpen: boolean;
  onClose: () => void;
  onAddFood?: (category: ExtendedMealCategory | MealCategory, item: MealFoodItem) => void;
  onOpenCustomFood?: () => void;
}

const CATEGORIES: { id: FoodCategoryType; label: string }[] = [
  { id: 'protein', label: 'Protein' },
  { id: 'carbs', label: 'Carbs' },
  { id: 'fats', label: 'Fats' },
  { id: 'fastfood', label: 'Fast Food' },
  { id: 'drinks', label: 'Drinks' },
];

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  category,
  isOpen,
  onClose,
  onAddFood,
  onOpenCustomFood,
}) => {
  const store = useFuelStore();
  const countryMarket = store.countryMarket || 'AU';
  const dietPreference = store.dietPreference || 'Omnivore';

  const [activeCategory, setActiveCategory] = useState<FoodCategoryType>('protein');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbFoods, setDbFoods] = useState<FoodItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFoodForDial, setSelectedFoodForDial] = useState<FoodItemRecord | null>(null);
  const [isDialModalOpen, setIsDialModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [activePortionGrams, setActivePortionGrams] = useState<number>(150);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveCategory('protein');
      setSelectedFoodForDial(null);
      setIsDialModalOpen(false);
      setIsCountryModalOpen(false);
      setIsManualModalOpen(false);
    }
  }, [isOpen]);

  // Curated catalog on browse; live OpenFoodFacts only after the athlete types a search
  useEffect(() => {
    if (!isOpen) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    const debounceTimer = setTimeout(
      async () => {
        try {
          const items = await queryFoodCatalog({
            query: searchQuery,
            category: activeCategory,
            country: countryMarket || 'AU',
            limit: 150,
            signal: controller.signal,
          });

          if (!controller.signal.aborted) {
            setDbFoods(items);
            setIsLoading(false);
          }
        } catch (err: any) {
          if (!controller.signal.aborted) {
            setDbFoods([]);
            setIsLoading(false);
          }
        }
      },
      searchQuery ? 250 : 0
    );

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [isOpen, activeCategory, searchQuery, countryMarket]);

  const currentCountry = useMemo(() => {
    return COUNTRIES.find((c) => c.code === countryMarket) || { flag: '🇦🇺', name: 'Australia', code: 'AU' };
  }, [countryMarket]);

  const regionalDbInfo = useMemo(() => {
    return getRegionalDatabaseInfo(countryMarket);
  }, [countryMarket]);

  const visibleFoods = useMemo(() => {
    const filtered = dbFoods.filter((f) => foodMatchesDietSafe(f.name, f.brand || '', dietPreference));
    if (activeCategory !== 'fastfood') return filtered;
    return [...filtered].sort((a, b) => {
      const brand = (a.brand || '').localeCompare(b.brand || '');
      if (brand !== 0) return brand;
      return a.name.localeCompare(b.name);
    });
  }, [dbFoods, dietPreference, activeCategory]);

  if (!isOpen) return null;

  const handleOpenDial = (food: FoodItemRecord) => {
    tactileEngine.triggerSelectionBuzz();
    setSelectedFoodForDial(food);
    setActivePortionGrams(food.serving_grams || 100);
    setIsDialModalOpen(true);
  };

  const handleManualFoodSaved = (food: FoodItemRecord, logToMeal: boolean) => {
    // Add to dbFoods list immediately so it appears at top
    setDbFoods((prev) => [food, ...prev.filter((f) => f.id !== food.id)]);

    if (logToMeal) {
      handleCommitFoodWithGrams(food, food.serving_grams || 100);
    } else {
      store.showToast(`Saved "${food.name}" to database permanently!`);
    }
  };

  const handleCommitFoodWithGrams = (food: FoodItemRecord, grams: number) => {
    tactileEngine.playPRCelebration();
    const baseServingG = (food.serving_grams && food.serving_grams > 0) ? food.serving_grams : 100;
    const scale = grams / baseServingG;

    const scaledKcal = Math.round(food.calories * scale);
    const scaledP = Math.round(food.protein * scale * 10) / 10;
    const scaledC = Math.round(food.carbs * scale * 10) / 10;
    const scaledF = Math.round(food.fats * scale * 10) / 10;

    const newItem: MealFoodItem = {
      id: `food-${food.id}-${Date.now()}`,
      name: food.name,
      portion: `${grams}g`,
      calories: scaledKcal,
      protein: scaledP,
      carbs: scaledC,
      fats: scaledF,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      logged: true,
    };

    store.addFoodItem(category, newItem);
    store.showToast(`Logged ${newItem.name} (${newItem.calories} kcal) to ${category}`);

    if (onAddFood) {
      onAddFood(category, newItem);
    }
    onClose();
  };

  const renderCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'protein':
        return <Beef className="w-4 h-4 text-red-500" />;
      case 'carbs':
        return <Wheat className="w-4 h-4 text-amber-500" />;
      case 'fats':
        return <Apple className="w-4 h-4 text-emerald-500" />;
      case 'fastfood':
        return <Utensils className="w-4 h-4 text-amber-400" />;
      case 'drinks':
        return <Coffee className="w-4 h-4 text-sky-500" />;
      default:
        return <Beef className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-150 select-none">
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] p-3.5 shadow-xl flex flex-col overflow-hidden space-y-2.5">
        {/* Top Header: Flame Icon, Title, Country Pill, Close Button */}
        <div className="flex items-center justify-between shrink-0 gap-2 pb-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-950/30 text-o1-crimson flex items-center justify-center shrink-0 border border-red-900/40 shadow-2xs">
              <Flame className="w-5 h-5 fill-o1-crimson/20 text-o1-crimson" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-neutral-100 leading-tight truncate">
                Add To {category}
              </h3>
              <p className="text-[11px] text-neutral-400 font-sans flex items-center gap-1.5 truncate mt-0.5">
                <span className="truncate">
                  {searchQuery.trim()
                    ? 'Live OpenFoodFacts · plus your catalog'
                    : regionalDbInfo.fullName}
                </span>
                <span className="text-neutral-700">·</span>
                <span className="truncate">{dietPreference}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Country Selector Pill (e.g. 🇦🇺 AU ▾) */}
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setIsCountryModalOpen(true);
              }}
              title="Select Regional Market Database"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-o1-well border border-white/[0.07] text-xs font-mono font-bold text-neutral-200 hover:border-white/[0.14] transition-colors cursor-pointer shadow-2xs active:scale-95"
            >
              <span>{currentCountry.flag}</span>
              <span>{currentCountry.code}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {/* Close Button - positioned cleanly with comfortable space */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close food modal"
              className="w-8 h-8 rounded-full bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Category Pills: Protein, Carbs, Fats, Fast Food, Drinks (STRICT ZERO "All Foods" tab) */}
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar border-b border-white/[0.05] pb-2 text-[11px] font-semibold shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setActiveCategory(cat.id);
              }}
              className={`px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'border border-o1-crimson bg-o1-crimson text-white font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search bar row: Reduced length input + Small + button for manual food & permanent DB storage */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={regionalDbInfo.searchPlaceholder}
              className="w-full h-11 pl-10 pr-10 rounded-2xl bg-o1-well border border-white/[0.07] text-xs font-sans text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-o1-crimson"
            />
            {isLoading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-o1-crimson" />
            )}
          </div>

          {/* Small + Icon button to manually add custom food & permanently store in database */}
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setIsManualModalOpen(true);
            }}
            title="Manually Add Food with Weight & Save to Database"
            aria-label="Add custom food with weight"
            className="w-11 h-11 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-o1-crimson flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Foods Catalog List — Pure Real Database */}
        <div className="overflow-y-auto space-y-2 pr-1 flex-1">
          {isLoading && visibleFoods.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 font-sans text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-o1-crimson" />
              <span>{searchQuery.trim() ? 'Searching OpenFoodFacts…' : 'Loading catalog…'}</span>
            </div>
          ) : visibleFoods.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 font-sans text-xs flex flex-col items-center justify-center gap-2">
              <Database className="w-6 h-6 text-neutral-500/50" />
              <span>No {dietPreference} match for &quot;{searchQuery || activeCategory}&quot;. Try another name or add a custom food.</span>
              <span className="text-[10px] text-neutral-500">Tap below to log a custom food item with exact macros.</span>
            </div>
          ) : (
            visibleFoods.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => handleOpenDial(food)}
                className="w-full text-left p-3 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between gap-3 transition-colors cursor-pointer active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-2xl bg-o1-card border border-white/[0.07] flex items-center justify-center shrink-0">
                  {renderCategoryIcon(food.category)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-neutral-100 truncate">
                        {food.name}
                      </span>
                      {(food.is_custom || food.source === 'custom') && (
                        <span className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-neutral-300 text-[9px] font-mono font-bold shrink-0 border border-white/[0.07]">
                          My Food
                        </span>
                      )}
                      {food.source === 'openfoodfacts' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-sky-950/40 text-sky-400 text-[9px] font-mono font-bold shrink-0 border border-sky-900/50">
                          Live
                        </span>
                      )}
                      {food.source === 'usda' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-950/40 text-amber-400 text-[9px] font-mono font-bold shrink-0 border border-amber-900/50">
                          Usda
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 font-sans truncate shrink-0 max-w-[110px]">
                      {food.brand}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-1">
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <Flame className="w-3 h-3 text-o1-crimson shrink-0" />
                      <span className="font-semibold text-neutral-200">{food.calories} kcal</span>
                      <span className="text-neutral-700">·</span>
                      <span>{food.serving_size || `${food.serving_grams || 100}g`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-o1-crimson font-bold">{food.protein}p</span>
                      <span className="text-amber-400 font-bold">{food.carbs}c</span>
                      <span className="text-emerald-400 font-bold">{food.fats}f</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Bottom Bar: + Custom Food Item (Left) & Done Button (Right) */}
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setIsManualModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-o1-crimson hover:underline cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Custom Food Item</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-900 font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Speedometer Radial Gauge Dial Modal */}
      <FoodPortionDialModal
        isOpen={isDialModalOpen}
        initialGrams={activePortionGrams}
        foodName={selectedFoodForDial ? selectedFoodForDial.name : 'Custom Portion'}
        food={selectedFoodForDial}
        onSetGrams={(g) => {
          if (selectedFoodForDial) {
            handleCommitFoodWithGrams(selectedFoodForDial, g);
          }
        }}
        onClose={() => setIsDialModalOpen(false)}
      />

      {/* Country Market Selection Modal */}
      <ClientCountryMarketModal
        isOpen={isCountryModalOpen}
        selectedCode={countryMarket}
        onSelect={(code) => {
          store.setCountryMarket(code);
        }}
        onClose={() => setIsCountryModalOpen(false)}
      />

      {/* Manual Food Entry & Permanent Storage Modal */}
      <ManualFoodEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        defaultCategory={activeCategory}
        currentMealCategory={category}
        countryMarket={countryMarket}
        onFoodSaved={handleManualFoodSaved}
      />
    </div>
  );
};

export default AddFoodModal;

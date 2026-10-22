import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, Plus, Flame, ChevronDown, Loader2, Database, WifiOff } from 'lucide-react';
import { MealFoodItem } from '../../../types';
import { useFuelStore } from '../store/useFuelStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { FoodPortionDialModal } from './FoodPortionDialModal';
import { ClientCountryMarketModal, COUNTRIES } from './ClientCountryMarketModal';
import type { FoodItemRecord } from '../../../services/foodCatalogService';
import { ManualFoodEntryModal } from './ManualFoodEntryModal';
import { FoodResultRow } from './FoodResultRow';
import { FoodListFooter } from './FoodListFooter';
import { foodMatchesDiet } from '../utils/dietFoodFilter';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { useFoodBrowse, type Browse } from '../hooks/useFoodBrowse';
import type { MacroBudget } from '../data/mealBudget';
import { FOOD_BROWSE_CATEGORIES } from '../../../../shared/foodBrowse';

interface AddFoodModalProps {
  /** Slot label from the fuel screen ("Snacks", "Supplements & Electrolytes"); the store maps it to a slot. */
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onAddFood?: (category: string, item: MealFoodItem) => void;
  showToast?: (msg: string) => void;
  budget?: MacroBudget | null;
}

const DEFAULT_BROWSE: Browse = FOOD_BROWSE_CATEGORIES[0].id;

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  category,
  isOpen,
  onClose,
  onAddFood,
  showToast,
  budget = null,
}) => {
  const countryMarket = useFuelStore((s) => s.countryMarket);
  const dietPreference = useFuelStore((s) => s.dietPreference);
  const addFoodItem = useFuelStore((s) => s.addFoodItem);
  const setCountryMarket = useFuelStore((s) => s.setCountryMarket);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItemRecord | null>(null);
  const [isDialModalOpen, setIsDialModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [browse, setBrowse] = useState<Browse>(DEFAULT_BROWSE);
  /** Foods already on the phone, searched at once while the network answers. */
  const instantPoolRef = useRef<FoodItemRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setBrowse(DEFAULT_BROWSE);
      setSelectedFood(null);
      setIsDialModalOpen(false);
      setIsCountryModalOpen(false);
      setIsManualModalOpen(false);
    }
  }, [isOpen]);

  const typed = searchQuery.trim().length > 0;
  const { foods, setFoods, isLoading } = useFoodSearch(
    isOpen,
    searchQuery,
    countryMarket,
    instantPoolRef,
  );
  const {
    popularCategory,
    popularList,
    popularError,
    retryPopular,
    livePlain,
    liveLocal,
    categoryFoods,
    shownCount,
    showMore,
  } = useFoodBrowse(isOpen, browse, countryMarket, instantPoolRef);

  const currentCountry = useMemo(
    () =>
      COUNTRIES.find((c) => c.code === countryMarket) || {
        flag: '🇦🇺',
        name: 'Australia',
        code: 'AU',
      },
    [countryMarket],
  );

  const showingPopular = !typed && popularCategory !== null;
  const visibleFoods = useMemo(
    () =>
      (showingPopular ? categoryFoods : foods).filter((f) => foodMatchesDiet(f, dietPreference)),
    [showingPopular, categoryFoods, foods, dietPreference],
  );
  const shownFoods = showingPopular ? visibleFoods.slice(0, shownCount) : visibleFoods;
  const stillLoading = showingPopular && (livePlain === null || liveLocal === null);
  const listLoading = showingPopular
    ? popularList === null && !popularError && livePlain === null
    : isLoading;
  const browseLabel =
    browse === 'mine'
      ? 'My foods'
      : `${FOOD_BROWSE_CATEGORIES.find((c) => c.id === browse)?.label ?? 'Foods'} · ${
          visibleFoods.length
        }${stillLoading ? '+' : ''} foods`;

  if (!isOpen) return null;

  const handleOpenDial = (food: FoodItemRecord) => {
    tactileEngine.triggerSelectionBuzz();
    setSelectedFood(food);
    setIsDialModalOpen(true);
  };

  const handleManualFoodSaved = (food: FoodItemRecord, logToMeal: boolean) => {
    setFoods((prev) => [food, ...prev.filter((f) => f.id !== food.id)]);
    if (logToMeal) {
      handleCommitFoodWithGrams(food, food.serving_grams || 100);
    } else {
      showToast?.(`Saved "${food.name}" to your foods`);
    }
  };

  const handleCommitFoodWithGrams = (food: FoodItemRecord, grams: number) => {
    const baseServingG = food.serving_grams && food.serving_grams > 0 ? food.serving_grams : 100;
    commitFood(food, grams / baseServingG, `${grams}g`);
  };

  const handleCommitFoodServings = (food: FoodItemRecord, servings: number) => {
    commitFood(food, servings, `${servings} × ${food.serving_size || 'serving'}`);
  };

  const commitFood = (food: FoodItemRecord, scale: number, portion: string) => {
    tactileEngine.playPRCelebration();
    const newItem: MealFoodItem = {
      id: `food-${food.id}-${Date.now()}`,
      name: food.name,
      portion,
      calories: Math.round(food.calories * scale),
      protein: Math.round(food.protein * scale * 10) / 10,
      carbs: Math.round(food.carbs * scale * 10) / 10,
      fats: Math.round(food.fats * scale * 10) / 10,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      logged: true,
    };

    addFoodItem(category, newItem);
    onAddFood?.(category, newItem);
    onClose();
  };

  const chooseBrowse = (next: Browse) => {
    tactileEngine.triggerSelectionBuzz();
    setSearchQuery('');
    setBrowse(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-150 select-none">
      <div className="o1-sheet-card bg-o1-sheet border border-white/[0.08] p-3.5 shadow-xl flex flex-col overflow-hidden space-y-2.5">
        <div className="flex items-center justify-between shrink-0 gap-2 pb-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-o1-crimson-wash/30 text-o1-crimson flex items-center justify-center shrink-0 border border-o1-crimson-deep/40">
              <Flame className="w-5 h-5 fill-o1-crimson/20 text-o1-crimson" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-o1-text leading-tight truncate">
                Add To {category}
              </h3>
              <p className="text-o1-label text-o1-muted font-sans flex items-center gap-1.5 truncate mt-0.5">
                <span className="truncate">{typed ? 'Live search' : browseLabel}</span>
                <span className="text-white/20">·</span>
                <span className="truncate">{dietPreference}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setIsCountryModalOpen(true);
              }}
              title="Choose your country"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-o1-surface border border-white/[0.08] text-xs tabular-nums font-bold text-o1-text hover:border-white/[0.14] transition-colors cursor-pointer active:scale-95"
            >
              <span>{currentCountry.flag}</span>
              <span>{currentCountry.code}</span>
              <ChevronDown className="w-3 h-3 text-o1-muted" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close food modal"
              className="w-8 h-8 rounded-full bg-o1-surface hover:bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-o1-text transition-all cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-o1-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any food, brand or restaurant"
              className="w-full h-11 pl-10 pr-10 rounded-2xl bg-o1-surface border border-white/[0.08] text-xs font-sans text-o1-text placeholder-o1-muted focus:outline-none focus:border-o1-crimson"
            />
            {listLoading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-o1-crimson" />
            )}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Food categories"
          className="flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 -mx-0.5 px-0.5"
        >
          {[...FOOD_BROWSE_CATEGORIES, { id: 'mine' as const, label: 'My foods' }].map((chip) => {
            const active = !typed && browse === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => chooseBrowse(chip.id)}
                className={`shrink-0 h-8 px-3 rounded-full border text-xs font-sans font-semibold transition-colors cursor-pointer active:scale-95 ${
                  active
                    ? 'bg-o1-crimson border-o1-crimson text-o1-text'
                    : 'bg-o1-surface border-white/[0.08] text-o1-muted hover:text-o1-text'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-y-auto space-y-2 pr-1 flex-1">
          {(listLoading || stillLoading) && visibleFoods.length === 0 ? (
            <div className="py-16 text-center text-o1-muted font-sans text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-o1-crimson" />
              <span>{showingPopular ? 'Loading foods…' : 'Searching…'}</span>
            </div>
          ) : showingPopular && popularError && visibleFoods.length === 0 && !stillLoading ? (
            <div
              role="alert"
              className="py-12 px-4 text-center text-o1-muted font-sans text-xs flex flex-col items-center justify-center gap-3"
            >
              <WifiOff className="w-6 h-6 text-o1-muted/50" />
              <span>{popularError}</span>
              <button
                type="button"
                onClick={retryPopular}
                className="px-4 py-2 rounded-xl bg-o1-surface border border-white/[0.08] text-o1-text font-bold cursor-pointer active:scale-95"
              >
                Try again
              </button>
            </div>
          ) : visibleFoods.length === 0 ? (
            <div className="py-16 px-4 text-center text-o1-muted font-sans text-xs flex flex-col items-center justify-center gap-2">
              <Database className="w-6 h-6 text-o1-muted/50" />
              {typed ? (
                <span>
                  No {dietPreference} match for &quot;{searchQuery.trim()}&quot;. Try another name
                  or add your own food.
                </span>
              ) : showingPopular ? (
                <span>No {dietPreference} foods in this category. Search for one instead.</span>
              ) : (
                <>
                  <span>You have not saved any foods yet.</span>
                  <span className="text-o1-label">
                    Use Custom Food Item below to save one with your own numbers.
                  </span>
                </>
              )}
            </div>
          ) : (
            shownFoods.map((food) => (
              <FoodResultRow key={food.id} food={food} onSelect={handleOpenDial} />
            ))
          )}

          {showingPopular && visibleFoods.length > 0 ? (
            <FoodListFooter
              total={visibleFoods.length}
              shownCount={shownCount}
              stillLoading={stillLoading}
              isFastFood={browse === 'fastfood'}
              hasPackagedProducts={(liveLocal?.items.length ?? 0) > 0}
              onShowMore={showMore}
            />
          ) : null}
        </div>

        <div className="pt-2 border-t border-white/[0.05] flex items-center shrink-0">
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
        </div>
      </div>

      <FoodPortionDialModal
        isOpen={isDialModalOpen}
        foodName={selectedFood ? selectedFood.name : 'Custom Portion'}
        food={selectedFood}
        budget={budget}
        onSetGrams={(g) => {
          if (selectedFood) handleCommitFoodWithGrams(selectedFood, g);
        }}
        onSetServings={(n) => {
          if (selectedFood) handleCommitFoodServings(selectedFood, n);
        }}
        onClose={() => setIsDialModalOpen(false)}
      />

      <ClientCountryMarketModal
        isOpen={isCountryModalOpen}
        selectedCode={countryMarket}
        onSelect={setCountryMarket}
        onClose={() => setIsCountryModalOpen(false)}
      />

      <ManualFoodEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        currentMealCategory={category}
        countryMarket={countryMarket}
        onFoodSaved={handleManualFoodSaved}
      />
    </div>
  );
};

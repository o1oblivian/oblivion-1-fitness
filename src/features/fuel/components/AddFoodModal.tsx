import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  Plus,
  Flame,
  ChevronDown,
  Loader2,
  Database,
  Utensils,
  WifiOff,
} from 'lucide-react';
import { MealFoodItem } from '../../../types';
import { useFuelStore } from '../store/useFuelStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { FoodPortionDialModal } from './FoodPortionDialModal';
import { ClientCountryMarketModal, COUNTRIES } from './ClientCountryMarketModal';
import { searchFoods, FoodItemRecord } from '../../../services/foodCatalogService';
import { ManualFoodEntryModal } from './ManualFoodEntryModal';
import { foodMatchesDiet } from '../utils/dietFoodFilter';
import type { MacroBudget } from '../data/mealBudget';
import { FOOD_BROWSE_CATEGORIES, type FoodBrowseId } from '../../../../shared/foodBrowse';
import { fetchPopularFoods } from '../../../services/popularFoodsService';

interface AddFoodModalProps {
  /** Slot label from the fuel screen ("Snacks", "Supplements & Electrolytes"); the store maps it to a slot. */
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onAddFood?: (category: string, item: MealFoodItem) => void;
  showToast?: (msg: string) => void;
  budget?: MacroBudget | null;
}

/** Wait this long after the last keystroke before searching, so one search is sent per word typed. */
const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_LIMIT = 60;

/** What the list shows while nothing is typed: the person's own saved foods, or one popular category. */
type Browse = 'mine' | FoodBrowseId;
const DEFAULT_BROWSE: Browse = 'protein';

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
  const [foods, setFoods] = useState<FoodItemRecord[]>([]);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItemRecord | null>(null);
  const [isDialModalOpen, setIsDialModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [browse, setBrowse] = useState<Browse>(DEFAULT_BROWSE);
  const [popular, setPopular] = useState<FoodItemRecord[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [popularAttempt, setPopularAttempt] = useState(0);

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

  useEffect(() => {
    if (!isOpen) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const typed = searchQuery.trim().length > 0;
    setIsLoading(typed);

    const timer = setTimeout(
      async () => {
        try {
          const result = await searchFoods({
            query: searchQuery,
            country: countryMarket || 'AU',
            limit: SEARCH_LIMIT,
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          setFoods(result.items);
          setUnavailable(result.unavailable);
        } catch {
          if (controller.signal.aborted) return;
          setFoods([]);
          setUnavailable(['Search could not be reached']);
        } finally {
          if (!controller.signal.aborted) setIsLoading(false);
        }
      },
      typed ? SEARCH_DEBOUNCE_MS : 0,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, searchQuery, countryMarket]);

  const typed = searchQuery.trim().length > 0;
  const popularCategory = browse === 'mine' ? null : browse;

  useEffect(() => {
    if (!isOpen || typed || !popularCategory) return;
    const controller = new AbortController();
    setPopular([]);
    setPopularError(null);
    setPopularLoading(true);
    fetchPopularFoods(popularCategory, countryMarket || 'AU', controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setPopular(items);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setPopularError(err instanceof Error ? err.message : 'Popular foods could not be loaded.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setPopularLoading(false);
      });
    return () => controller.abort();
  }, [isOpen, typed, popularCategory, countryMarket, popularAttempt]);

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
    () => (showingPopular ? popular : foods).filter((f) => foodMatchesDiet(f, dietPreference)),
    [showingPopular, popular, foods, dietPreference],
  );
  const listLoading = showingPopular ? popularLoading : isLoading;
  const browseLabel =
    browse === 'mine'
      ? 'My foods'
      : (FOOD_BROWSE_CATEGORIES.find((c) => c.id === browse)?.label ?? 'Popular');

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
            <div className="w-10 h-10 rounded-2xl bg-red-950/30 text-o1-crimson flex items-center justify-center shrink-0 border border-red-900/40">
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
          {[{ id: 'mine' as const, label: 'My foods' }, ...FOOD_BROWSE_CATEGORIES].map((chip) => {
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

        {unavailable.length > 0 && typed ? (
          <p
            role="status"
            className="shrink-0 flex items-center gap-2 rounded-xl bg-o1-warn-wash/60 px-3 py-2 text-o1-label text-o1-warn-ink"
          >
            <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span>Not answering: {unavailable.join(', ')}. Results may be incomplete.</span>
          </p>
        ) : null}

        <div className="overflow-y-auto space-y-2 pr-1 flex-1">
          {listLoading && visibleFoods.length === 0 ? (
            <div className="py-16 text-center text-o1-muted font-sans text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-o1-crimson" />
              <span>
                {showingPopular ? `Loading popular ${browseLabel.toLowerCase()}…` : 'Searching…'}
              </span>
            </div>
          ) : showingPopular && popularError ? (
            <div
              role="alert"
              className="py-12 px-4 text-center text-o1-muted font-sans text-xs flex flex-col items-center justify-center gap-3"
            >
              <WifiOff className="w-6 h-6 text-o1-muted/50" />
              <span>{popularError}</span>
              <button
                type="button"
                onClick={() => setPopularAttempt((count) => count + 1)}
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
            visibleFoods.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => handleOpenDial(food)}
                className="w-full text-left p-3 rounded-2xl bg-o1-surface border border-white/[0.08] flex items-center justify-between gap-3 transition-colors cursor-pointer active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-2xl bg-o1-sheet border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Utensils className="w-4 h-4 text-o1-muted" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-o1-text truncate">
                        {food.name}
                      </span>
                      {(food.is_custom || food.source === 'custom') && (
                        <span className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-o1-text text-o1-label tabular-nums font-bold shrink-0 border border-white/[0.08]">
                          My Food
                        </span>
                      )}
                      {food.source === 'openfoodfacts' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-transparent text-sky-600 text-o1-label tabular-nums font-bold shrink-0 border border-sky-600/40">
                          Live
                        </span>
                      )}
                    </div>
                    <span className="text-o1-label text-o1-muted font-sans truncate shrink-0 max-w-[110px]">
                      {food.brand}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-1">
                    <div className="flex items-center gap-1.5 text-o1-muted">
                      <Flame className="w-3 h-3 text-o1-crimson shrink-0" />
                      <span className="font-semibold text-o1-text">{food.calories} kcal</span>
                      <span className="text-white/20">·</span>
                      <span>
                        {food.serving_size ||
                          (food.serving_grams ? `${food.serving_grams}g` : '1 serving')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-o1-label tabular-nums">
                      <span className="text-o1-crimson font-bold">{food.protein}p</span>
                      <span className="text-amber-500 font-bold">{food.carbs}c</span>
                      <span className="text-emerald-500 font-bold">{food.fats}f</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

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
            className="px-6 py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-o1-text font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            Done
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

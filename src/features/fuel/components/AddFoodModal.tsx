import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
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
import { filterByFoodQuery } from '../utils/foodSearchMatch';
import { filterCustomFoods } from '../../../services/customFoodDatabase';
import type { MacroBudget } from '../data/mealBudget';
import { FOOD_BROWSE_CATEGORIES, type FoodBrowseId } from '../../../../shared/foodBrowse';
import { loadPopularFoods, type PopularList } from '../../../services/popularFoodsService';
import { browseFoods, mergeFoods, type BrowseAnswer } from '../../../services/browseFoodsService';

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
const SEARCH_DEBOUNCE_MS = 150;
/** Waits before a category part that did not answer is asked again in the background. */
const RETRY_AFTER_MS = [8_000, 20_000, 45_000, 90_000, 180_000];
const SEARCH_LIMIT = 60;
/** A category list shows this many foods, and this many more each time "Show more" is tapped. */
const PAGE_SIZE = 100;
/** Packaged products from the country's own shelves that are listed ahead of the plain foods. */
const LOCAL_FIRST = 30;

/** What the list shows while nothing is typed: one category of the country's most popular foods, or the person's own saved foods. */
type Browse = 'mine' | FoodBrowseId;
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
  const [foods, setFoods] = useState<FoodItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItemRecord | null>(null);
  const [isDialModalOpen, setIsDialModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [browse, setBrowse] = useState<Browse>(DEFAULT_BROWSE);
  const [popularList, setPopularList] = useState<PopularList | null>(null);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [popularAttempt, setPopularAttempt] = useState(0);
  const [livePlain, setLivePlain] = useState<BrowseAnswer | null>(null);
  const [liveLocal, setLiveLocal] = useState<BrowseAnswer | null>(null);
  const [shownCount, setShownCount] = useState(PAGE_SIZE);
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

  useEffect(() => {
    if (!isOpen) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const typed = searchQuery.trim().length > 0;
    setIsLoading(typed);
    // Matches from the saved foods and the lists already loaded show on the keystroke itself.
    const instant = typed
      ? mergeFoods(
          filterCustomFoods(undefined, searchQuery.trim()),
          filterByFoodQuery(instantPoolRef.current, searchQuery),
        ).slice(0, SEARCH_LIMIT)
      : [];
    if (typed) setFoods(instant);

    const timer = setTimeout(
      async () => {
        try {
          const result = await searchFoods({
            query: searchQuery,
            country: countryMarket || 'AU',
            limit: SEARCH_LIMIT,
            signal: controller.signal,
            onPartial: (partial) => {
              if (controller.signal.aborted || partial.items.length === 0) return;
              setFoods(partial.items);
              setIsLoading(false);
            },
          });
          if (controller.signal.aborted) return;
          setFoods(result.items.length > 0 ? result.items : instant);
        } catch {
          if (controller.signal.aborted) return;
          setFoods(instant);
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

  // The list is built into the app. It is read as soon as the country is known, so opening the sheet shows it at once.
  useEffect(() => {
    let cancelled = false;
    setPopularError(null);
    loadPopularFoods(countryMarket || 'AU')
      .then((list) => {
        if (!cancelled) setPopularList(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPopularList(null);
        setPopularError(err instanceof Error ? err.message : 'Popular foods could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [countryMarket, popularAttempt]);

  // The whole category is read live: plain foods at once, the country's packaged products when they arrive.
  // A part that does not answer is asked again quietly in the background, and the list fills in when it does.
  useEffect(() => {
    if (!isOpen || popularCategory === null) return;
    setLivePlain(null);
    setLiveLocal(null);
    setShownCount(PAGE_SIZE);
    const controller = new AbortController();
    const retries: ReturnType<typeof setTimeout>[] = [];
    const country = countryMarket || 'AU';
    const read = (
      part: 'plain' | 'local',
      set: Dispatch<SetStateAction<BrowseAnswer | null>>,
      attempt: number,
    ) => {
      browseFoods({ category: popularCategory, country, part, signal: controller.signal })
        .then((answer) => {
          if (controller.signal.aborted) return;
          // A refresh that comes back empty never replaces foods already on screen.
          set((shown) => (shown !== null && answer.items.length === 0 ? shown : answer));
          if (answer.failed.length > 0) {
            const wait = RETRY_AFTER_MS[Math.min(attempt, RETRY_AFTER_MS.length - 1)];
            retries.push(setTimeout(() => read(part, set, attempt + 1), wait));
          }
        })
        .catch(() => undefined);
    };
    read('plain', setLivePlain, 0);
    read('local', setLiveLocal, 0);
    return () => {
      controller.abort();
      retries.forEach(clearTimeout);
    };
  }, [isOpen, popularCategory, countryMarket]);

  // Everything already loaded can be searched without waiting for the network.
  useEffect(() => {
    instantPoolRef.current = mergeFoods(
      popularList?.foods ?? [],
      livePlain?.items ?? [],
      liveLocal?.items ?? [],
    );
  }, [popularList, livePlain, liveLocal]);

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
  const popularFoods = useMemo(() => {
    if (!popularList) return [];
    return popularList.foods.filter((f) => f.browse === browse);
  }, [popularList, browse]);
  // The country's staples lead, then its best-scanned packaged products, then every plain food in the category.
  const categoryFoods = useMemo(() => {
    const local = liveLocal?.items ?? [];
    return mergeFoods(
      popularFoods,
      local.slice(0, LOCAL_FIRST),
      livePlain?.items ?? [],
      local.slice(LOCAL_FIRST),
    );
  }, [popularFoods, livePlain, liveLocal]);
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
            shownFoods.map((food) => (
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

          {showingPopular && visibleFoods.length > 0 ? (
            <>
              {visibleFoods.length > shownCount ? (
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setShownCount((count) => count + PAGE_SIZE);
                  }}
                  className="w-full h-11 rounded-2xl border border-white/[0.08] bg-o1-surface text-xs font-sans font-semibold text-o1-text cursor-pointer active:scale-[0.99]"
                >
                  Show {Math.min(PAGE_SIZE, visibleFoods.length - shownCount)} more
                  <span className="text-o1-muted"> · {visibleFoods.length - shownCount} left</span>
                </button>
              ) : null}
              {stillLoading ? (
                <p className="flex items-center justify-center gap-2 py-3 text-o1-label text-o1-muted">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  Loading more foods…
                </p>
              ) : (
                <p className="py-3 text-center text-o1-label text-o1-muted">
                  {browse === 'fastfood'
                    ? 'Chain menu values are from US menus, via USDA FoodData Central'
                    : 'Plain foods from USDA FoodData Central'}
                  {(liveLocal?.items.length ?? 0) > 0
                    ? ' · packaged products from Open Food Facts'
                    : ''}
                </p>
              )}
            </>
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

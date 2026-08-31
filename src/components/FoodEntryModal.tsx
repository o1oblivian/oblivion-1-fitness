import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Scale, Search, UtensilsCrossed, Plus, Globe, Check, ChevronDown } from 'lucide-react';
import { FoodItem } from '../types';
import { getSelectedCountry, setSelectedCountry, POPULAR_COUNTRIES, CountryOption, subscribeCountryChange } from '../utils/geolocation';
import { FoodCategoryIcon } from './FoodCategoryIcon';
import { matchFoodSearch } from '../utils/foodSearch';

interface FoodEntryModalProps {
  isOpen: boolean;
  mealName: string;
  foodDB: Record<string, FoodItem[]>;
  onSelectFood: (food: FoodItem) => void;
  onOpenCustomModal: (query: string) => void;
  onClose: () => void;
  onOpenDial?: (type: string, maxVal: number, currentVal: number, onConfirm: (val: number) => void) => void;
}

interface OnlineFoodResult extends FoodItem {
  isOnline?: boolean;
  category: string;
  brand?: string;
  country?: string;
  defaultServingGrams?: number;
  servingUnit?: string;
}

export const FoodEntryModal: React.FC<FoodEntryModalProps> = ({
  isOpen,
  mealName,
  foodDB,
  onSelectFood,
  onOpenCustomModal,
  onClose,
  onOpenDial,
}) => {
  const [currentTab, setCurrentTab] = useState<string>('Protein');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCountry, setActiveCountry] = useState<string>(() => getSelectedCountry());
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [onlineResults, setOnlineResults] = useState<OnlineFoodResult[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync state whenever modal opens or country updates globally
  useEffect(() => {
    if (isOpen) {
      setActiveCountry(getSelectedCountry());
    }
  }, [isOpen]);

  useEffect(() => {
    return subscribeCountryChange((code) => {
      setActiveCountry(code);
    });
  }, []);

  const handleCountryChange = (code: string) => {
    setActiveCountry(code);
    setSelectedCountry(code);
    setIsCountryDropdownOpen(false);
    setCountrySearch('');
  };

  // Fetch live results from Open Food Facts via edge function with country preference
  const fetchOnlineResults = useCallback(async (query: string, country: string) => {
    if (query.trim().length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearchingOnline(true);

    try {
      let data: any = null;

      // 1. Try local server API
      try {
        const response = await fetch(`/api/food-scan?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          data = await response.json();
        }
      } catch {
        // Continue
      }

      // 2. Try Supabase Edge Function if available
      if (!data?.success && import.meta.env.VITE_SUPABASE_URL) {
        try {
          const countryParam = country === 'GLOBAL' ? '' : country;
          const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/food-scan?q=${encodeURIComponent(query.trim())}&country=${encodeURIComponent(countryParam)}`;
          const response = await fetch(functionUrl, {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          if (response.ok) {
            data = await response.json();
          }
        } catch {
          // Continue
        }
      }

      // 3. Fallback direct to OpenFoodFacts
      if (!data?.success) {
        try {
          const offRes = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page_size=20`, {
            headers: { 'User-Agent': 'O1FC-Fitness-App/1.0 (o1oblivianfitness@gmail.com)' },
            signal: controller.signal,
          });
          if (offRes.ok) {
            const raw = await offRes.json();
            if (raw.products && Array.isArray(raw.products)) {
              data = {
                success: true,
                results: raw.products.map((p: any) => {
                  const n = p.nutriments || {};
                  const servingGrams = parseFloat(p.serving_quantity) || 100;
                  const ratio = servingGrams / 100;
                  const prot100 = Number(n.proteins_100g || n.proteins || 0);
                  const carb100 = Number(n.carbohydrates_100g || n.carbohydrates || 0);
                  const fat100 = Number(n.fat_100g || n.fat || 0);
                  const cal100 = Number(n['energy-kcal_100g'] || n['energy-kcal'] || (prot100 * 4 + carb100 * 4 + fat100 * 9));
                  return {
                    name: p.product_name || p.product_name_en,
                    brand: p.brands || '',
                    category: 'General',
                    p: Math.round(prot100 * ratio * 10) / 10,
                    c: Math.round(carb100 * ratio * 10) / 10,
                    f: Math.round(fat100 * ratio * 10) / 10,
                    cals: Math.round(cal100 * ratio),
                    serving: p.serving_size || `${servingGrams}g`,
                  };
                }),
              };
            }
          }
        } catch {
          // Ignore
        }
      }

      if (data && data.success && Array.isArray(data.results)) {
        const mapped: OnlineFoodResult[] = data.results
          .filter((r: any) => r.name && r.cals >= 0)
          .slice(0, 25)
          .map((r: any) => ({
            icon: '',
            name: r.name,
            brand: r.brand,
            category: r.category || 'Carbs',
            country: r.country || country,
            p: r.p || 0,
            c: r.c || 0,
            f: r.f || 0,
            defaultServingGrams: r.serving ? parseFloat(r.serving) || 100 : 100,
            servingUnit: 'serving',
            isOnline: true,
          }));
        setOnlineResults(mapped);
      } else {
        setOnlineResults([]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setOnlineResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsSearchingOnline(false);
      }
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchOnlineResults(searchQuery, activeCountry);
      }, 400);
    } else {
      setOnlineResults([]);
      setIsSearchingOnline(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, activeCountry, fetchOnlineResults]);

  if (!isOpen) return null;

  // Primary Food OS Categories including Fast Food and Drinks
  const categories = ['Protein', 'Carbs', 'Fats', 'Fast Food', 'Drinks'];

  const getTabItems = (tab: string): FoodItem[] => {
    if (tab === 'Fast Food') {
      return foodDB['Fast Food'] || foodDB['Cheat'] || [];
    }
    if (tab === 'Drinks') {
      return foodDB['Drinks'] || foodDB['Drink'] || [];
    }
    return foodDB[tab] || [];
  };

  const currentCountryObj = POPULAR_COUNTRIES.find((c) => c.code === activeCountry) || {
    code: activeCountry,
    name: activeCountry,
    flag: '🌐',
  };

  const filteredCountries = countrySearch.trim()
    ? POPULAR_COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
          (c.regionName && c.regionName.toLowerCase().includes(countrySearch.toLowerCase()))
      )
    : POPULAR_COUNTRIES;

  const q = searchQuery.toLowerCase().trim();
  let filtered: (FoodItem & { isOnline?: boolean; category: string; searchScore?: number })[] = [];

  if (q.length > 0) {
    // Search across all food DB categories with Brand, Token & Alias intelligence
    (Object.entries(foodDB) as [string, FoodItem[]][]).forEach(([catKey, items]) => {
      const normalizedCat =
        catKey === 'Cheat' ? 'Fast Food' :
        catKey === 'Drink' ? 'Drinks' : catKey;

      if (Array.isArray(items)) {
        items.forEach((item) => {
          const { matches, score } = matchFoodSearch(item, q, normalizedCat, activeCountry);
          if (matches) {
            // Boost score if it matches currently selected tab
            const tabBonus = (currentTab === normalizedCat || (currentTab === 'Fast Food' && (normalizedCat === 'Fast Food' || normalizedCat === 'Cheat'))) ? 50 : 0;
            filtered.push({
              ...item,
              category: normalizedCat,
              searchScore: score + tabBonus,
            });
          }
        });
      }
    });

    // Add online results
    onlineResults.forEach((item) => {
      let itemCategory = item.category || 'Carbs';
      if (itemCategory === 'Drink') itemCategory = 'Drinks';
      if (itemCategory === 'Cheat') itemCategory = 'Fast Food';

      const { matches, score } = matchFoodSearch(item, q, itemCategory, activeCountry);
      if (matches || item.name.toLowerCase().includes(q)) {
        filtered.push({
          ...item,
          category: itemCategory,
          isOnline: true,
          searchScore: (score || 50) - 10,
        });
      }
    });

    // Remove duplicates
    const seen = new Set<string>();
    filtered = filtered.filter((f) => {
      const key = `${(f.brand || '').toLowerCase()}_${(f.name || '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by search score descending, then alphabetical
    filtered.sort((a, b) => {
      const scoreDiff = (b.searchScore || 0) - (a.searchScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
      if (a.isOnline && !b.isOnline) return 1;
      if (!a.isOnline && b.isOnline) return -1;
      return a.name.localeCompare(b.name);
    });
  } else {
    const items = getTabItems(currentTab);
    const seen = new Set<string>();
    const uniqueItems: FoodItem[] = [];
    items.forEach((item) => {
      const key = `${(item.brand || '').toLowerCase()}_${(item.name || '').toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      }
    });

    filtered = uniqueItems
      .map((item) => ({ ...item, category: currentTab }))
      .sort((a, b) => {
        if (activeCountry !== 'GLOBAL') {
          const aCountryMatch = (a.country === activeCountry) || (a.brand && a.brand.toLowerCase().includes(activeCountry.toLowerCase()));
          const bCountryMatch = (b.country === activeCountry) || (b.brand && b.brand.toLowerCase().includes(activeCountry.toLowerCase()));
          if (aCountryMatch && !bCountryMatch) return -1;
          if (!aCountryMatch && bCountryMatch) return 1;
        }
        return a.name.localeCompare(b.name);
      });
  }

  return (
    <div 
      className="fixed inset-0 z-[150] bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white rounded-t-[1.75rem] sm:rounded-3xl shadow-2xl border-t sm:border border-zinc-200/80/90 dark:border-zinc-800/80 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Sheet Bar */}
        <div className="pt-2.5 pb-2 px-4 flex flex-col items-center border-b border-zinc-200/80/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
          <div className="w-9 h-1.5 rounded-full bg-stone-300 dark:bg-zinc-700/80 mb-2 sm:hidden" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200/70 dark:border-red-850 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <UtensilsCrossed className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] capitalize text-zinc-900 dark:text-white tracking-tight leading-tight">
                  Add to {mealName}
                </h3>
                <p className="text-[11px] text-stone-400 dark:text-zinc-400 font-sans leading-none mt-0.5">
                  Fuel OS Nutritional Intelligence
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Country Selector Capsule */}
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(true)}
                className="h-8 px-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer text-[12px] font-semibold flex items-center gap-1.5 active:scale-95 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-zinc-800/70"
                title="Filter Brands by Country"
              >
                <span className="text-[13px] leading-none">{currentCountryObj.flag}</span>
                <span className="font-mono text-[11px] font-bold">{currentCountryObj.code}</span>
                <ChevronDown className="w-3 h-3 text-stone-400 dark:text-zinc-500" />
              </button>

              {onOpenDial && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDial('Food Scale (g)', 1000, 100, (grams) => {
                      if (grams <= 0) return;
                      onSelectFood({
                        icon: '',
                        name: `Weighed Food Portion (${grams}g)`,
                        p: Math.round(grams * 0.1),
                        c: Math.round(grams * 0.15),
                        f: Math.round(grams * 0.05),
                        defaultServingGrams: grams,
                      });
                    });
                  }}
                  className="h-8 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer text-[12px] font-mono font-medium flex items-center gap-1.5 active:scale-95"
                  title="Scale Dial"
                >
                  <Scale className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  <span>Scale</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="btn-nude-close"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1">
          {/* Apple iOS Segmented Capsule Bar */}
          <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-900/90 p-1 rounded-xl border border-zinc-200/80/60 dark:border-zinc-800/80 overflow-x-auto no-scrollbar">
            {categories.map((tab) => {
              const isActive = currentTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCurrentTab(tab)}
                  className={`flex-1 h-8 px-3 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer whitespace-nowrap flex items-center justify-center ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-stone-950 dark:text-white shadow-xs font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Search Input with Country & Brand Intelligence */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search foods, brands (e.g. McSpicy, GYG, Subway, Zinger)...`}
              className="w-full h-8 bg-white dark:bg-zinc-900/90 border border-zinc-200/80/80 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 text-xs rounded-lg pl-9 pr-8 focus:outline-none focus:border-stone-400 dark:focus:border-zinc-600 shadow-2xs font-medium"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-stone-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center text-[10px] cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Online Searching Notice */}
          {isSearchingOnline && q.length >= 2 && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-red-600 rounded-full animate-spin" />
              <span>Scanning {currentCountryObj.name} food & brand database...</span>
            </div>
          )}

          {/* Food List Container */}
          <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80/80 dark:border-zinc-800/80 rounded-2xl divide-y divide-stone-100 dark:divide-zinc-800/70 overflow-hidden shadow-2xs">
            {filtered.map((food, idx) => {
              const calculatedCals = Math.round(food.p * 4 + food.c * 4 + food.f * 9);

              return (
                <div
                  key={idx}
                  onClick={() => onSelectFood(food)}
                  className="p-3 hover:bg-zinc-50/90 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer flex items-center gap-3 group"
                >
                  {/* Apple Pro Squircle Category Icon */}
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center border border-zinc-200/80/70 dark:border-zinc-750/70 shrink-0 group-hover:scale-105 transition-transform">
                    <FoodCategoryIcon category={food.category} name={food.name} className="w-4.5 h-4.5" />
                  </div>
                  
                  {/* 2x2 Clean Stacked Row Layout */}
                  <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
                    {/* Row 1: Food Item Name (Left) & Brand Name (Right) */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-zinc-900 dark:text-white text-[13.5px] sm:text-[14px] leading-snug truncate">
                        {food.name}
                      </span>
                      {food.brand && (
                        <span className="text-[11px] font-medium text-stone-500 dark:text-zinc-400 shrink-0 max-w-[130px] sm:max-w-[180px] truncate">
                          {food.brand}
                        </span>
                      )}
                    </div>

                    {/* Row 2: Calories & Grams (Left) & Macros P/C/F (Right) */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Calories & Grams Weight */}
                      <div className="flex items-center gap-1.5 font-mono text-[11.5px] leading-none">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{calculatedCals} kcal</span>
                        <span className="text-stone-300 dark:text-zinc-600 font-sans">•</span>
                        <span className="font-semibold text-zinc-600 dark:text-zinc-300 font-mono">
                          {food.defaultServingGrams ? `${food.defaultServingGrams}g` : '100g'}
                        </span>
                      </div>

                      {/* Macronutrients: e.g. 30p / 22c / 10f */}
                      <div className="text-right text-[11.5px] font-mono font-bold flex items-center gap-1.5 shrink-0">
                        <span className="text-red-500 dark:text-red-400 font-bold">{food.p}<span className="text-[9px] font-sans font-bold text-stone-400 dark:text-zinc-500 ml-0.5">p</span></span>
                        <span className="text-stone-300 dark:text-zinc-600 font-normal">/</span>
                        <span className="text-sky-500 dark:text-sky-400 font-bold">{food.c}<span className="text-[9px] font-sans font-bold text-stone-400 dark:text-zinc-500 ml-0.5">c</span></span>
                        <span className="text-stone-300 dark:text-zinc-600 font-normal">/</span>
                        <span className="text-amber-500 dark:text-amber-400 font-bold">{food.f}<span className="text-[9px] font-sans font-bold text-stone-400 dark:text-zinc-500 ml-0.5">f</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && !isSearchingOnline && (
              <div className="text-center py-8 px-4 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {searchQuery.trim().length > 0
                      ? `No foods found for "${searchQuery}"`
                      : `No items in ${currentTab}`}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Search by brand or food name, switch region, or add a custom item
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {searchQuery.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3.5 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 border border-zinc-200/80/80 dark:border-zinc-750 shadow-2xs"
                    >
                      <span>Clear Search</span>
                    </button>
                  )}
                  {activeCountry !== 'GLOBAL' && (
                    <button
                      type="button"
                      onClick={() => handleCountryChange('GLOBAL')}
                      className="text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Search Global DB</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenCustomModal(searchQuery)}
                    className="text-xs font-semibold bg-stone-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Custom Food</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Apple Pro Bottom Action Bar */}
        <div className="p-3.5 border-t border-zinc-200/80/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenCustomModal(searchQuery)}
            className="h-8 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer px-3 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Custom Food Item</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-5 bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold rounded-lg text-xs transition-all active:scale-95 cursor-pointer shadow-xs flex items-center justify-center"
          >
            Done
          </button>
        </div>
      </div>

      {/* Country Selection Overlay Modal */}
      {isCountryDropdownOpen && (
        <div 
          className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setIsCountryDropdownOpen(false);
          }}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                    Country Brand Database
                  </h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Regional supermarket & restaurant foods
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Country Search Bar */}
            <div className="p-2.5 bg-zinc-50/70 dark:bg-zinc-950/50 border-b border-zinc-200/80 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search country (e.g. Australia, USA, India)..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Country List */}
            <div className="p-2 overflow-y-auto space-y-1 flex-1">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c) => {
                  const isSelected = activeCountry === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountryChange(c.code)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold border border-red-200/80 dark:border-red-900/50'
                          : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg leading-none shrink-0">{c.flag}</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{c.name}</p>
                          {c.regionName && (
                            <p className="text-[10px] text-zinc-400 font-normal">{c.regionName}</p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-zinc-400 text-xs">
                  No matching countries found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodEntryModal;


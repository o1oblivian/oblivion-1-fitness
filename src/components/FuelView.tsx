import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Droplets, Minus, Utensils, Globe, ChevronDown, Check, Sparkles, MapPin, X, Leaf } from 'lucide-react';
import { DailyMeals, ExerciseLog, LoggedMealItem } from '../types';
import { AIMealSuggestPanel } from './fuel/AIMealSuggestPanel';
import { getSelectedCountry, setSelectedCountry, POPULAR_COUNTRIES, getCountryObj, getCountryTags, subscribeCountryChange } from '../utils/geolocation';
import { getSelectedDietary, setSelectedDietary, subscribeDietaryChange, getDietaryObj, DIETARY_OPTIONS, DietaryType } from '../utils/dietaryPreferences';
import { haptic } from '../utils/haptics';

import { FuelIntelligencePanel } from './fuel/FuelIntelligencePanel';
import { DailyFoodMealLogs } from './fuel/DailyFoodMealLogs';
import { SupplementsHub } from './fuel/SupplementsHub';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { getTodayCardioTotals, subscribeCardioUpdates } from '../utils/cardioStorage';
import { pedometer } from '../utils/pedometer';

interface FuelViewProps {
  dailyMeals: DailyMeals;
  activeLogs?: ExerciseLog[];
  onOpenAutoPilot: () => void;
  onOpenFoodModal: (meal: keyof DailyMeals) => void;
  onOpenScanModal: (meal: keyof DailyMeals) => void;
  onDeleteMealItem: (meal: keyof DailyMeals, id: string) => void;
  onClearAllMeals?: () => void;
  onAddDirectMealItem?: (meal: keyof DailyMeals, item: LoggedMealItem) => void;
  bmr: number;
  setBmr: (bmr: number) => void;
  goalCals: number;
  setGoalCals: (cals: number) => void;
  goalP: number;
  setGoalP: (p: number) => void;
  goalC: number;
  setGoalC: (c: number) => void;
  goalF: number;
  setGoalF: (f: number) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  currentUserEmail: string;
}

/* ---- Hydration helpers (same storage contract as the old full tracker) ---- */
const HYDRATION_KEY = (email: string) => `lumina_hydration_${email}`;
const TODAY_KEY = () => new Date().toISOString().slice(0, 10);

interface HydrationRecord { date: string; liters: number; }

export const FuelView: React.FC<FuelViewProps> = ({
  dailyMeals,
  activeLogs = [],
  onOpenAutoPilot,
  onOpenFoodModal,
  onOpenScanModal,
  onDeleteMealItem,
  onClearAllMeals,
  onAddDirectMealItem,
  bmr,
  setBmr,
  goalCals,
  setGoalCals,
  goalP,
  setGoalP,
  goalC,
  setGoalC,
  goalF,
  setGoalF,
  showToast,
  currentUserEmail,
}) => {
  // Client market location state
  const [activeCountry, setActiveCountry] = useState<string>(() => getSelectedCountry());
  const [showCountryModal, setShowCountryModal] = useState<boolean>(false);

  // Client dietary choice state & dropdown
  const [activeDiet, setActiveDiet] = useState<DietaryType>(() => getSelectedDietary());
  const [showDietDropdown, setShowDietDropdown] = useState<boolean>(false);

  // Synchronize immediately when country is switched from FoodEntryModal, Fuel OS header, or any other component
  useEffect(() => {
    return subscribeCountryChange((newCode) => {
      setActiveCountry(newCode);
    });
  }, []);

  // Synchronize immediately when dietary preference changes
  useEffect(() => {
    return subscribeDietaryChange((newDiet) => {
      setActiveDiet(newDiet);
    });
  }, []);

  // Live cardio and pedometer burn subscription
  const [cardioTotals, setCardioTotals] = useState(getTodayCardioTotals);
  useEffect(() => {
    return subscribeCardioUpdates(() => {
      setCardioTotals(getTodayCardioTotals());
    });
  }, []);

  const currentCountryObj = useMemo(() => getCountryObj(activeCountry), [activeCountry]);
  const regionalTags = useMemo(() => getCountryTags(activeCountry), [activeCountry]);
  const currentDietObj = useMemo(() => getDietaryObj(activeDiet), [activeDiet]);

  const handleSelectCountry = (code: string) => {
    haptic.tap();
    setActiveCountry(code);
    setSelectedCountry(code);
    setShowCountryModal(false);
    showToast(`Fuel OS market set to ${getCountryObj(code).name}`, 'success');
  };

  const handleSelectDiet = (diet: DietaryType) => {
    haptic.tap();
    setActiveDiet(diet);
    setSelectedDietary(diet);
    setShowDietDropdown(false);
    showToast(`Dietary preference set to ${getDietaryObj(diet).label}`, 'success');
  };

  /* ---- Macro totals ---- */
  let totalP = 0, totalC = 0, totalF = 0, totalIntakeCals = 0;
  (['breakfast', 'lunch', 'dinner', 'snack', 'drinks'] as const).forEach((m) => {
    (dailyMeals[m] || []).forEach((item) => {
      totalP += item.p;
      totalC += item.c;
      totalF += item.f;
      totalIntakeCals += item.cals;
    });
  });

  // Include resistance training + cardio machines + live pedometer step burn
  let trainingBurn = cardioTotals.totalCalories + (pedometer.getState()?.caloriesBurned || 0);
  activeLogs.forEach((log) => {
    log.sets.forEach((s) => {
      const w = parseInt(`${s.weight}`) || 0;
      const r = parseInt(`${s.reps}`) || 0;
      trainingBurn += Math.round(w * r * 0.04 + r * 1.2);
    });
  });

  const [trendUnit, setTrendUnit] = useState<'grams' | 'calories'>('grams');

  const recentFoods = useMemo(() => {
    const allItems: LoggedMealItem[] = [];
    (['breakfast', 'lunch', 'dinner', 'snack', 'drinks'] as const).forEach((m) => {
      (dailyMeals[m] || []).forEach((item) => allItems.push(item));
    });
    const seen = new Set<string>();
    const unique: LoggedMealItem[] = [];
    for (const item of allItems) {
      const key = item.name.toLowerCase();
      if (!seen.has(key)) { seen.add(key); unique.push(item); }
    }
    return unique.slice(-8).reverse();
  }, [dailyMeals]);

  /* ---- Compact hydration state ---- */
  const TARGET_L = 3.0;
  const [liters, setLiters] = useState(0);

  const loadHydration = useCallback(() => {
    try {
      const raw = localStorage.getItem(HYDRATION_KEY(currentUserEmail));
      if (raw) {
        const records: HydrationRecord[] = JSON.parse(raw);
        const today = records.find((r) => r.date === TODAY_KEY());
        if (today) return today.liters;
      }
    } catch {}
    return 0;
  }, [currentUserEmail]);

  const syncHydrationFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await supabase
        .from('daily_macros')
        .select('hydration')
        .eq('user_email', currentUserEmail)
        .eq('record_date', TODAY_KEY())
        .maybeSingle();
      if (data?.hydration != null) setLiters(Number(data.hydration));
    } catch {}
  }, [currentUserEmail]);

  useEffect(() => {
    setLiters(loadHydration());
    syncHydrationFromSupabase();
  }, [loadHydration, syncHydrationFromSupabase]);

  const saveHydration = (newLiters: number) => {
    const clamped = Math.max(0, Math.round(newLiters * 10) / 10);
    setLiters(clamped);
    haptic.tap();
    try {
      const raw = localStorage.getItem(HYDRATION_KEY(currentUserEmail));
      let records: HydrationRecord[] = raw ? JSON.parse(raw) : [];
      const idx = records.findIndex((r) => r.date === TODAY_KEY());
      if (idx >= 0) records[idx].liters = clamped;
      else records.push({ date: TODAY_KEY(), liters: clamped });
      records = records.slice(-30);
      localStorage.setItem(HYDRATION_KEY(currentUserEmail), JSON.stringify(records));
    } catch {}

    if (isSupabaseConfigured()) {
      supabase
        .from('daily_macros')
        .upsert(
          { user_email: currentUserEmail, record_date: TODAY_KEY(), hydration: clamped, hydration_target: TARGET_L },
          { onConflict: 'user_email,record_date' }
        )
        .then(() => {});
    }

    if (clamped >= TARGET_L && liters < TARGET_L) {
      haptic.pulse();
      showToast(`Hydration goal reached! ${clamped}L`, 'success');
    }
  };

  const hydrationPct = Math.min(100, (liters / TARGET_L) * 100);

  return (
    <div className="space-y-2.5 tab-enter pb-3">
      {/* FUEL OS HEADER */}
      <header className="flex justify-between items-center mb-0.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight text-stone-950 dark:text-white flex items-center gap-2">
              Fuel OS
              <span className="text-[10.5px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-bold tracking-wide bg-[#EA4335]/10 text-[#EA4335] border border-[#EA4335]/30 uppercase shrink-0">
                PRO
              </span>
            </h1>
            
            {/* Country market pill */}
            <button
              onClick={() => setShowCountryModal(true)}
              className="h-8 px-2.5 rounded-lg bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200/70 dark:hover:bg-white/15 border border-[#EAE8E3] dark:border-white/10 text-zinc-800 dark:text-stone-200 text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Change client country market"
            >
              <span>{currentCountryObj.flag}</span>
              <span className="font-semibold">{currentCountryObj.code}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {/* Dietary choice dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowDietDropdown((prev) => !prev)}
                className="h-8 px-2.5 rounded-lg bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200/70 dark:hover:bg-white/15 border border-[#EAE8E3] dark:border-white/10 text-zinc-800 dark:text-stone-200 text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Select dietary preference"
              >
                <Leaf className="w-3.5 h-3.5 text-[#5D8A68]" />
                <span className="font-semibold">{currentDietObj.label}</span>
                <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-150 ${showDietDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDietDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDietDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-64 max-w-[calc(100vw-32px)] bg-white dark:bg-[#181B20] rounded-xl border border-neutral-200 dark:border-white/15 shadow-2xl z-50 overflow-hidden py-1 divide-y divide-neutral-100 dark:divide-white/5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/[0.02]">
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-stone-400 uppercase tracking-wider">
                        Dietary Preference
                      </p>
                    </div>
                    <div className="p-1 space-y-0.5 max-h-64 overflow-y-auto">
                      {DIETARY_OPTIONS.map((diet) => {
                        const isSelected = diet.id === activeDiet;
                        return (
                          <button
                            key={diet.id}
                            type="button"
                            onClick={() => handleSelectDiet(diet.id)}
                            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#EA4335]/10 text-[#EA4335] font-bold'
                                : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-800 dark:text-stone-200'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-[12px] font-semibold">
                                {diet.label}
                              </div>
                              <div className="text-[10px] text-zinc-500 dark:text-stone-400 font-normal leading-tight">
                                {diet.description}
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#EA4335] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-[11.5px] font-medium text-zinc-500 dark:text-stone-400 mt-0.5 truncate">
            Daily Nutrition & Energy Balance
          </p>
        </div>
      </header>

      {/* Country Market Quick Switcher Modal */}
      {showCountryModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 dark:bg-black/80 backdrop-blur-xs" onClick={() => setShowCountryModal(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-[#121214] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="p-3.5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#EA4335]" />
                <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white">Client Country Market</h3>
              </div>
              <button
                onClick={() => setShowCountryModal(false)}
                className="btn-nude-close"
                aria-label="Close"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1 divide-y divide-neutral-100 dark:divide-white/5">
              {POPULAR_COUNTRIES.map((c) => {
                const isSelected = c.code === activeCountry;
                return (
                  <button
                    key={c.code}
                    onClick={() => handleSelectCountry(c.code)}
                    className={`w-full h-10 px-3 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EA4335]/10 text-[#EA4335] font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-800 dark:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{c.flag}</span>
                      <span className="text-[12.5px]">{c.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#EA4335]" />}
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-neutral-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01] text-[11px] text-zinc-500 dark:text-stone-400">
              Adapts barcode scanning, regional grocery search, and intelligent athletic meal recommendations to local stores.
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 1. Fuel Intelligence -- targets, energy balance & macro trends */}
      <FuelIntelligencePanel
        goalCals={goalCals}
        setGoalCals={setGoalCals}
        goalP={goalP}
        setGoalP={setGoalP}
        goalC={goalC}
        setGoalC={setGoalC}
        goalF={goalF}
        setGoalF={setGoalF}
        bmr={bmr}
        setBmr={setBmr}
        totalIntakeCals={totalIntakeCals}
        totalP={totalP}
        totalC={totalC}
        totalF={totalF}
        trainingBurn={trainingBurn}
        trendUnit={trendUnit}
        setTrendUnit={setTrendUnit}
        onOpenAutoPilot={onOpenAutoPilot}
        showToast={showToast}
        currentUserEmail={currentUserEmail}
      />

      {/* 2. Compact Hydration Pill */}
      <div className="flex items-center gap-2 bg-white dark:bg-[#121214] border border-[#EAE8E3] dark:border-white/10 rounded-xl px-3 py-2 shadow-2xs">
        <Droplets className="w-4 h-4 text-[#4A7D94] shrink-0" />

        {/* Progress bar background */}
        <div className="flex-1 relative h-5 bg-[#4A7D94]/10 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[#4A7D94]/30 dark:bg-[#4A7D94]/40 rounded-full transition-all duration-500"
            style={{ width: `${hydrationPct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-[12px] font-medium font-mono text-[#2B5468] dark:text-[#88B2C7]">
            {liters.toFixed(1)} / {TARGET_L.toFixed(1)}L
          </span>
        </div>

        {/* Quick-add / undo buttons */}
        <button
          onClick={() => saveHydration(liters - 0.25)}
          className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-stone-300 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/15 active:scale-90 transition-all cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => saveHydration(liters + 0.25)}
          className="h-8 px-2.5 rounded-lg bg-[#4A7D94]/15 text-[#2B5468] dark:text-[#88B2C7] font-mono text-[11px] font-bold tracking-wide uppercase hover:bg-[#4A7D94]/25 active:scale-90 transition-all cursor-pointer"
        >
          +250ml
        </button>
      </div>

      {/* 2.5. Intel Meal Suggestions localized to client country & dietary protocol */}
      <AIMealSuggestPanel
        remainingCals={Math.round(goalCals - totalIntakeCals)}
        remainingProtein={Math.round(goalP - totalP)}
        remainingCarbs={Math.round(goalC - totalC)}
        remainingFat={Math.round(goalF - totalF)}
        mealSlot="Next meal"
        country={activeCountry}
        diet={activeDiet}
        showToast={showToast}
      />

      {/* 3. Daily Food & Meal Logs */}
      <DailyFoodMealLogs
        dailyMeals={dailyMeals}
        totalIntakeCals={totalIntakeCals}
        onOpenFoodModal={onOpenFoodModal}
        onOpenScanModal={onOpenScanModal}
        onDeleteMealItem={onDeleteMealItem}
        onClearAllMeals={onClearAllMeals}
        onAddDirectMealItem={onAddDirectMealItem}
        recentFoods={recentFoods}
      />

      {/* Unified Supplements & Electrolytes Hub */}
      <div id="fuel-supplement-tracker">
        <SupplementsHub showToast={showToast} currentUserEmail={currentUserEmail} />
      </div>
    </div>
  );
};

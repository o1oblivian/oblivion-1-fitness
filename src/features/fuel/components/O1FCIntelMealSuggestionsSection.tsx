import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Check,
  Clock,
  Target,
  Utensils,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { MealItem } from '../store/useFuelStore';
import { apiUrl } from '../../../services/apiBase';
import { buildDeskIntelMeals, MEAL_SLOT_SHARE, portionRemaining } from '../data/intelMealEngine';

export interface LiveMealSuggestion {
  id: string;
  name: string;
  description: string;
  prepTime?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
}

interface O1FCIntelMealSuggestionsSectionProps {
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFats: number;
  targetProteinG: number;
  dietPreference?: string;
  countryMarket?: string;
  onOpenDietModal?: () => void;
  onAddMealItem: (slot: 'breakfast' | 'lunch' | 'dinner' | 'snack', item: MealItem) => void;
  showToast: (msg: string) => void;
}

export const O1FCIntelMealSuggestionsSection: React.FC<O1FCIntelMealSuggestionsSectionProps> = ({
  remainingCalories,
  remainingProtein,
  remainingCarbs,
  remainingFats,
  targetProteinG,
  dietPreference = 'Omnivore',
  countryMarket = 'AU',
  onOpenDietModal,
  onAddMealItem,
  showToast,
}) => {
  // Default collapsed as requested by user
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<LiveMealSuggestion[]>([]);
  const [loggedMealId, setLoggedMealId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const deskMeals = useMemo(
    () =>
      buildDeskIntelMeals({
        diet: dietPreference,
        slot: selectedSlot,
        remainingKcal: remainingCalories,
        remainingProtein,
        remainingCarbs,
        remainingFats,
        country: countryMarket,
        rotation,
      }),
    [
      dietPreference,
      selectedSlot,
      remainingCalories,
      remainingProtein,
      remainingCarbs,
      remainingFats,
      countryMarket,
      rotation,
    ]
  );

  const mealKcal = portionRemaining(
    remainingCalories,
    MEAL_SLOT_SHARE[selectedSlot],
    selectedSlot === 'snack' ? 120 : 280
  );
  const mealP = portionRemaining(remainingProtein, MEAL_SLOT_SHARE[selectedSlot], selectedSlot === 'snack' ? 12 : 28);
  const mealC = portionRemaining(remainingCarbs, MEAL_SLOT_SHARE[selectedSlot], 0);
  const mealF = portionRemaining(remainingFats, MEAL_SLOT_SHARE[selectedSlot], 0);

  const fetchLiveSuggestions = useCallback(async () => {
    setSuggestions(deskMeals);
    setFetchError(null);
    setLoading(true);
    tactileEngine.triggerSelectionBuzz();

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(apiUrl('/api/fuel/ai-suggestions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          remainingKcal: mealKcal,
          remainingProtein: mealP,
          remainingCarbs: mealC,
          remainingFats: mealF,
          targetCalories: mealKcal,
          targetProtein: mealP,
          targetCarbs: mealC,
          targetFats: mealF,
          slot: selectedSlot,
          mealSlot: selectedSlot,
          dietPreference,
          diet: dietPreference,
          country: countryMarket,
          rotation,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch {
      setSuggestions(deskMeals);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [deskMeals, mealKcal, mealP, mealC, mealF, selectedSlot, dietPreference, countryMarket, rotation]);

  // Trigger live real-time fetch whenever expanded, slot changed, or diet changed
  useEffect(() => {
    if (isExpanded) {
      fetchLiveSuggestions();
    }
  }, [isExpanded, selectedSlot, dietPreference, fetchLiveSuggestions]);

  const handleLogMeal = (meal: LiveMealSuggestion) => {
    tactileEngine.triggerImpactPulse();
    setLoggedMealId(meal.id);

    onAddMealItem(selectedSlot, {
      id: `intel-${Date.now()}-${meal.id}`,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
    });

    showToast(`Logged Live Meal: ${meal.name} to ${selectedSlot.toUpperCase()}`);

    setTimeout(() => {
      setLoggedMealId(null);
    }, 1500);
  };

  return (
    <div
      id="o1fc-intel-meal-suggestions-tab"
      className="bg-o1-card border border-white/[0.07] rounded-2xl overflow-hidden transition-all shadow-xs select-none"
    >
      {/* Tab Banner Header: Exact Design as Screenshot */}
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setIsExpanded(!isExpanded);
        }}
        className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 flex items-center justify-between cursor-pointer hover:bg-o1-well/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold text-xs sm:text-sm text-white">
            Intel Meal Suggestions
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-400 font-mono tracking-tight">
            {targetProteinG}g P budget
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </div>
      </button>

      {/* Expandable Live Content Body */}
      {isExpanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3.5 border-t border-white/[0.05] pt-3.5">
          {/* Target Deficit Live Intelligence HUD */}
          <div className="bg-white/[0.03] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-o1-crimson" />
                <span className="text-xs font-bold text-white tracking-wider font-mono">
                  Live Deficit Goal Target
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">
                Day left {remainingCalories.toLocaleString()} kcal · this {selectedSlot} ~{mealKcal} kcal ·{' '}
                <span className="text-o1-crimson font-bold">{mealP}g P</span> ·{' '}
                <span className="text-amber-400 font-bold">{mealC}g C</span> ·{' '}
                <span className="text-emerald-400 font-bold">{mealF}g F</span>
              </p>
            </div>

            {/* Protocol Badge with Quick Open */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onOpenDietModal?.();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-o1-card border border-white/[0.07] text-[11px] font-semibold text-neutral-200 hover:border-o1-crimson transition-all cursor-pointer"
              >
                <Utensils className="w-3 h-3 text-o1-crimson" />
                <span>{dietPreference}</span>
              </button>

              <button
                type="button"
                onClick={() => setRotation((n) => n + 1)}
                disabled={loading}
                title="Rotate meal ideas"
                className="w-7 h-7 rounded-xl bg-o1-card border border-white/[0.07] flex items-center justify-center text-neutral-300 hover:text-o1-crimson transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-o1-crimson' : ''}`} />
              </button>
            </div>
          </div>

          {/* Slot Pill Switcher */}
          <div className="grid grid-cols-4 gap-1.5 bg-o1-well p-1 rounded-2xl border border-white/[0.07]">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((slot) => {
              const isActive = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setSelectedSlot(slot);
                  }}
                  className={`py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer ${
                    isActive
                      ? 'bg-o1-card text-white shadow-xs border border-white/[0.07]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>

          {/* Loading Indicator */}
          {loading && suggestions.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-center">
              <div className="w-10 h-10 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-o1-crimson">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Synthesizing Live Meal Suggestions...
                </p>
                <p className="text-[11px] text-neutral-400 font-mono">
                  Calibrating exact grams for {dietPreference} ({selectedSlot})
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {fetchError && !loading && (
            <div className="p-3 rounded-2xl bg-red-950/30 border border-red-900/50 flex items-center justify-between">
              <span className="text-xs text-red-400 font-medium">
                {fetchError}
              </span>
              <button
                type="button"
                onClick={fetchLiveSuggestions}
                className="px-2.5 py-1 rounded-xl bg-o1-crimson text-white text-[11px] font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Real-Time Live Generated Meals */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((meal) => {
                const isLogged = loggedMealId === meal.id;
                return (
                  <div
                    key={meal.id}
                    className="p-3.5 rounded-2xl bg-o1-well border border-white/[0.07] space-y-2.5 transition-all hover:border-o1-crimson/30"
                  >
                    {/* Meal Name & Slot Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white tracking-tight">
                            {meal.name}
                          </h4>
                          {meal.prepTime && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              {meal.prepTime}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          {meal.description}
                        </p>
                      </div>

                      {/* 1-Tap Log Meal Action Button */}
                      <button
                        type="button"
                        onClick={() => handleLogMeal(meal)}
                        disabled={isLogged}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
                          isLogged
                            ? 'bg-emerald-600 text-white'
                            : 'bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white'
                        }`}
                      >
                        {isLogged ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Logged</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Log Meal</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Exact Calibrated Macro Breakdown Badges */}
                    <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                      <div className="p-1.5 rounded-xl bg-white/[0.03]">
                        <span className="block text-[10px] text-neutral-500 font-sans">Calories</span>
                        <span className="text-xs font-bold text-white">
                          {meal.calories}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white/[0.03]">
                        <span className="block text-[10px] text-neutral-500 font-sans">Protein</span>
                        <span className="text-xs font-bold text-o1-crimson">
                          {meal.protein}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white/[0.03]">
                        <span className="block text-[10px] text-neutral-500 font-sans">Carbs</span>
                        <span className="text-xs font-bold text-amber-400">
                          {meal.carbs}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white/[0.03]">
                        <span className="block text-[10px] text-neutral-500 font-sans">Fats</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {meal.fats}g
                        </span>
                      </div>
                    </div>

                    {/* Exact Measured Ingredients List */}
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <div className="pt-1 border-t border-white/[0.05] flex flex-wrap gap-1.5">
                        {meal.ingredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-xl bg-white/[0.08] text-neutral-300 font-mono"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default O1FCIntelMealSuggestionsSection;

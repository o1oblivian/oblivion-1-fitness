import React, { useState, useEffect, useCallback } from 'react';
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

  // Live real-time fetch strictly based on the athlete's current remaining deficit and dietary protocol
  const fetchLiveSuggestions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    tactileEngine.triggerSelectionBuzz();

    try {
      const res = await fetch('/api/fuel/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remainingKcal: Math.max(150, remainingCalories),
          remainingProtein: Math.max(15, remainingProtein),
          remainingCarbs: Math.max(10, remainingCarbs),
          remainingFats: Math.max(5, remainingFats),
          targetCalories: Math.max(150, remainingCalories),
          targetProtein: Math.max(15, remainingProtein),
          targetCarbs: Math.max(10, remainingCarbs),
          targetFats: Math.max(5, remainingFats),
          slot: selectedSlot,
          mealSlot: selectedSlot,
          dietPreference,
          diet: dietPreference,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        throw new Error('No suggestions returned');
      }
    } catch (err: any) {
      console.warn('Real-time suggestion fetch error:', err);
      setFetchError('Live generation paused. Tap retry to recalculate.');
    } finally {
      setLoading(false);
    }
  }, [remainingCalories, remainingProtein, remainingCarbs, remainingFats, selectedSlot, dietPreference]);

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
      className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all shadow-xs select-none"
    >
      {/* Tab Banner Header: Exact Design as Screenshot */}
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setIsExpanded(!isExpanded);
        }}
        className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#18181b]/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-rose-500 fill-rose-500/20 shrink-0" />
          <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
            Intel Meal Suggestions
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono tracking-tight">
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
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3.5 border-t border-black/5 dark:border-white/5 pt-3.5">
          {/* Target Deficit Live Intelligence HUD */}
          <div className="bg-neutral-100 dark:bg-[#18181b] border border-neutral-200/90 dark:border-neutral-800/90 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-[#C4121A]" />
                <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
                  Live Deficit Goal Target
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                {remainingCalories.toLocaleString()} kcal left •{' '}
                <span className="text-[#C4121A] font-bold">+{remainingProtein}g P</span> •{' '}
                <span className="text-sky-600 dark:text-sky-400 font-bold">+{remainingCarbs}g C</span> •{' '}
                <span className="text-amber-600 dark:text-amber-400 font-bold">+{remainingFats}g F</span>
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
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 hover:border-[#C4121A] transition-all cursor-pointer"
              >
                <Utensils className="w-3 h-3 text-[#C4121A]" />
                <span>{dietPreference}</span>
              </button>

              <button
                type="button"
                onClick={fetchLiveSuggestions}
                disabled={loading}
                title="Recalculate Live Suggestions"
                className="w-7 h-7 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-[#C4121A] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C4121A]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Slot Pill Switcher */}
          <div className="grid grid-cols-4 gap-1.5 bg-neutral-100 dark:bg-[#18181b] p-1 rounded-2xl border border-neutral-200/90 dark:border-neutral-800/80">
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
                      ? 'bg-[#C4121A] text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-center">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-[#C4121A]">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  Synthesizing Live Meal Suggestions...
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  Calibrating exact grams for {dietPreference} ({selectedSlot})
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {fetchError && !loading && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center justify-between">
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                {fetchError}
              </span>
              <button
                type="button"
                onClick={fetchLiveSuggestions}
                className="px-2.5 py-1 rounded-lg bg-[#C4121A] text-white text-[11px] font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Real-Time Live Generated Meals */}
          {!loading && suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((meal) => {
                const isLogged = loggedMealId === meal.id;
                return (
                  <div
                    key={meal.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#16161a] border border-neutral-200/80 dark:border-neutral-800/80 space-y-2.5 transition-all hover:border-[#C4121A]/30"
                  >
                    {/* Meal Name & Slot Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight">
                            {meal.name}
                          </h4>
                          {meal.prepTime && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              {meal.prepTime}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
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
                            ? 'bg-green-600 text-white'
                            : 'bg-[#C4121A] hover:bg-[#a50f16] active:bg-[#800C11] text-white'
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
                      <div className="p-1.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                        <span className="block text-[10px] text-neutral-500 font-sans">Calories</span>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                          {meal.calories}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                        <span className="block text-[10px] text-neutral-500 font-sans">Protein</span>
                        <span className="text-xs font-bold text-[#C4121A]">
                          {meal.protein}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                        <span className="block text-[10px] text-neutral-500 font-sans">Carbs</span>
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                          {meal.carbs}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                        <span className="block text-[10px] text-neutral-500 font-sans">Fats</span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {meal.fats}g
                        </span>
                      </div>
                    </div>

                    {/* Exact Measured Ingredients List */}
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <div className="pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-wrap gap-1.5">
                        {meal.ingredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-lg bg-neutral-200/60 dark:bg-[#202025] text-neutral-800 dark:text-neutral-300 font-mono"
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

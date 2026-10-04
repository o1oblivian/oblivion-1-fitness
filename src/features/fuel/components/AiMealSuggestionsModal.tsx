import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ChefHat,
  Flame,
  Clock,
  Plus,
  RefreshCw,
  Check,
  Zap,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface AiMeal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTimeMinutes: number;
  ingredients: string[];
  cookingInstructions?: string;
}

interface AiMealSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dietPreference?: string;
  remainingCalories?: number;
  remainingProtein?: number;
  remainingCarbs?: number;
  remainingFats?: number;
  onLogMeal: (slot: 'breakfast' | 'lunch' | 'dinner' | 'snack', meal: AiMeal) => void;
}

export const AiMealSuggestionsModal: React.FC<AiMealSuggestionsModalProps> = ({
  isOpen,
  onClose,
  dietPreference = 'Omnivore',
  remainingCalories = 850,
  remainingProtein = 48,
  remainingCarbs = 65,
  remainingFats = 22,
  onLogMeal,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AiMeal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loggedMealId, setLoggedMealId] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    tactileEngine.triggerSelectionBuzz();

    try {
      const res = await fetch('/api/fuel/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diet: dietPreference,
          targetCalories: remainingCalories,
          targetProtein: remainingProtein,
          targetCarbs: remainingCarbs,
          targetFats: remainingFats,
          mealSlot: selectedSlot,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }

      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      } else {
        throw new Error('Invalid suggestions format');
      }
    } catch (err: any) {
      console.warn('Meal suggestions error, using athletic fallback:', err);
      // Fallback high-protein culinary suggestions
      setSuggestions([
        {
          id: 'sug-1',
          name: 'Seared Grass-Fed Sirloin & Crispy Sweet Potato Cubes',
          description: 'Pan-seared medium-rare beef medallion finished with garlic rosemary infused olive oil and air-fried sweet potato hash.',
          calories: 580,
          protein: 48,
          carbs: 45,
          fats: 16,
          prepTimeMinutes: 18,
          ingredients: ['180g Top Sirloin Steak', '160g Sweet Potato', '1 tsp Olive Oil', 'Fresh Rosemary', 'Himalayan Pink Salt'],
          cookingInstructions: 'Sear steak 3.5 min/side in smoking cast iron. Air fry diced sweet potato at 200°C for 15 min.',
        },
        {
          id: 'sug-2',
          name: 'Anabolic Citrus Glazed Salmon & Jasmine Grain Bowl',
          description: 'Wild Alaskan sockeye salmon over steaming jasmine rice with baby spinach and a low-sodium amino glaze.',
          calories: 620,
          protein: 44,
          carbs: 58,
          fats: 18,
          prepTimeMinutes: 15,
          ingredients: ['170g Wild Salmon', '160g Jasmine Rice (Cooked)', '100g Baby Spinach', '1 tbsp Coconut Aminos', 'Lemon Slices'],
          cookingInstructions: 'Broil salmon on high rack 8 minutes until flaky. Serve atop warm rice and wilted greens.',
        },
        {
          id: 'sug-3',
          name: 'Charred Chimichurri Chicken Breast & Quinoa Salad',
          description: 'Herb-marinated lean poultry breast sliced over tricolor quinoa with cherry tomatoes and fresh parsley lime chimichurri.',
          calories: 510,
          protein: 52,
          carbs: 42,
          fats: 12,
          prepTimeMinutes: 20,
          ingredients: ['200g Chicken Breast', '140g Cooked Quinoa', 'Cherry Tomatoes', 'Fresh Cilantro & Parsley', 'Red Wine Vinegar'],
          cookingInstructions: 'Grill chicken breast to 74°C internal. Toss warm quinoa with diced herbs and vinegar dressing.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen, selectedSlot]);

  if (!isOpen) return null;

  const handleCommit = (meal: AiMeal) => {
    tactileEngine.playPRCelebration();
    setLoggedMealId(meal.id);
    onLogMeal(selectedSlot, meal);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 sm:bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#1F1F23] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-tactical text-[#C4121A] uppercase font-bold tracking-wider block">
                Target-Matched Nutrition
              </span>
              <h3 className="font-tactical font-bold text-sm text-neutral-900 dark:text-white tracking-tight">
                Recommended Athlete Meals
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meal Slot Selector */}
        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-tactical font-medium">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className={`flex-1 py-1.5 rounded-lg capitalize text-center transition-all cursor-pointer ${
                selectedSlot === slot
                  ? 'bg-[#C4121A] text-white font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        {/* Athlete Budget Header Strip */}
        <div className="bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 font-tactical uppercase text-[10px] block font-semibold tracking-wide">
              Target Budget ({dietPreference})
            </span>
            <span className="font-mono font-bold text-neutral-900 dark:text-white tabular-nums text-xs">
              {remainingCalories} kcal left • {remainingProtein}g P budget
            </span>
          </div>

          <button
            type="button"
            onClick={fetchSuggestions}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-center gap-1 text-[11px] font-tactical font-medium cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>

        {/* Suggestions List */}
        <div className="space-y-3 overflow-y-auto max-h-96 pr-1">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#C4121A] mx-auto" />
              <p className="text-xs font-sans text-neutral-500 dark:text-neutral-400">
                Crafting macro-balanced culinary options...
              </p>
            </div>
          ) : suggestions.map((meal) => (
            <div
              key={meal.id}
              className="bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-2xl p-3.5 space-y-2.5 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-tactical font-bold text-sm text-neutral-900 dark:text-white leading-snug">
                    {meal.name}
                  </h4>
                  <p className="text-xs font-sans text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {meal.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white block tabular-nums">
                    {meal.calories} kcal
                  </span>
                  <span className="text-[10px] text-neutral-500 flex items-center justify-end gap-1 mt-0.5 font-sans">
                    <Clock className="w-2.5 h-2.5" />
                    {meal.prepTimeMinutes}m prep
                  </span>
                </div>
              </div>

              {/* Macro Bar */}
              <div className="grid grid-cols-3 gap-1.5 bg-white dark:bg-black/50 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800/80 text-center">
                <div>
                  <span className="text-[10px] text-[#C4121A] dark:text-rose-400 font-tactical font-semibold uppercase block">Protein</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-neutral-900 dark:text-white">{meal.protein}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-500 font-tactical font-semibold uppercase block">Carbs</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-neutral-900 dark:text-white">{meal.carbs}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-500 font-tactical font-semibold uppercase block">Fats</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-neutral-900 dark:text-white">{meal.fats}g</span>
                </div>
              </div>

              {/* Ingredients tag cloud */}
              {meal.ingredients && meal.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {meal.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-sans bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-md"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleCommit(meal)}
                className={`w-full py-2.5 px-3 rounded-xl font-tactical text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loggedMealId === meal.id
                    ? 'bg-[#C4121A] text-white'
                    : 'bg-[#C4121A] hover:bg-[#a60f16] text-white active:scale-95 shadow-xs'
                }`}
              >
                {loggedMealId === meal.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Logged to {selectedSlot}!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Log to {selectedSlot}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiMealSuggestionsModal;

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Clock,
  Plus,
  RefreshCw,
  Check,
  AlertCircle,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { apiUrl } from '../../../services/apiBase';
import { buildDeskIntelMeals } from '../data/intelMealEngine';

interface AiMeal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTimeMinutes: number | null;
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
  remainingCalories = 0,
  remainingProtein = 0,
  remainingCarbs = 0,
  remainingFats = 0,
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
      const res = await fetch(apiUrl('/api/fuel/ai-suggestions'), {
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
    } catch {
      setError('Live suggestions are unavailable right now. Showing on-device picks matched to your targets.');
      const desk = buildDeskIntelMeals({
        diet: dietPreference,
        slot: selectedSlot,
        remainingKcal: remainingCalories,
        remainingProtein,
        remainingCarbs,
        remainingFats,
      });
      setSuggestions(
        desk.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fats: m.fats,
          prepTimeMinutes: Number.parseInt(m.prepTime, 10) || null,
          ingredients: m.ingredients,
        }))
      );
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
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none animate-in fade-in duration-200">
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] w-full p-4 shadow-xl space-y-3.5 overflow-y-auto flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-tactical text-o1-crimson font-bold tracking-wider block">
                Target-Matched Nutrition
              </span>
              <h3 className="font-tactical font-bold text-sm text-white tracking-tight">
                Recommended Athlete Meals
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meal Slot Selector */}
        <div className="flex items-center gap-1.5 bg-o1-well p-1 rounded-xl border border-white/[0.07] text-xs font-tactical font-medium">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className={`flex-1 py-1.5 rounded-xl capitalize text-center transition-all cursor-pointer ${
                selectedSlot === slot
                  ? 'bg-o1-crimson text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        {/* Athlete Budget Header Strip */}
        <div className="bg-o1-well border border-white/[0.07] p-2.5 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-neutral-400 font-tactical text-[10px] block font-semibold tracking-wide">
              Target Budget ({dietPreference})
            </span>
            <span className="font-mono font-bold text-white tabular-nums text-xs">
              {remainingCalories} kcal left • {remainingProtein}g P budget
            </span>
          </div>

          <button
            type="button"
            onClick={fetchSuggestions}
            disabled={loading}
            className="px-2.5 py-1 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-neutral-300 border border-white/[0.07] flex items-center gap-1 text-[11px] font-tactical font-medium cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>

        {error && !loading && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-sans leading-snug">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Suggestions List */}
        <div className="space-y-3 overflow-y-auto max-h-96 pr-1">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-o1-crimson mx-auto" />
              <p className="text-xs font-sans text-neutral-400">
                Crafting macro-balanced culinary options...
              </p>
            </div>
          ) : suggestions.length === 0 ? (
            <p className="py-12 text-center text-xs font-sans text-neutral-400">
              No meals match your remaining targets for {selectedSlot}. Try another slot or regenerate.
            </p>
          ) : suggestions.map((meal) => (
            <div
              key={meal.id}
              className="bg-o1-well border border-white/[0.07] hover:border-white/[0.14] rounded-2xl p-3.5 space-y-2.5 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-tactical font-bold text-sm text-white leading-snug">
                    {meal.name}
                  </h4>
                  <p className="text-xs font-sans text-neutral-400 mt-1 leading-relaxed">
                    {meal.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-sm text-white block tabular-nums">
                    {meal.calories} kcal
                  </span>
                  {meal.prepTimeMinutes !== null && (
                    <span className="text-[10px] text-neutral-500 flex items-center justify-end gap-1 mt-0.5 font-sans">
                      <Clock className="w-2.5 h-2.5" />
                      {meal.prepTimeMinutes}m prep
                    </span>
                  )}
                </div>
              </div>

              {/* Macro Bar */}
              <div className="grid grid-cols-3 gap-1.5 bg-black/50 p-2 rounded-xl border border-white/[0.07] text-center">
                <div>
                  <span className="text-[10px] text-o1-crimson font-tactical font-semibold block">Protein</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-white">{meal.protein}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 font-tactical font-semibold block">Carbs</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-white">{meal.carbs}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-tactical font-semibold block">Fats</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-white">{meal.fats}g</span>
                </div>
              </div>

              {/* Ingredients tag cloud */}
              {meal.ingredients && meal.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {meal.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-sans bg-white/[0.08] text-neutral-300 px-2 py-0.5 rounded-md"
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
                    ? 'bg-o1-crimson text-white'
                    : 'bg-o1-crimson hover:bg-o1-crimson-hover text-white active:scale-95 shadow-xs'
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

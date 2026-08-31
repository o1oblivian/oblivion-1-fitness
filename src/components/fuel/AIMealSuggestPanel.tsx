import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, ChefHat, X, RefreshCw, Globe, Leaf } from 'lucide-react';
import { getCountryObj, getSelectedCountry, subscribeCountryChange } from '../../utils/geolocation';
import { getSelectedDietary, subscribeDietaryChange, getDietaryObj, DietaryType } from '../../utils/dietaryPreferences';

interface MealSuggestion {
  name: string;
  description: string;
  prepTime: string;
  ingredients: string[];
  macros: { calories: number; protein: number; carbs: number; fat: number };
  tags: string[];
}

interface AIMealSuggestPanelProps {
  remainingCals: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  mealSlot?: string;
  country?: string;
  diet?: DietaryType;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AIMealSuggestPanel: React.FC<AIMealSuggestPanelProps> = ({
  remainingCals, remainingProtein, remainingCarbs, remainingFat, mealSlot, country: propCountry, diet: propDiet, showToast,
}) => {
  const [activeCountry, setActiveCountry] = useState<string>(() => propCountry || getSelectedCountry());
  const [activeDiet, setActiveDiet] = useState<DietaryType>(() => propDiet || getSelectedDietary());
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize when prop changes
  useEffect(() => {
    if (propCountry) {
      setActiveCountry(propCountry);
    }
  }, [propCountry]);

  useEffect(() => {
    if (propDiet) {
      setActiveDiet(propDiet);
    }
  }, [propDiet]);

  // Synchronize immediately when country changed anywhere in app
  useEffect(() => {
    return subscribeCountryChange((code) => {
      setActiveCountry(code);
      setSuggestions([]);
    });
  }, []);

  // Synchronize immediately when dietary preference changed anywhere in app
  useEffect(() => {
    return subscribeDietaryChange((newDiet) => {
      setActiveDiet(newDiet);
      setSuggestions([]);
    });
  }, []);

  const countryInfo = getCountryObj(activeCountry);
  const dietInfo = getDietaryObj(activeDiet);

  async function fetchSuggestions() {
    if (remainingCals <= 0 && remainingProtein <= 0) {
      showToast('You\'ve already hit your targets!', 'success');
      return;
    }
    setLoading(true);
    setError(null);
    setExpanded(true);
    try {
      let data: any = null;

      // 1. Try local server API route with country and diet context
      try {
        const res = await fetch('/api/meal-suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            remainingCals: Math.max(0, remainingCals),
            remainingProtein: Math.max(0, remainingProtein),
            remainingCarbs: Math.max(0, remainingCarbs),
            remainingFat: Math.max(0, remainingFat),
            mealSlot: mealSlot || 'Next meal',
            country: activeCountry || 'GLOBAL',
            diet: activeDiet || 'omnivore',
          }),
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Fallback
      }

      // 2. Try Supabase Edge Function if defined
      if (!data?.suggestions?.length && import.meta.env.VITE_SUPABASE_URL) {
        try {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meal-suggest`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              remainingCals: Math.max(0, remainingCals),
              remainingProtein: Math.max(0, remainingProtein),
              remainingCarbs: Math.max(0, remainingCarbs),
              remainingFat: Math.max(0, remainingFat),
              mealSlot: mealSlot || 'Next meal',
              country: activeCountry || 'GLOBAL',
              diet: activeDiet || 'omnivore',
            }),
          });
          if (res.ok) {
            data = await res.json();
          }
        } catch {
          // Fallback
        }
      }

      if (data?.suggestions?.length) {
        setSuggestions(data.suggestions);
      } else {
        // High quality fallback macros customized by diet and country
        const p = Math.max(25, Math.round(remainingProtein || 35));
        const c = Math.max(20, Math.round(remainingCarbs || 45));
        const f = Math.max(5, Math.round(remainingFat || 12));
        const cals = Math.round(p * 4 + c * 4 + f * 9);

        if (activeDiet === 'vegan') {
          setSuggestions([
            {
              name: 'Crispy Tempeh & Edamame Quinoa Bowl',
              description: 'Pan-seared organic tempeh with steamed edamame, tri-color quinoa, baby spinach, and tahini drizzle.',
              prepTime: '15 min',
              ingredients: [`${Math.round(p * 4)}g Organic Tempeh`, '80g Steamed Edamame', '120g Cooked Quinoa'],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ['100% Vegan', 'Complete Protein'],
            },
            {
              name: 'High-Protein Tofu & Peanut Satay Bowl',
              description: 'Extra-firm pressed tofu stir-fried with broccoli florets, brown rice, and natural peanut sauce.',
              prepTime: '12 min',
              ingredients: [`${Math.round(p * 4.5)}g Extra-Firm Tofu`, '150g Brown Rice', '100g Steamed Broccoli'],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ['Plant Power', 'Antioxidant Rich'],
            },
            {
              name: 'Creamy Pea Protein & Chia Superfood Oats',
              description: 'Warm rolled oats blended with organic pea protein isolate, crushed walnuts, and wild blueberries.',
              prepTime: '5 min',
              ingredients: ['35g Pea Protein Isolate', '50g Rolled Oats', '15g Chia Seeds', '50g Blueberries'],
              macros: { calories: cals - 20, protein: p + 2, carbs: c - 4, fat: Math.max(3, f - 2) },
              tags: ['Quick Prep', 'No Cook Option'],
            },
          ]);
        } else if (activeDiet === 'vegetarian') {
          setSuggestions([
            {
              name: 'High-Protein Paneer & Spiced Rice Bowl',
              description: 'Seared low-fat paneer cubes tossed with bell peppers, onions, fragrant jeera rice & mint yogurt.',
              prepTime: '15 min',
              ingredients: [`${Math.round(p * 4.2)}g Low-Fat Paneer`, '150g Basmati Rice', '100g Greek Yogurt'],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ['Vegetarian', 'High Calcium'],
            },
            {
              name: 'Egg White & Avocado Sourdough Toast',
              description: 'Fluffy scrambled farm eggs and whites over toasted sourdough with sliced hass avocado and microgreens.',
              prepTime: '10 min',
              ingredients: ['200g Liquid Egg Whites', '1 Whole Egg', '2 slices Sourdough', '30g Sliced Avocado'],
              macros: { calories: cals - 30, protein: p, carbs: c - 5, fat: f },
              tags: ['Vegetarian', 'Quick Prep'],
            },
            {
              name: 'Greek Yogurt Superfood Parfait',
              description: 'Thick 0% nonfat Greek yogurt layered with whey isolate, fresh berries, chia seeds, and raw oats.',
              prepTime: '4 min',
              ingredients: ['250g 0% Greek Yogurt', '25g Whey Isolate', '50g Blueberries', '40g Oats'],
              macros: { calories: cals, protein: p + 5, carbs: c, fat: Math.max(3, f - 4) },
              tags: ['No Cook', 'High Protein'],
            },
          ]);
        } else if (activeDiet === 'pescatarian') {
          setSuggestions([
            {
              name: 'Pan-Seared Atlantic Salmon & Sweet Potato',
              description: 'Crispy skin salmon fillet with steamed tenderstem broccoli and roasted sweet potato wedges.',
              prepTime: '15 min',
              ingredients: [`${Math.round(p * 4.2)}g Salmon Fillet`, '180g Sweet Potato', '100g Steamed Broccoli'],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ['Pescatarian', 'High Omega-3'],
            },
            {
              name: 'Yellowfin Tuna & Quinoa Crunch Bowl',
              description: 'Seared sashimi-grade yellowfin tuna with edamame, cucumber, fluffy quinoa, and sesame ginger dressing.',
              prepTime: '12 min',
              ingredients: [`${Math.round(p * 3.8)}g Yellowfin Tuna`, '140g Cooked Quinoa', '60g Edamame'],
              macros: { calories: cals, protein: p + 3, carbs: c - 2, fat: f },
              tags: ['Lean Protein', 'Post-Workout'],
            },
            {
              name: 'Garlic Butter Prawns & Jasmine Rice',
              description: 'Sautéed king tiger prawns in garlic and parsley butter over steamed fragrant jasmine rice.',
              prepTime: '10 min',
              ingredients: [`${Math.round(p * 4.5)}g Tiger Prawns`, '160g Jasmine Rice', '10g Grass-Fed Butter'],
              macros: { calories: cals - 20, protein: p, carbs: c, fat: Math.max(3, f - 2) },
              tags: ['Ultra Lean', 'Quick Digest'],
            },
          ]);
        } else if (activeDiet === 'carnivore') {
          setSuggestions([
            {
              name: 'Grass-Fed Ribeye & Fried Eggs',
              description: 'Seared grass-fed ribeye steak cooked in grass-fed tallow served with two sunny-side-up pasture eggs.',
              prepTime: '15 min',
              ingredients: [`${Math.round(p * 4.2)}g Ribeye Steak`, '2 Pasture Eggs', '15g Grass-Fed Butter'],
              macros: { calories: cals, protein: p, carbs: 0, fat: Math.round(f + (c * 4) / 9) },
              tags: ['100% Carnivore', 'Zero Carb'],
            },
            {
              name: 'Lean Ground Beef & Bone Broth Bowl',
              description: '90/10 lean ground beef cooked in its own juices with rich warm beef bone broth reduction.',
              prepTime: '10 min',
              ingredients: [`${Math.round(p * 4.5)}g Lean Ground Beef`, '200ml Beef Bone Broth', '10g Sea Salt'],
              macros: { calories: cals, protein: p + 5, carbs: 0, fat: Math.round(f + (c * 4) / 9) },
              tags: ['Animal Based', 'High Iron'],
            },
            {
              name: 'Crispy Skin Salmon & Pasture Butter',
              description: 'Wild-caught salmon pan-seared in clarified ghee with a pinch of flaky Celtic sea salt.',
              prepTime: '12 min',
              ingredients: [`${Math.round(p * 4.8)}g Wild Salmon`, '15g Pure Ghee', 'Flaky Sea Salt'],
              macros: { calories: cals - 20, protein: p, carbs: 0, fat: Math.round(f + (c * 4) / 9) },
              tags: ['Omega-3 Dense', 'Zero Plant'],
            },
          ]);
        } else if (activeDiet === 'paleo') {
          setSuggestions([
            {
              name: 'Grass-Fed Sirloin & Roasted Sweet Potato',
              description: 'Flame-grilled sirloin steak with roasted sweet potato cubes, asparagus, and extra virgin olive oil.',
              prepTime: '20 min',
              ingredients: [`${Math.round(p * 4.2)}g Sirloin Steak`, '220g Sweet Potato', '100g Grilled Asparagus'],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ['Paleo Approved', 'Grain Free'],
            },
            {
              name: 'Roasted Chicken Thighs with Butternut Squash',
              description: 'Crispy skin herb-roasted chicken thighs with spiced butternut squash and sautéed kale.',
              prepTime: '25 min',
              ingredients: [`${Math.round(p * 4.5)}g Free-Range Chicken`, '180g Butternut Squash', '80g Sautéed Kale'],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ['Whole Foods', 'Dairy Free'],
            },
            {
              name: 'Pasture Omelet with Sliced Avocado & Berries',
              description: '3-egg pasture omelet with baby spinach, side of sliced avocado, and fresh wild blackberries.',
              prepTime: '8 min',
              ingredients: ['3 Whole Pasture Eggs', '100g Egg Whites', '40g Avocado', '60g Fresh Blackberries'],
              macros: { calories: cals - 30, protein: p, carbs: Math.round(c * 0.5), fat: f + 3 },
              tags: ['Nutrient Dense', 'Unprocessed'],
            },
          ]);
        } else if (activeCountry === 'AU') {
          setSuggestions([
            {
              name: 'Tasmanian Salmon & Sweet Potato Mash',
              description: 'Pan-seared Atlantic salmon with steamed broccolini and cinnamon roasted sweet potato.',
              prepTime: '15 min',
              ingredients: [`${Math.round(p * 4.5)}g Tassal Salmon`, '200g Sweet Potato', '120g Broccolini'],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ['Aussie Fresh', 'High Omega-3'],
            },
            {
              name: 'GYG Style Naked Grilled Chicken Bowl',
              description: 'Grilled chicken breast with seasoned brown rice, black beans, pico de gallo & avocado.',
              prepTime: '10 min',
              ingredients: [`${Math.round(p * 3.2)}g Free Range Chicken`, '150g Brown Rice', '30g Avocado'],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ['Local Staple', 'Post-Workout'],
            },
            {
              name: 'YoPRO High Protein Yogurt Bowl',
              description: 'Thick Danone YoPRO Greek yogurt topped with raw blueberries, chia seeds & rolled oats.',
              prepTime: '3 min',
              ingredients: ['200g YoPRO Yogurt', '25g WPI Powder', '50g Blueberries', '35g Uncle Tobys Oats'],
              macros: { calories: cals - 30, protein: p + 4, carbs: c - 5, fat: Math.max(3, f - 3) },
              tags: ['No Cook', 'High Protein'],
            },
          ]);
        } else {
          setSuggestions([
            {
              name: 'Grilled Steak & Sweet Potato Mash',
              description: 'Lean flank steak with steamed broccoli and baked cinnamon sweet potato.',
              prepTime: '20 min',
              ingredients: [`${Math.round(p * 4.5)}g Flank Steak`, '200g Sweet Potato', '100g Steamed Broccoli'],
              macros: { calories: cals, protein: p, carbs: c, fat: f },
              tags: ['High Protein', 'Clean Carb'],
            },
            {
              name: 'Egg White & Turkey Bacon Power Bowl',
              description: 'Scrambled pasture-raised egg whites with avocado slices and sourdough toast.',
              prepTime: '10 min',
              ingredients: ['200g Liquid Egg Whites', '2 slices Sourdough', '30g Sliced Avocado'],
              macros: { calories: cals - 30, protein: p, carbs: c - 5, fat: f },
              tags: ['Quick Prep', 'Post-Workout'],
            },
            {
              name: 'Greek Yogurt Superfood Parfait',
              description: 'Thick nonfat Greek yogurt layered with whey isolate, blueberries, and rolled oats.',
              prepTime: '5 min',
              ingredients: ['250g 0% Greek Yogurt', '25g Whey Isolate', '50g Blueberries', '40g Oats'],
              macros: { calories: cals, protein: p + 5, carbs: c, fat: Math.max(3, f - 4) },
              tags: ['No Cook', 'High Protein'],
            },
          ]);
        }
      }
    } catch (err) {
      setError((err as Error).message);
      showToast('Could not get meal suggestions', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={fetchSuggestions}
        disabled={loading}
        className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#13161A] border border-[#EAE8E3] dark:border-white/10 hover:border-[#DC2626]/40 dark:hover:border-[#DC2626]/40 shadow-2xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          {loading ? (
            <RefreshCw className="w-4 h-4 text-[#DC2626] animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-[#DC2626]" />
          )}
          <span className="text-[12px] font-bold text-zinc-900 dark:text-white">
            {loading ? 'Analyzing produce & macros...' : 'Intel Meal Suggestions'}
          </span>
          <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 font-semibold text-zinc-600 dark:text-stone-300">
            {dietInfo.label}
          </span>
        </div>
        <span className="text-[10.5px] font-mono font-bold text-[#DC2626]">
          {Math.max(0, remainingProtein)}g P budget
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[#EAE8E3] dark:border-white/10 bg-white dark:bg-[#13161A] shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#EAE8E3] dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" />
          <span className="text-[11px] font-bold text-zinc-900 dark:text-white tracking-tight">
            Meal Suggestions
          </span>
          <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-white/10 font-semibold text-zinc-700 dark:text-stone-300 border border-zinc-200/80 dark:border-white/10">
            {dietInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={fetchSuggestions} disabled={loading} className="p-1 rounded-md hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50" title="Refresh suggestions">
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 dark:text-stone-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setExpanded(false)} className="p-1 rounded-md hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer" aria-label="Close">
            <X className="w-3.5 h-3.5 text-zinc-500 dark:text-stone-400" />
          </button>
        </div>
      </div>

      <div className="px-3 py-1.5 border-b border-[#EAE8E3] dark:border-white/10 flex items-center gap-3 bg-zinc-50/50 dark:bg-white/[0.01]">
        <div className="text-[10px] font-mono text-zinc-600 dark:text-stone-400 flex items-center gap-2">
          <span>Budget:</span>
          <span className="text-zinc-900 dark:text-white font-bold">{Math.max(0,remainingCals)} kcal</span>
          <span className="text-[#DC2626] font-bold">{Math.max(0,remainingProtein)}g P</span>
          <span className="text-[#D4A24A] font-bold">{Math.max(0,remainingCarbs)}g C</span>
          <span className="text-[#5D8A68] font-bold">{Math.max(0,remainingFat)}g F</span>
        </div>
      </div>

      {loading && (
        <div className="p-5 flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-[#DC2626] border-t-transparent animate-spin" />
          <span className="text-[11px] font-medium text-zinc-600 dark:text-stone-300">
            Gemini tailoring {countryInfo.name} ({dietInfo.label}) athletic recipes...
          </span>
        </div>
      )}

      {error && !loading && suggestions.length === 0 && (
        <div className="p-4 text-center">
          <p className="text-[11px] text-[#DC2626] font-medium">{error}</p>
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="divide-y divide-[#EAE8E3] dark:divide-white/5">
          {suggestions.map((meal, i) => (
            <div key={i} className="px-3 py-2.5 space-y-1.5 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-[13px] font-bold text-zinc-900 dark:text-white tracking-tight">{meal.name}</h4>
                  <p className="text-[11px] text-zinc-600 dark:text-stone-400 leading-snug">{meal.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-600 dark:text-stone-300">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>{meal.prepTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <ChefHat className="w-3.5 h-3.5 text-[#5D8A68] shrink-0" />
                {meal.ingredients.map((ing, j) => (
                  <span key={j} className="text-[9.5px] font-mono bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded px-1.5 py-0.5 text-zinc-700 dark:text-stone-300">
                    {ing}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-0.5 text-[10.5px] font-mono">
                <span className="font-bold text-zinc-900 dark:text-white">{meal.macros.calories} kcal</span>
                <span className="text-[#DC2626] font-bold">{meal.macros.protein}g P</span>
                <span className="text-[#D4A24A] font-bold">{meal.macros.carbs}g C</span>
                <span className="text-[#5D8A68] font-bold">{meal.macros.fat}g F</span>
              </div>

              {meal.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap pt-0.5">
                  {meal.tags.map((tag, k) => (
                    <span key={k} className="text-[9px] font-semibold bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-stone-300 px-2 py-0.5 rounded-full border border-zinc-200/80 dark:border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


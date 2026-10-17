import React, { useMemo, useState } from 'react';
import { Sparkles, ChevronDown, RefreshCw, Plus, Check, Clock, Utensils } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { MealItem } from '../store/useFuelStore';
import { buildIntelMeals, IntelMealSuggestion, MacroBudget, MealSlot, slotBudget } from '../data/intelMealEngine';

const SLOTS: { key: MealSlot; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

function slotForNow(logged: readonly MealSlot[]): MealSlot {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  const byClock: MealSlot = h < 10.5 ? 'breakfast' : h < 16 ? 'lunch' : h < 17.5 ? 'snack' : h < 21.5 ? 'dinner' : 'snack';
  const order: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const start = order.indexOf(byClock);
  for (let i = 0; i < order.length; i++) {
    const s = order[(start + i) % order.length];
    if (!logged.includes(s)) return s;
  }
  return byClock;
}

function fitTone(fit: number): string {
  if (fit >= 90) return 'text-emerald-500 border-emerald-600/40';
  if (fit >= 75) return 'text-amber-500 border-amber-600/40';
  return 'text-o1-muted border-white/[0.08]';
}

interface O1FCIntelMealSuggestionsSectionProps {
  calibrated: boolean;
  remaining: MacroBudget;
  loggedSlots: readonly MealSlot[];
  dietPreference?: string;
  onOpenDietModal: () => void;
  onOpenSettings: () => void;
  onAddMealItem: (slot: MealSlot, item: MealItem) => void;
  showToast: (msg: string) => void;
}

export const O1FCIntelMealSuggestionsSection: React.FC<O1FCIntelMealSuggestionsSectionProps> = ({
  calibrated,
  remaining,
  loggedSlots,
  dietPreference = 'Omnivore',
  onOpenDietModal,
  onOpenSettings,
  onAddMealItem,
  showToast,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [slot, setSlot] = useState<MealSlot>(() => slotForNow(loggedSlots));
  const [rotation, setRotation] = useState(0);
  const [loggedId, setLoggedId] = useState<string | null>(null);

  const budget = useMemo(() => slotBudget(slot, remaining, loggedSlots), [slot, remaining, loggedSlots]);
  const dayDone = remaining.kcal < 150;
  const meals = useMemo(
    () => (calibrated && !dayDone ? buildIntelMeals({ diet: dietPreference, slot, budget, rotation }) : []),
    [calibrated, dayDone, dietPreference, slot, budget, rotation]
  );
  const slotLabel = SLOTS.find((s) => s.key === slot)?.label ?? slot;

  const logMeal = (meal: IntelMealSuggestion) => {
    tactileEngine.triggerImpactPulse();
    setLoggedId(meal.id);
    const stamp = Date.now();
    [...meal.ingredients].reverse().forEach((ing, i) => {
      onAddMealItem(slot, {
        id: `intel-${stamp}-${i}-${meal.id}`,
        name: `${ing.label} · ${ing.display}`,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fats: ing.fats,
      });
    });
    showToast(`Logged ${meal.name} to ${slotLabel} · ${meal.ingredients.length} items, +${meal.calories} kcal`);
    window.setTimeout(() => setLoggedId(null), 1500);
  };

  return (
    <section id="o1fc-intel-meal-suggestions-tab" className="bg-o1-canvas border border-white/[0.08] rounded-2xl overflow-hidden select-none">
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setIsExpanded((v) => !v);
        }}
        className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-sm font-semibold text-o1-text truncate">Intel Meal Suggestions</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-o1-muted tabular-nums">
            {calibrated ? (dayDone ? 'Day target reached' : `${slotLabel} · ~${budget.kcal.toLocaleString()} kcal`) : 'Set targets'}
          </span>
          <ChevronDown className={`w-4 h-4 text-o1-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-3 space-y-3 border-t border-white/[0.05]">
          {!calibrated ? (
            <div className="rounded-xl bg-o1-surface border border-white/[0.05] p-3.5 flex items-center justify-between gap-3">
              <p className="text-xs text-o1-muted">Set your daily calorie and macro targets so portions can be sized to you.</p>
              <button
                type="button"
                onClick={onOpenSettings}
                className="shrink-0 h-8 px-3 rounded-full bg-o1-crimson hover:bg-[#A30F16] active:bg-[#800C11] text-white text-xs font-semibold cursor-pointer"
              >
                Set targets
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-o1-surface border border-white/[0.05]" role="tablist" aria-label="Meal slot">
                {SLOTS.map((s) => {
                  const active = s.key === slot;
                  const done = loggedSlots.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        setSlot(s.key);
                        setRotation(0);
                      }}
                      className={`h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        active ? 'bg-o1-text text-black border border-transparent' : 'text-o1-muted hover:text-o1-text border border-transparent'
                      }`}
                    >
                      {s.label}
                      {done && <Check className="w-3 h-3 text-emerald-500" aria-label="logged" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-o1-muted">{slotLabel} budget · from what's left</p>
                  <p className="text-xs font-semibold tabular-nums mt-0.5">
                    <span className="text-o1-text">{budget.kcal.toLocaleString()} kcal</span>
                    <span className="text-o1-muted"> · </span>
                    <span className="text-o1-crimson">{budget.protein}g P</span>
                    <span className="text-o1-muted"> · </span>
                    <span className="text-amber-500">{budget.carbs}g C</span>
                    <span className="text-o1-muted"> · </span>
                    <span className="text-emerald-500">{budget.fats}g F</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      onOpenDietModal();
                    }}
                    aria-label={`Diet: ${dietPreference}. Change diet`}
                    className="h-8 pl-2.5 pr-3 rounded-full border border-white/[0.08] hover:border-white/20 text-[11px] font-medium text-o1-text flex items-center gap-1.5 cursor-pointer"
                  >
                    <Utensils className="w-3 h-3 text-o1-muted" />
                    {dietPreference}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setRotation((n) => n + 1);
                    }}
                    aria-label="Show different meals"
                    className="w-8 h-8 rounded-full border border-white/[0.08] hover:border-white/20 text-o1-muted hover:text-o1-text flex items-center justify-center active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {dayDone ? (
                <p className="rounded-xl bg-o1-surface border border-white/[0.05] p-3.5 text-xs text-o1-muted">
                  You've reached today's calorie target. Nothing left to plan.
                </p>
              ) : (
                <ul className="space-y-2">
                  {meals.map((meal) => {
                    const isLogged = loggedId === meal.id;
                    return (
                      <li key={meal.id} className="rounded-xl bg-o1-surface border border-white/[0.05] p-3 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-semibold text-o1-text leading-snug">{meal.name}</h4>
                            <span className="mt-0.5 flex items-center gap-2 text-[10px] text-o1-muted">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {meal.prepTime}
                              </span>
                              <span className={`px-1.5 py-px rounded-full border tabular-nums ${fitTone(meal.fit)}`}>{meal.fit}% fit</span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => logMeal(meal)}
                            disabled={isLogged}
                            className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer ${
                              isLogged ? 'bg-emerald-600 text-white' : 'bg-o1-crimson hover:bg-[#A30F16] active:bg-[#800C11] text-white'
                            }`}
                          >
                            {isLogged ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            {isLogged ? 'Logged' : 'Log'}
                          </button>
                        </div>

                        <ul className="space-y-1">
                          {meal.ingredients.map((ing) => (
                            <li key={ing.label} className="flex items-baseline justify-between gap-3 text-[11px]">
                              <span className="text-o1-text truncate">{ing.label}</span>
                              <span className="text-o1-muted tabular-nums shrink-0">{ing.display}</span>
                            </li>
                          ))}
                        </ul>

                        <p className="pt-2 border-t border-white/[0.05] text-[11px] font-semibold tabular-nums">
                          <span className="text-o1-text">{meal.calories.toLocaleString()} kcal</span>
                          <span className="text-o1-muted"> · </span>
                          <span className="text-o1-crimson">{meal.protein}g P</span>
                          <span className="text-o1-muted"> · </span>
                          <span className="text-amber-500">{meal.carbs}g C</span>
                          <span className="text-o1-muted"> · </span>
                          <span className="text-emerald-500">{meal.fats}g F</span>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="text-[10px] text-o1-muted leading-relaxed">
                Portions are solved to your remaining macros. Nutrition values from USDA FoodData Central; weights are cooked unless noted.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
};



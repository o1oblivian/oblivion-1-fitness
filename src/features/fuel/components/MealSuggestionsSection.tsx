import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  RefreshCw,
  Plus,
  Check,
  Clock,
  Utensils,
  Loader2,
} from 'lucide-react';
import { StillThumb } from '../../../components/StillThumb';
import { tactileEngine } from '../../../services/tactileEngine';
import { foodStill } from '../utils/foodStill';
import { MealItem } from '../store/useFuelStore';
import { MacroBudget, MealSlot, slotBudget } from '../data/mealBudget';
import type { MealSuggestion } from '../../../../shared/mealSuggestion';
import { useLiveMealSuggestions } from '../hooks/useLiveMealSuggestions';
import { warmApi } from '../../../services/apiBase';

const SLOTS: { key: MealSlot; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

function slotForNow(logged: readonly MealSlot[]): MealSlot {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  const byClock: MealSlot =
    h < 10.5 ? 'breakfast' : h < 16 ? 'lunch' : h < 17.5 ? 'snack' : h < 21.5 ? 'dinner' : 'snack';
  const order: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
  const start = order.indexOf(byClock);
  for (let i = 0; i < order.length; i++) {
    const s = order[(start + i) % order.length];
    if (!logged.includes(s)) return s;
  }
  return byClock;
}

function fitTone(fit: number): string {
  if (fit >= 90) return 'text-o1-olive border-o1-olive/40';
  if (fit >= 75) return 'text-o1-yellow border-o1-yellow/40';
  return 'text-o1-muted border-white/[0.08]';
}

const Macros: React.FC<{ kcal: number; protein: number; carbs: number; fats: number }> = ({
  kcal,
  protein,
  carbs,
  fats,
}) => (
  <>
    <span className="text-o1-text">{kcal.toLocaleString()} kcal</span>
    <span className="text-o1-muted"> · </span>
    <span className="text-o1-crimson">{protein}g P</span>
    <span className="text-o1-muted"> · </span>
    <span className="text-o1-yellow">{carbs}g C</span>
    <span className="text-o1-muted"> · </span>
    <span className="text-o1-olive">{fats}g F</span>
  </>
);

const MealOption: React.FC<{
  meal: MealSuggestion;
  isLogged: boolean;
  onLog: (meal: MealSuggestion) => void;
}> = ({ meal, isLogged, onLog }) => (
  <li className="rounded-xl bg-o1-well border border-white/[0.08] p-3 space-y-2.5">
    <div className="flex items-start justify-between gap-3">
      <StillThumb src={foodStill(meal)} />
      <div className="min-w-0 flex-1">
        <h4 className="text-o1-body font-semibold text-o1-text leading-snug">{meal.name}</h4>
        <span className="mt-0.5 flex items-center gap-2 text-o1-label text-o1-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {meal.prepTime}
          </span>
          <span className={`px-1.5 py-px rounded-full border tabular-nums ${fitTone(meal.fit)}`}>
            {meal.fit}% fit
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => onLog(meal)}
        disabled={isLogged}
        className={`shrink-0 h-9 px-3 rounded-full text-o1-body font-semibold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer ${
          isLogged
            ? 'bg-o1-olive text-white'
            : 'bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white'
        }`}
      >
        {isLogged ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        {isLogged ? 'Logged' : 'Log'}
      </button>
    </div>

    <ul className="space-y-1">
      {meal.ingredients.map((ing) => (
        <li key={ing.label} className="flex items-baseline justify-between gap-3 text-o1-label">
          <span className="text-o1-text truncate">{ing.label}</span>
          <span className="text-o1-muted tabular-nums shrink-0">{ing.display}</span>
        </li>
      ))}
    </ul>

    <p className="pt-2 border-t border-white/[0.05] text-o1-label font-semibold tabular-nums">
      <Macros kcal={meal.calories} protein={meal.protein} carbs={meal.carbs} fats={meal.fats} />
    </p>
  </li>
);

const MealPlaceholder: React.FC = () => (
  <div
    role="status"
    aria-label="Finding meals"
    className="rounded-xl bg-o1-well border border-white/[0.08] p-3 space-y-2.5 animate-pulse"
  >
    <div className="h-4 w-2/3 rounded bg-white/[0.08]" />
    <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
    <div className="space-y-1.5 pt-1">
      <div className="h-3 w-full rounded bg-white/[0.05]" />
      <div className="h-3 w-5/6 rounded bg-white/[0.05]" />
      <div className="h-3 w-4/6 rounded bg-white/[0.05]" />
    </div>
  </div>
);

interface MealSuggestionsSectionProps {
  calibrated: boolean;
  remaining: MacroBudget;
  loggedSlots: readonly MealSlot[];
  dietPreference?: string;
  country: string;
  /** Foods the person already logs often, so the ideas feel familiar. */
  usualNames: string[];
  onOpenDietModal: () => void;
  onAddMealItem: (slot: MealSlot, item: MealItem) => void;
  showToast: (msg: string) => void;
  /** Drawn in its own card, not as a divider inside the dashboard. */
  detached?: boolean;
}

/** The meal worth eating next, found live and sized to this meal's calories, with alternatives a tap away. */
export const MealSuggestionsSection: React.FC<MealSuggestionsSectionProps> = ({
  calibrated,
  remaining,
  loggedSlots,
  dietPreference = 'Omnivore',
  country,
  usualNames,
  onOpenDietModal,
  onAddMealItem,
  showToast,
  detached = false,
}) => {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [slot, setSlot] = useState<MealSlot>(() => slotForNow(loggedSlots));
  const [loggedId, setLoggedId] = useState<string | null>(null);

  const budget = useMemo(
    () => slotBudget(slot, remaining, loggedSlots),
    [slot, remaining, loggedSlots],
  );
  const dayDone = remaining.kcal < 150;
  const { state, refresh, retry, clearExclusions } = useLiveMealSuggestions({
    enabled: calibrated && !dayDone && open,
    slot,
    target: budget,
    diet: dietPreference,
    country,
    usuals: usualNames,
  });
  // Collapsed means nothing is fetched yet; waking the server now makes the first tap on Eat Insight quick.
  useEffect(() => {
    if (calibrated) warmApi();
  }, [calibrated]);

  const slotLabel = SLOTS.find((s) => s.key === slot)?.label ?? slot;
  const [best, ...others] = state.meals;

  // Without targets the hero already asks for them; a second prompt here would only repeat it.
  if (!calibrated) return null;

  const logMeal = (meal: MealSuggestion) => {
    tactileEngine.triggerImpactPulse();
    setLoggedId(meal.id);
    const stamp = Date.now();
    [...meal.ingredients].reverse().forEach((ing, i) => {
      onAddMealItem(slot, {
        id: `suggest-${stamp}-${i}-${meal.id}`,
        name: `${ing.label} · ${ing.display}`,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fats: ing.fats,
      });
    });
    showToast(
      `Logged ${meal.name} to ${slotLabel} · ${meal.ingredients.length} items, +${meal.calories} kcal`,
    );
    window.setTimeout(() => setLoggedId(null), 1500);
  };

  return (
    <section
      id="o1fc-intel-meal-suggestions-tab"
      aria-label="Eat Insight"
      className={
        detached
          ? 'space-y-3 select-none'
          : 'mt-3 pt-3 border-t border-white/[0.08] space-y-3 select-none'
      }
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="o1fc-eat-insight-body"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setOpen((v) => !v);
        }}
        className="w-full flex items-start justify-between gap-3 text-left cursor-pointer"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-o1-control font-semibold text-o1-text">
            <Sparkles className="w-4 h-4 text-o1-olive shrink-0" />
            Eat Insight
          </span>
          <span className="mt-0.5 block text-o1-label text-o1-muted tabular-nums">
            {dayDone ? "You've reached today's calorie target." : `Ideas for ${slotLabel.toLowerCase()}`}
          </span>
        </span>
        {open && state.status === 'loading' ? (
          <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-o1-muted" aria-hidden />
        ) : (
          <ChevronDown
            className={`w-4 h-4 shrink-0 mt-0.5 text-o1-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        )}
      </button>

      {open ? (
        <div id="o1fc-eat-insight-body" className="space-y-3">
          {state.status === 'loading' ? <MealPlaceholder /> : null}

          {state.status === 'error' ? (
            <div
              role="alert"
              className="rounded-xl bg-o1-well border border-white/[0.08] p-3.5 space-y-2.5"
            >
              <p className="text-o1-body text-o1-muted">{state.message}</p>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  retry();
                }}
                className="h-9 px-4 rounded-full border border-white/[0.08] text-o1-body font-medium text-o1-text cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : null}

          {best ? (
            <ul>
              <MealOption meal={best} isLogged={loggedId === best.id} onLog={logMeal} />
            </ul>
          ) : null}

          {state.status === 'ready' ? (
            <button
              type="button"
              aria-expanded={showMore}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setShowMore((v) => !v);
              }}
              className="w-full h-10 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] text-o1-body font-medium text-o1-muted cursor-pointer"
            >
              {showMore ? 'Fewer options' : 'More options'}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`}
              />
            </button>
          ) : null}

          {showMore && !dayDone ? (
            <div className="space-y-3">
              <div
                className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-o1-well border border-white/[0.08]"
                role="tablist"
                aria-label="Meal slot"
              >
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
                        clearExclusions();
                      }}
                      className={`h-9 rounded-lg text-o1-label font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        active ? 'bg-o1-text text-black' : 'text-o1-muted hover:text-o1-text'
                      }`}
                    >
                      {s.label}
                      {done && <Check className="w-3 h-3 text-o1-olive" aria-label="logged" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-o1-label font-semibold tabular-nums">
                  <Macros
                    kcal={budget.kcal}
                    protein={budget.protein}
                    carbs={budget.carbs}
                    fats={budget.fats}
                  />
                  <span className="block font-normal text-o1-muted">budget for this meal</span>
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      onOpenDietModal();
                    }}
                    aria-label={`Diet: ${dietPreference}. Change diet`}
                    className="h-9 pl-2.5 pr-3 rounded-full border border-white/[0.08] text-o1-label font-medium text-o1-text flex items-center gap-1.5 cursor-pointer"
                  >
                    <Utensils className="w-3 h-3 text-o1-muted" />
                    {dietPreference}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      refresh();
                    }}
                    aria-label="Show different meals"
                    className="w-9 h-9 rounded-full border border-white/[0.08] text-o1-muted hover:text-o1-text flex items-center justify-center active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <ul className="space-y-2">
                {others.map((meal) => (
                  <MealOption
                    key={meal.id}
                    meal={meal}
                    isLogged={loggedId === meal.id}
                    onLog={logMeal}
                  />
                ))}
              </ul>

              <p className="text-o1-label text-o1-muted leading-relaxed">
                Meals are suggested live. Every portion is sized from USDA FoodData Central values
                so the calories match this meal; weights are as eaten.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MacroBudget, MealSlot, MealSuggestion } from '../../../../shared/mealSuggestion';
import { fetchMealSuggestions, normalizeRequest } from '../services/mealSuggestionService';

type SuggestionState =
  | { status: 'idle'; meals: MealSuggestion[] }
  | { status: 'loading'; meals: MealSuggestion[] }
  | { status: 'ready'; meals: MealSuggestion[] }
  | { status: 'error'; meals: MealSuggestion[]; message: string };

interface LiveMealInput {
  enabled: boolean;
  slot: MealSlot;
  target: MacroBudget;
  diet: string;
  country: string;
  usuals: string[];
}

/** Live meal ideas for one meal, refetched when the meal, its calorie target or the diet changes. */
export function useLiveMealSuggestions({
  enabled,
  slot,
  target,
  diet,
  country,
  usuals,
}: LiveMealInput) {
  const [state, setState] = useState<SuggestionState>({ status: 'idle', meals: [] });
  const [excluded, setExcluded] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);

  const requestKey = useMemo(
    () =>
      JSON.stringify(normalizeRequest({ slot, target, diet, country, usuals, exclude: excluded })),
    [slot, target, diet, country, usuals, excluded],
  );

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', meals: [] });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading', meals: [] });
    fetchMealSuggestions(JSON.parse(requestKey), controller.signal)
      .then((meals) => setState({ status: 'ready', meals }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          meals: [],
          message: err instanceof Error ? err.message : 'Meal ideas are not available right now.',
        });
      });
    return () => controller.abort();
  }, [enabled, requestKey, attempt]);

  /** Asks for different meals than the ones on screen. */
  const refresh = useCallback(() => {
    setExcluded((names) => [...names, ...state.meals.map((m) => m.name)]);
  }, [state.meals]);

  /** Tries the same request again after a failure. */
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  /** Forgets the meals already seen, for when a different meal slot is chosen. */
  const clearExclusions = useCallback(() => setExcluded([]), []);

  return { state, refresh, retry, clearExclusions };
}

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { searchFoods, type FoodItemRecord } from '../../../services/foodCatalogService';
import { filterCustomFoods } from '../../../services/customFoodDatabase';
import { mergeFoods } from '../../../services/browseFoodsService';
import { filterByFoodQuery } from '../utils/foodSearchMatch';

/** Wait this long after the last keystroke before searching, so one search is sent per word typed. */
const SEARCH_DEBOUNCE_MS = 150;
const SEARCH_LIMIT = 60;

/**
 * Live food search for the Add Food sheet. Matches from the saved foods and the lists already
 * on the phone show on the keystroke itself; the network answer replaces them when it arrives.
 */
export function useFoodSearch(
  isOpen: boolean,
  searchQuery: string,
  countryMarket: string | null | undefined,
  instantPoolRef: MutableRefObject<FoodItemRecord[]>,
) {
  const [foods, setFoods] = useState<FoodItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const typed = searchQuery.trim().length > 0;
    setIsLoading(typed);
    // Matches from the saved foods and the lists already loaded show on the keystroke itself.
    const instant = typed
      ? mergeFoods(
          filterCustomFoods(undefined, searchQuery.trim()),
          filterByFoodQuery(instantPoolRef.current, searchQuery),
        ).slice(0, SEARCH_LIMIT)
      : [];
    if (typed) setFoods(instant);

    const timer = setTimeout(
      async () => {
        try {
          const result = await searchFoods({
            query: searchQuery,
            country: countryMarket || 'AU',
            limit: SEARCH_LIMIT,
            signal: controller.signal,
            onPartial: (partial) => {
              if (controller.signal.aborted || partial.items.length === 0) return;
              setFoods(partial.items);
              setIsLoading(false);
            },
          });
          if (controller.signal.aborted) return;
          setFoods(result.items.length > 0 ? result.items : instant);
        } catch {
          if (controller.signal.aborted) return;
          setFoods(instant);
        } finally {
          if (!controller.signal.aborted) setIsLoading(false);
        }
      },
      typed ? SEARCH_DEBOUNCE_MS : 0,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, searchQuery, countryMarket, instantPoolRef]);

  return { foods, setFoods, isLoading };
}

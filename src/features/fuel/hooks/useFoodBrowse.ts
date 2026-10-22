import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { FoodItemRecord } from '../../../services/foodCatalogService';
import { loadPopularFoods, type PopularList } from '../../../services/popularFoodsService';
import { browseFoods, mergeFoods, type BrowseAnswer } from '../../../services/browseFoodsService';
import type { FoodBrowseId } from '../../../../shared/foodBrowse';

/** What the list shows while nothing is typed: one category of the country's most popular foods, or the person's own saved foods. */
export type Browse = 'mine' | FoodBrowseId;

/** Waits before a category part that did not answer is asked again in the background. */
const RETRY_AFTER_MS = [8_000, 20_000, 45_000, 90_000, 180_000];
/** A category list shows this many foods, and this many more each time "Show more" is tapped. */
export const PAGE_SIZE = 100;
/** Packaged products from the country's own shelves that are listed ahead of the plain foods. */
const LOCAL_FIRST = 30;

/**
 * The browse lists of the Add Food sheet: the built-in popular foods, the live category read
 * (with quiet background retries) and the paging over the merged result. Everything it loads is
 * also published to `instantPoolRef` so typed searches can match it before the network answers.
 */
export function useFoodBrowse(
  isOpen: boolean,
  browse: Browse,
  countryMarket: string | null | undefined,
  instantPoolRef: MutableRefObject<FoodItemRecord[]>,
) {
  const [popularList, setPopularList] = useState<PopularList | null>(null);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [popularAttempt, setPopularAttempt] = useState(0);
  const [livePlain, setLivePlain] = useState<BrowseAnswer | null>(null);
  const [liveLocal, setLiveLocal] = useState<BrowseAnswer | null>(null);
  const [shownCount, setShownCount] = useState(PAGE_SIZE);
  const popularCategory = browse === 'mine' ? null : browse;

  // The list is built into the app. It is read as soon as the country is known, so opening the sheet shows it at once.
  useEffect(() => {
    let cancelled = false;
    setPopularError(null);
    loadPopularFoods(countryMarket || 'AU')
      .then((list) => {
        if (!cancelled) setPopularList(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPopularList(null);
        setPopularError(err instanceof Error ? err.message : 'Popular foods could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [countryMarket, popularAttempt]);

  // The whole category is read live: plain foods at once, the country's packaged products when they arrive.
  // A part that does not answer is asked again quietly in the background, and the list fills in when it does.
  useEffect(() => {
    if (!isOpen || popularCategory === null) return;
    setLivePlain(null);
    setLiveLocal(null);
    setShownCount(PAGE_SIZE);
    const controller = new AbortController();
    const retries: ReturnType<typeof setTimeout>[] = [];
    const country = countryMarket || 'AU';
    const read = (
      part: 'plain' | 'local',
      set: Dispatch<SetStateAction<BrowseAnswer | null>>,
      attempt: number,
    ) => {
      browseFoods({ category: popularCategory, country, part, signal: controller.signal })
        .then((answer) => {
          if (controller.signal.aborted) return;
          // A refresh that comes back empty never replaces foods already on screen.
          set((shown) => (shown !== null && answer.items.length === 0 ? shown : answer));
          if (answer.failed.length > 0) {
            const wait = RETRY_AFTER_MS[Math.min(attempt, RETRY_AFTER_MS.length - 1)];
            retries.push(setTimeout(() => read(part, set, attempt + 1), wait));
          }
        })
        .catch(() => undefined);
    };
    read('plain', setLivePlain, 0);
    read('local', setLiveLocal, 0);
    return () => {
      controller.abort();
      retries.forEach(clearTimeout);
    };
  }, [isOpen, popularCategory, countryMarket]);

  // Everything already loaded can be searched without waiting for the network.
  useEffect(() => {
    instantPoolRef.current = mergeFoods(
      popularList?.foods ?? [],
      livePlain?.items ?? [],
      liveLocal?.items ?? [],
    );
  }, [popularList, livePlain, liveLocal, instantPoolRef]);

  const popularFoods = useMemo(() => {
    if (!popularList) return [];
    return popularList.foods.filter((f) => f.browse === browse);
  }, [popularList, browse]);
  // The country's staples lead, then its best-scanned packaged products, then every plain food in the category.
  const categoryFoods = useMemo(() => {
    const local = liveLocal?.items ?? [];
    return mergeFoods(
      popularFoods,
      local.slice(0, LOCAL_FIRST),
      livePlain?.items ?? [],
      local.slice(LOCAL_FIRST),
    );
  }, [popularFoods, livePlain, liveLocal]);

  return {
    popularCategory,
    popularList,
    popularError,
    retryPopular: () => setPopularAttempt((count) => count + 1),
    livePlain,
    liveLocal,
    categoryFoods,
    shownCount,
    showMore: () => setShownCount((count) => count + PAGE_SIZE),
  };
}

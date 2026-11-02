import { useCallback, useEffect, useMemo, useState } from 'react';
import { IAP_PRODUCTS, type IAPProductInfo } from '../../types/iap';
import { revenueCatService, type StoreCatalog } from '../../services/revenueCatService';
import { BUILD_STAMP } from '../../services/buildStamp';
import { storeCopy } from '../../utils/storeCopy';

export type StoreStatus = 'loading' | 'ready' | 'unavailable';

export interface StorePlans {
  status: StoreStatus;
  /** The plans from `products` the store sells right now, in the same order. Empty until it answers. */
  offered: (products: readonly IAPProductInfo[]) => IAPProductInfo[];
  /** The store's own price in the buyer's currency, or `null` for a plan the store did not price. */
  priceOf: (product: IAPProductInfo) => string | null;
  /** "Unable to reach the App Store." while `status` is `'unavailable'`, otherwise `null`. */
  error: string | null;
  /** Asks the store again after a failure. */
  retry: () => void;
  /** Which build this is and which store step it is on, or the store's own reason for failing. Empty once prices are in. */
  detail: string;
}

interface Loaded {
  status: StoreStatus;
  prices: Record<string, string>;
  issue: string | null;
}

/** However the store behaves, the spinner ends with a reason after this long. */
const PRICE_DEADLINE_MS = 20_000;
const LOADING: Loaded = { status: 'loading', prices: {}, issue: null };
const PRODUCTS = Object.values(IAP_PRODUCTS);

/** Reads each plan's store price out of a product list. */
function pricesFrom(catalog: StoreCatalog): Record<string, string> {
  const prices: Record<string, string> = {};
  for (const product of PRODUCTS) {
    const price = revenueCatService.packageForPlan(catalog, product.productId)?.product
      ?.priceString;
    if (price) prices[product.productId] = price;
  }
  return prices;
}

/** A paywall opened after the store already answered starts with prices, not a spinner. */
function initialState(): Loaded {
  const cached = revenueCatService.peekOfferings();
  if (!cached) return LOADING;
  const prices = pricesFrom(cached);
  return Object.keys(prices).length > 0 ? { status: 'ready', prices, issue: null } : LOADING;
}

/**
 * The one place every paywall learns which plans are on sale and what they cost.
 * Plans and prices come from the store only, so a screen never lists a plan the store did not
 * return, and a store that cannot be reached is reported instead of waited on.
 */
export function useStorePlans(enabled: boolean = true): StorePlans {
  const [loaded, setLoaded] = useState<Loaded>(initialState);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (!revenueCatService.isNative()) {
      setLoaded({ status: 'unavailable', prices: {}, issue: 'Plans are sold in the mobile app.' });
      return;
    }
    let cancelled = false;
    setLoaded((current) => (current.status === 'ready' ? current : LOADING));
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const tooSlow = new Promise<never>((_, reject) => {
      deadline = setTimeout(() => reject(new Error('store answer too slow')), PRICE_DEADLINE_MS);
    });
    Promise.race([revenueCatService.getOfferings(), tooSlow])
      .then((offerings) => {
        if (cancelled) return;
        const prices = pricesFrom(offerings);
        setLoaded(
          Object.keys(prices).length > 0
            ? { status: 'ready', prices, issue: null }
            : {
                status: 'unavailable',
                prices: {},
                issue: revenueCatService.lastIssue ?? 'The store returned no plans.',
              },
        );
      })
      .catch((err: unknown) => {
        console.error('[StorePlans] Store offerings failed', err);
        if (!cancelled)
          setLoaded({
            status: 'unavailable',
            prices: {},
            issue: revenueCatService.lastIssue ?? 'The store did not answer in time.',
          });
      })
      .finally(() => clearTimeout(deadline));
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  // While waiting, redraw each second so the step and its timer on screen stay current.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!enabled || loaded.status !== 'loading') return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [enabled, loaded.status]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  // Read on every render: the text carries the seconds elapsed, so it changes as the timer redraws.
  const progress = revenueCatService.progress;

  return useMemo<StorePlans>(() => {
    const priceOf = (product: IAPProductInfo) => loaded.prices[product.productId] ?? null;
    return {
      status: loaded.status,
      offered: (products) => products.filter((product) => priceOf(product) !== null),
      priceOf,
      error: loaded.status === 'unavailable' ? `Unable to reach ${storeCopy().inSentence}.` : null,
      retry,
      detail:
        loaded.status === 'ready'
          ? ''
          : loaded.status === 'unavailable' && loaded.issue
            ? loaded.issue
            : `Build ${BUILD_STAMP} · ${progress}`,
    };
  }, [loaded, retry, progress]);
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { IAP_PRODUCTS, type IAPProductInfo } from '../../types/iap';
import { revenueCatService, type StoreCatalog } from '../../services/revenueCatService';
import { BUILD_STAMP } from '../../services/buildStamp';

/** What a plan button can do right now. Paid plans are only `ready` once the store has priced them. */
export type PlanAvailability = 'free' | 'ready' | 'loading' | 'unavailable';

export interface StorePlans {
  /** The store's own price in the buyer's currency. Paid plans show `--` until the store answers. */
  priceOf: (product: IAPProductInfo) => string;
  availability: (product: IAPProductInfo) => PlanAvailability;
  /** Why this plan cannot be bought yet, in words the athlete can act on. Null when it can. */
  notice: (product: IAPProductInfo) => string | null;
  /** Asks the store again after a failure. */
  retry: () => void;
  /** Which build this is and which store step it is on. Empty once prices are in. Shown small under the buy button. */
  detail: string;
}

interface Loaded {
  status: 'loading' | 'ready' | 'unavailable';
  prices: Record<string, string>;
  issue: string | null;
}

/** However the store behaves, the spinner ends with a reason after this long. */
const PRICE_DEADLINE_MS = 20_000;
const LOADING: Loaded = { status: 'loading', prices: {}, issue: null };
const PAID_PRODUCTS = Object.values(IAP_PRODUCTS).filter((product) => !product.isFree);

/** Reads each paid plan's store price out of a product list. */
function pricesFrom(catalog: StoreCatalog): Record<string, string> {
  const prices: Record<string, string> = {};
  for (const product of PAID_PRODUCTS) {
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
 * The one place every paywall learns what plans cost.
 * Prices come from the store only, never from the catalog, so a screen can never show a price
 * the store did not confirm, and a missing store is reported instead of waited on.
 */
export function useStorePlans(enabled: boolean = true): StorePlans {
  const [loaded, setLoaded] = useState<Loaded>(initialState);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (!revenueCatService.isNative()) {
      setLoaded({
        status: 'unavailable',
        prices: {},
        issue: 'Prices load in the iOS or Android app.',
      });
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
                issue:
                  revenueCatService.lastIssue ??
                  'The store returned no prices. Check your connection and try again.',
              },
        );
      })
      .catch(() => {
        if (!cancelled)
          setLoaded({
            status: 'unavailable',
            prices: {},
            issue:
              revenueCatService.lastIssue ??
              'The store did not answer in time. Check your connection and try again.',
          });
      })
      .finally(() => clearTimeout(deadline));
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  // While waiting, redraw each second so the step and its timer on screen stay current.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled || loaded.status !== 'loading') return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [enabled, loaded.status]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return useMemo<StorePlans>(() => {
    const availability = (product: IAPProductInfo): PlanAvailability => {
      if (product.isFree) return 'free';
      if (loaded.prices[product.productId]) return 'ready';
      return loaded.status === 'loading' ? 'loading' : 'unavailable';
    };
    return {
      priceOf: (product) =>
        product.isFree ? (product.price ?? '$0') : (loaded.prices[product.productId] ?? '--'),
      availability,
      notice: (product) => {
        const state = availability(product);
        if (state === 'free' || state === 'ready' || state === 'loading') return null;
        return loaded.status === 'ready'
          ? `${product.name} is not live in the store yet.`
          : loaded.issue;
      },
      retry,
      detail:
        loaded.status === 'ready' ? '' : `Build ${BUILD_STAMP} · ${revenueCatService.progress}`,
    };
    // `tick` makes the step timer redraw while waiting.
  }, [loaded, retry, tick]);
}

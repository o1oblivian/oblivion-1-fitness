import { useCallback, useEffect, useMemo, useState } from 'react';
import { IAP_PRODUCTS, type IAPProductInfo } from '../../types/iap';
import { revenueCatService } from '../../services/revenueCatService';

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
}

interface Loaded {
  status: 'loading' | 'ready' | 'unavailable';
  prices: Record<string, string>;
  issue: string | null;
}

const LOADING: Loaded = { status: 'loading', prices: {}, issue: null };
const PAID_PRODUCTS = Object.values(IAP_PRODUCTS).filter((product) => !product.isFree);

/**
 * The one place every paywall learns what plans cost.
 * Prices come from the store only, never from the catalog, so a screen can never show a price
 * the store did not confirm, and a missing store is reported instead of waited on.
 */
export function useStorePlans(enabled: boolean = true): StorePlans {
  const [loaded, setLoaded] = useState<Loaded>(LOADING);
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
    setLoaded(LOADING);
    revenueCatService
      .getOfferings()
      .then((offerings) => {
        if (cancelled) return;
        const prices: Record<string, string> = {};
        for (const product of PAID_PRODUCTS) {
          const price = revenueCatService.packageForPlan(offerings, product.productId)?.product
            ?.priceString;
          if (price) prices[product.productId] = price;
        }
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
            issue: 'The store could not be reached. Check your connection and try again.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return useMemo<StorePlans>(() => {
    const availability = (product: IAPProductInfo): PlanAvailability => {
      if (product.isFree) return 'free';
      if (loaded.prices[product.productId]) return 'ready';
      return loaded.status === 'loading' ? 'loading' : 'unavailable';
    };
    return {
      priceOf: (product) =>
        product.isFree ? product.price : (loaded.prices[product.productId] ?? '--'),
      availability,
      notice: (product) => {
        const state = availability(product);
        if (state === 'free' || state === 'ready' || state === 'loading') return null;
        return loaded.status === 'ready'
          ? `${product.name} is not live in the store yet.`
          : loaded.issue;
      },
      retry,
    };
  }, [loaded, retry]);
}

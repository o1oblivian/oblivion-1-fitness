import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/apiBase';
import { IAP_PRODUCTS } from '../../types/iap';

const REFRESH_MS = 15_000;

export interface FreeAccessSpots {
  cap: number;
  remaining: number;
}

/** "100,000 places · 99,982 left", or a plain note once they are all taken. Empty until the server answers. */
export function freeAccessLine(spots: FreeAccessSpots | null): string {
  if (!spots) return '';
  if (spots.remaining <= 0)
    return `All ${spots.cap.toLocaleString()} places for 90-day full access are taken`;
  return `${spots.cap.toLocaleString()} places for 90-day full access · ${spots.remaining.toLocaleString()} left`;
}

export function isFreeAccessProduct(productId: string): boolean {
  return productId === IAP_PRODUCTS.core_free.productId;
}

/** Live count of the 100,000 places that include 90 days of full access. Polls while the plan screen is open. */
export function useFreeAccessSpots(active: boolean): FreeAccessSpots | null {
  const [spots, setSpots] = useState<FreeAccessSpots | null>(null);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch('/api/billing/free-access');
        if (!res.ok) return;
        const body = (await res.json()) as { cap?: unknown; remaining?: unknown };
        if (cancelled || typeof body.cap !== 'number' || typeof body.remaining !== 'number') return;
        setSpots({ cap: body.cap, remaining: body.remaining });
      } catch {
        // Keep the last count. The next poll tries again.
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active]);
  return spots;
}

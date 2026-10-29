import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/apiBase';
import { IAP_PRODUCTS } from '../../types/iap';

const REFRESH_MS = 15_000;

export interface FounderPasses {
  cap: number;
  remaining: number;
}

/** "5,000 of 5,000 left", then a lower number as passes sell. Empty until the server answers. */
export function founderPassLine(stock: FounderPasses | null): string {
  if (!stock) return '';
  const cap = stock.cap.toLocaleString();
  if (stock.remaining <= 0) return `${cap} founder passes · Sold out`;
  return `${cap} founder passes · ${stock.remaining.toLocaleString()} left`;
}

export function isFounderProduct(productId: string): boolean {
  return productId === IAP_PRODUCTS.founder_pass.productId;
}

/** Live remaining Founder Passes. Polls while the plan screen is open. */
export function useFounderPasses(active: boolean): FounderPasses | null {
  const [stock, setStock] = useState<FounderPasses | null>(null);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch('/api/billing/founder-passes');
        if (!res.ok) return;
        const body = (await res.json()) as { cap?: unknown; remaining?: unknown };
        if (cancelled || typeof body.cap !== 'number' || typeof body.remaining !== 'number') return;
        setStock({ cap: body.cap, remaining: body.remaining });
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
  return stock;
}

import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/apiBase';
import { IAP_PRODUCTS } from '../../types/iap';

const REFRESH_MS = 15_000;

export interface FounderPasses {
  cap: number;
  remaining: number;
}

/** "4,321 of 5,000 left". Empty until the server answers. */
export function founderPassLine(stock: FounderPasses | null): string {
  if (!stock) return '';
  const cap = stock.cap.toLocaleString();
  if (stock.remaining <= 0) return `All ${cap} Founder Passes are sold`;
  return `${stock.remaining.toLocaleString()} of ${cap} Founder Passes left`;
}

/** True once the server reports every pass sold. An unknown count is not sold out. */
export function founderSoldOut(stock: FounderPasses | null): boolean {
  return stock !== null && stock.remaining <= 0;
}

export function isFounderProduct(productId: string): boolean {
  return productId === IAP_PRODUCTS.founder_pass.productId;
}

/** Live remaining Founder Passes from the server. Polls while a plan screen is open. */
export function useFounderPasses(active: boolean): FounderPasses | null {
  const [stock, setStock] = useState<FounderPasses | null>(null);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch('/api/billing/founder-passes');
        if (!res.ok) {
          console.warn(`[FounderPasses] Count unavailable (${res.status}); keeping the last one`);
          return;
        }
        const body = (await res.json()) as { cap?: unknown; remaining?: unknown };
        if (cancelled || typeof body.cap !== 'number' || typeof body.remaining !== 'number') return;
        setStock({ cap: body.cap, remaining: body.remaining });
      } catch (err) {
        // The last count stays on screen; the next poll tries again.
        console.warn('[FounderPasses] Count request failed', err);
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

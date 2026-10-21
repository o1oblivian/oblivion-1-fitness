import { AlertCircle, Loader2 } from 'lucide-react';
import { openLegalUrl } from '../../../services/apiBase';
import type { PlanCopy } from '../../membership/planCatalog';
import type { PlanAvailability } from '../../membership/useStorePlans';
import type { MembershipTier } from '../consultationTypes';

interface PlanCheckoutProps {
  plan: PlanCopy;
  picked: MembershipTier;
  /** Localised store price of the picked plan. */
  price: string;
  availability: PlanAvailability;
  /** A purchase, restore, or finish is in progress. */
  working: boolean;
  restoring: boolean;
  error: string | null;
  onBuy: () => void;
  onStartFree: () => void;
  onRestore: () => void;
}

/** The buy button, "start free" link, price disclosure, restore, and legal links under the plan list. */
export function PlanCheckout({
  plan,
  picked,
  price,
  availability,
  working,
  restoring,
  error,
  onBuy,
  onStartFree,
  onRestore,
}: PlanCheckoutProps) {
  return (
    <footer className="mx-auto w-full max-w-[480px] shrink-0 bg-gradient-to-t from-black via-black/90 to-black/0 px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3">
      {error ? (
        <div
          role="alert"
          className="mb-2 flex items-start gap-2.5 rounded-xl bg-o1-bad-wash/60 px-3.5 py-2.5 text-o1-label font-normal leading-snug text-o1-bad-ink backdrop-blur-md"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onBuy}
        disabled={working || availability === 'loading'}
        className="flex h-10 w-full items-center justify-center rounded-full bg-o1-crimson text-o1-body font-medium text-white transition hover:bg-o1-crimson-hover active:scale-[0.98] active:bg-o1-crimson-press disabled:opacity-60"
      >
        {working || availability === 'loading' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : plan.product.isFree ? (
          `Start with ${picked === 'coach' ? 'Coach Starter' : 'Core'}`
        ) : availability === 'unavailable' ? (
          'Retry store connection'
        ) : plan.renews ? (
          `Subscribe · ${price} per month`
        ) : (
          `Buy once · ${price}`
        )}
      </button>
      {!plan.product.isFree ? (
        <button
          type="button"
          onClick={onStartFree}
          disabled={working}
          className="h-9 w-full text-o1-caption font-normal text-o1-muted"
        >
          Not now, start free
        </button>
      ) : null}
      <p className="mt-1 text-center text-o1-label font-normal leading-snug text-o1-muted/70">
        {plan.product.isFree
          ? 'No payment needed. Upgrade any time from Settings.'
          : availability !== 'ready'
            ? 'Prices come from the App Store or Google Play.'
            : plan.renews
              ? `Renews monthly at ${price} until cancelled. Cancel at least 24 hours before renewal in your App Store or Google Play settings.`
              : 'One payment through the App Store or Google Play. It never renews.'}
      </p>
      <div className="flex items-center justify-center gap-5 text-o1-label font-normal text-o1-muted">
        <button type="button" onClick={onRestore} disabled={working} className="h-8">
          {restoring ? 'Restoring…' : 'Restore purchases'}
        </button>
        <button type="button" onClick={() => void openLegalUrl('terms')} className="h-9">
          Terms
        </button>
        <button type="button" onClick={() => void openLegalUrl('privacy')} className="h-9">
          Privacy
        </button>
      </div>
    </footer>
  );
}

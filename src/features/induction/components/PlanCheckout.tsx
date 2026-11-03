import { AlertCircle, Loader2 } from 'lucide-react';
import { LEGAL_URLS, openLegalUrl } from '../../../services/apiBase';
import { storeCopy } from '../../../utils/storeCopy';
import type { PlanCopy } from '../../membership/planCatalog';

interface PlanCheckoutProps {
  /** The picked plan, or `null` when the store is offering nothing to buy. */
  plan: PlanCopy | null;
  /** The store's price for the picked plan. */
  price: string | null;
  /** A purchase, restore, or finish is in progress. */
  working: boolean;
  restoring: boolean;
  error: string | null;
  onBuy: () => void;
  onNotNow: () => void;
  onRestore: () => void;
}

/** The buy button, "not now" link, price disclosure, restore, and legal links under the plan list. */
export function PlanCheckout({
  plan,
  price,
  working,
  restoring,
  error,
  onBuy,
  onNotNow,
  onRestore,
}: PlanCheckoutProps) {
  const store = storeCopy();
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
      {plan && price ? (
        <>
          <button
            type="button"
            onClick={onBuy}
            disabled={working}
            className="flex h-10 w-full items-center justify-center rounded-full bg-o1-crimson text-o1-body font-medium text-white transition hover:bg-o1-crimson-hover active:scale-[0.98] active:bg-o1-crimson-press disabled:opacity-60"
          >
            {working ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : plan.renews ? (
              `Subscribe · ${price} per month`
            ) : (
              `Buy once · ${price}`
            )}
          </button>
          {plan.renews ? (
            <p className="mt-2 text-center text-xs font-normal leading-snug text-o1-text">
              {plan.product.name}. Length: 1 month.{price ? ` Price: ${price}.` : ''}
            </p>
          ) : null}
          <p className="mt-2 text-center text-xs font-normal leading-snug text-o1-muted">
            {plan.renews
              ? store.renewalDisclosure
              : `One payment through ${store.inSentence}. It never renews.`}
          </p>
        </>
      ) : null}
      <button
        type="button"
        onClick={onNotNow}
        disabled={working}
        className="h-9 w-full text-o1-caption font-normal text-o1-muted"
      >
        Not now
      </button>
      <div className="flex items-center justify-center gap-5 text-o1-label font-normal text-o1-muted">
        <button type="button" onClick={onRestore} disabled={working} className="h-8 underline">
          {restoring ? 'Restoring…' : 'Restore Purchases'}
        </button>
        <a
          href={LEGAL_URLS.appleEula}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            e.preventDefault();
            void openLegalUrl('eula');
          }}
          className="inline-flex h-9 items-center underline"
        >
          Terms of Use (EULA)
        </a>
        <a
          href={LEGAL_URLS.privacy}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            e.preventDefault();
            void openLegalUrl('privacy');
          }}
          className="inline-flex h-9 items-center underline"
        >
          Privacy Policy
        </a>
      </div>
    </footer>
  );
}

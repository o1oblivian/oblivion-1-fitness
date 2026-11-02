import React from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { storeCopy } from '../../../utils/storeCopy';
import type { StorePlans } from '../useStorePlans';

interface Props {
  plans: StorePlans;
  /** How many plans the store returned for this screen. */
  offeredCount: number;
}

/** In place of the plan list: a spinner while the store answers, or why it did not and a Retry button. */
export const StorePlansState: React.FC<Props> = ({ plans, offeredCount }) => {
  const store = storeCopy();
  if (plans.status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-2 py-8 text-o1-label text-o1-muted"
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading plans from {store.inSentence}…</span>
        {plans.detail ? (
          <span className="text-o1-faint text-center break-words">{plans.detail}</span>
        ) : null}
      </div>
    );
  }
  const message =
    plans.error ??
    (offeredCount === 0 ? `No plans are on sale in ${store.inSentence} right now.` : null);
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.07] bg-o1-well p-4 text-center"
    >
      <span className="flex items-center gap-2 text-xs font-semibold text-o1-text">
        <AlertCircle className="h-4 w-4 shrink-0 text-o1-crimson" />
        {message}
      </span>
      {plans.detail ? (
        <span className="text-o1-label text-o1-faint break-words">{plans.detail}</span>
      ) : null}
      <button
        type="button"
        onClick={plans.retry}
        className="mt-1 flex min-h-[44px] items-center gap-2 rounded-full border border-white/[0.14] px-5 text-xs font-semibold text-white active:scale-95"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
};

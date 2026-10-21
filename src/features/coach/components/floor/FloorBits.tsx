import type { ReactNode } from 'react';

/** A quiet message card for a list with nothing in it yet. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-white/[0.07] bg-o1-surface px-4 py-6 text-center text-o1-body text-o1-muted">
      {children}
    </p>
  );
}

/** A load failure with a Retry button. */
export function RetryAlert({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-2 rounded-xl border border-o1-crimson/30 bg-o1-crimson/10 px-3 py-2"
    >
      <p className="text-o1-caption text-o1-text">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[36px] px-2 text-o1-caption font-semibold text-o1-text"
      >
        Retry
      </button>
    </div>
  );
}

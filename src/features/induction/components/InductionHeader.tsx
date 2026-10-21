import { ArrowLeft } from 'lucide-react';

interface InductionHeaderProps {
  canGoBack: boolean;
  /** 1-based position of the current screen out of `total`. */
  position: number;
  total: number;
  onBack: () => void;
  onSkip: () => void;
}

/** Back button, "n of total" counter, Skip, and the progress bar. */
export function InductionHeader({
  canGoBack,
  position,
  total,
  onBack,
  onSkip,
}: InductionHeaderProps) {
  return (
    <header className="mx-auto w-full max-w-[480px] shrink-0 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex h-11 items-center justify-between">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-o1-text"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : (
          <span className="h-11 w-11" />
        )}
        <span className="text-o1-label font-normal tabular-nums text-o1-muted">
          {position} of {total}
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="-mr-2 h-11 px-2 text-o1-body font-normal text-o1-muted"
        >
          Skip
        </button>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${index < position ? 'bg-o1-crimson' : 'bg-white/[0.1]'}`}
          />
        ))}
      </div>
    </header>
  );
}

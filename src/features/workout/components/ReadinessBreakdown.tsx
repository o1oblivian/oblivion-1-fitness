import React from 'react';
import { useTodayIntel } from '../../report/useTodayIntel';
import { TONE_HEX } from '../../report/palette';

/** Shows what the readiness score is made of, so the number is never a black box. */
export const ReadinessBreakdown: React.FC = () => {
  const intel = useTodayIntel();
  return (
    <section
      aria-label="Why this readiness score"
      className="rounded-2xl bg-o1-card border border-white/[0.07] p-4 space-y-2"
    >
      <h3 className="text-o1-label font-num font-bold tracking-[0.18em] text-o1-muted">
        Why this number
      </h3>
      <p className="text-o1-body font-medium text-o1-text leading-snug">{intel.headline}</p>
      <ul className="divide-y divide-white/[0.05]">
        {intel.signals.map((signal) => (
          <li key={signal.id} className="py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-o1-caption font-medium text-o1-text">{signal.label}</div>
              <div className="text-o1-label text-o1-muted">{signal.note}</div>
            </div>
            <span
              className="text-o1-control font-num shrink-0"
              style={{ color: TONE_HEX[signal.tone] }}
            >
              {signal.display}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-o1-label text-o1-muted leading-snug">
        The score is the average of the signals you have logged.
      </p>
    </section>
  );
};

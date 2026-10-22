import React, { useState } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useSubscription } from '../../../context/SubscriptionContext';
import { IntelInsightsModal } from './IntelInsightsModal';

const FEATURES = ['Week grade', 'Readiness', 'Load', 'Muscle map'];

export const IntelInsightsCard: React.FC = () => {
  const { hasFullAccess } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        id="card-intel-insights"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setIsOpen(true);
        }}
        aria-label={
          hasFullAccess ? 'Open Oblivion Intel Insights' : 'Oblivion Intel Insights, Pro feature'
        }
        className="group relative overflow-hidden w-full text-left rounded-2xl border border-white/[0.09] hover:border-white/[0.16] bg-o1-surface px-4 py-3.5 mb-3 transition-colors cursor-pointer select-none flex items-center gap-4 active:scale-[0.99]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(234,232,223,0.07),transparent_55%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent"
        />

        <span className="relative min-w-0 flex-1">
          <span className="block text-o1-control font-light tracking-wide text-o1-pure leading-tight">
            Oblivion Intel Insights
          </span>
          <span className="flex flex-wrap items-center gap-x-1.5 mt-1.5 text-o1-label text-o1-muted leading-none">
            {FEATURES.map((f, i) => (
              <React.Fragment key={f}>
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="w-[3px] h-[3px] rounded-full bg-white/[0.22]"
                  />
                )}
                <span>{f}</span>
              </React.Fragment>
            ))}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="relative shrink-0 px-2 py-1 rounded-md border border-o1-crimson/60 text-o1-label font-medium tracking-wider text-o1-text"
        >
          PRO
        </span>
      </button>

      <IntelInsightsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

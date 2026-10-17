import React, { useState } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useSubscription } from '../../../context/SubscriptionContext';
import { IntelInsightsModal } from './IntelInsightsModal';

const FEATURES = ['Week grade', 'Readiness', 'Load', 'Muscle map'];

export const IntelInsightsCard: React.FC = () => {
  const { isPro } = useSubscription();
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
        aria-label={isPro ? 'Open My progress' : 'My progress, Pro feature'}
        className="group relative overflow-hidden w-full text-left rounded-2xl border border-white/[0.09] hover:border-white/[0.16] bg-o1-surface px-4 py-3.5 mb-3 transition-colors cursor-pointer select-none flex items-center gap-4 active:scale-[0.99]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(234,232,223,0.07),transparent_55%)]"
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent" />

        <span className="relative min-w-0 flex-1">
          <span className="block text-[11px] font-medium tracking-[0.2em] uppercase text-o1-muted">Oblivion Pro</span>
          <span className="block text-[15px] font-light tracking-wide text-[#FFFFFF] leading-tight mt-1">My progress</span>
          <span className="flex flex-wrap items-center gap-x-1.5 mt-1.5 text-[11px] text-o1-muted leading-none">
            {FEATURES.map((f, i) => (
              <React.Fragment key={f}>
                {i > 0 && <span aria-hidden="true" className="w-[3px] h-[3px] rounded-full bg-white/[0.22]" />}
                <span>{f}</span>
              </React.Fragment>
            ))}
          </span>
        </span>

        <span className="relative w-9 h-9 rounded-full border border-white/[0.12] bg-black/40 flex items-center justify-center shrink-0 transition-colors group-hover:border-white/[0.24]">
          {isPro ? (
            <ChevronRight className="w-4 h-4 text-o1-text group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-o1-text" aria-hidden="true" />
          )}
        </span>
      </button>

      <IntelInsightsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};



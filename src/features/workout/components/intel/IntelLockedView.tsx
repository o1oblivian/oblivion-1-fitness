import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { useSubscription } from '../../../../context/SubscriptionContext';

const LOCKED_FEATURES = [
  'Your week graded A to F, with the reasons behind it',
  "Today's readiness call and load targets for every lift",
  'Acute : chronic load and per-muscle recovery',
  'Muscle map, strength trend, sleep and fuel adherence',
  'Next-week moves you can start in one tap',
];

/** What a free user sees instead of the Intel tabs: a blurred preview and the upgrade pitch. */
export const IntelLockedView: React.FC = () => {
  const { openPaywall } = useSubscription();
  return (
    <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3">
      <section className="relative overflow-hidden rounded-2xl bg-o1-surface border border-white/[0.07] p-4">
        <div aria-hidden="true" className="blur-[6px] opacity-60 pointer-events-none space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border border-o1-emerald/40 flex items-center justify-center text-4xl font-light font-num text-o1-emerald">
              B
            </div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-3/4 rounded bg-white/15" />
              <div className="h-3 w-1/2 rounded bg-white/10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-11 rounded-xl bg-o1-sheet border border-white/[0.07]" />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-6 h-6 text-o1-text" />
        </div>
      </section>
      <section className="rounded-2xl bg-o1-sheet border border-white/[0.07] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-o1-amber-deep" />
          <h4 className="text-sm font-medium">Part of Club Pass Pro</h4>
        </div>
        <ul className="space-y-2">
          {LOCKED_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-o1-body text-o1-text/90">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-o1-crimson shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            openPaywall('Intel Insights');
          }}
          className="w-full min-h-[48px] rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          Unlock Oblivion Intel Insights
        </button>
      </section>
    </div>
  );
};

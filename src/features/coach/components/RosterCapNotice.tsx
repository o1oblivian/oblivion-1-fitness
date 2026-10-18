import React, { useEffect, useState } from 'react';
import { useSubscription } from '../../../context/SubscriptionContext';
import { tactileEngine } from '../../../services/tactileEngine';
import { COACH_PAYWALL_FEATURE } from '../../membership/planCatalog';
import { fetchRosterStatus, type RosterStatus } from '../services/rosterCap';

/** Shows Coach Starter's seats (for example 3 of 5) and the upgrade route. Nothing for Coach Pro. */
export const RosterCapNotice: React.FC<{ seated: number }> = ({ seated }) => {
  const { openPaywall } = useSubscription();
  const [status, setStatus] = useState<RosterStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchRosterStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, [seated]);

  if (!status || status.limit === null) return null;
  const full = status.active >= status.limit;

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-o1-surface p-3"
    >
      <div className="min-w-0 flex-1">
        <p className="text-o1-control font-semibold text-o1-text">
          {full
            ? `Roster full · ${status.active} of ${status.limit} athletes`
            : `Coach Starter · ${status.active} of ${status.limit} athletes`}
        </p>
        <p className="text-o1-caption text-o1-muted">
          {full
            ? 'New athletes cannot join until you upgrade. After upgrading, turn on accepting new athletes in your profile.'
            : 'Coach Pro removes the limit and lowers the fee on program sales.'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          openPaywall(COACH_PAYWALL_FEATURE);
        }}
        className="h-[44px] shrink-0 rounded-xl bg-o1-crimson px-4 text-o1-body font-semibold text-white active:scale-[0.98]"
      >
        Upgrade
      </button>
    </div>
  );
};

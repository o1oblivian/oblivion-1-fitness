import React, { useState } from 'react';
import { RotateCcw, ShieldCheck, Sparkles, Crown } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { tactileEngine } from '../../services/tactileEngine';

interface MembershipSectionProps {
  onManage?: () => void;
  onShowToast?: (msg: string) => void;
}

export const SettingsMembershipSection: React.FC<MembershipSectionProps> = ({
  onManage,
  onShowToast,
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const { restorePurchases, openPaywall, isPro } = useSubscription();

  const handleRestore = async () => {
    tactileEngine.triggerSelectionBuzz();
    setIsRestoring(true);
    let isRestored = false;
    try {
      isRestored = await restorePurchases();
    } catch (err) {
      setIsRestoring(false);
      onShowToast?.(
        err instanceof Error
          ? err.message
          : 'Could not reach the store. Check your connection and try again.',
      );
      return;
    }
    setIsRestoring(false);
    if (isRestored) {
      tactileEngine.playPRCelebration();
      onShowToast?.('Purchases restored: O1 Club Pass Pro is active.');
    } else {
      onShowToast?.('No prior active subscriptions found on this account.');
    }
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-o1-muted font-bold px-1 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-o1-gold" /> Membership &amp; Entitlements
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] p-3 space-y-2 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-sans font-semibold text-white block truncate">
              {isPro ? 'O1 Club Pass Pro' : 'Core Free'}
            </span>

            <p className="text-xs text-o1-muted mt-1">
              {isPro ? 'Club Pass is active.' : 'Club Pass is available when you want it.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              if (onManage) onManage();
              else openPaywall('O1 Club Pass Pro Upgrade');
            }}
            className="o1-pill bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-sans font-semibold cursor-pointer active:scale-95"
          >
            {isPro ? (
              <span>Plans</span>
            ) : (
              <>
                <Crown className="w-3 h-3" />
                <span>Upgrade</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-o1-label font-num text-o1-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-o1-olive" />
            <span>Private backup • Zero 3rd-party trackers</span>
          </div>

          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="o1-pill bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] text-xs font-sans font-semibold text-o1-stone cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

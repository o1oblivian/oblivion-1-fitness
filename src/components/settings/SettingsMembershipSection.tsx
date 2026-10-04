import React, { useState } from 'react';
import { RotateCcw, ShieldCheck, Sparkles, Clock, Crown, ArrowRight } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { tactileEngine } from '../../services/tactileEngine';

interface MembershipSectionProps {
  onManage?: () => void;
  onShowToast?: (msg: string) => void;
}

export const SettingsMembershipSection: React.FC<MembershipSectionProps> = ({ onManage, onShowToast }) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const { isPro, trialState, restorePurchases, openPaywall } = useSubscription();

  const handleRestore = async () => {
    tactileEngine.triggerSelectionBuzz();
    setIsRestoring(true);
    const isRestored = await restorePurchases();
    setIsRestoring(false);
    if (isRestored) {
      tactileEngine.playPRCelebration();
      onShowToast?.('Purchases restored: O1 Club Pass Pro is active.');
    } else {
      onShowToast?.('No prior active subscriptions found on this account.');
    }
  };

  const isTrialActive = !trialState.hasSubscribedPro && trialState.isTrialActive;
  const isExpired = trialState.isTrialExpired;

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-[#C4121A] font-bold uppercase px-1 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#C4121A]" /> Membership &amp; Entitlements
      </h3>

      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-tactical font-bold uppercase text-neutral-900 dark:text-white truncate">
                {trialState.hasSubscribedPro ? 'O1 Club Pass Pro' : isTrialActive ? 'Core Free (90-Day All-Access Trial)' : 'Core Free (Trial Expired)'}
              </span>

              {trialState.hasSubscribedPro ? (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-600/30">
                  PRO SUBSCRIBER
                </span>
              ) : isTrialActive ? (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-600/30 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{trialState.daysRemaining} DAYS REMAINING</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600/30">
                  GATE ACTIVE • PRO UPGRADE NEEDED
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {trialState.hasSubscribedPro
                ? 'Full lifetime / active subscription with cloud sync and radar active.'
                : isTrialActive
                ? `Enjoying full complimentary trial access across all features. Automatically converts after 90 days.`
                : 'Your 90-day complimentary full-access window has ended. Upgrade to keep using Pro intelligence & radar.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              if (onManage) onManage();
              else openPaywall('O1 Club Pass Pro Upgrade');
            }}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-[#C4121A] hover:bg-[#A30F16] text-white text-xs font-tactical font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs flex items-center gap-1"
          >
            {trialState.hasSubscribedPro ? (
              <span>Plans</span>
            ) : (
              <>
                <Crown className="w-3 h-3" />
                <span>Upgrade</span>
              </>
            )}
          </button>
        </div>

        {/* 90-Day Trial Progress Meter if on Core Free */}
        {!trialState.hasSubscribedPro && (
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-600 dark:text-neutral-300 font-bold">
                90-Day Complimentary Window
              </span>
              <span className="text-[#C4121A] font-bold">
                {isExpired ? 'Ended' : `${trialState.daysRemaining} of 90 days left`}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isExpired ? 'bg-amber-500' : 'bg-[#C4121A]'}`}
                style={{ width: `${Math.min(100, Math.max(5, ((90 - trialState.daysRemaining) / 90) * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">
              {isExpired
                ? 'Basic workout logging is always free. Premium Telemetry & Radar requires an active pass.'
                : 'Workout Logger and Hydration stay free forever even after 90 days.'}
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Private Cloud Sync • Zero 3rd-Party Trackers</span>
          </div>

          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#18181B] hover:bg-neutral-200 dark:hover:bg-[#202024] border border-neutral-200 dark:border-neutral-700 text-[10px] font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default SettingsMembershipSection;

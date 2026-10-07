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
      <h3 className="text-xs font-tactical tracking-wider text-o1-crimson font-bold uppercase px-1 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-o1-crimson" /> Membership &amp; Entitlements
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] p-3 space-y-2 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-tactical font-bold uppercase text-white truncate">
                {trialState.hasSubscribedPro ? 'O1 Club Pass Pro' : isTrialActive ? 'Core Free (90-Day All-Access Trial)' : 'Core Free (Trial Expired)'}
              </span>

              {trialState.hasSubscribedPro ? (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border bg-emerald-950/40 text-emerald-400 border-emerald-600/30">
                  PRO SUBSCRIBER
                </span>
              ) : isTrialActive ? (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border bg-sky-950/40 text-sky-400 border-sky-600/30 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{trialState.daysRemaining} DAYS REMAINING</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border bg-amber-950/40 text-amber-400 border-amber-600/30">
                  GATE ACTIVE • PRO UPGRADE NEEDED
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-400 mt-1">
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
            className="shrink-0 px-3 py-1.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-tactical font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs flex items-center gap-1"
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
          <div className="p-3 rounded-xl bg-o1-well border border-white/[0.07] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-300 font-bold">
                90-Day Complimentary Window
              </span>
              <span className="text-o1-crimson font-bold">
                {isExpired ? 'Ended' : `${trialState.daysRemaining} of 90 days left`}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isExpired ? 'bg-amber-500' : 'bg-o1-crimson'}`}
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

        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Private Cloud Sync • Zero 3rd-Party Trackers</span>
          </div>

          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] text-[10px] font-mono font-bold uppercase text-neutral-300 transition active:scale-95 cursor-pointer disabled:opacity-50"
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

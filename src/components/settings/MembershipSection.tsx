import React from 'react';
import { SectionHeader, SettingsGroup } from './SettingsShared';
import { useSubscription } from '@/utils/useSubscription';

interface Props {
  onOpenPayPlan?: (highlightTier?: 'premium' | 'coach') => void;
}

export function MembershipSection({ onOpenPayPlan }: Props) {
  const { tier, isPaid, isTrialActive, trialDaysLeft } = useSubscription();

  const tierLabel = tier === 'premium' ? 'Premium Athlete' : tier === 'coach_pro' ? 'Coach Pro' : tier === 'premium_travel' ? 'Premium + Travel' : 'Free Tier Athlete';

  return (
    <div>
      <SectionHeader title="Membership & Billing" />
      <SettingsGroup>
        <div className="min-h-[52px] px-3.5 py-1.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                {tierLabel}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-50 dark:bg-red-950/40 text-[#DC2626] border border-red-200 dark:border-red-900/50">
                {isPaid ? 'Active' : isTrialActive ? 'Trial' : 'Free'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isPaid
                ? 'Subscription active & fully unlocked'
                : isTrialActive
                  ? `${trialDaysLeft} days remaining in trial`
                  : 'Upgrade for unlimited access & coach features'}
            </p>
          </div>

          {onOpenPayPlan && (
            <button
              type="button"
              onClick={() => onOpenPayPlan('premium')}
              className="shrink-0 h-[26px] px-2.5 rounded-full bg-[#DC2626] text-white text-[11px] font-semibold flex items-center justify-center hover:bg-red-600 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              {isPaid ? 'Manage' : 'Upgrade'}
            </button>
          )}
        </div>
      </SettingsGroup>
    </div>
  );
}

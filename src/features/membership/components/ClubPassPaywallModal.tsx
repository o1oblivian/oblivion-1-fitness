import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, RotateCcw, Check, Sparkles, Loader2 } from 'lucide-react';
import { useSubscription } from '../../../context/SubscriptionContext';
import { tactileEngine } from '../../../services/tactileEngine';
import { planKind, revenueCatService } from '../../../services/revenueCatService';
import { IAP_PRODUCTS, IAPProductInfo } from '../../../types/iap';

type Audience = 'athletes' | 'coaches';

const PLANS: Record<Audience, readonly IAPProductInfo[]> = {
  athletes: [IAP_PRODUCTS.founder_pass, IAP_PRODUCTS.core_free, IAP_PRODUCTS.premium, IAP_PRODUCTS.premium_travel],
  coaches: [IAP_PRODUCTS.coach_free, IAP_PRODUCTS.coach_pro],
};

const DEFAULT_PLAN: Record<Audience, string> = {
  athletes: IAP_PRODUCTS.premium.productId,
  coaches: IAP_PRODUCTS.coach_pro.productId,
};

const PAID_PLAN_IDS = [...PLANS.athletes, ...PLANS.coaches].filter((p) => !p.isFree).map((p) => p.productId);

const PERKS = [
  'Meal scan and the cardio console',
  'Coach programs and the video vault',
  'Radar and the rest of Club Pass',
];

export const ClubPassPaywallModal: React.FC = () => {
  const { isPaywallOpen, closePaywall } = useSubscription();
  const [audience, setAudience] = useState<Audience>('athletes');
  const [selectedId, setSelectedId] = useState(DEFAULT_PLAN.athletes);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [storePrices, setStorePrices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isPaywallOpen || !revenueCatService.isNative()) return;
    let live = true;
    revenueCatService
      .getOfferings()
      .then((offerings) => {
        const next: Record<string, string> = {};
        for (const id of PAID_PLAN_IDS) {
          const price = revenueCatService.packageForPlan(offerings, id)?.product?.priceString;
          if (price) next[id] = String(price);
        }
        if (live) setStorePrices(next);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [isPaywallOpen]);

  if (!isPaywallOpen) return null;

  const plans = PLANS[audience];
  const selected = plans.find((p) => p.productId === selectedId) || plans[0];
  const kind = planKind(selected.productId);
  const priceOf = (plan: IAPProductInfo) => storePrices[plan.productId] || (plan.isFree ? plan.price : `${plan.price} AUD`);
  const ctaLabel = selected.isFree
    ? 'Continue Free →'
    : kind === 'lifetime'
      ? `Get Lifetime Access → ${priceOf(selected)}`
      : `Subscribe → ${priceOf(selected)}/mo`;

  const switchAudience = (next: Audience) => {
    tactileEngine.triggerSelectionBuzz();
    setAudience(next);
    setSelectedId(DEFAULT_PLAN[next]);
    setStatusMsg(null);
  };

  const handlePrimary = async () => {
    tactileEngine.triggerSelectionBuzz();
    setStatusMsg(null);
    if (selected.isFree) {
      closePaywall();
      return;
    }
    setIsPurchasing(true);
    const res = await revenueCatService.purchasePackage(selected.productId);
    setIsPurchasing(false);
    if (res.success) {
      tactileEngine.playPRCelebration();
      closePaywall();
    } else {
      setStatusMsg(res.error || 'Available via the App Store or Google Play.');
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setStatusMsg(null);
    tactileEngine.triggerSelectionBuzz();
    const res = await revenueCatService.restore();
    setIsRestoring(false);
    if (res.success && res.info.isActive) {
      tactileEngine.playPRCelebration();
      closePaywall();
    } else {
      setStatusMsg('No active subscription found for this account.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black o1-sheet-scrim o1-sheet-cover flex items-end justify-center select-none">
      <div className="o1-sheet-card o1-sheet-tall bg-o1-card border border-white/[0.07] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] bg-o1-card">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-zinc-400"><Sparkles className="w-4 h-4" /></div>
            <h2 className="text-sm font-sans font-semibold text-white">Club Pass</h2>
          </div>
          <button onClick={closePaywall} aria-label="Close" className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 bg-o1-card flex-1 min-h-0">
          <div role="tablist" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-o1-well border border-white/[0.07]">
            {(['athletes', 'coaches'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={audience === tab}
                onClick={() => switchAudience(tab)}
                className={`py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider cursor-pointer transition ${
                  audience === tab ? 'bg-o1-card text-white border border-white/[0.07]' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {audience === 'athletes' && (
            <div className="space-y-1.5 py-0.5">
              {PERKS.map((p) => (
                <div key={p} className="flex items-center gap-2 text-xs font-mono text-neutral-200">
                  <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /><span>{p}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-1">
            {plans.map((plan) => (
              <button
                key={plan.productId}
                type="button"
                onClick={() => { tactileEngine.triggerSelectionBuzz(); setSelectedId(plan.productId); setStatusMsg(null); }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  selected.productId === plan.productId ? 'bg-o1-well border-[rgba(196,18,26,0.4)]' : 'bg-o1-card border-white/[0.07] hover:border-white/[0.14]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-white">{plan.name}</span>
                    {plan.badge && <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-o1-well text-zinc-400 border border-white/[0.07] font-bold">{plan.badge}</span>}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">{plan.description}</span>
                </div>
                <span className="text-sm font-black font-mono text-white shrink-0 text-right">
                  {priceOf(plan)}
                  <span className="text-[10px] font-normal text-neutral-400">{plan.periodText}</span>
                </span>
              </button>
            ))}
          </div>
          {statusMsg && (
            <div role="status" className="p-3 rounded-2xl bg-o1-warn-wash border border-amber-500/30 text-o1-warn-ink text-xs font-mono text-center flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/[0.05] bg-o1-card space-y-2">
          <button
            onClick={handlePrimary}
            disabled={isPurchasing}
            className="w-full py-3.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white font-tactical font-black text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition disabled:opacity-50"
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Connecting to store billing...</span>
              </>
            ) : (
              <>
                {!selected.isFree && <ShieldCheck className="w-4 h-4" />}
                <span>{ctaLabel}</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-3 text-[10px] font-sans text-neutral-400">
            <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer" className="hover:text-white underline">Terms of Use (EULA)</a>
            <span>•</span>
            <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noreferrer" className="hover:text-white underline">Privacy Policy</a>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
            <button onClick={handleRestore} disabled={isRestoring} className="text-zinc-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50">
              <RotateCcw className={`w-3 h-3 text-zinc-400 ${isRestoring ? 'animate-spin' : ''}`} />
              <span>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</span>
            </button>
            <span>{kind === 'lifetime' ? 'One-time payment' : 'Cancel anytime in Store'}</span>
          </div>

          <p className="text-[8.5px] font-mono text-neutral-500 text-center leading-tight">
            {kind === 'lifetime'
              ? 'Founder Pass is a one-time, non-recurring purchase. Billed via Apple App Store or Google Play.'
              : 'Subscriptions auto-renew unless cancelled 24h before period end. Billed via Apple App Store or Google Play.'}
          </p>
        </div>
      </div>
    </div>
  );
};
export default ClubPassPaywallModal;

import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, RotateCcw, Check, Sparkles, Loader2 } from 'lucide-react';
import { useSubscription } from '../../../context/SubscriptionContext';
import { tactileEngine } from '../../../services/tactileEngine';
import { planKind } from '../../../services/revenueCatService';
import { openLegalUrl } from '../../../services/apiBase';
import { IAP_PRODUCTS, IAPProductInfo } from '../../../types/iap';
import { COACH_PAYWALL_FEATURE } from '../planCatalog';
import { useStorePlans } from '../useStorePlans';
import { useStorePurchase } from '../useStorePurchase';
import { founderPassLine, isFounderProduct, useFounderPasses } from '../useFounderPasses';
import { freeAccessLine, isFreeAccessProduct, useFreeAccessSpots } from '../useFreeAccessSpots';

type Audience = 'athletes' | 'coaches';

const PLANS: Record<Audience, readonly IAPProductInfo[]> = {
  athletes: [IAP_PRODUCTS.founder_pass, IAP_PRODUCTS.core_free, IAP_PRODUCTS.premium],
  coaches: [IAP_PRODUCTS.coach_free, IAP_PRODUCTS.coach_pro],
};

const DEFAULT_PLAN: Record<Audience, string> = {
  athletes: IAP_PRODUCTS.premium.productId,
  coaches: IAP_PRODUCTS.coach_pro.productId,
};

const PERKS = [
  'Meal scan and the cardio console',
  'Coach programs and the video vault',
  'Every wallpaper and dial face, plus data export',
];

export const ClubPassPaywallModal: React.FC = () => {
  const { isPaywallOpen, gatedFeature, closePaywall, restorePurchases } = useSubscription();
  const [audience, setAudience] = useState<Audience>('athletes');
  const [selectedId, setSelectedId] = useState(DEFAULT_PLAN.athletes);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const storePlans = useStorePlans(isPaywallOpen);
  const purchase = useStorePurchase();
  const founder = useFounderPasses(isPaywallOpen);
  const founderLine = founderPassLine(founder);
  const freeLine = freeAccessLine(useFreeAccessSpots(isPaywallOpen));

  // Opening from a coach prompt (roster full) lands on the coach plans; every other entry starts on athletes.
  useEffect(() => {
    if (!isPaywallOpen) return;
    const next: Audience = gatedFeature === COACH_PAYWALL_FEATURE ? 'coaches' : 'athletes';
    setAudience(next);
    setSelectedId(DEFAULT_PLAN[next]);
  }, [isPaywallOpen, gatedFeature]);

  if (!isPaywallOpen) return null;

  const plans = PLANS[audience];
  const selected = plans.find((p) => p.productId === selectedId) || plans[0];
  const kind = planKind(selected.productId);
  const availability = storePlans.availability(selected);
  const priceOf = storePlans.priceOf;
  const notice = statusMsg ?? purchase.error ?? storePlans.notice(selected);
  const waiting = purchase.busy || availability === 'loading';
  const ctaLabel = selected.isFree
    ? 'Continue Free →'
    : availability === 'unavailable'
      ? 'Retry store connection'
      : kind === 'lifetime'
        ? `Get Lifetime Access → ${priceOf(selected)}`
        : `Subscribe → ${priceOf(selected)}/mo`;

  const select = (productId: string) => {
    purchase.clearError();
    setSelectedId(productId);
    setStatusMsg(null);
  };

  const switchAudience = (next: Audience) => {
    tactileEngine.triggerSelectionBuzz();
    setAudience(next);
    select(DEFAULT_PLAN[next]);
  };

  const handlePrimary = async () => {
    tactileEngine.triggerSelectionBuzz();
    purchase.clearError();
    setStatusMsg(null);
    if (selected.isFree) {
      closePaywall();
      return;
    }
    if (isFounderProduct(selected.productId) && founder && founder.remaining <= 0) {
      setStatusMsg('Founder Pass is sold out.');
      return;
    }
    if (availability === 'unavailable') {
      storePlans.retry();
      return;
    }
    if (await purchase.buy(selected.productId)) {
      tactileEngine.playPRCelebration();
      closePaywall();
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setStatusMsg(null);
    tactileEngine.triggerSelectionBuzz();
    // Through the app's subscription state, so the restored plan unlocks features straight away.
    const restored = await restorePurchases();
    setIsRestoring(false);
    if (restored) {
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
            <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-o1-muted">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-sans font-semibold text-white">Club Pass</h2>
          </div>
          <button
            onClick={closePaywall}
            aria-label="Close"
            className="p-1.5 text-o1-muted hover:text-white rounded-full cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 bg-o1-card flex-1 min-h-0">
          <div
            role="tablist"
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-o1-well border border-white/[0.07]"
          >
            {(['athletes', 'coaches'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={audience === tab}
                onClick={() => switchAudience(tab)}
                className={`py-2 rounded-lg text-o1-label font-num font-bold uppercase tracking-wider cursor-pointer transition ${
                  audience === tab
                    ? 'bg-o1-card text-white border border-white/[0.07]'
                    : 'text-o1-muted hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {audience === 'athletes' && (
            <div className="space-y-1.5 py-0.5">
              {PERKS.map((p) => (
                <div key={p} className="flex items-center gap-2 text-xs font-num text-o1-ink-soft">
                  <Check className="w-3.5 h-3.5 text-o1-muted shrink-0" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-1">
            {plans.map((plan) => (
              <button
                key={plan.productId}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  select(plan.productId);
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  selected.productId === plan.productId
                    ? 'bg-o1-well border-[rgba(196,18,26,0.4)]'
                    : 'bg-o1-card border-white/[0.07] hover:border-white/[0.14]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-num text-white">{plan.name}</span>
                    {plan.badge && (
                      <span className="text-o1-label font-num px-2 py-0.5 rounded-full bg-o1-well text-o1-muted border border-white/[0.07] font-bold">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-o1-label font-num text-o1-muted block mt-0.5">
                    {plan.description}
                  </span>
                  {(isFounderProduct(plan.productId) ? founderLine : '') ||
                  (isFreeAccessProduct(plan.productId) ? freeLine : '') ? (
                    <span className="text-o1-label font-num tabular-nums text-o1-gold block mt-0.5">
                      {isFounderProduct(plan.productId) ? founderLine : freeLine}
                    </span>
                  ) : null}
                </div>
                <span className="text-sm font-black font-num text-white shrink-0 text-right">
                  {priceOf(plan)}
                  <span className="text-o1-label font-normal text-o1-muted">{plan.periodText}</span>
                </span>
              </button>
            ))}
          </div>
          {notice && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-o1-warn-wash border border-o1-yellow/30 text-o1-warn-ink text-xs font-num text-center flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/[0.05] bg-o1-card space-y-2">
          <button
            onClick={handlePrimary}
            disabled={waiting}
            className="w-full py-3.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white font-tactical font-black text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition disabled:opacity-50"
          >
            {waiting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{purchase.busy ? 'Opening the store...' : 'Loading store prices...'}</span>
              </>
            ) : (
              <>
                {!selected.isFree && <ShieldCheck className="w-4 h-4" />}
                <span>{ctaLabel}</span>
              </>
            )}
          </button>

          {storePlans.detail ? (
            <p className="text-o1-label font-num text-o1-faint text-center break-words">
              {storePlans.detail}
            </p>
          ) : null}

          <div className="flex items-center justify-center gap-3 text-o1-label font-sans text-o1-muted">
            <button
              type="button"
              onClick={() => void openLegalUrl('terms')}
              className="hover:text-white underline cursor-pointer"
            >
              Terms of Use
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => void openLegalUrl('privacy')}
              className="hover:text-white underline cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>

          <div className="flex items-center justify-between text-o1-label font-num text-o1-muted px-1">
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="text-o1-muted hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3 h-3 text-o1-muted ${isRestoring ? 'animate-spin' : ''}`} />
              <span>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</span>
            </button>
            <span>{kind === 'lifetime' ? 'One-time payment' : 'Cancel anytime in Store'}</span>
          </div>

          <p className="text-o1-label font-num text-o1-faint text-center leading-tight">
            {kind === 'lifetime'
              ? 'Founder Pass is a one-time, non-recurring purchase. Billed via Apple App Store or Google Play.'
              : 'Subscriptions auto-renew unless cancelled 24h before period end. Billed via Apple App Store or Google Play.'}
          </p>
        </div>
      </div>
    </div>
  );
};

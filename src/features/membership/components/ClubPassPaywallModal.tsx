import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, RotateCcw, Check, Sparkles, Loader2 } from 'lucide-react';
import { useSubscription } from '../../../context/SubscriptionContext';
import { tactileEngine } from '../../../services/tactileEngine';
import { revenueCatService } from '../../../services/revenueCatService';

const TIERS = [
  { id: 'com.o1fc.fitness.plus_monthly', name: 'Monthly Access', price: '$9.99', period: '/ month', cadence: 'Billed monthly until cancelled', badge: 'MONTHLY' },
  { id: 'o1fc_founder_pass', name: 'Founder Pass', price: '$24.00', period: ' lifetime', cadence: 'One-time lifetime access', badge: 'FOUNDER' },
];

const PERKS = [
  'Meal scan and the cardio console',
  'Coach programs and the video vault',
  'Radar and the rest of Club Pass',
];

export const ClubPassPaywallModal: React.FC = () => {
  const { isPaywallOpen, closePaywall } = useSubscription();
  const [selectedTier, setSelectedTier] = useState(TIERS[0].id);
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
        const packages = revenueCatService.listPackages(offerings).filter((pkg) => !pkg?.isFallback);
        const label = (pkg: any) => `${pkg?.identifier || ''} ${pkg?.packageType || ''} ${pkg?.product?.identifier || ''}`;
        const monthly = packages.find((pkg) => /month/i.test(label(pkg)))?.product?.priceString;
        const lifetime = packages.find((pkg) => /founder|lifetime/i.test(label(pkg)))?.product?.priceString;
        const next: Record<string, string> = {};
        if (monthly) next[TIERS[0].id] = monthly;
        if (lifetime) next[TIERS[1].id] = lifetime;
        if (live) setStorePrices(next);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [isPaywallOpen]);

  if (!isPaywallOpen) return null;
  const currentTier = TIERS.find((t) => t.id === selectedTier) || TIERS[0];
  const priceOf = (tier: (typeof TIERS)[number]) => storePrices[tier.id] || tier.price;

  const handleNativePurchase = async () => {
    setIsPurchasing(true);
    setStatusMsg(null);
    tactileEngine.triggerSelectionBuzz();
    const res = await revenueCatService.purchasePackage(currentTier.id);
    setIsPurchasing(false);
    if (res.success) {
      tactileEngine.playPRCelebration();
      closePaywall();
    } else {
      setStatusMsg(res.error || 'Membership Tier Available via App Store / Google Play');
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
            <div>
              <h2 className="text-sm font-sans font-semibold text-white">Club Pass</h2>
            </div>
          </div>
          <button onClick={closePaywall} className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 bg-o1-card flex-1 min-h-0">
          <div className="space-y-1.5 py-0.5">
            {PERKS.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono text-neutral-200">
                <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /><span>{p}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            {TIERS.map((tier) => (
              <button
                key={tier.id} type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setSelectedTier(tier.id); }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  selectedTier === tier.id ? 'bg-o1-well border-white/[0.07]' : 'bg-o1-card border-white/[0.07] hover:border-white/[0.14]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-white">{tier.name}</span>
                    {tier.badge && <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-o1-well text-zinc-400 border border-white/[0.07] font-bold">{tier.badge}</span>}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">{tier.cadence}</span>
                </div>
                <span className="text-sm font-black font-mono text-white">{priceOf(tier)}</span>
              </button>
            ))}
          </div>
          {statusMsg && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono text-center flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/[0.05] bg-o1-card space-y-2">
          <button
            onClick={handleNativePurchase}
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
                <ShieldCheck className="w-4 h-4" />
                <span>SUBSCRIBE VIA STORE • {priceOf(currentTier)} {currentTier.period}</span>
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
            <span>Cancel anytime in Store</span>
          </div>

          <p className="text-[8.5px] font-mono text-neutral-500 text-center leading-tight">
            Subscription auto-renews unless cancelled 24h before period end. Billed via Apple App Store or Google Play.
          </p>
        </div>
      </div>
    </div>
  );
};
export default ClubPassPaywallModal;

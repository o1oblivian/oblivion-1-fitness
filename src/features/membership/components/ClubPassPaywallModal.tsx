import React, { useState } from 'react';
import { X, ShieldCheck, Zap, RotateCcw, Check, Sparkles, Loader2 } from 'lucide-react';
import { useSubscription } from '../../../context/SubscriptionContext';
import { tactileEngine } from '../../../services/tactileEngine';
import { revenueCatService } from '../../../services/revenueCatService';
import { MembershipCheckoutModal } from './MembershipCheckoutModal';

const TIERS = [
  { id: 'com.o1fc.fitness.plus_monthly', name: 'Monthly Access', price: '$9.99', period: '/ month', cadence: 'Billed monthly until cancelled', badge: 'STANDARD' },
  { id: 'com.o1fc.fitness.plus_annual', name: 'Annual Pass', price: '$79.99', period: '/ year', cadence: 'Billed $79.99 annually ($6.67/mo)', badge: 'SAVE 40% • BLACK TIER' },
];

const PERKS = [
  'Cardio Console & G-Shock Optical OCR Scanner',
  'Optical Vision Macro & Nutrition Biometrics',
  'Coach Direct Broadcasts & Biomechanical Vault',
  '250km Radar Vector & Athlete Pro Network',
  'Private Cloud Sync • Zero 3rd-Party Trackers • Zero Ad Bloat',
];

export const ClubPassPaywallModal: React.FC = () => {
  const { isPaywallOpen, closePaywall, gatedFeature } = useSubscription();
  const [selectedTier, setSelectedTier] = useState(TIERS[1].id);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isPaywallOpen) return null;
  const currentTier = TIERS.find((t) => t.id === selectedTier) || TIERS[1];

  const handleOpenPaymentWindow = () => {
    tactileEngine.triggerSelectionBuzz();
    setStatusMsg(null);
    setIsCheckoutOpen(true);
  };

  const handleRestore = async () => {
    setIsRestoring(true); setStatusMsg(null); tactileEngine.triggerSelectionBuzz();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 select-none animate-in fade-in duration-150 backdrop-blur-md">
      <div className="w-full max-w-[440px] bg-[#080808] border border-[#D4AF37]/30 rounded-3xl overflow-hidden shadow-[0_0_35px_-5px_rgba(212,175,55,0.2)] flex flex-col max-h-[92dvh] h-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4AF37]/15 bg-[#050505]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#F5D061]"><Sparkles className="w-4 h-4" /></div>
            <div>
              <h2 className="text-sm font-tactical font-black uppercase text-white tracking-wider">O1 CLUB PASS PRO</h2>
              <p className="text-[10px] font-mono text-[#D4AF37]">REVENUECAT IN-APP PURCHASES</p>
            </div>
          </div>
          <button onClick={closePaywall} className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-[#0A0A0A] to-[#050505] flex-1 min-h-0">
          {gatedFeature && (
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5D061] text-xs font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#F5D061] shrink-0" />
              <span>Unlock <strong className="text-white">{gatedFeature}</strong> with Pro</span>
            </div>
          )}
          <div className="space-y-1.5 py-0.5">
            {PERKS.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono text-neutral-200">
                <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" /><span>{p}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            {TIERS.map((tier) => (
              <button
                key={tier.id} type="button" onClick={() => { tactileEngine.triggerSelectionBuzz(); setSelectedTier(tier.id); }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  selectedTier === tier.id ? 'bg-[#141416] border-[#D4AF37] shadow-[0_0_15px_-3px_rgba(212,175,55,0.25)]' : 'bg-[#0E0E10] border-neutral-800 hover:border-[#D4AF37]/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-white">{tier.name}</span>
                    {tier.badge && <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#F5D061] border border-[#D4AF37]/40 font-bold">{tier.badge}</span>}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">{tier.cadence}</span>
                </div>
                <span className="text-sm font-black font-mono text-[#F5D061]">{tier.price}</span>
              </button>
            ))}
          </div>
          {statusMsg && <p className="text-rose-400 text-xs font-sans text-center">{statusMsg}</p>}
        </div>

        <div className="p-4 border-t border-[#D4AF37]/15 bg-[#050505] space-y-2">
          <button
            onClick={handleOpenPaymentWindow}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F5D061] to-[#C69B3C] text-black font-tactical font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition"
          >
            <ShieldCheck className="w-4 h-4 fill-black" />
            <span>OPEN PAYMENT OPTIONS • {currentTier.price} {currentTier.period}</span>
          </button>

          <div className="flex items-center justify-center gap-3 text-[10px] font-sans text-neutral-400">
            <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer" className="hover:text-white underline">Terms of Use (EULA)</a>
            <span>•</span>
            <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noreferrer" className="hover:text-white underline">Privacy Policy</a>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
            <button onClick={handleRestore} disabled={isRestoring} className="text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50">
              <RotateCcw className={`w-3 h-3 text-[#D4AF37] ${isRestoring ? 'animate-spin' : ''}`} />
              <span>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</span>
            </button>
            <span>Cancel anytime in Store</span>
          </div>

          <p className="text-[8.5px] font-mono text-neutral-500 text-center leading-tight">
            Subscription auto-renews unless cancelled 24h before period end. Billed via Apple App Store, Google Play, or Secure Card.
          </p>
        </div>
      </div>

      <MembershipCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        planId={currentTier.id}
        planName={currentTier.name}
        price={`${currentTier.price} ${currentTier.period}`}
        onSuccess={async () => {
          tactileEngine.playPRCelebration();
          closePaywall();
        }}
      />
    </div>
  );
};
export default ClubPassPaywallModal;

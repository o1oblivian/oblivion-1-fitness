import React, { useState } from 'react';
import { X, Lock, ShieldCheck, Check, Loader2, Sparkles } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { executeMembershipPurchase } from '../../../services/revenueCatService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  price: string;
  onSuccess?: (planId: string) => void;
  onShowToast?: (msg: string) => void;
}

const HIGHLIGHTS = [
  'Unlimited Biomechanical Telemetry & Kinetic Vault',
  '250km Radar Vector & Real-Time Partner Matching',
  'Automated ACWR Load Balancing & Form Review Reels',
];

export const MembershipCheckoutModal: React.FC<Props> = ({
  isOpen, onClose, planId, planName, price, onSuccess, onShowToast,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setError(null);
    setIsLoading(true);
    tactileEngine.triggerSelectionBuzz();

    const res = await executeMembershipPurchase(planId);
    setIsLoading(false);

    if (res.success) {
      tactileEngine.playPRCelebration();
      onShowToast?.(`Membership Activated: ${planName}`);
      onSuccess?.(planId);
      onClose();
    } else {
      const errText = res.error || 'Subscription could not be processed.';
      setError(errText);
      onShowToast?.(errText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 select-none animate-in fade-in duration-150 backdrop-blur-md">
      <div className="w-full max-w-sm bg-[#0a0a0c] border border-[#D4AF37]/30 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/15">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F5D061]" />
            <h2 className="text-sm font-tactical font-black uppercase text-white tracking-wider">O1 CLUB PASS CHECKOUT</h2>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="py-3.5 space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-tactical font-black text-white uppercase tracking-wider">{planName}</span>
            <span className="text-xl font-mono font-black text-[#F5D061]">{price}</span>
          </div>
          <p className="text-[11px] font-sans text-neutral-400">Recurring billing • Cancel anytime in App Store or Google Play</p>
          <div className="border-t border-[#D4AF37]/20 my-3" />
        </div>

        <div className="space-y-2 py-1">
          {HIGHLIGHTS.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-sans text-neutral-200">
              <Check className="w-3.5 h-3.5 text-[#F5D061] shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="my-4 p-3 bg-[#121214] border border-[#D4AF37]/20 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#D4AF37] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#F5D061]" />
            <span>REVENUECAT VERIFIED MOBILE BILLING</span>
          </div>
          <p className="text-[10px] font-sans text-neutral-400 leading-snug">
            Protected by Apple StoreKit &amp; Google Play Billing infrastructure. Synchronized with your athlete profile.
          </p>
        </div>

        {error && <p className="text-rose-400 text-xs font-sans mb-3 px-1">{error}</p>}

        <button
          type="button"
          disabled={isLoading}
          onClick={handleCheckout}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F5D061] to-[#C69B3C] text-black font-tactical font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>AUTHORIZING PASS...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>CONFIRM &amp; ACTIVATE • {price}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
export default MembershipCheckoutModal;

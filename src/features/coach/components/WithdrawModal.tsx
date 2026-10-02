import React, { useState } from 'react';
import { X, ArrowDownRight, Building2, ShieldAlert, Loader2 } from 'lucide-react';
import { stripeConnectService, CoachProfileData } from '../../../services/stripeConnectService';
import { tactileEngine } from '../../../services/tactileEngine';
import { sanitizeNumericInput } from '../../../utils/numberInputUtils';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  profile?: CoachProfileData | null;
  onSuccess: (amount: number) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen, onClose, availableBalance, profile, onSuccess,
}) => {
  const [amountStr, setAmountStr] = useState<string>(availableBalance > 0 ? availableBalance.toFixed(2) : '0.00');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;
  const withdrawAmount = Math.max(0, Math.min(availableBalance, parseFloat(amountStr) || 0));
  const destinationLabel = profile?.stripe_connect_account_id
    ? `Stripe Express (••••${profile.stripe_connect_account_id.slice(-6)})`
    : 'Stripe Express (Direct Deposit)';

  const handleWithdraw = async () => {
    if (withdrawAmount <= 0) { setError('Specify an amount greater than $0.00'); return; }
    setError(null);
    setIsProcessing(true);
    tactileEngine.triggerSelectionBuzz();
    try {
      const amountCents = Math.round(withdrawAmount * 100);
      const res = await stripeConnectService.createPayout(amountCents);
      if (res.success) {
        tactileEngine.playPRCelebration();
        onSuccess(withdrawAmount);
        onClose();
      } else {
        setError(res.error || 'Withdrawal rejected by Stripe. Verify banking status.');
      }
    } catch {
      setError('Network failure connecting to payout service.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none animate-in fade-in duration-150 backdrop-blur-md">
      <div className="w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0e0e11]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C4121A]">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-tactical font-black uppercase text-white tracking-wider">WITHDRAW EARNINGS</h2>
              <p className="text-xs font-sans text-neutral-400 font-semibold mt-0.5">Automated Stripe Express Transfer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 bg-neutral-950">
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-4 text-center space-y-1">
            <span className="text-xs font-tactical uppercase text-neutral-400 tracking-wider font-bold block">AVAILABLE FOR PAYOUT</span>
            <div className="text-3xl font-mono font-black text-white tracking-tight">
              ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans font-semibold text-neutral-300 uppercase block px-1">Withdrawal Amount ($ USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">$</span>
              <input
                type="number" step="0.01" min="1" max={availableBalance}
                value={amountStr}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAmountStr(sanitizeNumericInput(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-[#121214] border border-[#D4AF37]/35 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-[#F5D061]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[0.25, 0.5, 1.0].map((pct) => (
                <button
                  key={pct} type="button" onClick={() => setAmountStr((availableBalance * pct).toFixed(2))}
                  className="py-1.5 rounded-xl bg-[#121214] border border-[#D4AF37]/25 hover:border-[#D4AF37]/50 text-xs font-tactical font-black text-[#D4AF37] hover:text-[#F5D061] cursor-pointer"
                >
                  {pct === 1 ? 'MAX (100%)' : `${pct * 100}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#121214] border border-[#D4AF37]/20 rounded-2xl p-3.5 flex items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-2.5 text-neutral-200 min-w-0">
              <Building2 className="w-4 h-4 text-[#F5D061] shrink-0" />
              <span className="truncate font-medium">To: {destinationLabel}</span>
            </div>
            <span className="text-[#F5D061] font-mono font-bold shrink-0 ml-2">STANDARD ACH</span>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-sans flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={isProcessing || withdrawAmount <= 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F5D061] to-[#C69B3C] text-black font-tactical font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <ArrowDownRight className="w-4 h-4 text-black stroke-[3]" />}
            <span>{isProcessing ? 'DISPATCHING PAYOUT...' : `WITHDRAW $${withdrawAmount.toFixed(2)}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default WithdrawModal;

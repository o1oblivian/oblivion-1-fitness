import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownRight, RefreshCw, DollarSign } from 'lucide-react';
import { stripeConnectService, CoachProfileData, CoachBalanceTelemetry } from '../../../services/stripeConnectService';
import { CoachPayoutLedgerRecord } from '../../../types/database';
import { PayoutAccountBanner } from './PayoutAccountBanner';
import { WithdrawModal } from './WithdrawModal';
import { tactileEngine } from '../../../services/tactileEngine';

interface CoachEarningsDeckProps {
  coachId?: string;
  onShowToast: (msg: string) => void;
}

export const CoachEarningsDeck: React.FC<CoachEarningsDeckProps> = ({ coachId = 'coach_alpha', onShowToast }) => {
  const [profile, setProfile] = useState<CoachProfileData | null>(null);
  const [balance, setBalance] = useState<CoachBalanceTelemetry | null>(null);
  const [ledger, setLedger] = useState<CoachPayoutLedgerRecord[]>([]);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const prof = await stripeConnectService.getCoachProfile(coachId);
    setProfile(prof);

    if (prof.stripe_payouts_enabled) {
      const data = await stripeConnectService.getLedgerAndBalance(prof.id);
      setBalance(data.balance);
      setLedger(data.ledger);
    } else {
      setBalance(null);
      setLedger([]);
    }
    setIsLoading(false);
  }, [coachId]);

  useEffect(() => { loadData(); }, [loadData]);
  const available = balance?.availableNet || 0;
  const isOnboarded = Boolean(profile?.stripe_payouts_enabled);

  return (
    <div className="bg-neutral-950 border border-white/10 text-white rounded-3xl p-4 space-y-4 select-none">
      <PayoutAccountBanner profile={profile} onRefresh={loadData} onShowToast={onShowToast} />

      <div className="bg-[#0e0e11] border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-tactical font-black text-[#D4AF37] uppercase tracking-wider block">NET AVAILABLE BALANCE</span>
          <button onClick={loadData} disabled={isLoading} className="text-[#997D2B] hover:text-[#F5D061] transition cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-3xl font-mono font-black text-[#F5D061] tracking-tight">
          ${available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#D4AF37]/15">
          <div>
            <span className="text-[10px] font-tactical font-bold text-[#997D2B] uppercase tracking-wider block">Pending Settlement</span>
            <span className="text-neutral-200 font-mono font-bold text-sm">${balance?.pendingNet?.toFixed(2) || '0.00'}</span>
          </div>
          <div>
            <span className="text-[10px] font-tactical font-bold text-[#997D2B] uppercase tracking-wider block">Platform Fee (10%)</span>
            <span className="text-neutral-200 font-mono font-bold text-sm">${balance?.platformFee10Pct?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
        <button
          onClick={() => { tactileEngine.triggerSelectionBuzz(); setIsWithdrawOpen(true); }}
          disabled={!isOnboarded || available <= 0}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F5D061] to-[#C69B3C] text-black font-tactical font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition disabled:opacity-40"
        >
          <ArrowDownRight className="w-4 h-4 stroke-[3]" />
          <span>{isOnboarded ? 'WITHDRAW TO BANK' : 'CONNECT STRIPE TO WITHDRAW'}</span>
        </button>
      </div>

      <div className="space-y-2 pt-1">
        <span className="text-xs font-tactical font-black uppercase tracking-wider text-[#D4AF37] block px-1">
          PAYOUT LEDGER &amp; TRANSFERS ({ledger.length})
        </span>
        {ledger.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-dashed border-[#D4AF37]/20 text-center space-y-1">
            <DollarSign className="w-5 h-5 text-[#997D2B] mx-auto" />
            <p className="text-xs font-sans text-neutral-300 font-semibold uppercase">NO TRANSACTIONS RECORDED</p>
            <p className="text-[11px] font-sans text-neutral-500">Earnings from client coaching &amp; verified program sales will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {ledger.map((item) => {
              const isPositive = Number(item.amount_cents) > 0;
              const formattedAmt = (Math.abs(item.amount_cents) / 100).toFixed(2);
              return (
                <div key={item.id} className="p-3.5 bg-[#0A0A0A] border-b border-[#D4AF37]/15 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-tactical font-black text-white uppercase text-xs tracking-wider">
                        {item.stripe_transfer_id ? `Payout • ${item.stripe_transfer_id.slice(-8)}` : 'Bank Transfer'}
                      </span>
                      <span className={`text-[9px] font-tactical font-black px-1.5 py-0.5 rounded-full border tracking-wider uppercase ${
                        item.status?.toLowerCase() === 'paid' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' : 'bg-[#D4AF37]/15 text-[#F5D061] border-[#D4AF37]/30'
                      }`}>{item.status}</span>
                    </div>
                    <span className="text-[11px] font-sans text-neutral-400 block mt-0.5">{new Date(item.created_at).toLocaleDateString()} • {item.currency.toUpperCase()}</span>
                  </div>
                  <span className={`font-mono font-bold text-sm ${isPositive ? 'text-[#F5D061]' : 'text-neutral-400'}`}>
                    {isPositive ? `+$${formattedAmt}` : `-$${formattedAmt}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={available}
        profile={profile}
        onSuccess={(amt) => {
          onShowToast(`Withdrawal of $${amt.toFixed(2)} dispatched via Stripe Express.`);
          loadData();
        }}
      />
    </div>
  );
};
export default CoachEarningsDeck;

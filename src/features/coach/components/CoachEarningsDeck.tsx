import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { stripeConnectService, CoachProfileData, StripeBalance } from '../../../services/stripeConnectService';
import { WithdrawModal } from './WithdrawModal';
import { tactileEngine } from '../../../services/tactileEngine';
import { COACH_PLANS, formatFeePercent } from '../../../../shared/coachPlans';

interface CoachEarningsDeckProps {
  coachId?: string;
  onShowToast: (msg: string) => void;
}

interface LedgerLine {
  id: string;
  kind: 'sale' | 'payout';
  title: string;
  status: string;
  createdAt: string;
  currency: string;
  /** Signed cents: positive = earned, negative = withdrawn. */
  amountCents: number;
}

const money = (cents: number) =>
  (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const CoachEarningsDeck: React.FC<CoachEarningsDeckProps> = ({ coachId = '', onShowToast }) => {
  const [balance, setBalance] = useState<StripeBalance | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupNote, setSetupNote] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await stripeConnectService.getBalance();
    if (res.data) setBalance(res.data);
    setIsLoading(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  // Onboarding opens in another tab/browser; refresh the moment the coach comes back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadData();
    };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadData]);

  const profile: CoachProfileData | null = useMemo(
    () =>
      balance
        ? {
            id: coachId,
            stripe_connect_account_id: balance.accountId,
            stripe_payouts_enabled: balance.payoutsEnabled,
            currency: balance.currency.toUpperCase(),
          }
        : null,
    [balance, coachId],
  );

  const ledger: LedgerLine[] = useMemo(() => {
    if (!balance) return [];
    const sales: LedgerLine[] = balance.transactions
      .filter((t) => String(t.status).toUpperCase() !== 'REFUNDED')
      .map((t) => ({
        id: `sale-${t.id}`,
        kind: 'sale',
        title: t.program_title || 'Program sale',
        status: String(t.status).toUpperCase() === 'PENDING' ? 'pending' : 'available',
        createdAt: t.created_at,
        currency: t.currency || balance.currency,
        amountCents: Math.round(Number(t.coach_net || 0) * 100),
      }));
    const payouts: LedgerLine[] = balance.payouts.map((p) => ({
      id: `payout-${p.id}`,
      kind: 'payout',
      title: p.stripe_transfer_id ? `Payout • ${p.stripe_transfer_id.slice(-8)}` : 'Bank Transfer',
      status: String(p.status).toLowerCase(),
      createdAt: p.created_at,
      currency: p.currency,
      amountCents: -Math.abs(Number(p.amount_cents || 0)),
    }));
    return [...sales, ...payouts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [balance]);

  const availableCents = Math.max(0, balance?.availableCents ?? 0);
  const isOnboarded = Boolean(balance?.payoutsEnabled);

  const startPayoutSetup = async () => {
    setSetupNote('');
    tactileEngine.triggerSelectionBuzz();
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined;
    const res = await stripeConnectService.createConnectAccount(returnUrl);
    if (res.url) {
      window.location.assign(res.url);
      return;
    }
    setSetupNote('Payout setup needs a connection.');
  };
  const planLabel = balance ? COACH_PLANS[balance.plan].label : '';
  const feeLabel = balance ? formatFeePercent(balance.platformFeeRate) : '--';

  return (
    <div className="bg-black border border-white/[0.07] text-white rounded-2xl p-2.5 space-y-2.5 select-none">
      <div className="bg-o1-card border border-white/[0.07] rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-tactical font-black text-[#D4A017] tracking-wider block">Net Available Balance</span>
          <button onClick={() => void loadData()} disabled={isLoading} className="text-[#D97706] hover:text-[#D4A017] transition cursor-pointer" aria-label="Refresh balance">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {balance ? (
          <>
            <div className="text-3xl font-mono font-black text-[#D4A017] tracking-tight">
              ${money(availableCents)}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D4A017]/15">
              <div>
                <span className="text-[10px] font-tactical font-bold text-[#D97706] tracking-wider block">Pending</span>
                <span className="text-neutral-200 font-mono font-bold text-sm">${money(balance.pendingCents)}</span>
              </div>
              <div>
                <span className="text-[10px] font-tactical font-bold text-[#D97706] tracking-wider block">Paid Out</span>
                <span className="text-neutral-200 font-mono font-bold text-sm">${money(balance.paidCents)}</span>
              </div>
              <div>
                <span className="text-[10px] font-tactical font-bold text-[#D97706] tracking-wider block">Fees ({feeLabel})</span>
                <span className="text-neutral-200 font-mono font-bold text-sm">${money(balance.platformFeeCents)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#8A887F]">Payouts are not connected.</p>
        )}
        {balance && (
          <p className="text-[10px] font-mono text-neutral-500">
            {planLabel} • {feeLabel} platform fee on program sales
          </p>
        )}
        {isOnboarded && availableCents > 0 ? (
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); setIsWithdrawOpen(true); }}
            className="h-[44px] w-full rounded-full bg-[#D4A017] text-[13px] font-semibold text-black"
          >
            Withdraw
          </button>
        ) : !isOnboarded ? (
          <button
            type="button"
            onClick={() => { void startPayoutSetup(); }}
            className="h-[44px] w-full rounded-full bg-o1-crimson text-[13px] font-semibold text-white"
          >
            Set up payouts
          </button>
        ) : null}
        {setupNote ? <p className="text-center text-[12px] text-neutral-400">{setupNote}</p> : null}
      </div>

      {ledger.length > 0 && (
      <div className="space-y-2 pt-1">
        <span className="text-xs font-semibold text-white block px-1">
          Ledger
        </span>
          <div className="space-y-1.5">
            {ledger.map((item) => {
              const isPositive = item.amountCents > 0;
              const settled = item.status === 'paid' || item.status === 'available';
              return (
                <div key={item.id} className="p-3.5 bg-black border-b border-[#D4A017]/15 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-tactical font-black text-white text-xs tracking-wider truncate">{item.title}</span>
                      <span className={`text-[9px] font-tactical font-black px-1.5 py-0.5 rounded-full border tracking-wider shrink-0 ${
                        settled ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                          : item.status === 'failed' ? 'bg-red-950/40 text-red-400 border-red-500/30'
                          : 'bg-[#D4A017]/15 text-[#D4A017] border-[#D4A017]/30'
                      }`}>{item.status}</span>
                    </div>
                    <span className="text-[11px] font-sans text-neutral-400 block mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString()} • {item.currency.toUpperCase()}
                    </span>
                  </div>
                  <span className={`font-mono font-bold text-sm shrink-0 ${isPositive ? 'text-[#D4A017]' : 'text-neutral-400'}`}>
                    {isPositive ? '+' : '-'}${money(Math.abs(item.amountCents))}
                  </span>
                </div>
              );
            })}
          </div>
      </div>
      )}

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={availableCents / 100}
        profile={profile}
        onSuccess={(amt) => {
          onShowToast(`Withdrawal of $${amt.toFixed(2)} dispatched via Stripe Express.`);
          void loadData();
        }}
      />
    </div>
  );
};
export default CoachEarningsDeck;

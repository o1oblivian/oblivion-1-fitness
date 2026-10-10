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

function money(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    return (cents / 100).toFixed(2);
  }
}

const STATUS_LABEL: Record<string, string> = {
  available: 'Ready',
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
};

function statusTone(status: string): string {
  if (status === 'paid' || status === 'available') return 'bg-o1-ok-wash text-o1-ok-ink';
  if (status === 'failed') return 'bg-o1-bad-wash text-o1-bad-ink';
  return 'bg-o1-warn-wash text-o1-warn-ink';
}

export const CoachEarningsDeck: React.FC<CoachEarningsDeckProps> = ({ coachId = '', onShowToast }) => {
  const [balance, setBalance] = useState<StripeBalance | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupNote, setSetupNote] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await stripeConnectService.getBalance();
      if (res.data) setBalance(res.data);
    } finally {
      setIsLoading(false);
    }
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
      title: 'Paid to your bank',
      status: String(p.status).toLowerCase(),
      createdAt: p.created_at,
      currency: p.currency,
      amountCents: -Math.abs(Number(p.amount_cents || 0)),
    }));
    return [...sales, ...payouts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [balance]);

  const availableCents = Math.max(0, balance?.availableCents ?? 0);
  const isOnboarded = Boolean(balance?.payoutsEnabled);
  const currency = balance?.currency || 'usd';

  const startPayoutSetup = async () => {
    setSetupNote('');
    tactileEngine.triggerSelectionBuzz();
    const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined;
    const res = await stripeConnectService.createConnectAccount(returnUrl);
    if (res.url) {
      window.location.assign(res.url);
      return;
    }
    setSetupNote('Could not reach payout setup. Check your connection and try again.');
  };
  const planLabel = balance ? COACH_PLANS[balance.plan].label : '';
  const feeLabel = balance ? formatFeePercent(balance.platformFeeRate) : '--';

  return (
    <div className="space-y-3 select-none">
      <section className="space-y-3 rounded-2xl border border-white/[0.07] bg-o1-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-o1-text">{balance ? 'Ready to withdraw' : 'Earnings'}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={isLoading}
            className="flex h-11 w-11 items-center justify-center text-o1-muted active:scale-95"
            aria-label="Refresh balance"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {balance ? (
          <>
            <p className="text-[32px] font-semibold leading-none tabular-nums text-o1-text">{money(availableCents, currency)}</p>
            <dl className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'On the way', value: balance.pendingCents },
                { label: 'Paid out', value: balance.paidCents },
                { label: `Fees (${feeLabel})`, value: balance.platformFeeCents },
              ].map((row) => (
                <div key={row.label} className="rounded-xl bg-o1-canvas px-2 py-1.5 text-center">
                  <dt className="text-[10px] text-o1-muted">{row.label}</dt>
                  <dd className="text-[13px] font-semibold tabular-nums text-o1-text">{money(row.value, currency)}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[11px] text-o1-muted">
              {planLabel} plan · we keep {feeLabel} of each program sale
            </p>
          </>
        ) : (
          <p className="text-[13px] text-o1-muted">Connect a bank account to get paid for program sales.</p>
        )}
        {isOnboarded && availableCents > 0 ? (
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); setIsWithdrawOpen(true); }}
            className="h-[44px] w-full rounded-xl bg-o1-crimson text-[13px] font-semibold text-o1-text active:scale-[0.98]"
          >
            Withdraw
          </button>
        ) : !isOnboarded ? (
          <button
            type="button"
            onClick={() => { void startPayoutSetup(); }}
            className="h-[44px] w-full rounded-xl bg-o1-crimson text-[13px] font-semibold text-o1-text active:scale-[0.98]"
          >
            Set up payouts
          </button>
        ) : null}
        {setupNote ? <p className="text-center text-[12px] text-o1-muted">{setupNote}</p> : null}
      </section>

      {ledger.length > 0 && (
        <section className="space-y-2">
          <p className="px-1 text-[13px] font-semibold text-o1-text">History</p>
          {ledger.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-o1-surface p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold text-o1-text">{item.title}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(item.status)}`}>
                    {STATUS_LABEL[item.status] || item.status}
                  </span>
                </div>
                <span className="mt-0.5 block text-[11px] text-o1-muted">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <span className={`shrink-0 text-[13px] font-semibold tabular-nums ${item.amountCents > 0 ? 'text-o1-text' : 'text-o1-muted'}`}>
                {item.amountCents > 0 ? '+' : '−'}{money(Math.abs(item.amountCents), item.currency)}
              </span>
            </div>
          ))}
        </section>
      )}

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={availableCents / 100}
        profile={profile}
        onSuccess={(amt) => {
          onShowToast(`Withdrawing ${money(Math.round(amt * 100), currency)} to your bank`);
          void loadData();
        }}
      />
    </div>
  );
};
export default CoachEarningsDeck;

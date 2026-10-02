import { supabase } from './supabaseClient';
import { CoachPayoutLedgerRecord } from '../types/database';
import { CoachBalanceTelemetry } from './stripeConnectService';

export async function fetchCoachLedgerAndBalance(
  coachId: string
): Promise<{ balance: CoachBalanceTelemetry; ledger: CoachPayoutLedgerRecord[] }> {
  try {
    const { data, error } = await supabase
      .from('coach_payout_ledger')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const ledger = data as CoachPayoutLedgerRecord[];
      const paidOutCents = ledger.filter((l) => l.status?.toLowerCase() === 'paid').reduce((s, l) => s + Number(l.amount_cents || 0), 0);
      const inFlightCents = ledger.filter((l) => ['pending', 'processing'].includes(l.status?.toLowerCase() || '')).reduce((s, l) => s + Number(l.amount_cents || 0), 0);
      const totalVolumeCents = ledger.filter((l) => l.status?.toLowerCase() !== 'failed').reduce((s, l) => s + Number(l.amount_cents || 0), 0);
      return {
        balance: {
          availableNet: Math.max(0, (totalVolumeCents - paidOutCents - inFlightCents) / 100),
          pendingNet: inFlightCents / 100,
          grossVolume: totalVolumeCents / 100,
          platformFee10Pct: (totalVolumeCents / 100) * 0.1,
          currency: (ledger[0]?.currency || 'aud').toUpperCase(),
        },
        ledger,
      };
    }
  } catch {}

  return {
    balance: { availableNet: 0, pendingNet: 0, grossVolume: 0, platformFee10Pct: 0, currency: 'AUD' },
    ledger: [],
  };
}

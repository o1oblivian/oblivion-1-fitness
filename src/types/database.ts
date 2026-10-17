export interface CoachPayoutLedgerRecord {
  id: string;
  coach_id: string;
  amount_cents: number;
  currency: string;
  stripe_transfer_id?: string | null;
  status: 'pending' | 'processing' | 'paid' | 'failed' | string;
  error_message?: string | null;
  created_at: string;
  updated_at?: string;
}

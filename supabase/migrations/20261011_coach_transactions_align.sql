-- Production coach_transactions predates 20261007_coach_payouts_ledger.sql (CREATE TABLE IF NOT EXISTS skipped it).
-- Adds the columns the sale ledger writes and relaxes the legacy cents columns it never sets. Safe to re-run.
ALTER TABLE public.coach_transactions
  ADD COLUMN IF NOT EXISTS athlete_id TEXT,
  ADD COLUMN IF NOT EXISTS athlete_name TEXT,
  ADD COLUMN IF NOT EXISTS program_title TEXT,
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coach_net NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'aud',
  ADD COLUMN IF NOT EXISTS coach_plan TEXT,
  ADD COLUMN IF NOT EXISTS platform_fee_rate NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coach_transactions' AND column_name = 'amount_cents') THEN
    ALTER TABLE public.coach_transactions ALTER COLUMN amount_cents DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coach_transactions' AND column_name = 'platform_fee_cents') THEN
    ALTER TABLE public.coach_transactions ALTER COLUMN platform_fee_cents DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE public.coach_transactions ALTER COLUMN status SET DEFAULT 'PENDING';

CREATE UNIQUE INDEX IF NOT EXISTS coach_transactions_stripe_session_uidx
  ON public.coach_transactions (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS coach_transactions_coach_idx
  ON public.coach_transactions (coach_id, created_at DESC);

ALTER TABLE public.coach_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach reads own transactions" ON public.coach_transactions;
CREATE POLICY "coach reads own transactions" ON public.coach_transactions
  FOR SELECT USING (auth.uid() = coach_id);

NOTIFY pgrst, 'reload schema';

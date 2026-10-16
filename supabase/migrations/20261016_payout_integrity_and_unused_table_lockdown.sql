-- 1. One Stripe transfer can belong to one payout row only, and a payout is always a positive amount.
--    These make a double payout impossible even if application code ever has a bug.
CREATE UNIQUE INDEX IF NOT EXISTS coach_payout_ledger_stripe_transfer_uidx
  ON public.coach_payout_ledger (stripe_transfer_id)
  WHERE stripe_transfer_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coach_payout_ledger_amount_positive'
  ) THEN
    -- NOT VALID: applies to every new row without failing on old data.
    ALTER TABLE public.coach_payout_ledger
      ADD CONSTRAINT coach_payout_ledger_amount_positive CHECK (amount_cents > 0) NOT VALID;
  END IF;
END $$;

-- 2. The app never reads or writes buddy_messages (messages live in buddy_likes). Its original policy let anyone
--    read and write every row, so close it completely.
DO $$
BEGIN
  IF to_regclass('public.buddy_messages') IS NOT NULL THEN
    ALTER TABLE public.buddy_messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public access on buddy_messages" ON public.buddy_messages;
    REVOKE ALL ON public.buddy_messages FROM anon, authenticated;
  END IF;
END $$;

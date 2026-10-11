-- A fully reversed transfer marks its payout 'reversed'; the production status check predates that state.
ALTER TABLE public.coach_payout_ledger DROP CONSTRAINT IF EXISTS coach_payout_ledger_status_check;
ALTER TABLE public.coach_payout_ledger
  ADD CONSTRAINT coach_payout_ledger_status_check
  CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'reversed')) NOT VALID;

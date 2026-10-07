-- Coach payouts ledger. Run once in the Supabase SQL editor (safe to re-run).
-- The Express backend writes with the service role key; coaches may only READ their own rows.

-- 1. Sales ledger: one row per program sale with the platform / coach split.
create table if not exists public.coach_transactions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  athlete_id text,
  athlete_name text,
  program_title text,
  gross_amount numeric(12,2) not null default 0,
  platform_fee numeric(12,2) not null default 0,
  coach_net numeric(12,2) not null default 0,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

alter table public.coach_transactions add column if not exists currency text not null default 'aud';
alter table public.coach_transactions add column if not exists coach_plan text;
alter table public.coach_transactions add column if not exists platform_fee_rate numeric(5,4);
alter table public.coach_transactions add column if not exists stripe_session_id text;

create unique index if not exists coach_transactions_stripe_session_uidx
  on public.coach_transactions (stripe_session_id) where stripe_session_id is not null;
create index if not exists coach_transactions_coach_idx
  on public.coach_transactions (coach_id, created_at desc);

-- 2. Payout ledger: one row per withdrawal to the coach's bank (already used by the app).
create table if not exists public.coach_payout_ledger (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  amount_cents integer not null,
  currency text not null default 'aud',
  stripe_transfer_id text,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coach_payout_ledger_coach_idx
  on public.coach_payout_ledger (coach_id, created_at desc);

-- 3. Row level security: coaches can read their own rows. No client write policies exist,
--    so only the server (service role) can create or change money records.
alter table public.coach_transactions enable row level security;
alter table public.coach_payout_ledger enable row level security;

drop policy if exists "coach reads own transactions" on public.coach_transactions;
create policy "coach reads own transactions" on public.coach_transactions
  for select using (auth.uid() = coach_id);

drop policy if exists "coach reads own payouts" on public.coach_payout_ledger;
create policy "coach reads own payouts" on public.coach_payout_ledger
  for select using (auth.uid() = coach_id);

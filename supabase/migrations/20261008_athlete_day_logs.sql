-- Day logs the athlete types on Log: workout backfill, cardio, food, sleep, mindful.
-- The phone keeps a copy. This table is what a new install reads after sign-in.

create table if not exists public.athlete_day_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date_key   date not null,
  category   text not null check (category in ('workout', 'cardio', 'nutrition', 'sleep', 'meditation')),
  payload    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, date_key, category)
);

alter table public.athlete_day_logs enable row level security;

drop policy if exists "athlete manages own day logs" on public.athlete_day_logs;
create policy "athlete manages own day logs"
  on public.athlete_day_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.athlete_day_logs from anon;
grant select, insert, update, delete on public.athlete_day_logs to authenticated;

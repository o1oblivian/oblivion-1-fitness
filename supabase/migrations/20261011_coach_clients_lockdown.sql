-- A coach's roster is visible only to that coach and to the athlete on each row.
-- Drops every existing policy on coach_clients (some environments carry an open read policy)
-- and recreates the single parties-only policy. Verify with: node scripts/coach-sync-check.cjs
do $$
declare
  p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'coach_clients' loop
    execute format('drop policy if exists %I on public.coach_clients', p.policyname);
  end loop;
end $$;

alter table public.coach_clients enable row level security;
revoke all on public.coach_clients from anon;

create policy "coach_clients_parties" on public.coach_clients
  for all to authenticated
  using (coach_id::text = auth.uid()::text or client_id::text = auth.uid()::text)
  with check (coach_id::text = auth.uid()::text or client_id::text = auth.uid()::text);

-- The Oblivion Report: consented, coach-readable snapshots.
--
-- The report is computed on the athlete's device. When (and only when) the
-- athlete switches "Share with coach" on, the computed result (scores and
-- aggregates, never raw set logs) is upserted here. Switching it off deletes
-- the row. A coach can read a row only if the athlete shared it AND the athlete
-- is on that coach's roster.

create table if not exists public.athlete_report_snapshots (
  athlete_id uuid primary key references auth.users (id) on delete cascade,
  shared     boolean     not null default false,
  snapshot   jsonb       not null,
  updated_at timestamptz not null default now()
);

alter table public.athlete_report_snapshots enable row level security;

drop policy if exists "athlete manages own report" on public.athlete_report_snapshots;
create policy "athlete manages own report"
  on public.athlete_report_snapshots
  for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

-- Roster tables differ between environments (athlete_roster / coach_clients),
-- so the coach policy is assembled from whichever of them exist.
do $$
declare
  roster_checks text[] := array[]::text[];
  predicate text;
begin
  if to_regclass('public.athlete_roster') is not null then
    roster_checks := roster_checks || $q$exists (
      select 1 from public.athlete_roster r
      where r.coach_id::text = auth.uid()::text
        and r.client_id::text = athlete_report_snapshots.athlete_id::text
    )$q$;
  end if;

  if to_regclass('public.coach_clients') is not null then
    roster_checks := roster_checks || $q$exists (
      select 1 from public.coach_clients c
      where c.coach_id::text = auth.uid()::text
        and c.client_id::text = athlete_report_snapshots.athlete_id::text
    )$q$;
  end if;

  execute 'drop policy if exists "coach reads shared report" on public.athlete_report_snapshots';

  if array_length(roster_checks, 1) is null then
    raise notice 'No roster table found; coach read policy skipped (athletes can still manage their own report).';
  else
    predicate := 'shared and (' || array_to_string(roster_checks, ' or ') || ')';
    execute 'create policy "coach reads shared report" on public.athlete_report_snapshots for select using (' || predicate || ')';
  end if;
end
$$;

revoke all on public.athlete_report_snapshots from anon;
grant select, insert, update, delete on public.athlete_report_snapshots to authenticated;

-- Paid program content, Buddy spatial search and query indexes. Safe to run more than once in the Supabase SQL editor.
-- 1. Program content (week_one, program_data) is never selectable from the app. Owners, enrolled athletes,
--    accepted applicants and free-program members read it through program_content().
-- 2. Program rows are visible only when listed, owned, enrolled or accepted.
-- 3. buddy_locations gets a PostGIS geography column with a GiST index; buddy_within_radius uses ST_DWithin.
-- 4. Coach balance totals are summed in SQL (service role only).
-- 5. B-tree indexes on every owner, foreign key and date column the app filters or sorts by.

-- ---------------------------------------------------------------------------
-- 1. Paid program content
-- ---------------------------------------------------------------------------
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS program_data JSONB;
ALTER TABLE public.coach_programs ADD COLUMN IF NOT EXISTS week_one JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.program_catalog ADD COLUMN IF NOT EXISTS week_one JSONB DEFAULT '[]'::jsonb;

DO $$
DECLARE
  t TEXT;
  cols TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['coach_programs', 'program_catalog'] LOOP
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon, authenticated', t);
    SELECT string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position) INTO cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = t AND column_name NOT IN ('week_one', 'program_data');
    EXECUTE format('GRANT SELECT (%s) ON public.%I TO authenticated', cols, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Allow public access on coach_programs" ON public.coach_programs;
DROP POLICY IF EXISTS "coach_programs_read" ON public.coach_programs;
CREATE POLICY "coach_programs_read" ON public.coach_programs
  FOR SELECT TO authenticated
  USING (
    COALESCE(listed, false)
    OR coach_id::text = (SELECT auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.program_enrollments e
      WHERE e.athlete_id = (SELECT auth.uid()) AND e.program_id = coach_programs.id::text
    )
    OR EXISTS (
      SELECT 1 FROM public.coaching_applications a
      WHERE a.athlete_id = (SELECT auth.uid()) AND a.program_id = coach_programs.id::text AND a.status = 'accepted'
    )
  );

DROP FUNCTION IF EXISTS public.program_content(text[]);
CREATE FUNCTION public.program_content(program_ids text[])
RETURNS TABLE (id text, week_one jsonb, program_data jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (SELECT auth.uid() AS uid),
  wanted AS (SELECT DISTINCT w AS id FROM unnest(program_ids[1:60]) AS w WHERE w IS NOT NULL)
  SELECT p.id::text, p.week_one, p.program_data
  FROM public.coach_programs p
  JOIN wanted ON wanted.id = p.id::text
  CROSS JOIN me
  WHERE me.uid IS NOT NULL AND (
    p.coach_id::text = me.uid::text
    OR EXISTS (SELECT 1 FROM public.program_enrollments e WHERE e.athlete_id = me.uid AND e.program_id = p.id::text)
    OR public.program_enrollment_allowed(me.uid::text, p.id::text)
  )
  UNION ALL
  SELECT c.id::text, c.week_one, NULL::jsonb
  FROM public.program_catalog c
  JOIN wanted ON wanted.id = c.id::text
  CROSS JOIN me
  WHERE me.uid IS NOT NULL AND (
    c.catalog_coach_id::text = me.uid::text
    OR EXISTS (SELECT 1 FROM public.program_enrollments e WHERE e.athlete_id = me.uid AND e.program_id = c.id::text)
    OR public.program_enrollment_allowed(me.uid::text, c.id::text)
  );
$$;

REVOKE ALL ON FUNCTION public.program_content(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.program_content(text[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Buddy spatial search
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

DO $$
DECLARE
  s TEXT;
BEGIN
  SELECT n.nspname INTO s
  FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname = 'postgis';
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'buddy_locations' AND column_name = 'geog'
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.buddy_locations ADD COLUMN geog %1$I.geography(Point, 4326) '
      'GENERATED ALWAYS AS (%1$I.st_setsrid(%1$I.st_makepoint(longitude, latitude), 4326)::%1$I.geography) STORED',
      s
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS buddy_locations_geog_gist ON public.buddy_locations USING gist (geog);
CREATE INDEX IF NOT EXISTS buddy_profiles_id_text_idx ON public.buddy_profiles ((id::text));

DROP FUNCTION IF EXISTS public.buddy_within_radius(double precision, double precision, double precision);

CREATE FUNCTION public.buddy_within_radius(
  origin_lat double precision,
  origin_lng double precision,
  radius_km double precision
)
RETURNS TABLE (
  id text,
  user_id text,
  athlete_name text,
  handle text,
  age integer,
  home_gym text,
  avatar_url text,
  image_url text,
  discipline text,
  current_split text,
  training_time text,
  gender text,
  looking_for text,
  training_place text,
  experience_level text,
  bio text,
  last_active timestamptz,
  is_verified boolean,
  distance_km double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH me AS (
    SELECT
      auth.uid()::text AS uid,
      LEAST(GREATEST(COALESCE(radius_km, 25), 1), 250) AS r,
      st_setsrid(st_makepoint(
        LEAST(GREATEST(COALESCE(origin_lng, 0), -180), 180),
        LEAST(GREATEST(COALESCE(origin_lat, 0), -90), 90)
      ), 4326)::geography AS origin
  ),
  near AS (
    SELECT l.user_id, st_distance(l.geog, me.origin) / 1000.0 AS raw_km
    FROM public.buddy_locations l
    CROSS JOIN me
    WHERE me.uid IS NOT NULL
      AND l.user_id <> me.uid
      AND st_dwithin(l.geog, me.origin, me.r * 1000.0)
    ORDER BY l.geog <-> me.origin
    LIMIT 400
  )
  SELECT
    p.id::text,
    p.user_id::text,
    p.athlete_name,
    p.handle,
    p.age,
    p.home_gym,
    p.avatar_url,
    p.image_url,
    p.discipline,
    p.current_split,
    p.training_time,
    p.gender,
    p.looking_for,
    p.training_place,
    p.experience_level,
    p.bio,
    p.last_active,
    COALESCE(p.is_verified, false),
    GREATEST(1, round(near.raw_km))::double precision
  FROM near
  JOIN public.buddy_profiles p ON p.id::text = near.user_id
  CROSS JOIN me
  WHERE COALESCE(p.is_ghost_mode, false) = false
    AND p.age >= 18
    AND NOT EXISTS (
      SELECT 1 FROM public.buddy_likes b
      WHERE b.id IN ('b|' || me.uid || '|' || p.id::text, 'b|' || p.id::text || '|' || me.uid)
    )
  ORDER BY near.raw_km
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.buddy_within_radius(double precision, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buddy_within_radius(double precision, double precision, double precision) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Coach balance totals, summed in the database so the server never loads a coach's whole history
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.coach_ledger_totals(uuid, numeric);
CREATE FUNCTION public.coach_ledger_totals(p_coach uuid, p_hold_days numeric)
RETURNS TABLE (
  released_cents bigint,
  pending_cents bigint,
  gross_cents bigint,
  fee_cents bigint,
  committed_cents bigint,
  paid_cents bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH tx AS (
    SELECT
      round(COALESCE(t.gross_amount, 0)::numeric * 100)::bigint AS gross,
      round(COALESCE(t.platform_fee, 0)::numeric * 100)::bigint AS fee,
      round(COALESCE(t.coach_net, 0)::numeric * 100)::bigint AS net,
      (
        upper(COALESCE(t.status, '')) IN ('AVAILABLE', 'PAID_OUT')
        OR (upper(COALESCE(t.status, '')) = 'PENDING'
            AND t.created_at <= NOW() - GREATEST(COALESCE(p_hold_days, 7), 0) * INTERVAL '1 day')
      ) AS released
    FROM public.coach_transactions t
    WHERE t.coach_id = p_coach AND upper(COALESCE(t.status, '')) <> 'REFUNDED'
  ),
  po AS (
    SELECT lower(COALESCE(p.status, '')) AS s, COALESCE(p.amount_cents, 0)::bigint AS amount
    FROM public.coach_payout_ledger p
    WHERE p.coach_id = p_coach
  )
  SELECT
    COALESCE((SELECT sum(net) FILTER (WHERE released) FROM tx), 0)::bigint,
    COALESCE((SELECT sum(net) FILTER (WHERE NOT released) FROM tx), 0)::bigint,
    COALESCE((SELECT sum(gross) FROM tx), 0)::bigint,
    COALESCE((SELECT sum(fee) FROM tx), 0)::bigint,
    COALESCE((SELECT sum(amount) FILTER (WHERE s IN ('paid', 'processing', 'pending')) FROM po), 0)::bigint,
    COALESCE((SELECT sum(amount) FILTER (WHERE s = 'paid') FROM po), 0)::bigint;
$$;

REVOKE ALL ON FUNCTION public.coach_ledger_totals(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.coach_ledger_totals(uuid, numeric) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Query indexes
-- ---------------------------------------------------------------------------
-- Creates the index only when the table and every column exist, and skips it when an index already
-- starts with the same columns (a primary key or unique constraint covers the lookup).
CREATE OR REPLACE FUNCTION pg_temp.o1_index(tbl text, idx text, cols text[], pred text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rel regclass := to_regclass('public.' || quote_ident(tbl));
  names text[];
BEGIN
  IF rel IS NULL THEN
    RETURN;
  END IF;
  SELECT array_agg(split_part(c, ' ', 1) ORDER BY o) INTO names FROM unnest(cols) WITH ORDINALITY AS u(c, o);
  IF EXISTS (
    SELECT 1 FROM unnest(names) AS n
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_attribute a WHERE a.attrelid = rel AND a.attname = n AND a.attnum > 0 AND NOT a.attisdropped
    )
  ) THEN
    RETURN;
  END IF;
  IF pred IS NULL AND EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = rel AND i.indpred IS NULL AND i.indexprs IS NULL
      AND (
        SELECT array_agg(a.attname::text ORDER BY k.ord)
        FROM unnest(i.indkey::int2[]) WITH ORDINALITY AS k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = rel AND a.attnum = k.attnum
        WHERE k.ord <= cardinality(names)
      ) = names
  ) THEN
    RETURN;
  END IF;
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON public.%I (%s)%s',
    idx,
    tbl,
    (SELECT string_agg(format('%I', split_part(c, ' ', 1)) || CASE WHEN c ILIKE '% desc' THEN ' DESC' ELSE '' END, ', ' ORDER BY o)
     FROM unnest(cols) WITH ORDINALITY AS u(c, o)),
    COALESCE(' WHERE ' || pred, '')
  );
END;
$$;

-- Coach
SELECT pg_temp.o1_index('coach_messages', 'coach_messages_coach_idx', ARRAY['coach_id', 'created_at desc']);
SELECT pg_temp.o1_index('coach_messages', 'coach_messages_athlete_idx', ARRAY['athlete_id', 'created_at desc']);
SELECT pg_temp.o1_index('coach_clients', 'coach_clients_coach_idx', ARRAY['coach_id', 'status', 'created_at desc']);
SELECT pg_temp.o1_index('coach_clients', 'coach_clients_client_idx', ARRAY['client_id', 'status', 'created_at desc']);
SELECT pg_temp.o1_index('coach_programs', 'coach_programs_coach_idx', ARRAY['coach_id', 'created_at desc']);
SELECT pg_temp.o1_index('coach_programs', 'coach_programs_listed_idx', ARRAY['created_at desc'], 'listed');
SELECT pg_temp.o1_index('program_catalog', 'program_catalog_active_idx', ARRAY['sort_order'], 'active');
SELECT pg_temp.o1_index('program_enrollments', 'program_enrollments_program_idx', ARRAY['program_id']);
SELECT pg_temp.o1_index('program_enrollments', 'program_enrollments_coach_idx', ARRAY['coach_id']);
SELECT pg_temp.o1_index('coaching_applications', 'coaching_applications_athlete_coach_idx', ARRAY['athlete_id', 'coach_id', 'created_at desc']);
SELECT pg_temp.o1_index('coaching_applications', 'coaching_applications_athlete_status_idx', ARRAY['athlete_id', 'status']);
SELECT pg_temp.o1_index('workout_completions', 'workout_completions_coach_idx', ARRAY['coach_id', 'submitted_at desc']);
SELECT pg_temp.o1_index('workout_completions', 'workout_completions_athlete_idx', ARRAY['athlete_id', 'submitted_at desc']);
SELECT pg_temp.o1_index('assigned_workouts', 'assigned_workouts_client_idx', ARRAY['client_id', 'status']);
SELECT pg_temp.o1_index('assigned_workouts', 'assigned_workouts_athlete_idx', ARRAY['athlete_id', 'status']);
SELECT pg_temp.o1_index('assigned_workouts', 'assigned_workouts_coach_idx', ARRAY['coach_id', 'status', 'assigned_date']);
SELECT pg_temp.o1_index('athlete_checkins', 'athlete_checkins_coach_idx', ARRAY['coach_id', 'created_at desc']);
SELECT pg_temp.o1_index('athlete_checkins', 'athlete_checkins_athlete_idx', ARRAY['athlete_id', 'created_at desc']);
SELECT pg_temp.o1_index('coach_directives', 'coach_directives_coach_idx', ARRAY['coach_id', 'created_at desc']);
SELECT pg_temp.o1_index('coach_invites', 'coach_invites_coach_idx', ARRAY['coach_id']);
SELECT pg_temp.o1_index('coach_follows', 'coach_follows_follower_idx', ARRAY['follower_id', 'coach_id']);
SELECT pg_temp.o1_index('coach_payout_ledger', 'coach_payout_ledger_transfer_idx', ARRAY['stripe_transfer_id']);
SELECT pg_temp.o1_index('coach_profiles', 'coach_profiles_connect_idx', ARRAY['stripe_connect_account_id']);

-- Workout and Log
SELECT pg_temp.o1_index('completed_sessions', 'completed_sessions_user_idx', ARRAY['user_id', 'created_at desc']);
SELECT pg_temp.o1_index('completed_sessions', 'completed_sessions_client_idx', ARRAY['client_id', 'created_at desc']);
SELECT pg_temp.o1_index('workout_logs', 'workout_logs_user_idx', ARRAY['user_id', 'created_at desc']);
SELECT pg_temp.o1_index('workout_logs', 'workout_logs_session_idx', ARRAY['session_id']);
SELECT pg_temp.o1_index('workout_sessions', 'workout_sessions_user_idx', ARRAY['user_id', 'created_at desc']);
SELECT pg_temp.o1_index('workout_sessions', 'workout_sessions_client_idx', ARRAY['client_id']);
SELECT pg_temp.o1_index('athlete_day_logs', 'athlete_day_logs_user_idx', ARRAY['user_id', 'date_key']);
SELECT pg_temp.o1_index('user_telemetry', 'user_telemetry_user_idx', ARRAY['user_id', 'date']);
SELECT pg_temp.o1_index('user_telemetry', 'user_telemetry_client_idx', ARRAY['client_id', 'date']);
SELECT pg_temp.o1_index('daily_metrics', 'daily_metrics_user_idx', ARRAY['user_id', 'date']);
SELECT pg_temp.o1_index('telemetry_records', 'telemetry_records_user_idx', ARRAY['user_id']);

-- Fuel
SELECT pg_temp.o1_index('meal_logs', 'meal_logs_user_date_idx', ARRAY['user_id', 'date']);
SELECT pg_temp.o1_index('fuel_days', 'fuel_days_user_date_idx', ARRAY['user_id', 'date_key']);

-- Buddy and safety
SELECT pg_temp.o1_index('buddy_likes', 'buddy_likes_to_idx', ARRAY['to_id', 'created_at desc']);
SELECT pg_temp.o1_index('buddy_likes', 'buddy_likes_from_idx', ARRAY['from_id', 'created_at desc']);
SELECT pg_temp.o1_index('buddy_profiles', 'buddy_profiles_user_idx', ARRAY['user_id']);
SELECT pg_temp.o1_index('user_blocks', 'user_blocks_blocked_idx', ARRAY['blocked_id']);
SELECT pg_temp.o1_index('safety_reports', 'safety_reports_reported_idx', ARRAY['reported_id', 'created_at desc']);
SELECT pg_temp.o1_index('safety_reports', 'safety_reports_reporter_idx', ARRAY['reporter_id', 'created_at desc']);

-- Media
SELECT pg_temp.o1_index('reel_likes', 'reel_likes_user_idx', ARRAY['user_id']);
SELECT pg_temp.o1_index('vault_bookmarks', 'vault_bookmarks_user_idx', ARRAY['user_id', 'created_at desc']);

ANALYZE public.buddy_locations;

NOTIFY pgrst, 'reload schema';

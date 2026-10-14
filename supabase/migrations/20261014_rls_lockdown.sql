-- Row-Level Security for tables that were created outside migrations and had none.
-- Every block is guarded, so tables missing from a project are skipped.

-- coach_profiles: the public card is readable by everyone (column grants in
-- 20261011_coach_profiles_privacy.sql limit which columns); only the coach can create or edit their own card.
DO $$
BEGIN
  IF to_regclass('public.coach_profiles') IS NULL THEN RETURN; END IF;
  ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "coach cards are public" ON public.coach_profiles;
  CREATE POLICY "coach cards are public" ON public.coach_profiles
    FOR SELECT TO anon, authenticated USING (true);
  DROP POLICY IF EXISTS "coach creates own card" ON public.coach_profiles;
  CREATE POLICY "coach creates own card" ON public.coach_profiles
    FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
  DROP POLICY IF EXISTS "coach edits own card" ON public.coach_profiles;
  CREATE POLICY "coach edits own card" ON public.coach_profiles
    FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
END $$;

-- profiles: each athlete reads and writes only their own row.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN RETURN; END IF;
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.profiles FROM anon;
  DROP POLICY IF EXISTS "athlete manages own profile" ON public.profiles;
  CREATE POLICY "athlete manages own profile" ON public.profiles
    FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
END $$;

-- Legacy telemetry tables keyed by user_id: owner only.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['telemetry_records', 'user_telemetry'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'user_id'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('DROP POLICY IF EXISTS "athlete manages own rows" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "athlete manages own rows" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      t
    );
  END LOOP;
END $$;

-- PostGIS owns spatial_ref_sys (coordinate-system reference data, no user data), so RLS cannot be
-- enabled on it from the SQL editor. Keep it readable but stop the public key from changing it.
DO $$
BEGIN
  IF to_regclass('public.spatial_ref_sys') IS NULL THEN RETURN; END IF;
  BEGIN
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.spatial_ref_sys FROM anon, authenticated;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'spatial_ref_sys is owned by the PostGIS extension; write access left as Supabase set it';
  END;
END $$;

-- Safety net: any other app table in public still without RLS gets it turned on with no policies,
-- which blocks the public key entirely (the server's service_role still works).
-- Tables that belong to an extension are skipped; only their owner can change them.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
    RAISE NOTICE 'RLS enabled with no policies on public.%', r.relname;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

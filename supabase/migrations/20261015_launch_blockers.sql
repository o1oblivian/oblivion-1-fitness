-- Launch blockers found in the Oct 15 agent test run.
-- Safe to run more than once.

-- 1. profiles: columns the app writes (profile save, onboarding flag).
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN RETURN; END IF;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS handle TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings JSONB;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
END $$;

-- 2. profiles: each athlete sees only their own row.
-- Policies are OR'ed together, so every older policy (including ones created in the dashboard) is dropped first.
DO $$
DECLARE pol RECORD;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN RETURN; END IF;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON public.profiles FROM anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
  CREATE POLICY "athlete manages own profile" ON public.profiles
    FOR ALL TO authenticated USING (id::text = auth.uid()::text) WITH CHECK (id::text = auth.uid()::text);
END $$;

-- 3. Workout archive: columns the app reads and writes.
DO $$
BEGIN
  IF to_regclass('public.completed_sessions') IS NOT NULL THEN
    ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS activity_type TEXT;
    ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS session_name TEXT;
    ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS client_id TEXT;
    ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS volume_kg NUMERIC;
    ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS duration_seconds INT;
    ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS strain NUMERIC;
    ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS pr_count INT;
  END IF;
  IF to_regclass('public.workout_logs') IS NOT NULL THEN
    ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS is_pr BOOLEAN DEFAULT FALSE;
  END IF;
  IF to_regclass('public.workout_sessions') IS NOT NULL THEN
    ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS exercises JSONB;
    ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS duration_seconds INT;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

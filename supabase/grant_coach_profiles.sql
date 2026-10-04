-- ============================================================================
-- OBLIVION 1 FITNESS CLUB: COACH PROFILES TABLE GRANT & SCHEMA SCRIPT
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor) to ensure
-- table privileges and columns are fully granted to anon and authenticated roles.
-- ============================================================================

-- 1. Ensure columns exist
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Grant table privileges to anon, authenticated, and service_role
GRANT ALL ON TABLE public.coach_profiles TO anon, authenticated, service_role;

-- 3. Row Level Security policies
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on coach_profiles') THEN
    CREATE POLICY "Allow public select on coach_profiles" ON public.coach_profiles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert on coach_profiles') THEN
    CREATE POLICY "Allow public insert on coach_profiles" ON public.coach_profiles FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update on coach_profiles') THEN
    CREATE POLICY "Allow public update on coach_profiles" ON public.coach_profiles FOR UPDATE USING (true);
  END IF;
END $$;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

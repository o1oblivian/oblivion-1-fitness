-- Run this once in the Supabase SQL editor before TestFlight.
-- It lets a signed-in athlete save their own Buddy card and lets other athletes read it.

ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS is_ghost_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS looking_for TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS discipline TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS training_place TEXT;

ALTER TABLE public.buddy_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'buddy_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.buddy_profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "buddy_profiles_read" ON public.buddy_profiles
  FOR SELECT TO anon, authenticated
  USING (COALESCE(is_ghost_mode, false) = false OR id = auth.uid());

CREATE POLICY "buddy_profiles_insert_own" ON public.buddy_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "buddy_profiles_update_own" ON public.buddy_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

GRANT SELECT ON public.buddy_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.buddy_profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.buddy_likes TO anon, authenticated;

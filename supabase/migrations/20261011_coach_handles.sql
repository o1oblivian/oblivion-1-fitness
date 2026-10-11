-- Public @handle on the coach card. Readable by everyone, writable only by the coach who owns the row.
-- Run once in the Supabase SQL editor after 20261011_coach_profiles_privacy.sql. Safe to re-run.

ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS handle TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coach_profiles_handle_format') THEN
    ALTER TABLE public.coach_profiles
      ADD CONSTRAINT coach_profiles_handle_format CHECK (handle IS NULL OR handle ~ '^[a-z0-9_.]{3,30}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS coach_profiles_handle_key ON public.coach_profiles (handle) WHERE handle IS NOT NULL;

GRANT SELECT (handle) ON public.coach_profiles TO anon, authenticated;
GRANT INSERT (handle), UPDATE (handle) ON public.coach_profiles TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Buddy likes. A match exists when both people have a row.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.buddy_likes (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.buddy_likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on buddy_likes') THEN
    CREATE POLICY "Allow public access on buddy_likes" ON public.buddy_likes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS athlete_name TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS current_split TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS training_time TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

GRANT SELECT, INSERT, UPDATE ON public.buddy_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.buddy_likes TO anon, authenticated;


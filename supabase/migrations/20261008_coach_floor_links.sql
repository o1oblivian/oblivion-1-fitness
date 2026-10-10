-- Coach links the other phone can read: invite, programs, notes, check-ins, messages, finished workouts.
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.coach_invites (
  code TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  coach_handle TEXT DEFAULT '',
  coach_avatar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coach_programs (
  id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coach_directives (
  id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  tag TEXT,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  affected_count INT DEFAULT 0,
  priority TEXT DEFAULT 'NORMAL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.athlete_checkins (
  id TEXT PRIMARY KEY,
  athlete_id TEXT,
  athlete_name TEXT,
  coach_id TEXT,
  weight_kg NUMERIC,
  sleep_hours NUMERIC,
  soreness INT,
  stress INT,
  notes TEXT DEFAULT '',
  feedback_text TEXT DEFAULT '',
  feedback_at TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coach_messages (
  id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  athlete_id TEXT,
  sender_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_completions (
  id TEXT PRIMARY KEY,
  coach_id TEXT NOT NULL,
  athlete_id TEXT,
  athlete_name TEXT,
  title TEXT,
  tonnage_kg NUMERIC,
  total_sets INT,
  total_reps INT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  exercises JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.coach_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_completions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on coach_invites') THEN
    CREATE POLICY "Allow public access on coach_invites" ON public.coach_invites FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on coach_programs') THEN
    CREATE POLICY "Allow public access on coach_programs" ON public.coach_programs FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on coach_directives') THEN
    CREATE POLICY "Allow public access on coach_directives" ON public.coach_directives FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on athlete_checkins') THEN
    CREATE POLICY "Allow public access on athlete_checkins" ON public.athlete_checkins FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on coach_messages') THEN
    CREATE POLICY "Allow public access on coach_messages" ON public.coach_messages FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on workout_completions') THEN
    CREATE POLICY "Allow public access on workout_completions" ON public.workout_completions FOR ALL USING (true);
  END IF;
END $$;

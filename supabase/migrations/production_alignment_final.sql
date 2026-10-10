-- Production alignment. Safe to run more than once in the Supabase SQL editor.
-- Buddy cards, likes, coach links, day logs, and workout archives.

-- ---------------------------------------------------------------------------
-- Buddy profiles. id stays uuid and matches auth.uid().
-- ---------------------------------------------------------------------------
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS is_ghost_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS looking_for TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS discipline TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS training_place TEXT;
ALTER TABLE public.buddy_profiles ADD COLUMN IF NOT EXISTS home_gym TEXT;
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

ALTER TABLE public.buddy_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access on buddy_profiles" ON public.buddy_profiles;
DROP POLICY IF EXISTS "buddy_profiles_read" ON public.buddy_profiles;
DROP POLICY IF EXISTS "buddy_profiles_insert_own" ON public.buddy_profiles;
DROP POLICY IF EXISTS "buddy_profiles_update_own" ON public.buddy_profiles;

CREATE POLICY "buddy_profiles_read" ON public.buddy_profiles
  FOR SELECT TO anon, authenticated
  USING (COALESCE(is_ghost_mode, false) = false OR id::text = auth.uid()::text);

CREATE POLICY "buddy_profiles_insert_own" ON public.buddy_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id::text = auth.uid()::text);

CREATE POLICY "buddy_profiles_update_own" ON public.buddy_profiles
  FOR UPDATE TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

GRANT SELECT ON public.buddy_profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.buddy_profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- Buddy likes. A match is two rows. Chat, block, and report rows use
-- from_id prefixes m| b| r| so they are not counted as likes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buddy_likes (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.buddy_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access on buddy_likes" ON public.buddy_likes;
DROP POLICY IF EXISTS "buddy_likes_read" ON public.buddy_likes;
DROP POLICY IF EXISTS "buddy_likes_insert" ON public.buddy_likes;
DROP POLICY IF EXISTS "buddy_likes_update" ON public.buddy_likes;
DROP POLICY IF EXISTS "buddy_likes_delete" ON public.buddy_likes;

CREATE POLICY "buddy_likes_read" ON public.buddy_likes
  FOR SELECT TO authenticated
  USING (
    to_id::text = auth.uid()::text
    OR from_id::text = auth.uid()::text
    OR from_id::text = 'm|' || auth.uid()::text
    OR from_id::text = 'b|' || auth.uid()::text
    OR from_id::text = 'r|' || auth.uid()::text
  );

CREATE POLICY "buddy_likes_insert" ON public.buddy_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    from_id::text = auth.uid()::text
    OR from_id::text = 'm|' || auth.uid()::text
    OR from_id::text = 'b|' || auth.uid()::text
    OR from_id::text = 'r|' || auth.uid()::text
  );

CREATE POLICY "buddy_likes_update" ON public.buddy_likes
  FOR UPDATE TO authenticated
  USING (
    from_id::text = auth.uid()::text
    OR from_id::text = 'm|' || auth.uid()::text
    OR from_id::text = 'b|' || auth.uid()::text
    OR from_id::text = 'r|' || auth.uid()::text
  )
  WITH CHECK (
    from_id::text = auth.uid()::text
    OR from_id::text = 'm|' || auth.uid()::text
    OR from_id::text = 'b|' || auth.uid()::text
    OR from_id::text = 'r|' || auth.uid()::text
  );

CREATE POLICY "buddy_likes_delete" ON public.buddy_likes
  FOR DELETE TO authenticated
  USING (from_id::text = auth.uid()::text OR id::text LIKE auth.uid()::text || ':%');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.buddy_likes TO authenticated;

-- ---------------------------------------------------------------------------
-- Coach link tables. There is no coach_floor_links table. These are the tables
-- the coach and athlete clients actually write.
-- ---------------------------------------------------------------------------
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

CREATE TABLE IF NOT EXISTS public.coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_name TEXT,
  name TEXT,
  handle TEXT,
  status TEXT,
  readiness NUMERIC,
  volume TEXT,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coach_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access on coach_invites" ON public.coach_invites;
DROP POLICY IF EXISTS "Allow public access on coach_programs" ON public.coach_programs;
DROP POLICY IF EXISTS "Allow public access on coach_directives" ON public.coach_directives;
DROP POLICY IF EXISTS "Allow public access on athlete_checkins" ON public.athlete_checkins;
DROP POLICY IF EXISTS "Allow public access on coach_messages" ON public.coach_messages;
DROP POLICY IF EXISTS "Allow public access on workout_completions" ON public.workout_completions;

DROP POLICY IF EXISTS "coach_invites_owner" ON public.coach_invites;
CREATE POLICY "coach_invites_owner" ON public.coach_invites
  FOR INSERT TO authenticated
  WITH CHECK (coach_id::text = auth.uid()::text);
DROP POLICY IF EXISTS "coach_invites_update" ON public.coach_invites;
CREATE POLICY "coach_invites_update" ON public.coach_invites
  FOR UPDATE TO authenticated
  USING (coach_id::text = auth.uid()::text)
  WITH CHECK (coach_id::text = auth.uid()::text);
DROP POLICY IF EXISTS "coach_invites_delete" ON public.coach_invites;
CREATE POLICY "coach_invites_delete" ON public.coach_invites
  FOR DELETE TO authenticated
  USING (coach_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "coach_programs_read" ON public.coach_programs;
CREATE POLICY "coach_programs_read" ON public.coach_programs
  FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS "coach_programs_owner" ON public.coach_programs;
CREATE POLICY "coach_programs_owner" ON public.coach_programs
  FOR INSERT TO authenticated
  WITH CHECK (coach_id::text = auth.uid()::text);
DROP POLICY IF EXISTS "coach_programs_update" ON public.coach_programs;
CREATE POLICY "coach_programs_update" ON public.coach_programs
  FOR UPDATE TO authenticated
  USING (coach_id::text = auth.uid()::text)
  WITH CHECK (coach_id::text = auth.uid()::text);
DROP POLICY IF EXISTS "coach_programs_delete" ON public.coach_programs;
CREATE POLICY "coach_programs_delete" ON public.coach_programs
  FOR DELETE TO authenticated
  USING (coach_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "coach_directives_read" ON public.coach_directives;
CREATE POLICY "coach_directives_read" ON public.coach_directives
  FOR SELECT TO authenticated
  USING (
    coach_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.coach_clients c
      WHERE c.coach_id::text = coach_directives.coach_id::text
        AND c.client_id::text = auth.uid()::text
    )
  );
DROP POLICY IF EXISTS "coach_directives_owner" ON public.coach_directives;
CREATE POLICY "coach_directives_owner" ON public.coach_directives
  FOR INSERT TO authenticated
  WITH CHECK (coach_id::text = auth.uid()::text);
DROP POLICY IF EXISTS "coach_directives_update" ON public.coach_directives;
CREATE POLICY "coach_directives_update" ON public.coach_directives
  FOR UPDATE TO authenticated
  USING (coach_id::text = auth.uid()::text)
  WITH CHECK (coach_id::text = auth.uid()::text);
DROP POLICY IF EXISTS "coach_directives_delete" ON public.coach_directives;
CREATE POLICY "coach_directives_delete" ON public.coach_directives
  FOR DELETE TO authenticated
  USING (coach_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "athlete_checkins_parties" ON public.athlete_checkins;
CREATE POLICY "athlete_checkins_parties" ON public.athlete_checkins
  FOR ALL TO authenticated
  USING (coach_id::text = auth.uid()::text OR athlete_id::text = auth.uid()::text)
  WITH CHECK (coach_id::text = auth.uid()::text OR athlete_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "coach_messages_parties" ON public.coach_messages;
CREATE POLICY "coach_messages_parties" ON public.coach_messages
  FOR ALL TO authenticated
  USING (coach_id::text = auth.uid()::text OR athlete_id::text = auth.uid()::text)
  WITH CHECK (coach_id::text = auth.uid()::text OR athlete_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "workout_completions_parties" ON public.workout_completions;
CREATE POLICY "workout_completions_parties" ON public.workout_completions
  FOR ALL TO authenticated
  USING (coach_id::text = auth.uid()::text OR athlete_id::text = auth.uid()::text)
  WITH CHECK (coach_id::text = auth.uid()::text OR athlete_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "coach_clients_parties" ON public.coach_clients;
CREATE POLICY "coach_clients_parties" ON public.coach_clients
  FOR ALL TO authenticated
  USING (coach_id::text = auth.uid()::text OR client_id::text = auth.uid()::text)
  WITH CHECK (coach_id::text = auth.uid()::text OR client_id::text = auth.uid()::text);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_directives TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_checkins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_clients TO authenticated;

-- Athletes can read a coach invite by code before the link exists.
DROP POLICY IF EXISTS "coach_invites_read" ON public.coach_invites;
CREATE POLICY "coach_invites_read" ON public.coach_invites
  FOR SELECT TO anon, authenticated
  USING (true);
GRANT SELECT ON public.coach_invites TO anon;

-- ---------------------------------------------------------------------------
-- Day logs. The athlete owns the row. A linked coach can read it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.athlete_day_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  date_key DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('workout', 'cardio', 'nutrition', 'sleep', 'meditation')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date_key, category)
);

ALTER TABLE public.athlete_day_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "athlete manages own day logs" ON public.athlete_day_logs;
CREATE POLICY "athlete manages own day logs"
  ON public.athlete_day_logs
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "coach reads linked day logs" ON public.athlete_day_logs;
CREATE POLICY "coach reads linked day logs"
  ON public.athlete_day_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_clients c
      WHERE c.client_id::text = athlete_day_logs.user_id::text
        AND c.coach_id::text = auth.uid()::text
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_day_logs TO authenticated;

-- ---------------------------------------------------------------------------
-- Workout archive and coach dispatch columns the client already sends.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.completed_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  client_id TEXT,
  title TEXT,
  session_name TEXT,
  tonnage_kg NUMERIC,
  volume_kg NUMERIC,
  total_sets INT,
  duration_seconds INT,
  strain NUMERIC,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT,
  exercise_name TEXT,
  set_number INT,
  reps INT,
  weight_kg NUMERIC,
  rpe NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  client_id TEXT,
  title TEXT,
  session_name TEXT,
  tonnage_kg NUMERIC,
  volume_kg NUMERIC,
  total_sets INT,
  duration_seconds INT,
  strain NUMERIC,
  exercises JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS session_name TEXT;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS tonnage_kg NUMERIC;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS volume_kg NUMERIC;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS total_sets INT;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS duration_seconds INT;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS strain NUMERIC;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.completed_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS exercise_name TEXT;
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS set_number INT;
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS reps INT;
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS rpe NUMERIC;
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS session_name TEXT;
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS volume_kg NUMERIC;
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS duration_seconds INT;
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS exercises JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF to_regclass('public.assigned_workouts') IS NULL THEN
    CREATE TABLE public.assigned_workouts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_id TEXT NOT NULL,
      coach_id TEXT NOT NULL,
      athlete_id TEXT,
      title TEXT NOT NULL,
      split_day TEXT,
      exercises JSONB DEFAULT '[]'::jsonb,
      parameters JSONB,
      workout_data JSONB,
      assigned_date TIMESTAMPTZ DEFAULT NOW(),
      status TEXT DEFAULT 'assigned',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    ALTER TABLE public.assigned_workouts ADD COLUMN IF NOT EXISTS athlete_id TEXT;
    ALTER TABLE public.assigned_workouts ADD COLUMN IF NOT EXISTS parameters JSONB;
    ALTER TABLE public.assigned_workouts ADD COLUMN IF NOT EXISTS workout_data JSONB;
  END IF;
END $$;

ALTER TABLE public.completed_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access on workout_sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Allow public access on assigned_workouts" ON public.assigned_workouts;

DROP POLICY IF EXISTS "completed_sessions_owner" ON public.completed_sessions;
CREATE POLICY "completed_sessions_owner" ON public.completed_sessions
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text OR client_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text OR client_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "workout_logs_owner" ON public.workout_logs;
CREATE POLICY "workout_logs_owner" ON public.workout_logs
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "workout_sessions_owner" ON public.workout_sessions;
CREATE POLICY "workout_sessions_owner" ON public.workout_sessions
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text OR client_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text OR client_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "assigned_workouts_parties" ON public.assigned_workouts;
CREATE POLICY "assigned_workouts_parties" ON public.assigned_workouts
  FOR ALL TO authenticated
  USING (coach_id::text = auth.uid()::text OR client_id::text = auth.uid()::text OR athlete_id::text = auth.uid()::text)
  WITH CHECK (coach_id::text = auth.uid()::text OR client_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "coach reads linked sessions" ON public.completed_sessions;
CREATE POLICY "coach reads linked sessions" ON public.completed_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_clients c
      WHERE c.coach_id::text = auth.uid()::text
        AND (c.client_id::text = completed_sessions.user_id::text OR c.client_id::text = completed_sessions.client_id::text)
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.completed_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assigned_workouts TO authenticated;

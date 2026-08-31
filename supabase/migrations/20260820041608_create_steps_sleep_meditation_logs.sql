/*
# Create daily_steps, sleep_logs, meditation_sessions tables

Three new tracking tables for the History Log accordion view.

1. New Tables
   - `daily_steps`
     - `id` (uuid, primary key)
     - `user_email` (text, not null) – identifies the user
     - `log_date` (date, not null) – the calendar day
     - `steps` (integer, not null) – step count for the day
     - `goal` (integer, default 10000) – daily step goal
     - `created_at` (timestamptz)
     Unique constraint on (user_email, log_date) to prevent duplicates.

   - `sleep_logs`
     - `id` (uuid, primary key)
     - `user_email` (text, not null)
     - `log_date` (date, not null) – the night of sleep
     - `bedtime` (text) – e.g. "22:30"
     - `wake_time` (text) – e.g. "06:15"
     - `duration_minutes` (integer) – total sleep in minutes
     - `quality` (integer, 1-5 scale)
     - `notes` (text)
     - `created_at` (timestamptz)
     Unique constraint on (user_email, log_date).

   - `meditation_sessions`
     - `id` (uuid, primary key)
     - `user_email` (text, not null)
     - `completed_at` (timestamptz) – when the session ended
     - `duration_secs` (integer) – how long the meditation lasted
     - `soundscape` (text) – ambient sound used
     - `notes` (text)
     - `created_at` (timestamptz)

2. Indexes
   - user_email + log_date DESC on daily_steps and sleep_logs
   - user_email + completed_at DESC on meditation_sessions

3. Security
   - RLS enabled on all tables with anon + authenticated CRUD
     (app uses email-keyed data, no auth.uid ownership)
*/

-- ── daily_steps ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  steps integer NOT NULL DEFAULT 0,
  goal integer NOT NULL DEFAULT 10000,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_email, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date
  ON daily_steps (user_email, log_date DESC);

ALTER TABLE daily_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_daily_steps" ON daily_steps;
CREATE POLICY "select_daily_steps" ON daily_steps FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_daily_steps" ON daily_steps;
CREATE POLICY "insert_daily_steps" ON daily_steps FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_daily_steps" ON daily_steps;
CREATE POLICY "update_daily_steps" ON daily_steps FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_daily_steps" ON daily_steps;
CREATE POLICY "delete_daily_steps" ON daily_steps FOR DELETE
  TO anon, authenticated USING (true);

-- ── sleep_logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  bedtime text,
  wake_time text,
  duration_minutes integer NOT NULL DEFAULT 0,
  quality integer NOT NULL DEFAULT 3 CHECK (quality >= 1 AND quality <= 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_email, log_date)
);

CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date
  ON sleep_logs (user_email, log_date DESC);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_sleep_logs" ON sleep_logs;
CREATE POLICY "select_sleep_logs" ON sleep_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_sleep_logs" ON sleep_logs;
CREATE POLICY "insert_sleep_logs" ON sleep_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_sleep_logs" ON sleep_logs;
CREATE POLICY "update_sleep_logs" ON sleep_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_sleep_logs" ON sleep_logs;
CREATE POLICY "delete_sleep_logs" ON sleep_logs FOR DELETE
  TO anon, authenticated USING (true);

-- ── meditation_sessions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  duration_secs integer NOT NULL DEFAULT 0,
  soundscape text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_date
  ON meditation_sessions (user_email, completed_at DESC);

ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_meditation_sessions" ON meditation_sessions;
CREATE POLICY "select_meditation_sessions" ON meditation_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_meditation_sessions" ON meditation_sessions;
CREATE POLICY "insert_meditation_sessions" ON meditation_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_meditation_sessions" ON meditation_sessions;
CREATE POLICY "update_meditation_sessions" ON meditation_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_meditation_sessions" ON meditation_sessions;
CREATE POLICY "delete_meditation_sessions" ON meditation_sessions FOR DELETE
  TO anon, authenticated USING (true);

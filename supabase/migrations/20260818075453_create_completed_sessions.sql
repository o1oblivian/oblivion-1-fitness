/*
# Create completed_sessions table

Permanent storage for finished workout sessions. Each row is one completed
workout with full exercise/set detail stored as JSONB.

1. New Tables
   - `completed_sessions`
     - `id` (uuid, primary key)
     - `user_email` (text, not null) – identifies the athlete
     - `title` (text) – session title, e.g. "HYPERTROPHY PULL"
     - `completed_at` (timestamptz) – when the session was finished
     - `duration_secs` (integer) – actual session length in seconds
     - `total_volume_kg` (numeric) – total weight x reps across all sets
     - `total_sets` (integer) – count of all sets performed
     - `avg_rpe` (numeric) – average RPE across all sets
     - `exercises` (jsonb) – full exercise + set detail array
     - `created_at` (timestamptz) – row creation time

2. Indexes
   - user_email + completed_at DESC for fast timeline queries

3. Security
   - RLS enabled with anon + authenticated CRUD (app uses email-keyed data, no auth.uid)
*/

CREATE TABLE IF NOT EXISTS completed_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  title text NOT NULL DEFAULT 'Workout',
  completed_at timestamptz NOT NULL DEFAULT now(),
  duration_secs integer NOT NULL DEFAULT 0,
  total_volume_kg numeric NOT NULL DEFAULT 0,
  total_sets integer NOT NULL DEFAULT 0,
  avg_rpe numeric NOT NULL DEFAULT 0,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_completed_sessions_user_date
  ON completed_sessions (user_email, completed_at DESC);

ALTER TABLE completed_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_completed_sessions" ON completed_sessions;
CREATE POLICY "select_completed_sessions" ON completed_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_completed_sessions" ON completed_sessions;
CREATE POLICY "insert_completed_sessions" ON completed_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_completed_sessions" ON completed_sessions;
CREATE POLICY "update_completed_sessions" ON completed_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_completed_sessions" ON completed_sessions;
CREATE POLICY "delete_completed_sessions" ON completed_sessions FOR DELETE
  TO anon, authenticated USING (true);

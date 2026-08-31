/*
# Create coach_activity_logs table

Persistent storage for the coach feed. Each row represents one workout
submission that appears in the coach's review queue. Mirrors the in-memory
CoachLog type from FitnessIntelligenceApp.

1. New Tables
   - `coach_activity_logs`
     - `id` (uuid, primary key)
     - `user_email` (text, not null) – email of the coach/account owner
     - `athlete_name` (text) – display name of the athlete
     - `athlete_handle` (text) – handle/label
     - `volume` (text) – formatted volume string e.g. "23.4 MT"
     - `title` (text) – session title
     - `date_label` (text) – display date e.g. "TODAY"
     - `time_ago` (text) – relative time label
     - `approved` (boolean) – coach approval status
     - `duration` (text) – formatted duration
     - `readiness` (integer) – readiness score 0-100
     - `exercises` (jsonb) – full exercise detail array
     - `created_at` (timestamptz) – row creation time

2. Indexes
   - user_email + created_at DESC for feed queries

3. Security
   - RLS enabled with anon + authenticated CRUD (app uses email-keyed data)
*/

CREATE TABLE IF NOT EXISTS coach_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  athlete_name text NOT NULL DEFAULT '',
  athlete_handle text NOT NULL DEFAULT '',
  volume text NOT NULL DEFAULT '0',
  title text NOT NULL DEFAULT '',
  date_label text NOT NULL DEFAULT '',
  time_ago text NOT NULL DEFAULT '',
  approved boolean NOT NULL DEFAULT false,
  duration text NOT NULL DEFAULT '00:00',
  readiness integer NOT NULL DEFAULT 0,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_activity_logs_user_date
  ON coach_activity_logs (user_email, created_at DESC);

ALTER TABLE coach_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_coach_activity_logs" ON coach_activity_logs;
CREATE POLICY "select_coach_activity_logs" ON coach_activity_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_coach_activity_logs" ON coach_activity_logs;
CREATE POLICY "insert_coach_activity_logs" ON coach_activity_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_coach_activity_logs" ON coach_activity_logs;
CREATE POLICY "update_coach_activity_logs" ON coach_activity_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_coach_activity_logs" ON coach_activity_logs;
CREATE POLICY "delete_coach_activity_logs" ON coach_activity_logs FOR DELETE
  TO anon, authenticated USING (true);

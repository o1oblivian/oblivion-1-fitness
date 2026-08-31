/*
# Create error_logs and analytics_events tables

1. New Tables
  - `error_logs` - Stores application errors and crash reports
    - `id` (uuid, primary key)
    - `user_email` (text, nullable - who experienced the error)
    - `error_message` (text, the error message)
    - `error_stack` (text, nullable - stack trace)
    - `component` (text, nullable - which component/area crashed)
    - `url` (text, nullable - page URL when error occurred)
    - `user_agent` (text, nullable - browser info)
    - `metadata` (jsonb, nullable - extra context)
    - `created_at` (timestamptz)

  - `analytics_events` - Tracks page views and feature usage
    - `id` (uuid, primary key)
    - `user_email` (text, nullable - who triggered the event)
    - `event_name` (text, not null - e.g. 'page_view', 'feature_used')
    - `event_data` (jsonb, nullable - extra event properties)
    - `page` (text, nullable - current page/view)
    - `session_id` (text, nullable - session identifier)
    - `created_at` (timestamptz)

2. Security
  - RLS enabled on both tables
  - Both allow anon + authenticated INSERT (so errors/events can be logged even without login)
  - Only authenticated users can SELECT their own rows
*/

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  error_message text NOT NULL,
  error_stack text,
  component text,
  url text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_insert_errors" ON error_logs;
CREATE POLICY "anyone_can_insert_errors" ON error_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_own_errors" ON error_logs;
CREATE POLICY "authenticated_select_own_errors" ON error_logs FOR SELECT
  TO authenticated USING (user_email = (auth.jwt()->>'email'));

DROP POLICY IF EXISTS "authenticated_delete_own_errors" ON error_logs;
CREATE POLICY "authenticated_delete_own_errors" ON error_logs FOR DELETE
  TO authenticated USING (user_email = (auth.jwt()->>'email'));

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  event_name text NOT NULL,
  event_data jsonb,
  page text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_insert_events" ON analytics_events;
CREATE POLICY "anyone_can_insert_events" ON analytics_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_own_events" ON analytics_events;
CREATE POLICY "authenticated_select_own_events" ON analytics_events FOR SELECT
  TO authenticated USING (user_email = (auth.jwt()->>'email'));

-- Index for querying events by name and time
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created ON analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs (created_at DESC);

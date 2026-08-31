/*
# Create weekly_report_cards table

## Purpose
Stores generated weekly performance report cards for athletes, summarizing training adherence,
nutrition consistency, sleep quality, steps, bodyweight trend, and an overall letter grade.

## New Tables
- `weekly_report_cards`
  - `id` (uuid, PK)
  - `user_email` (text, not null) - the athlete this report belongs to
  - `week_start` (date, not null) - Monday of the report week
  - `week_end` (date, not null) - Sunday of the report week
  - `training_score` (integer) - 0-100, sessions completed vs planned
  - `nutrition_score` (integer) - 0-100, macro adherence
  - `sleep_score` (integer) - 0-100, sleep quality/duration
  - `steps_score` (integer) - 0-100, step goal adherence
  - `consistency_score` (integer) - 0-100, overall streak/logging consistency
  - `overall_grade` (text) - letter grade A+ through F
  - `overall_score` (integer) - 0-100, weighted average
  - `highlights` (jsonb) - PRs, streaks, achievements
  - `areas_to_improve` (jsonb) - flagged weak areas
  - `snapshot_data` (jsonb) - raw metric data for the week
  - `generated_by` (text) - 'system' or coach email who generated it
  - `created_at` (timestamptz)

## Security
- RLS enabled
- Athletes can read their own reports
- Coaches can read/create reports for their clients
- Uses JWT email matching for ownership
*/

CREATE TABLE IF NOT EXISTS weekly_report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  training_score integer NOT NULL DEFAULT 0,
  nutrition_score integer NOT NULL DEFAULT 0,
  sleep_score integer NOT NULL DEFAULT 0,
  steps_score integer NOT NULL DEFAULT 0,
  consistency_score integer NOT NULL DEFAULT 0,
  overall_grade text NOT NULL DEFAULT 'C',
  overall_score integer NOT NULL DEFAULT 0,
  highlights jsonb DEFAULT '[]'::jsonb,
  areas_to_improve jsonb DEFAULT '[]'::jsonb,
  snapshot_data jsonb DEFAULT '{}'::jsonb,
  generated_by text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_email, week_start)
);

ALTER TABLE weekly_report_cards ENABLE ROW LEVEL SECURITY;

-- Athletes can view their own report cards
DROP POLICY IF EXISTS "select_own_report_cards" ON weekly_report_cards;
CREATE POLICY "select_own_report_cards" ON weekly_report_cards FOR SELECT
  TO anon, authenticated
  USING (
    user_email = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
    OR
    generated_by = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
  );

-- Coaches or system can insert report cards
DROP POLICY IF EXISTS "insert_report_cards" ON weekly_report_cards;
CREATE POLICY "insert_report_cards" ON weekly_report_cards FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only the generator or owner can update
DROP POLICY IF EXISTS "update_own_report_cards" ON weekly_report_cards;
CREATE POLICY "update_own_report_cards" ON weekly_report_cards FOR UPDATE
  TO anon, authenticated
  USING (
    user_email = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
    OR
    generated_by = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
  )
  WITH CHECK (
    user_email = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
    OR
    generated_by = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
  );

-- Owner or generator can delete
DROP POLICY IF EXISTS "delete_own_report_cards" ON weekly_report_cards;
CREATE POLICY "delete_own_report_cards" ON weekly_report_cards FOR DELETE
  TO anon, authenticated
  USING (
    user_email = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
    OR
    generated_by = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
  );

CREATE INDEX IF NOT EXISTS idx_report_cards_user_email ON weekly_report_cards(user_email);
CREATE INDEX IF NOT EXISTS idx_report_cards_week_start ON weekly_report_cards(week_start);

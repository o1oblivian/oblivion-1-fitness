/*
# Create consultation_requests table

## Purpose
Stores consultation requests from clients to coaches, replacing free-form direct messaging
with a structured intake flow that qualifies prospects and gives coaches a progress snapshot.

## New Tables
- `consultation_requests`
  - `id` (uuid, PK)
  - `client_email` (text, not null) - the requesting client
  - `coach_email` (text, not null) - the target coach
  - `status` (text) - pending | accepted | declined | completed
  - `goal` (text) - primary fitness goal
  - `experience_level` (text) - beginner | intermediate | advanced
  - `training_days_per_week` (integer)
  - `why_now` (text) - client motivation paragraph
  - `snapshot_data` (jsonb) - auto-compiled progress snapshot (workouts, nutrition, sleep, bodyweight)
  - `coach_response_note` (text) - coach's personalized response
  - `proposed_duration_weeks` (integer) - coach proposed program duration
  - `proposed_focus` (text) - coach proposed focus area
  - `proposed_price_cents` (integer) - coach proposed price
  - `created_at` (timestamptz)
  - `responded_at` (timestamptz) - when coach responded

## Security
- RLS enabled
- Clients can create and read their own requests
- Coaches can read requests addressed to them and update (respond to) them
- Uses JWT email for ownership since app uses email-based identity
*/

CREATE TABLE IF NOT EXISTS consultation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email text NOT NULL,
  coach_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  goal text NOT NULL,
  experience_level text NOT NULL DEFAULT 'intermediate' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  training_days_per_week integer NOT NULL DEFAULT 4,
  why_now text NOT NULL DEFAULT '',
  snapshot_data jsonb DEFAULT '{}'::jsonb,
  coach_response_note text,
  proposed_duration_weeks integer,
  proposed_focus text,
  proposed_price_cents integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- Clients can view their own sent requests
DROP POLICY IF EXISTS "client_select_own_requests" ON consultation_requests;
CREATE POLICY "client_select_own_requests" ON consultation_requests FOR SELECT
  TO anon, authenticated
  USING (
    client_email = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
    OR
    coach_email = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
  );

-- Clients can create requests
DROP POLICY IF EXISTS "client_insert_requests" ON consultation_requests;
CREATE POLICY "client_insert_requests" ON consultation_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    client_email = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
  );

-- Coaches can update requests addressed to them (respond)
DROP POLICY IF EXISTS "coach_update_requests" ON consultation_requests;
CREATE POLICY "coach_update_requests" ON consultation_requests FOR UPDATE
  TO anon, authenticated
  USING (
    coach_email = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
  )
  WITH CHECK (
    coach_email = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
  );

-- Clients can delete their own pending requests
DROP POLICY IF EXISTS "client_delete_own_requests" ON consultation_requests;
CREATE POLICY "client_delete_own_requests" ON consultation_requests FOR DELETE
  TO anon, authenticated
  USING (
    client_email = coalesce(
      current_setting('request.jwt.claims', true)::json->>'email',
      ''
    )
    AND status = 'pending'
  );

-- Index for coach lookups
CREATE INDEX IF NOT EXISTS idx_consultation_requests_coach_email ON consultation_requests(coach_email);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_client_email ON consultation_requests(client_email);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);

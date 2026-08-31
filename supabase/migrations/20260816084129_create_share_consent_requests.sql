/*
# Create share_consent_requests table

1. New Tables
  - `share_consent_requests`
    - `id` (uuid, primary key)
    - `coach_email` (text, not null) - email of the coach requesting share
    - `client_email` (text, not null) - email of the client whose data is being shared
    - `client_name` (text, not null) - display name of the client
    - `share_type` (text, not null) - what is being shared: 'progress', 'goals', 'transformation'
    - `share_description` (text) - coach's note about what they want to share
    - `otp_code` (text, not null) - 6-digit OTP code for consent verification
    - `status` (text, not null, default 'pending') - 'pending', 'approved', 'denied', 'expired'
    - `expires_at` (timestamptz, not null) - when the OTP expires (10 min from creation)
    - `responded_at` (timestamptz) - when the client responded
    - `created_at` (timestamptz, default now())

2. Security
  - Enable RLS on `share_consent_requests`.
  - Allow anon + authenticated full CRUD (app uses email-based identification, not auth.uid()).
*/

CREATE TABLE IF NOT EXISTS share_consent_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_email text NOT NULL,
  client_email text NOT NULL,
  client_name text NOT NULL,
  share_type text NOT NULL CHECK (share_type IN ('progress', 'goals', 'transformation')),
  share_description text,
  otp_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  expires_at timestamptz NOT NULL,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE share_consent_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_share_consent" ON share_consent_requests;
CREATE POLICY "select_share_consent" ON share_consent_requests FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_share_consent" ON share_consent_requests;
CREATE POLICY "insert_share_consent" ON share_consent_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_share_consent" ON share_consent_requests;
CREATE POLICY "update_share_consent" ON share_consent_requests FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_share_consent" ON share_consent_requests;
CREATE POLICY "delete_share_consent" ON share_consent_requests FOR DELETE
  TO anon, authenticated USING (true);

/*
# Create gym_session_bookings table

1. New Tables
  - `gym_session_bookings`
    - `id` (uuid, primary key)
    - `proposer_email` (text, not null) - email of the user who proposed the session
    - `recipient_email` (text, not null) - email of the buddy being invited
    - `session_date` (date, not null) - date of the gym session
    - `time_slot` (text, not null) - time slot for the session
    - `gym_name` (text, not null) - gym where the session will take place
    - `status` (text, default 'pending') - pending / accepted / declined / cancelled
    - `created_at` (timestamptz, default now())
    - `responded_at` (timestamptz) - when the recipient responded

2. Security
  - Enable RLS on `gym_session_bookings`
  - Users can see bookings where they are proposer or recipient (via JWT email)
  - Users can insert bookings as proposer
  - Users can update status only if they are the recipient
  - Users can delete bookings they proposed

3. Indexes
  - Index on proposer_email
  - Index on recipient_email
  - Index on status
*/

CREATE TABLE IF NOT EXISTS gym_session_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_email text NOT NULL,
  recipient_email text NOT NULL,
  session_date date NOT NULL,
  time_slot text NOT NULL,
  gym_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

ALTER TABLE gym_session_bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_gym_bookings_proposer ON gym_session_bookings(proposer_email);
CREATE INDEX IF NOT EXISTS idx_gym_bookings_recipient ON gym_session_bookings(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gym_bookings_status ON gym_session_bookings(status);

DROP POLICY IF EXISTS "select_own_bookings" ON gym_session_bookings;
CREATE POLICY "select_own_bookings" ON gym_session_bookings FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = proposer_email
    OR (auth.jwt() ->> 'email') = recipient_email
  );

DROP POLICY IF EXISTS "insert_own_bookings" ON gym_session_bookings;
CREATE POLICY "insert_own_bookings" ON gym_session_bookings FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = proposer_email);

DROP POLICY IF EXISTS "update_recipient_bookings" ON gym_session_bookings;
CREATE POLICY "update_recipient_bookings" ON gym_session_bookings FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = recipient_email
    OR (auth.jwt() ->> 'email') = proposer_email
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') = recipient_email
    OR (auth.jwt() ->> 'email') = proposer_email
  );

DROP POLICY IF EXISTS "delete_own_bookings" ON gym_session_bookings;
CREATE POLICY "delete_own_bookings" ON gym_session_bookings FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = proposer_email);

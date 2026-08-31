/*
# Create user_reminders table for notification & reminder system

1. New Tables
   - `user_reminders`
     - `id` (uuid, primary key)
     - `user_email` (text, not null) - identifies the user
     - `type` (text, not null) - reminder category: 'workout', 'meal', 'hydration', 'supplement', 'weigh_in', 'custom'
     - `title` (text, not null) - display title
     - `body` (text) - optional detail/message
     - `time_of_day` (time, not null) - when to fire (HH:MM)
     - `days_of_week` (int[], not null) - 0=Sun,1=Mon..6=Sat
     - `enabled` (boolean, default true)
     - `last_fired_at` (timestamptz) - tracks when last shown
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

2. Security
   - Enable RLS on `user_reminders`
   - Users can only CRUD their own reminders (matched by JWT email)
*/

CREATE TABLE IF NOT EXISTS user_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  type text NOT NULL CHECK (type IN ('workout', 'meal', 'hydration', 'supplement', 'weigh_in', 'custom')),
  title text NOT NULL,
  body text,
  time_of_day time NOT NULL,
  days_of_week int[] NOT NULL DEFAULT '{1,2,3,4,5,6,0}',
  enabled boolean NOT NULL DEFAULT true,
  last_fired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reminders" ON user_reminders;
CREATE POLICY "select_own_reminders" ON user_reminders FOR SELECT
  TO authenticated
  USING (user_email = (auth.jwt()->>'email'));

DROP POLICY IF EXISTS "insert_own_reminders" ON user_reminders;
CREATE POLICY "insert_own_reminders" ON user_reminders FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (auth.jwt()->>'email'));

DROP POLICY IF EXISTS "update_own_reminders" ON user_reminders;
CREATE POLICY "update_own_reminders" ON user_reminders FOR UPDATE
  TO authenticated
  USING (user_email = (auth.jwt()->>'email'))
  WITH CHECK (user_email = (auth.jwt()->>'email'));

DROP POLICY IF EXISTS "delete_own_reminders" ON user_reminders;
CREATE POLICY "delete_own_reminders" ON user_reminders FOR DELETE
  TO authenticated
  USING (user_email = (auth.jwt()->>'email'));

CREATE INDEX IF NOT EXISTS idx_user_reminders_email ON user_reminders(user_email);
CREATE INDEX IF NOT EXISTS idx_user_reminders_enabled ON user_reminders(user_email, enabled) WHERE enabled = true;

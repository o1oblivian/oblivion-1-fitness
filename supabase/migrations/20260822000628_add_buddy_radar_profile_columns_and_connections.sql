/*
# Add Buddy Radar Profile Columns & Connections Table

1. Modified Tables
   - `profiles`
     - `photos` (text array) — multi-photo gallery URLs
     - `age` (integer) — user age
     - `height` (integer) — height in cm
     - `weight` (numeric) — weight in kg
     - `discipline` (text) — training discipline
     - `experience_level` (text) — training level
     - `preferred_time` (text) — preferred workout time
     - `home_gym` (text) — primary gym
     - `current_gym` (text) — gym currently at
     - `gym_zone_sharing` (boolean) — share gym location with buddies
     - `public_telemetry` (boolean) — share stats publicly
     - `is_ghost_mode` (boolean) — hide from radar
     - `latitude` (double precision) — location lat
     - `longitude` (double precision) — location lng
     - `last_active_at` (timestamptz) — last activity timestamp

2. New Tables
   - `buddy_connections`
     - `id` (uuid, primary key)
     - `user_email` (text) — requesting user email
     - `buddy_email` (text) — target buddy email
     - `status` (text) — 'pending', 'connected', 'fist_bumped'
     - `created_at` (timestamptz)

3. Security
   - RLS on buddy_connections with policies for authenticated users
*/

-- Add columns to profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='photos') THEN
    ALTER TABLE profiles ADD COLUMN photos text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='age') THEN
    ALTER TABLE profiles ADD COLUMN age integer DEFAULT 28;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='height') THEN
    ALTER TABLE profiles ADD COLUMN height integer DEFAULT 175;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='weight') THEN
    ALTER TABLE profiles ADD COLUMN weight numeric DEFAULT 81.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='discipline') THEN
    ALTER TABLE profiles ADD COLUMN discipline text DEFAULT 'Hypertrophy';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='experience_level') THEN
    ALTER TABLE profiles ADD COLUMN experience_level text DEFAULT 'Intermediate';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferred_time') THEN
    ALTER TABLE profiles ADD COLUMN preferred_time text DEFAULT 'Morning';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='home_gym') THEN
    ALTER TABLE profiles ADD COLUMN home_gym text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='current_gym') THEN
    ALTER TABLE profiles ADD COLUMN current_gym text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='gym_zone_sharing') THEN
    ALTER TABLE profiles ADD COLUMN gym_zone_sharing boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='public_telemetry') THEN
    ALTER TABLE profiles ADD COLUMN public_telemetry boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_ghost_mode') THEN
    ALTER TABLE profiles ADD COLUMN is_ghost_mode boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='latitude') THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision DEFAULT -33.8688;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='longitude') THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision DEFAULT 151.2093;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_active_at') THEN
    ALTER TABLE profiles ADD COLUMN last_active_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create buddy_connections table
CREATE TABLE IF NOT EXISTS buddy_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  buddy_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_email, buddy_email)
);

ALTER TABLE buddy_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_connections" ON buddy_connections;
CREATE POLICY "select_own_connections" ON buddy_connections FOR SELECT
  TO authenticated
  USING (
    user_email = (auth.jwt()->>'email')
    OR buddy_email = (auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "insert_own_connections" ON buddy_connections;
CREATE POLICY "insert_own_connections" ON buddy_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (auth.jwt()->>'email'));

DROP POLICY IF EXISTS "update_own_connections" ON buddy_connections;
CREATE POLICY "update_own_connections" ON buddy_connections FOR UPDATE
  TO authenticated
  USING (
    user_email = (auth.jwt()->>'email')
    OR buddy_email = (auth.jwt()->>'email')
  )
  WITH CHECK (
    user_email = (auth.jwt()->>'email')
    OR buddy_email = (auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "delete_own_connections" ON buddy_connections;
CREATE POLICY "delete_own_connections" ON buddy_connections FOR DELETE
  TO authenticated
  USING (user_email = (auth.jwt()->>'email'));

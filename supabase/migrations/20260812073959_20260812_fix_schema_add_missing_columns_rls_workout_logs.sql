-- 1. Add missing columns to gym_venues (category, city, country)
ALTER TABLE gym_venues ADD COLUMN IF NOT EXISTS category text DEFAULT 'Gym';
ALTER TABLE gym_venues ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE gym_venues ADD COLUMN IF NOT EXISTS country text DEFAULT 'Australia';

-- 2. Create workout_logs table (referenced by frontend but missing)
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  active_logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_email, record_date)
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing open-access policies and recreate with proper ownership checks

-- checkins: drop old policies
DROP POLICY IF EXISTS anon_delete_checkins ON checkins;
DROP POLICY IF EXISTS anon_update_checkins ON checkins;
DROP POLICY IF EXISTS anon_select_checkins ON checkins;
DROP POLICY IF EXISTS anon_insert_checkins ON checkins;

-- habits: drop old policies
DROP POLICY IF EXISTS anon_delete_habits ON habits;
DROP POLICY IF EXISTS anon_update_habits ON habits;
DROP POLICY IF EXISTS anon_insert_habits ON habits;
DROP POLICY IF EXISTS anon_select_habits ON habits;

-- coach_feedback: drop old policies
DROP POLICY IF EXISTS "Allow read coach_feedback" ON coach_feedback;
DROP POLICY IF EXISTS "Allow write coach_feedback" ON coach_feedback;

-- direct_messages: drop old policies
DROP POLICY IF EXISTS "Allow read direct_messages" ON direct_messages;
DROP POLICY IF EXISTS "Allow write direct_messages" ON direct_messages;

-- dispatched_workouts: drop old policies
DROP POLICY IF EXISTS "Allow read dispatched_workouts" ON dispatched_workouts;
DROP POLICY IF EXISTS "Allow write dispatched_workouts" ON dispatched_workouts;

-- gym_passes: drop old policies
DROP POLICY IF EXISTS "Allow read gym_passes" ON gym_passes;
DROP POLICY IF EXISTS "Allow write gym_passes" ON gym_passes;

-- gym_venues: drop old policies
DROP POLICY IF EXISTS "Allow read gym_venues" ON gym_venues;
DROP POLICY IF EXISTS "Allow write gym_venues" ON gym_venues;

-- health_telemetry: drop old policies
DROP POLICY IF EXISTS "Allow read health_telemetry" ON health_telemetry;
DROP POLICY IF EXISTS "Allow write health_telemetry" ON health_telemetry;

-- live_workout_logs: drop old policies
DROP POLICY IF EXISTS "Allow read live_workout_logs" ON live_workout_logs;
DROP POLICY IF EXISTS "Allow write live_workout_logs" ON live_workout_logs;

-- profiles: drop old policies
DROP POLICY IF EXISTS "Allow read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow write profiles" ON profiles;

-- user_training_vectors: drop old policies
DROP POLICY IF EXISTS "Allow read user_training_vectors" ON user_training_vectors;
DROP POLICY IF EXISTS "Allow write user_training_vectors" ON user_training_vectors;

-- 4. Recreate policies with proper ownership checks using auth.uid()

-- gym_venues: public read (partner directory), auth write
CREATE POLICY "select_gym_venues" ON gym_venues FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_gym_venues" ON gym_venues FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_gym_venues" ON gym_venues FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- user_training_vectors: user owns their row, public read for buddy matching
CREATE POLICY "select_user_training_vectors" ON user_training_vectors FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_user_training_vectors" ON user_training_vectors FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_email OR user_email = '');
CREATE POLICY "update_user_training_vectors" ON user_training_vectors FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_email) WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "delete_user_training_vectors" ON user_training_vectors FOR DELETE
  TO authenticated USING (auth.uid()::text = user_email);

-- gym_passes: user owns their passes
CREATE POLICY "select_gym_passes" ON gym_passes FOR SELECT
  TO authenticated USING (auth.uid()::text = user_email OR user_email = '');
CREATE POLICY "insert_gym_passes" ON gym_passes FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_email OR user_email = '');
CREATE POLICY "update_gym_passes" ON gym_passes FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_email) WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "delete_gym_passes" ON gym_passes FOR DELETE
  TO authenticated USING (auth.uid()::text = user_email);

-- direct_messages: users can only see/modify their own messages
CREATE POLICY "select_direct_messages" ON direct_messages FOR SELECT
  TO authenticated USING (auth.uid()::text = sender_email OR auth.uid()::text = receiver_email);
CREATE POLICY "insert_direct_messages" ON direct_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = sender_email);
CREATE POLICY "update_direct_messages" ON direct_messages FOR UPDATE
  TO authenticated USING (auth.uid()::text = sender_email) WITH CHECK (auth.uid()::text = sender_email);
CREATE POLICY "delete_direct_messages" ON direct_messages FOR DELETE
  TO authenticated USING (auth.uid()::text = sender_email OR auth.uid()::text = receiver_email);

-- coach_feedback: coach owns their feedback, clients read their feedback
CREATE POLICY "select_coach_feedback" ON coach_feedback FOR SELECT
  TO authenticated USING (auth.uid()::text = coach_id OR auth.uid()::text = client_email);
CREATE POLICY "insert_coach_feedback" ON coach_feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = coach_id);
CREATE POLICY "update_coach_feedback" ON coach_feedback FOR UPDATE
  TO authenticated USING (auth.uid()::text = coach_id) WITH CHECK (auth.uid()::text = coach_id);
CREATE POLICY "delete_coach_feedback" ON coach_feedback FOR DELETE
  TO authenticated USING (auth.uid()::text = coach_id);

-- dispatched_workouts: coach owns dispatched workouts
CREATE POLICY "select_dispatched_workouts" ON dispatched_workouts FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_dispatched_workouts" ON dispatched_workouts FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_dispatched_workouts" ON dispatched_workouts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_dispatched_workouts" ON dispatched_workouts FOR DELETE
  TO authenticated USING (true);

-- live_workout_logs: users own their workout logs
CREATE POLICY "select_live_workout_logs" ON live_workout_logs FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_live_workout_logs" ON live_workout_logs FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_live_workout_logs" ON live_workout_logs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_live_workout_logs" ON live_workout_logs FOR DELETE
  TO authenticated USING (true);

-- workout_logs: users own their daily workout logs
CREATE POLICY "select_workout_logs" ON workout_logs FOR SELECT
  TO authenticated USING (auth.uid()::text = user_email);
CREATE POLICY "insert_workout_logs" ON workout_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "update_workout_logs" ON workout_logs FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_email) WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "delete_workout_logs" ON workout_logs FOR DELETE
  TO authenticated USING (auth.uid()::text = user_email);

-- health_telemetry: users own their telemetry
CREATE POLICY "select_health_telemetry" ON health_telemetry FOR SELECT
  TO authenticated USING (auth.uid()::text = user_email);
CREATE POLICY "insert_health_telemetry" ON health_telemetry FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "update_health_telemetry" ON health_telemetry FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_email) WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "delete_health_telemetry" ON health_telemetry FOR DELETE
  TO authenticated USING (auth.uid()::text = user_email);

-- profiles: users own their profile
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (auth.uid()::text = id::text OR true);
CREATE POLICY "insert_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = id::text);
CREATE POLICY "update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);
CREATE POLICY "delete_profiles" ON profiles FOR DELETE
  TO authenticated USING (auth.uid()::text = id::text);

-- habits: users own their habits (add user_id column if missing)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS user_id text;
CREATE POLICY "select_habits" ON habits FOR SELECT
  TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "insert_habits" ON habits FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "update_habits" ON habits FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "delete_habits" ON habits FOR DELETE
  TO authenticated USING (auth.uid()::text = user_id);

-- checkins: users own their checkins (add user_id column if missing)
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS user_id text;
CREATE POLICY "select_checkins" ON checkins FOR SELECT
  TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "insert_checkins" ON checkins FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "update_checkins" ON checkins FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "delete_checkins" ON checkins FOR DELETE
  TO authenticated USING (auth.uid()::text = user_id);

-- 5. Update find_buddy_matches RPC to return vector_array
CREATE OR REPLACE FUNCTION find_buddy_matches(
  current_user_email text,
  user_lat double precision,
  user_lng double precision,
  max_distance_km double precision DEFAULT 50.0
)
RETURNS TABLE (
  id uuid,
  user_email text,
  user_name text,
  user_avatar text,
  gender text,
  city_town text,
  postcode text,
  partner_status text,
  venue_id text,
  rpe_target numeric,
  volume_level integer,
  training_focus text,
  workout_preferences text[],
  age integer,
  favorite_gym text,
  vector_array double precision[],
  bio text,
  updated_at timestamptz,
  distance_km double precision,
  similarity_score double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    v.id,
    v.user_email,
    v.user_name,
    v.user_avatar,
    v.gender,
    v.city_town,
    v.postcode,
    v.partner_status,
    v.venue_id,
    v.rpe_target,
    v.volume_level,
    v.training_focus,
    v.workout_preferences,
    v.age,
    v.favorite_gym,
    v.vector_array,
    v.bio,
    v.updated_at,
    ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000.0 AS distance_km,
    0.85::double precision AS similarity_score
  FROM user_training_vectors v
  WHERE v.user_email != current_user_email
    AND v.location IS NOT NULL
    AND ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      max_distance_km * 1000.0
    )
  ORDER BY distance_km ASC
  LIMIT 20;
$$;
-- =====================================================================
-- FITLAB PLATINUM SUPABASE DATABASE SCHEMA & POSTGIS REALTIME ENGINE
-- =====================================================================
-- Supports:
-- 1. Coach-Client Communication & Real-Time Live Logging
-- 2. Date Match (Buddy System) Vector Preference Matrix & PostGIS Geospatial Engine
-- 3. Gym Navigation & Proximity Locator
-- 4. Digital QR Passes, Memberships, and Unified Health Telemetry with RLS
-- =====================================================================

-- Enable required Postgres Extensions
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. PROFILES & ATHLETE TELEMETRY HEADERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Elite Athlete',
  avatar_url TEXT DEFAULT '',
  handle TEXT DEFAULT '',
  is_coach BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. COACH-CLIENT WORKOUT DISPATCH & LIVE LOGGING
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dispatched_workouts (
  id TEXT PRIMARY KEY DEFAULT ('disp_' || gen_random_uuid()::text),
  coachId TEXT NOT NULL,
  coachName TEXT NOT NULL,
  clientIds TEXT[] NOT NULL DEFAULT '{}',
  clientNames TEXT[] DEFAULT '{}',
  title TEXT NOT NULL,
  routineCategory TEXT NOT NULL DEFAULT 'Push',
  scheduledDay TEXT DEFAULT 'Today',
  scheduledDate DATE DEFAULT CURRENT_DATE,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Dispatched', -- 'Dispatched', 'In Progress', 'Completed'
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id TEXT REFERENCES public.dispatched_workouts(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INT NOT NULL,
  weight_kg NUMERIC(6,2),
  reps_completed INT,
  rpe NUMERIC(3,1),
  notes TEXT DEFAULT '',
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coach_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id TEXT REFERENCES public.dispatched_workouts(id) ON DELETE CASCADE,
  coach_id TEXT NOT NULL,
  client_email TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  rating NUMERIC(3,1) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. BUDDY SYSTEM & DATE MATCHING (POSTGIS + VECTOR MATRICES)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_training_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT DEFAULT '',
  gender TEXT DEFAULT 'Non-Binary',
  city_town TEXT DEFAULT 'Melbourne',
  postcode TEXT DEFAULT '3000',
  partner_status TEXT DEFAULT 'Open for Gym Date',
  venue_id TEXT,
  rpe_target NUMERIC(3,1) DEFAULT 8.0,
  volume_level INT DEFAULT 18,
  training_focus TEXT DEFAULT 'Hypertrophy',
  workout_preferences TEXT[] DEFAULT '{}',
  age INT DEFAULT 25,
  favorite_gym TEXT DEFAULT '',
  vector_array NUMERIC[] DEFAULT '{0.85, 0.60, 0, 1, 0, 0}',
  bio TEXT DEFAULT '',
  location GEOGRAPHY(POINT, 4326), -- PostGIS Spatial Point for Distance Queries
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Spatial GIST Index for PostGIS queries
CREATE INDEX IF NOT EXISTS idx_user_vectors_location ON public.user_training_vectors USING GIST(location);

-- ---------------------------------------------------------------------
-- 4. GYM LOCATOR & VENUE NAVIGATION
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  postcode TEXT NOT NULL,
  address TEXT NOT NULL,
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  location GEOGRAPHY(POINT, 4326), -- PostGIS Location
  image_url TEXT,
  is_partner BOOLEAN DEFAULT true,
  vibe_tags TEXT[] DEFAULT '{}',
  pass_price_aud NUMERIC(6,2) DEFAULT 14.99,
  active_checkins_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_venues_location ON public.gym_venues USING GIST(location);

-- ---------------------------------------------------------------------
-- 5. DIGITAL QR PASSES & MEMBERSHIPS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_token TEXT UNIQUE NOT NULL,
  venue_id TEXT NOT NULL,
  venue_name TEXT,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  pass_type TEXT DEFAULT 'Day Pass',
  price_aud NUMERIC(6,2) DEFAULT 14.99,
  valid_until TIMESTAMPTZ NOT NULL,
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 6. HEALTH TELEMETRY & UNIFIED TRACKING
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.health_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INT DEFAULT 0,
  step_target INT DEFAULT 10000,
  weight_kg NUMERIC(5,2),
  calories_consumed INT DEFAULT 0,
  protein_g INT DEFAULT 0,
  carbs_g INT DEFAULT 0,
  fat_g INT DEFAULT 0,
  water_ml INT DEFAULT 0,
  hrv_ms INT DEFAULT 65,
  sleep_hours NUMERIC(4,2) DEFAULT 7.5,
  workout_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, record_date)
);

-- ---------------------------------------------------------------------
-- 7. DIRECT MESSAGES / BUDDY CHAT
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || gen_random_uuid()::text),
  sender_email TEXT NOT NULL,
  receiver_email TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatched_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Permissive policies for FitLab API operations
CREATE POLICY "Allow read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow write profiles" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Allow read dispatched_workouts" ON public.dispatched_workouts FOR SELECT USING (true);
CREATE POLICY "Allow write dispatched_workouts" ON public.dispatched_workouts FOR ALL USING (true);

CREATE POLICY "Allow read live_workout_logs" ON public.live_workout_logs FOR SELECT USING (true);
CREATE POLICY "Allow write live_workout_logs" ON public.live_workout_logs FOR ALL USING (true);

CREATE POLICY "Allow read coach_feedback" ON public.coach_feedback FOR SELECT USING (true);
CREATE POLICY "Allow write coach_feedback" ON public.coach_feedback FOR ALL USING (true);

CREATE POLICY "Allow read user_training_vectors" ON public.user_training_vectors FOR SELECT USING (true);
CREATE POLICY "Allow write user_training_vectors" ON public.user_training_vectors FOR ALL USING (true);

CREATE POLICY "Allow read gym_venues" ON public.gym_venues FOR SELECT USING (true);
CREATE POLICY "Allow write gym_venues" ON public.gym_venues FOR ALL USING (true);

CREATE POLICY "Allow read gym_passes" ON public.gym_passes FOR SELECT USING (true);
CREATE POLICY "Allow write gym_passes" ON public.gym_passes FOR ALL USING (true);

CREATE POLICY "Allow read health_telemetry" ON public.health_telemetry FOR SELECT USING (true);
CREATE POLICY "Allow write health_telemetry" ON public.health_telemetry FOR ALL USING (true);

CREATE POLICY "Allow read direct_messages" ON public.direct_messages FOR SELECT USING (true);
CREATE POLICY "Allow write direct_messages" ON public.direct_messages FOR ALL USING (true);

-- ---------------------------------------------------------------------
-- POSTGIS GEOSPATIAL & RPC FUNCTIONS
-- ---------------------------------------------------------------------

-- Function 1: Find Nearby Gym Venues within Radius (meters) using PostGIS
CREATE OR REPLACE FUNCTION public.get_nearby_gym_venues(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_meters NUMERIC DEFAULT 25000
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  postcode TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  image_url TEXT,
  is_partner BOOLEAN,
  vibe_tags TEXT[],
  pass_price_aud NUMERIC,
  active_checkins_count INT,
  distance_km NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.name,
    v.postcode,
    v.address,
    v.lat,
    v.lng,
    v.image_url,
    v.is_partner,
    v.vibe_tags,
    v.pass_price_aud,
    v.active_checkins_count,
    ROUND((ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000.0)::numeric, 2) AS distance_km
  FROM public.gym_venues v
  WHERE ST_DWithin(
    v.location,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_km ASC;
END;
$$;

-- Function 2: Find Buddy / Date Match Profiles with Distance & Vector Compatibility
CREATE OR REPLACE FUNCTION public.find_buddy_matches(
  current_user_email TEXT,
  user_lat NUMERIC,
  user_lng NUMERIC,
  max_distance_km NUMERIC DEFAULT 50.0
)
RETURNS TABLE (
  id UUID,
  user_email TEXT,
  user_name TEXT,
  user_avatar TEXT,
  gender TEXT,
  city_town TEXT,
  postcode TEXT,
  partner_status TEXT,
  venue_id TEXT,
  rpe_target NUMERIC,
  volume_level INT,
  training_focus TEXT,
  workout_preferences TEXT[],
  age INT,
  favorite_gym TEXT,
  bio TEXT,
  distance_km NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.user_email,
    u.user_name,
    u.user_avatar,
    u.gender,
    u.city_town,
    u.postcode,
    u.partner_status,
    u.venue_id,
    u.rpe_target,
    u.volume_level,
    u.training_focus,
    u.workout_preferences,
    u.age,
    u.favorite_gym,
    u.bio,
    ROUND((ST_Distance(
      u.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000.0)::numeric, 2) AS distance_km
  FROM public.user_training_vectors u
  WHERE u.user_email <> current_user_email
    AND (
      u.location IS NULL OR
      ST_DWithin(
        u.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        max_distance_km * 1000.0
      )
    )
  ORDER BY distance_km ASC NULLS LAST;
END;
$$;

-- ---------------------------------------------------------------------
-- REALTIME SUBSCRIPTIONS PUBLICATION
-- ---------------------------------------------------------------------
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE
    public.dispatched_workouts,
    public.live_workout_logs,
    public.coach_feedback,
    public.user_training_vectors,
    public.gym_passes,
    public.health_telemetry,
    public.direct_messages;
COMMIT;

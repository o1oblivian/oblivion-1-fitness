-- ============================================================================
-- OBLIVION 1 FITNESS CLUB (O1FC) - OFFICIAL SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Execute this script in your Supabase Project SQL Editor (Dashboard > SQL Editor)
-- This creates all required tables, Row Level Security (RLS) policies, and Realtime publications.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Athlete Profiles Table (Stores user profile, tier, and 90-day trial status)
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
  id TEXT PRIMARY KEY,
  handle TEXT,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  membership_tier TEXT DEFAULT 'core_free', -- 'core_free', 'pro', 'founder_pass', 'travel_pass'
  status TEXT DEFAULT 'active',
  is_trial_active BOOLEAN DEFAULT TRUE,
  trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  trial_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Entitlements Table (Stores verified Store receipts & RevenueCat status)
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  user_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'inactive'
  platform TEXT DEFAULT 'web', -- 'ios', 'android', 'web'
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Workout Sessions Table (Stores completed workout logs and volume strain)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  duration TEXT,
  strain NUMERIC,
  tonnage_kg NUMERIC,
  total_sets INT,
  exercises JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Assigned Workouts Table (Coach-to-Client Workout Dispatch)
CREATE TABLE IF NOT EXISTS public.assigned_workouts (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  client_id TEXT NOT NULL,
  coach_id TEXT NOT NULL,
  title TEXT NOT NULL,
  split_day TEXT,
  exercises JSONB DEFAULT '[]'::jsonb,
  assigned_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Buddy Profiles Table (Radar Corridor & Global Travel Matching)
CREATE TABLE IF NOT EXISTS public.buddy_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT,
  discipline TEXT,
  home_gym TEXT,
  city TEXT,
  distance_km NUMERIC DEFAULT 5.0,
  verified BOOLEAN DEFAULT TRUE,
  is_ghost_mode BOOLEAN DEFAULT FALSE,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Buddy Messages Table (In-App Direct Athlete Messaging)
CREATE TABLE IF NOT EXISTS public.buddy_messages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_messages ENABLE ROW LEVEL SECURITY;

-- Anonymous/Authenticated Public access policies for client-side operations:
DO $$
BEGIN
  -- athlete_profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on athlete_profiles') THEN
    CREATE POLICY "Allow public select on athlete_profiles" ON public.athlete_profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public upsert on athlete_profiles') THEN
    CREATE POLICY "Allow public upsert on athlete_profiles" ON public.athlete_profiles FOR ALL USING (true);
  END IF;

  -- user_entitlements
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on user_entitlements') THEN
    CREATE POLICY "Allow public select on user_entitlements" ON public.user_entitlements FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public upsert on user_entitlements') THEN
    CREATE POLICY "Allow public upsert on user_entitlements" ON public.user_entitlements FOR ALL USING (true);
  END IF;

  -- workout_sessions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on workout_sessions') THEN
    CREATE POLICY "Allow public access on workout_sessions" ON public.workout_sessions FOR ALL USING (true);
  END IF;

  -- assigned_workouts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on assigned_workouts') THEN
    CREATE POLICY "Allow public access on assigned_workouts" ON public.assigned_workouts FOR ALL USING (true);
  END IF;

  -- buddy_profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on buddy_profiles') THEN
    CREATE POLICY "Allow public access on buddy_profiles" ON public.buddy_profiles FOR ALL USING (true);
  END IF;

  -- buddy_messages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on buddy_messages') THEN
    CREATE POLICY "Allow public access on buddy_messages" ON public.buddy_messages FOR ALL USING (true);
  END IF;
END $$;

-- ============================================================================
-- SUPABASE REALTIME REPLICATION (For live chat & instant workout dispatch)
-- ============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.buddy_messages;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assigned_workouts;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- ============================================================================
-- OBLIVION 1 FITNESS CLUB (O1FC) - BASE DATABASE SCHEMA
-- ============================================================================
-- Run this first in the Supabase SQL Editor, then every file in supabase/migrations in date order.
-- This file only creates the original base tables. Row Level Security is switched on here with NO policies
-- (the public key can see nothing); the real, per-user policies are created by the migrations.
-- Never add "FOR ALL USING (true)" policies: they would let any visitor read and rewrite every row.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Entitlements Table (Stores verified Store receipts & RevenueCat status)
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  user_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'inactive'
  platform TEXT DEFAULT 'web', -- 'ios', 'android', 'web'
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workout Sessions Table (Stores completed workout logs and volume strain)
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

-- 4. Assigned Workouts Table (Coach-to-Client Workout Dispatch)
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

-- ============================================================================
-- ROW LEVEL SECURITY: on, with no policies. Migrations add the per-user policies.
-- ============================================================================
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;
-- ============================================================================
-- SUPABASE REALTIME REPLICATION (instant workout dispatch)
-- ============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assigned_workouts;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

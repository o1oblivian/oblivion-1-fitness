-- Base tables that were first created by hand in the Supabase dashboard and never had a migration:
-- profiles, coach_profiles, meal_logs. Columns, types and defaults were read from the live project on 17 Oct 2026.
--
-- Every statement is CREATE TABLE IF NOT EXISTS, so running this on the live project changes nothing.
-- On a fresh project it builds the tables so the later migrations (RLS, fuel cloud, coach storefront, ...) can run.
-- Row Level Security and policies are NOT set here; 20261011_fuel_cloud.sql and 20261014_rls_lockdown.sql own them.

-- One row per athlete, keyed by the Supabase auth user id.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  target_calories INTEGER DEFAULT 2400,
  target_protein INTEGER DEFAULT 180,
  target_carbs INTEGER DEFAULT 250,
  target_fats INTEGER DEFAULT 70,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, NOW()),
  stripe_account_id TEXT,
  stripe_connect_account_id TEXT,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
  coach_tier TEXT DEFAULT 'starter',
  avatar_url TEXT,
  full_name TEXT,
  handle TEXT,
  bio TEXT,
  settings JSONB,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Public coach card plus payout and identity state, keyed by the coach's auth user id.
CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  specialties TEXT[] DEFAULT ARRAY['Hypertrophy'::TEXT, 'Strength'::TEXT],
  bio TEXT,
  hourly_rate NUMERIC DEFAULT 80.00,
  monthly_coaching_rate NUMERIC DEFAULT 250.00,
  available_balance NUMERIC DEFAULT 0.00,
  lifetime_earnings NUMERIC DEFAULT 0.00,
  payout_method TEXT DEFAULT 'bank_transfer',
  payout_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_connect_account_id TEXT,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
  is_id_verified BOOLEAN DEFAULT FALSE,
  stripe_identity_session_id TEXT,
  identity_status TEXT DEFAULT 'unverified',
  verified_at TIMESTAMPTZ,
  accepting_new_athletes BOOLEAN NOT NULL DEFAULT TRUE,
  handle TEXT
);

-- Food entries. date is the athlete's local YYYY-MM-DD. fuel_days totals are rebuilt by a trigger
-- created in 20261011_fuel_cloud.sql.
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fats NUMERIC DEFAULT 0,
  fiber NUMERIC DEFAULT 0,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, NOW())
);

-- Locked from the start: no policies means the public key sees nothing until the migrations add the real ones.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

/*
# Create user profiles, subscriptions, and coach earnings tables

## Purpose
Core monetization infrastructure: track user roles (athlete/coach), subscription tiers,
and coach earnings from program sales.

## 1. New Tables

### user_profiles
- id (uuid, PK, references auth.users)
- email (text, not null)
- role (text: 'athlete' or 'coach', default 'athlete')
- display_name (text)
- profile_image_url (text, nullable)
- workout_focus (text, nullable)
- postcode (text, nullable)
- subscription_tier (text: 'free', 'premium', 'premium_travel', 'coach_pro', default 'free')
- payout_method (text, nullable - for coaches: 'paypal', 'bank_transfer', etc.)
- payout_email (text, nullable - PayPal email or similar)
- onboarding_completed (boolean, default false)
- created_at (timestamptz)
- updated_at (timestamptz)

### subscriptions
- id (uuid, PK)
- user_id (uuid, references auth.users)
- tier (text: the plan name)
- status (text: 'active', 'cancelled', 'expired', 'trialing')
- price_cents (integer)
- currency (text, default 'usd')
- started_at (timestamptz)
- expires_at (timestamptz, nullable)
- stripe_subscription_id (text, nullable - for future Stripe integration)
- stripe_customer_id (text, nullable)
- created_at (timestamptz)

### coach_earnings
- id (uuid, PK)
- coach_user_id (uuid, references auth.users)
- purchase_id (uuid, nullable - references program_purchases)
- buyer_email (text)
- program_title (text)
- sale_amount_cents (integer)
- platform_fee_cents (integer)
- coach_payout_cents (integer)
- payout_status (text: 'pending', 'processing', 'paid', default 'pending')
- paid_at (timestamptz, nullable)
- created_at (timestamptz)

## 2. Security
- RLS enabled on all tables
- user_profiles: users can read/update own profile; insert on signup
- subscriptions: users can read own; insert/update restricted
- coach_earnings: coaches can read own earnings
*/

-- user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach')),
  display_name text,
  profile_image_url text,
  workout_focus text,
  postcode text,
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'premium_travel', 'coach_pro')),
  payout_method text,
  payout_email text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subscriptions" ON subscriptions;
CREATE POLICY "delete_own_subscriptions" ON subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- coach_earnings
CREATE TABLE IF NOT EXISTS coach_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id uuid,
  buyer_email text NOT NULL,
  program_title text NOT NULL,
  sale_amount_cents integer NOT NULL DEFAULT 0,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  coach_payout_cents integer NOT NULL DEFAULT 0,
  payout_status text NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coach_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_earnings" ON coach_earnings;
CREATE POLICY "select_own_earnings" ON coach_earnings FOR SELECT
  TO authenticated USING (auth.uid() = coach_user_id);

DROP POLICY IF EXISTS "insert_own_earnings" ON coach_earnings;
CREATE POLICY "insert_own_earnings" ON coach_earnings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = coach_user_id);

DROP POLICY IF EXISTS "update_own_earnings" ON coach_earnings;
CREATE POLICY "update_own_earnings" ON coach_earnings FOR UPDATE
  TO authenticated USING (auth.uid() = coach_user_id) WITH CHECK (auth.uid() = coach_user_id);

DROP POLICY IF EXISTS "delete_own_earnings" ON coach_earnings;
CREATE POLICY "delete_own_earnings" ON coach_earnings FOR DELETE
  TO authenticated USING (auth.uid() = coach_user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_coach_earnings_coach_id ON coach_earnings(coach_user_id);
CREATE INDEX IF NOT EXISTS idx_coach_earnings_payout_status ON coach_earnings(payout_status);

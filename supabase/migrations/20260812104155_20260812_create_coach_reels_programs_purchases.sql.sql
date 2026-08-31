/*
# Coach Reels, Programs & Purchases

## Purpose
Enables an Instagram-style vertical reels feed where coaches post short-form
video/photo content promoting specialised workout programs. Users can browse
reels, view coach profiles, and purchase programs in-app. The platform takes
a configurable commission (default 15%) on each sale.

## New Tables

### 1. coach_programs
- id (uuid PK)
- coach_email (text, NOT NULL) — the coach who created the program
- title (text, NOT NULL) — program name
- description (text) — what the program covers
- category (text) — e.g. Hypertrophy, Powerlifting, Conditioning, Mobility
- difficulty (text) — Beginner / Intermediate / Advanced
- duration_weeks (integer) — how many weeks the program runs
- price_cents (integer, NOT NULL) — price in cents (e.g. 4900 = $49.00)
- cover_image_url (text) — optional cover photo
- program_content (jsonb) — structured workout data (exercises, sets, schedule)
- is_published (boolean, default true)
- created_at (timestamptz)
- updated_at (timestamptz)

### 2. coach_reels
- id (uuid PK)
- coach_email (text, NOT NULL) — the coach who posted the reel
- coach_name (text) — display name shown on the feed
- coach_avatar (text) — optional avatar URL
- caption (text) — text caption shown on the reel
- media_url (text, NOT NULL) — URL to video or photo
- media_type (text, NOT NULL) — 'video' or 'image'
- thumbnail_url (text) — optional poster image for videos
- program_id (uuid, nullable FK → coach_programs) — optional linked purchasable program
- workout_type (text) — e.g. Push, Pull, Legs, Full Body, Cardio
- tags (text[]) — searchable tags
- like_count (integer, default 0) — denormalised for performance
- view_count (integer, default 0) — denormalised for performance
- is_published (boolean, default true)
- created_at (timestamptz)

### 3. program_purchases
- id (uuid PK)
- buyer_email (text, NOT NULL) — the user who purchased
- program_id (uuid, NOT NULL FK → coach_programs)
- coach_email (text, NOT NULL) — denormalised for quick lookup
- price_cents (integer, NOT NULL) — price paid in cents
- platform_commission_pct (numeric, default 15.0) — commission % at time of purchase
- platform_fee_cents (integer, NOT NULL) — calculated fee in cents
- coach_payout_cents (integer, NOT NULL) — coach's share in cents
- status (text, default 'completed') — completed / pending / refunded
- created_at (timestamptz)
- UNIQUE(buyer_email, program_id) — one purchase per user per program

## Security (RLS)
- coach_programs: public SELECT (anyone can browse); only coach can INSERT/UPDATE/DELETE
- coach_reels: public SELECT (anyone can browse the feed); only coach can INSERT/UPDATE/DELETE
- program_purchases: buyer can SELECT own purchases; buyer can INSERT own; no UPDATE/DELETE

## Notes
1. All tables use user_email text (matching the app's existing identity pattern)
2. Reels are publicly viewable (anon + authenticated) to maximise discovery
3. Purchase records are private to the buyer
4. Platform commission is recorded at purchase time so historical payouts are immutable
*/

-- ============================================================
-- 1. coach_programs
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_email text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'General',
  difficulty text DEFAULT 'Intermediate',
  duration_weeks integer DEFAULT 4,
  price_cents integer NOT NULL DEFAULT 0,
  cover_image_url text DEFAULT '',
  program_content jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE coach_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_coach_programs" ON coach_programs;
CREATE POLICY "select_coach_programs"
  ON coach_programs FOR SELECT
  TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "insert_coach_programs" ON coach_programs;
CREATE POLICY "insert_coach_programs"
  ON coach_programs FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = coach_email);

DROP POLICY IF EXISTS "update_coach_programs" ON coach_programs;
CREATE POLICY "update_coach_programs"
  ON coach_programs FOR UPDATE
  TO authenticated USING (auth.uid()::text = coach_email)
  WITH CHECK (auth.uid()::text = coach_email);

DROP POLICY IF EXISTS "delete_coach_programs" ON coach_programs;
CREATE POLICY "delete_coach_programs"
  ON coach_programs FOR DELETE
  TO authenticated USING (auth.uid()::text = coach_email);

CREATE INDEX IF NOT EXISTS idx_coach_programs_coach_email ON coach_programs(coach_email);
CREATE INDEX IF NOT EXISTS idx_coach_programs_category ON coach_programs(category);

-- ============================================================
-- 2. coach_reels
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_email text NOT NULL,
  coach_name text DEFAULT '',
  coach_avatar text DEFAULT '',
  caption text DEFAULT '',
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'video',
  thumbnail_url text DEFAULT '',
  program_id uuid REFERENCES coach_programs(id) ON DELETE SET NULL,
  workout_type text DEFAULT '',
  tags text[] DEFAULT '{}',
  like_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coach_reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_coach_reels" ON coach_reels;
CREATE POLICY "select_coach_reels"
  ON coach_reels FOR SELECT
  TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "insert_coach_reels" ON coach_reels;
CREATE POLICY "insert_coach_reels"
  ON coach_reels FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = coach_email);

DROP POLICY IF EXISTS "update_coach_reels" ON coach_reels;
CREATE POLICY "update_coach_reels"
  ON coach_reels FOR UPDATE
  TO authenticated USING (auth.uid()::text = coach_email)
  WITH CHECK (auth.uid()::text = coach_email);

DROP POLICY IF EXISTS "delete_coach_reels" ON coach_reels;
CREATE POLICY "delete_coach_reels"
  ON coach_reels FOR DELETE
  TO authenticated USING (auth.uid()::text = coach_email);

CREATE INDEX IF NOT EXISTS idx_coach_reels_created_at ON coach_reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_reels_coach_email ON coach_reels(coach_email);
CREATE INDEX IF NOT EXISTS idx_coach_reels_workout_type ON coach_reels(workout_type);

-- ============================================================
-- 3. program_purchases
-- ============================================================
CREATE TABLE IF NOT EXISTS program_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email text NOT NULL,
  program_id uuid NOT NULL REFERENCES coach_programs(id) ON DELETE CASCADE,
  coach_email text NOT NULL,
  price_cents integer NOT NULL,
  platform_commission_pct numeric DEFAULT 15.0,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  coach_payout_cents integer NOT NULL DEFAULT 0,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  UNIQUE(buyer_email, program_id)
);

ALTER TABLE program_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_purchases" ON program_purchases;
CREATE POLICY "select_own_purchases"
  ON program_purchases FOR SELECT
  TO authenticated USING (auth.uid()::text = buyer_email);

DROP POLICY IF EXISTS "insert_own_purchases" ON program_purchases;
CREATE POLICY "insert_own_purchases"
  ON program_purchases FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = buyer_email);

CREATE INDEX IF NOT EXISTS idx_program_purchases_buyer ON program_purchases(buyer_email);
CREATE INDEX IF NOT EXISTS idx_program_purchases_program ON program_purchases(program_id);

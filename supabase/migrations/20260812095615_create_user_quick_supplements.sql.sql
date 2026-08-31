/*
# Create user_quick_supplements table

1. Purpose
   Stores per-user saved supplements from live internet search so users can
   build a persistent "quick add" list across devices and sessions.

2. New Tables
   - `user_quick_supplements`
     - `id` (uuid, primary key)
     - `user_email` (text, not null) — identifies the owner (matches app's email-based identity)
     - `name` (text, not null) — supplement name
     - `brand` (text) — brand/manufacturer
     - `category` (text) — categorized supplement type
     - `dosage` (text) — serving size info
     - `ingredients` (jsonb) — array of active ingredient strings
     - `image_url` (text) — product image URL
     - `source` (text) — data source (e.g. "Open Food Facts")
     - `timing` (text) — user-set timing preference (Morning, Pre-workout, etc.)
     - `created_at` (timestamptz, default now())

3. Security
   - Enable RLS on `user_quick_supplements`.
   - Owner-scoped CRUD: each authenticated user can only access rows where
     `user_email` matches the email in their JWT (`auth.jwt() ->> 'email'`).
   - 4 separate policies for SELECT, INSERT, UPDATE, DELETE.
*/

CREATE TABLE IF NOT EXISTS user_quick_supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  name text NOT NULL,
  brand text DEFAULT '',
  category text DEFAULT 'General Wellness',
  dosage text DEFAULT '1 Serving',
  ingredients jsonb DEFAULT '[]'::jsonb,
  image_url text DEFAULT '',
  source text DEFAULT 'Open Food Facts',
  timing text DEFAULT 'Morning',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_quick_supplements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quick_supplements" ON user_quick_supplements;
CREATE POLICY "select_own_quick_supplements"
ON user_quick_supplements FOR SELECT
TO authenticated
USING (user_email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "insert_own_quick_supplements" ON user_quick_supplements;
CREATE POLICY "insert_own_quick_supplements"
ON user_quick_supplements FOR INSERT
TO authenticated
WITH CHECK (user_email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "update_own_quick_supplements" ON user_quick_supplements;
CREATE POLICY "update_own_quick_supplements"
ON user_quick_supplements FOR UPDATE
TO authenticated
USING (user_email = (auth.jwt() ->> 'email'))
WITH CHECK (user_email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "delete_own_quick_supplements" ON user_quick_supplements;
CREATE POLICY "delete_own_quick_supplements"
ON user_quick_supplements FOR DELETE
TO authenticated
USING (user_email = (auth.jwt() ->> 'email'));

CREATE INDEX IF NOT EXISTS idx_quick_supplements_user_email ON user_quick_supplements(user_email);

/*
# Create meal_logs table for individual food entry persistence

1. New Tables
  - `meal_logs`
    - `id` (uuid, primary key)
    - `user_email` (text, not null) - identifies the user
    - `log_date` (date, not null) - which day this meal belongs to
    - `meal_type` (text, not null) - 'breakfast', 'lunch', 'dinner', 'snack'
    - `food_name` (text, not null) - name of the food item
    - `calories` (integer) - calories for this entry
    - `protein` (numeric) - grams of protein
    - `carbs` (numeric) - grams of carbs
    - `fat` (numeric) - grams of fat
    - `quantity` (numeric) - serving quantity
    - `unit` (text) - serving unit (g, ml, serving, etc.)
    - `created_at` (timestamptz)

2. Security
  - RLS enabled, scoped by user_email via JWT email claim
  - anon + authenticated can CRUD (app uses email-based identity, not auth.uid)
*/

CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text NOT NULL DEFAULT 'snack',
  food_name text NOT NULL,
  calories integer DEFAULT 0,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'serving',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_email, log_date);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_meal_logs" ON meal_logs;
CREATE POLICY "select_own_meal_logs" ON meal_logs FOR SELECT
  TO anon, authenticated
  USING (lower(user_email) = lower(current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "insert_own_meal_logs" ON meal_logs;
CREATE POLICY "insert_own_meal_logs" ON meal_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (lower(user_email) = lower(current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "update_own_meal_logs" ON meal_logs;
CREATE POLICY "update_own_meal_logs" ON meal_logs FOR UPDATE
  TO anon, authenticated
  USING (lower(user_email) = lower(current_setting('request.jwt.claims', true)::json->>'email'))
  WITH CHECK (lower(user_email) = lower(current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "delete_own_meal_logs" ON meal_logs;
CREATE POLICY "delete_own_meal_logs" ON meal_logs FOR DELETE
  TO anon, authenticated
  USING (lower(user_email) = lower(current_setting('request.jwt.claims', true)::json->>'email'));

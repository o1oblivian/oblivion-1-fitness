/*
# Create daily_macros and bodyweight_logs tables for athlete telemetry

## Purpose
Persists per-athlete daily nutrition logs and weekly bodyweight measurements
so the coach telemetry dashboards (dossier cards, intelligence modal, client
detail modal) render from real stored data instead of hardcoded mock arrays.

## New Tables

### daily_macros
- `id` (uuid PK)
- `user_email` (text, not null) — identifies the athlete (email-scoped, same pattern as workout_logs)
- `record_date` (date, not null) — the day the macros were logged
- `calories` (int) / `calorie_target` (int)
- `protein` (int) / `protein_target` (int)
- `carbs` (int) / `carbs_target` (int)
- `fat` (int) / `fat_target` (int)
- `hydration` (numeric(4,1)) / `hydration_target` (numeric(4,1)) — liters
- `created_at` (timestamptz default now())
- Unique constraint on (user_email, record_date)

### bodyweight_logs
- `id` (uuid PK)
- `user_email` (text, not null)
- `record_date` (date, not null) — weigh-in date
- `weight_kg` (numeric(5,2)) — bodyweight in kg
- `created_at` (timestamptz default now())
- Unique constraint on (user_email, record_date)

## Security
- RLS enabled on both tables.
- Policies use `TO anon, authenticated` because this app uses email-scoped
  identity without Supabase Auth sign-in (same pattern as the existing
  workout_logs table). Data is intentionally accessible to the anon-key client.

## Seed Data
- 7 days of macro history for path.patel.fit@ofc.app and sarah.chen.hybrid@ofc.app
- 8 weeks of weekly bodyweight logs for both athletes
*/

-- ───────────────────────── daily_macros ─────────────────────────

CREATE TABLE IF NOT EXISTS daily_macros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  record_date date NOT NULL,
  calories integer NOT NULL DEFAULT 0,
  calorie_target integer NOT NULL DEFAULT 0,
  protein integer NOT NULL DEFAULT 0,
  protein_target integer NOT NULL DEFAULT 0,
  carbs integer NOT NULL DEFAULT 0,
  carbs_target integer NOT NULL DEFAULT 0,
  fat integer NOT NULL DEFAULT 0,
  fat_target integer NOT NULL DEFAULT 0,
  hydration numeric(4,1) NOT NULL DEFAULT 0,
  hydration_target numeric(4,1) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daily_macros ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS daily_macros_user_email_record_date_key
  ON daily_macros (user_email, record_date);

DROP POLICY IF EXISTS "anon_select_daily_macros" ON daily_macros;
CREATE POLICY "anon_select_daily_macros" ON daily_macros FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_daily_macros" ON daily_macros;
CREATE POLICY "anon_insert_daily_macros" ON daily_macros FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_daily_macros" ON daily_macros;
CREATE POLICY "anon_update_daily_macros" ON daily_macros FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_daily_macros" ON daily_macros;
CREATE POLICY "anon_delete_daily_macros" ON daily_macros FOR DELETE
  TO anon, authenticated USING (true);

-- ─────────────────────── bodyweight_logs ───────────────────────

CREATE TABLE IF NOT EXISTS bodyweight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  record_date date NOT NULL,
  weight_kg numeric(5,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bodyweight_logs ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS bodyweight_logs_user_email_record_date_key
  ON bodyweight_logs (user_email, record_date);

DROP POLICY IF EXISTS "anon_select_bodyweight_logs" ON bodyweight_logs;
CREATE POLICY "anon_select_bodyweight_logs" ON bodyweight_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bodyweight_logs" ON bodyweight_logs;
CREATE POLICY "anon_insert_bodyweight_logs" ON bodyweight_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bodyweight_logs" ON bodyweight_logs;
CREATE POLICY "anon_update_bodyweight_logs" ON bodyweight_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bodyweight_logs" ON bodyweight_logs;
CREATE POLICY "anon_delete_bodyweight_logs" ON bodyweight_logs FOR DELETE
  TO anon, authenticated USING (true);

-- ──────────────────── Seed: daily_macros ────────────────────
-- Path Patel: 7 days ending 2026-08-13

INSERT INTO daily_macros (user_email, record_date, calories, calorie_target, protein, protein_target, carbs, carbs_target, fat, fat_target, hydration, hydration_target)
VALUES
  ('path.patel.fit@ofc.app', '2026-08-13', 2850, 2900, 190, 200, 310, 320, 65, 70, 3.2, 3.0),
  ('path.patel.fit@ofc.app', '2026-08-12', 2750, 2900, 195, 200, 300, 320, 60, 70, 3.0, 3.0),
  ('path.patel.fit@ofc.app', '2026-08-11', 2950, 2900, 205, 200, 330, 320, 72, 70, 3.5, 3.0),
  ('path.patel.fit@ofc.app', '2026-08-10', 2600, 2900, 180, 200, 280, 320, 58, 70, 2.8, 3.0),
  ('path.patel.fit@ofc.app', '2026-08-09', 3100, 2900, 210, 200, 340, 320, 75, 70, 3.3, 3.0),
  ('path.patel.fit@ofc.app', '2026-08-08', 2880, 2900, 198, 200, 315, 320, 68, 70, 3.1, 3.0),
  ('path.patel.fit@ofc.app', '2026-08-07', 2500, 2900, 170, 200, 270, 320, 55, 70, 2.5, 3.0)
ON CONFLICT (user_email, record_date) DO NOTHING;

-- Sarah Chen: 7 days ending 2026-08-13
INSERT INTO daily_macros (user_email, record_date, calories, calorie_target, protein, protein_target, carbs, carbs_target, fat, fat_target, hydration, hydration_target)
VALUES
  ('sarah.chen.hybrid@ofc.app', '2026-08-13', 2100, 2300, 155, 165, 240, 260, 55, 60, 2.8, 2.8),
  ('sarah.chen.hybrid@ofc.app', '2026-08-12', 2250, 2300, 160, 165, 255, 260, 58, 60, 2.9, 2.8),
  ('sarah.chen.hybrid@ofc.app', '2026-08-11', 1950, 2300, 140, 165, 220, 260, 50, 60, 2.5, 2.8),
  ('sarah.chen.hybrid@ofc.app', '2026-08-10', 2400, 2300, 170, 165, 270, 260, 65, 60, 3.0, 2.8),
  ('sarah.chen.hybrid@ofc.app', '2026-08-09', 2180, 2300, 158, 165, 245, 260, 56, 60, 2.7, 2.8),
  ('sarah.chen.hybrid@ofc.app', '2026-08-08', 2320, 2300, 168, 165, 265, 260, 62, 60, 2.8, 2.8),
  ('sarah.chen.hybrid@ofc.app', '2026-08-07', 2050, 2300, 145, 165, 230, 260, 52, 60, 2.4, 2.8)
ON CONFLICT (user_email, record_date) DO NOTHING;

-- ──────────────────── Seed: bodyweight_logs ────────────────────
-- Path Patel: 8 weekly weigh-ins
INSERT INTO bodyweight_logs (user_email, record_date, weight_kg)
VALUES
  ('path.patel.fit@ofc.app', '2026-06-25', 79.20),
  ('path.patel.fit@ofc.app', '2026-07-02', 79.50),
  ('path.patel.fit@ofc.app', '2026-07-09', 79.80),
  ('path.patel.fit@ofc.app', '2026-07-16', 80.00),
  ('path.patel.fit@ofc.app', '2026-07-23', 80.10),
  ('path.patel.fit@ofc.app', '2026-07-30', 80.30),
  ('path.patel.fit@ofc.app', '2026-08-06', 80.40),
  ('path.patel.fit@ofc.app', '2026-08-13', 80.40)
ON CONFLICT (user_email, record_date) DO NOTHING;

-- Sarah Chen: 8 weekly weigh-ins
INSERT INTO bodyweight_logs (user_email, record_date, weight_kg)
VALUES
  ('sarah.chen.hybrid@ofc.app', '2026-06-25', 62.50),
  ('sarah.chen.hybrid@ofc.app', '2026-07-02', 62.80),
  ('sarah.chen.hybrid@ofc.app', '2026-07-09', 63.00),
  ('sarah.chen.hybrid@ofc.app', '2026-07-16', 63.10),
  ('sarah.chen.hybrid@ofc.app', '2026-07-23', 63.30),
  ('sarah.chen.hybrid@ofc.app', '2026-07-30', 63.50),
  ('sarah.chen.hybrid@ofc.app', '2026-08-06', 63.60),
  ('sarah.chen.hybrid@ofc.app', '2026-08-13', 63.80)
ON CONFLICT (user_email, record_date) DO NOTHING;

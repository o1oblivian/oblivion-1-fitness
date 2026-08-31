/*
# Coach Hub Unlocks Table

## Purpose
Tracks which athletes have unlocked a coach's private "Coach Hub" by purchasing
a workout program. When an athlete buys a coach's program, a row is inserted here
that sets is_coach_hub_unlocked = true for that coach+athlete pair. The presence of
this row (with unlocked = true) gates access to the coach's private portal features:
1-on-1 routine dispatch, form-check submissions, macro syncing, and direct messaging.

## New Table
### coach_hub_unlocks
- id (uuid PK)
- athlete_email (text, NOT NULL) — the buyer/athlete
- coach_email (text, NOT NULL) — the coach whose hub is unlocked
- program_id (uuid, nullable FK → coach_programs) — the purchase that triggered the unlock
- is_coach_hub_unlocked (boolean, default true) — the unlock flag
- created_at (timestamptz)
- UNIQUE(athlete_email, coach_email) — one unlock row per athlete per coach

## Security (RLS)
- Athletes can SELECT their own unlock rows
- Athletes can INSERT their own unlock rows (set during purchase)
- No UPDATE or DELETE (unlocks are permanent once granted)

## Notes
1. This is a companion to program_purchases — a purchase triggers both a purchase record and an unlock record
2. The unlock is per-coach (not per-program), so buying any program from a coach unlocks their full hub
3. Uses email-based identity to match the existing app pattern
*/

CREATE TABLE IF NOT EXISTS coach_hub_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_email text NOT NULL,
  coach_email text NOT NULL,
  program_id uuid REFERENCES coach_programs(id) ON DELETE SET NULL,
  is_coach_hub_unlocked boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(athlete_email, coach_email)
);

ALTER TABLE coach_hub_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_unlocks" ON coach_hub_unlocks;
CREATE POLICY "select_own_unlocks"
  ON coach_hub_unlocks FOR SELECT
  TO authenticated USING (auth.uid()::text = athlete_email);

DROP POLICY IF EXISTS "insert_own_unlocks" ON coach_hub_unlocks;
CREATE POLICY "insert_own_unlocks"
  ON coach_hub_unlocks FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = athlete_email);

CREATE INDEX IF NOT EXISTS idx_coach_hub_unlocks_athlete ON coach_hub_unlocks(athlete_email);
CREATE INDEX IF NOT EXISTS idx_coach_hub_unlocks_coach ON coach_hub_unlocks(coach_email);

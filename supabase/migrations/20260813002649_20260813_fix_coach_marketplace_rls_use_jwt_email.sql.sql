/*
# Fix RLS policies for coach marketplace tables — use JWT email instead of auth.uid()::text

## Problem
The coach_programs, coach_reels, program_purchases, and coach_hub_unlocks tables all
use policies that compare `auth.uid()::text = <email_column>`. But auth.uid() returns
a UUID while the columns store text email addresses. The comparison can never match,
causing every insert/update/delete to fail with:
  "new row violates row-level security policy for table <table>"

This is the exact same bug that was already fixed for workout_logs in migration
20260812100803, but the coach marketplace tables were never patched.

## Fix
Replace `auth.uid()::text` with `auth.jwt() ->> 'email'` in all ownership-check
policies across all four tables so the check compares the authenticated user's
email (from the JWT) against the email column.

## Tables modified
- coach_programs — SELECT (public, unchanged), INSERT/UPDATE/DELETE (coach ownership)
- coach_reels — SELECT (public, unchanged), INSERT/UPDATE/DELETE (coach ownership)
- program_purchases — SELECT (buyer), INSERT (buyer)
- coach_hub_unlocks — SELECT (athlete), INSERT (athlete)

## Security
- RLS remains enabled on all tables.
- Public SELECT policies on coach_programs and coach_reels remain TO anon, authenticated
  with USING (is_published = true) — unchanged.
- Ownership policies now correctly compare JWT email to the email column.
- All policies remain scoped to authenticated role for writes.
*/

-- ============================================================
-- 1. coach_programs — fix INSERT/UPDATE/DELETE ownership checks
-- ============================================================
DROP POLICY IF EXISTS "insert_coach_programs" ON coach_programs;
CREATE POLICY "insert_coach_programs"
  ON coach_programs FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = coach_email);

DROP POLICY IF EXISTS "update_coach_programs" ON coach_programs;
CREATE POLICY "update_coach_programs"
  ON coach_programs FOR UPDATE
  TO authenticated USING (auth.jwt() ->> 'email' = coach_email)
  WITH CHECK (auth.jwt() ->> 'email' = coach_email);

DROP POLICY IF EXISTS "delete_coach_programs" ON coach_programs;
CREATE POLICY "delete_coach_programs"
  ON coach_programs FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'email' = coach_email);

-- ============================================================
-- 2. coach_reels — fix INSERT/UPDATE/DELETE ownership checks
-- ============================================================
DROP POLICY IF EXISTS "insert_coach_reels" ON coach_reels;
CREATE POLICY "insert_coach_reels"
  ON coach_reels FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = coach_email);

DROP POLICY IF EXISTS "update_coach_reels" ON coach_reels;
CREATE POLICY "update_coach_reels"
  ON coach_reels FOR UPDATE
  TO authenticated USING (auth.jwt() ->> 'email' = coach_email)
  WITH CHECK (auth.jwt() ->> 'email' = coach_email);

DROP POLICY IF EXISTS "delete_coach_reels" ON coach_reels;
CREATE POLICY "delete_coach_reels"
  ON coach_reels FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'email' = coach_email);

-- ============================================================
-- 3. program_purchases — fix SELECT and INSERT buyer checks
-- ============================================================
DROP POLICY IF EXISTS "select_own_purchases" ON program_purchases;
CREATE POLICY "select_own_purchases"
  ON program_purchases FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'email' = buyer_email);

DROP POLICY IF EXISTS "insert_own_purchases" ON program_purchases;
CREATE POLICY "insert_own_purchases"
  ON program_purchases FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = buyer_email);

-- ============================================================
-- 4. coach_hub_unlocks — fix SELECT and INSERT athlete checks
-- ============================================================
DROP POLICY IF EXISTS "select_own_unlocks" ON coach_hub_unlocks;
CREATE POLICY "select_own_unlocks"
  ON coach_hub_unlocks FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'email' = athlete_email);

DROP POLICY IF EXISTS "insert_own_unlocks" ON coach_hub_unlocks;
CREATE POLICY "insert_own_unlocks"
  ON coach_hub_unlocks FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = athlete_email);

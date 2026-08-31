/*
# Fix workout_logs RLS policies to use JWT email instead of auth.uid()

## Problem
The existing policies compared `auth.uid()::text = user_email`, but `auth.uid()` returns
a UUID while `user_email` stores a text email address. The comparison can never match,
causing every insert/update/delete to fail with:
  "new row violates row-level security policy for table workout_logs"

## Fix
Replace `auth.uid()::text` with `auth.jwt() ->> 'email'` in all four policies
(SELECT, INSERT, UPDATE, DELETE) so the check compares the authenticated user's
email (from the JWT) against the `user_email` column.

## Tables modified
- `workout_logs` — all 4 RLS policies dropped and recreated.

## Security
- RLS remains enabled.
- Ownership check now correctly compares JWT email to user_email column.
- Policies remain scoped to `authenticated` role.
*/

-- Drop existing broken policies
DROP POLICY IF EXISTS "select_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "insert_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "update_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "delete_workout_logs" ON workout_logs;

-- Recreate with correct email comparison
CREATE POLICY "select_workout_logs" ON workout_logs
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "insert_workout_logs" ON workout_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "update_workout_logs" ON workout_logs
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "delete_workout_logs" ON workout_logs
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);

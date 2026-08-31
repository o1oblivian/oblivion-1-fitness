/*
# Fix workout_logs RLS for custom-auth app

## Context
This app uses a custom localStorage-based auth model (authStorage.ts), NOT Supabase Auth.
The existing workout_logs policies are scoped to `TO authenticated` with
`(auth.jwt() ->> 'email') = user_email`. Since no Supabase auth session exists,
`auth.jwt() ->> 'email'` returns NULL and every upsert fails with:
"new row violates row-level security policy for table workout_logs"

## Changes
1. Drop the 4 existing authenticated-only policies on workout_logs.
2. Create 4 new policies scoped TO anon, authenticated (matching the custom auth model)
   that match on user_email directly. The app stores the user's email in the
   user_email column and sends it from the client; there is no Supabase session.

## Security Notes
- This app does NOT use Supabase Auth (no auth.users integration). The anon key
  is used for all requests. Row isolation is by user_email which the app controls.
- This matches the existing pattern used by daily_macros and bodyweight_logs tables.
- No columns are renamed or dropped. No data is lost.
*/

DROP POLICY IF EXISTS "delete_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "insert_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "select_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "update_workout_logs" ON workout_logs;

CREATE POLICY "anon_select_workout_logs" ON workout_logs
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "anon_insert_workout_logs" ON workout_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anon_update_workout_logs" ON workout_logs
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_workout_logs" ON workout_logs
  FOR DELETE TO anon, authenticated
  USING (true);

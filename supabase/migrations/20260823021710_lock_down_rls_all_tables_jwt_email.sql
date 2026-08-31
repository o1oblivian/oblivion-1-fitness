/*
# Lock Down RLS: Replace wide-open policies with JWT email ownership

## Summary
Replaces all USING(true) policies on user-data tables with proper ownership checks.
Each authenticated user can only read/write their own data. Anonymous access revoked.

## Tables affected:
- workout_logs (user_email)
- daily_macros (user_email)
- bodyweight_logs (user_email)
- completed_sessions (user_email)
- coach_activity_logs (user_email)
- live_workout_logs (client_email)
- dispatched_workouts (coachid / clientids)
- share_consent_requests (coach_email / client_email)
- profiles (fix OR true in SELECT)

## Security changes:
- All policies now require authenticated role
- Ownership enforced via auth.jwt() ->> 'email'
- OTP in share_consent_requests only visible to involved parties
- Profiles SELECT fixed: removed OR true backdoor
*/

-- ============================================================
-- WORKOUT_LOGS (user_email)
-- ============================================================
DROP POLICY IF EXISTS "anon_select_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "anon_insert_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "anon_update_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "anon_delete_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "select_own_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "insert_own_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "update_own_workout_logs" ON workout_logs;
DROP POLICY IF EXISTS "delete_own_workout_logs" ON workout_logs;

CREATE POLICY "select_own_workout_logs" ON workout_logs FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "insert_own_workout_logs" ON workout_logs FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "update_own_workout_logs" ON workout_logs FOR UPDATE
  TO authenticated USING (auth.jwt() ->> 'email' = user_email) WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "delete_own_workout_logs" ON workout_logs FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'email' = user_email);

-- ============================================================
-- DAILY_MACROS (user_email)
-- ============================================================
DROP POLICY IF EXISTS "anon_select_daily_macros" ON daily_macros;
DROP POLICY IF EXISTS "anon_insert_daily_macros" ON daily_macros;
DROP POLICY IF EXISTS "anon_update_daily_macros" ON daily_macros;
DROP POLICY IF EXISTS "anon_delete_daily_macros" ON daily_macros;
DROP POLICY IF EXISTS "select_own_daily_macros" ON daily_macros;
DROP POLICY IF EXISTS "insert_own_daily_macros" ON daily_macros;
DROP POLICY IF EXISTS "update_own_daily_macros" ON daily_macros;
DROP POLICY IF EXISTS "delete_own_daily_macros" ON daily_macros;

CREATE POLICY "select_own_daily_macros" ON daily_macros FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "insert_own_daily_macros" ON daily_macros FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "update_own_daily_macros" ON daily_macros FOR UPDATE
  TO authenticated USING (auth.jwt() ->> 'email' = user_email) WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "delete_own_daily_macros" ON daily_macros FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'email' = user_email);

-- ============================================================
-- BODYWEIGHT_LOGS (user_email)
-- ============================================================
DROP POLICY IF EXISTS "anon_select_bodyweight_logs" ON bodyweight_logs;
DROP POLICY IF EXISTS "anon_insert_bodyweight_logs" ON bodyweight_logs;
DROP POLICY IF EXISTS "anon_update_bodyweight_logs" ON bodyweight_logs;
DROP POLICY IF EXISTS "anon_delete_bodyweight_logs" ON bodyweight_logs;
DROP POLICY IF EXISTS "select_own_bodyweight_logs" ON bodyweight_logs;
DROP POLICY IF EXISTS "insert_own_bodyweight_logs" ON bodyweight_logs;
DROP POLICY IF EXISTS "update_own_bodyweight_logs" ON bodyweight_logs;
DROP POLICY IF EXISTS "delete_own_bodyweight_logs" ON bodyweight_logs;

CREATE POLICY "select_own_bodyweight_logs" ON bodyweight_logs FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "insert_own_bodyweight_logs" ON bodyweight_logs FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "update_own_bodyweight_logs" ON bodyweight_logs FOR UPDATE
  TO authenticated USING (auth.jwt() ->> 'email' = user_email) WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "delete_own_bodyweight_logs" ON bodyweight_logs FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'email' = user_email);

-- ============================================================
-- COMPLETED_SESSIONS (user_email)
-- ============================================================
DROP POLICY IF EXISTS "anon_select_completed_sessions" ON completed_sessions;
DROP POLICY IF EXISTS "anon_insert_completed_sessions" ON completed_sessions;
DROP POLICY IF EXISTS "anon_update_completed_sessions" ON completed_sessions;
DROP POLICY IF EXISTS "anon_delete_completed_sessions" ON completed_sessions;
DROP POLICY IF EXISTS "select_own_completed_sessions" ON completed_sessions;
DROP POLICY IF EXISTS "insert_own_completed_sessions" ON completed_sessions;
DROP POLICY IF EXISTS "update_own_completed_sessions" ON completed_sessions;
DROP POLICY IF EXISTS "delete_own_completed_sessions" ON completed_sessions;

CREATE POLICY "select_own_completed_sessions" ON completed_sessions FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "insert_own_completed_sessions" ON completed_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "update_own_completed_sessions" ON completed_sessions FOR UPDATE
  TO authenticated USING (auth.jwt() ->> 'email' = user_email) WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "delete_own_completed_sessions" ON completed_sessions FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'email' = user_email);

-- ============================================================
-- COACH_ACTIVITY_LOGS (user_email)
-- ============================================================
DROP POLICY IF EXISTS "anon_select_coach_activity_logs" ON coach_activity_logs;
DROP POLICY IF EXISTS "anon_insert_coach_activity_logs" ON coach_activity_logs;
DROP POLICY IF EXISTS "anon_update_coach_activity_logs" ON coach_activity_logs;
DROP POLICY IF EXISTS "anon_delete_coach_activity_logs" ON coach_activity_logs;
DROP POLICY IF EXISTS "select_own_coach_activity_logs" ON coach_activity_logs;
DROP POLICY IF EXISTS "insert_own_coach_activity_logs" ON coach_activity_logs;
DROP POLICY IF EXISTS "update_own_coach_activity_logs" ON coach_activity_logs;
DROP POLICY IF EXISTS "delete_own_coach_activity_logs" ON coach_activity_logs;

CREATE POLICY "select_own_coach_activity_logs" ON coach_activity_logs FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "insert_own_coach_activity_logs" ON coach_activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "update_own_coach_activity_logs" ON coach_activity_logs FOR UPDATE
  TO authenticated USING (auth.jwt() ->> 'email' = user_email) WITH CHECK (auth.jwt() ->> 'email' = user_email);
CREATE POLICY "delete_own_coach_activity_logs" ON coach_activity_logs FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'email' = user_email);

-- ============================================================
-- LIVE_WORKOUT_LOGS (client_email)
-- ============================================================
DROP POLICY IF EXISTS "anon_select_live_workout_logs" ON live_workout_logs;
DROP POLICY IF EXISTS "anon_insert_live_workout_logs" ON live_workout_logs;
DROP POLICY IF EXISTS "anon_update_live_workout_logs" ON live_workout_logs;
DROP POLICY IF EXISTS "anon_delete_live_workout_logs" ON live_workout_logs;
DROP POLICY IF EXISTS "select_own_live_workout_logs" ON live_workout_logs;
DROP POLICY IF EXISTS "insert_own_live_workout_logs" ON live_workout_logs;
DROP POLICY IF EXISTS "update_own_live_workout_logs" ON live_workout_logs;
DROP POLICY IF EXISTS "delete_own_live_workout_logs" ON live_workout_logs;

CREATE POLICY "select_own_live_workout_logs" ON live_workout_logs FOR SELECT
  TO authenticated USING (auth.jwt() ->> 'email' = client_email);
CREATE POLICY "insert_own_live_workout_logs" ON live_workout_logs FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = client_email);
CREATE POLICY "update_own_live_workout_logs" ON live_workout_logs FOR UPDATE
  TO authenticated USING (auth.jwt() ->> 'email' = client_email) WITH CHECK (auth.jwt() ->> 'email' = client_email);
CREATE POLICY "delete_own_live_workout_logs" ON live_workout_logs FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'email' = client_email);

-- ============================================================
-- DISPATCHED_WORKOUTS (coachid = email, clientids = text[])
-- ============================================================
DROP POLICY IF EXISTS "anon_select_dispatched_workouts" ON dispatched_workouts;
DROP POLICY IF EXISTS "anon_insert_dispatched_workouts" ON dispatched_workouts;
DROP POLICY IF EXISTS "anon_update_dispatched_workouts" ON dispatched_workouts;
DROP POLICY IF EXISTS "anon_delete_dispatched_workouts" ON dispatched_workouts;
DROP POLICY IF EXISTS "select_own_dispatched_workouts" ON dispatched_workouts;
DROP POLICY IF EXISTS "insert_own_dispatched_workouts" ON dispatched_workouts;
DROP POLICY IF EXISTS "update_own_dispatched_workouts" ON dispatched_workouts;
DROP POLICY IF EXISTS "delete_own_dispatched_workouts" ON dispatched_workouts;

CREATE POLICY "select_own_dispatched_workouts" ON dispatched_workouts FOR SELECT
  TO authenticated USING (
    auth.jwt() ->> 'email' = coachid
    OR (auth.jwt() ->> 'email') = ANY(clientids)
  );
CREATE POLICY "insert_own_dispatched_workouts" ON dispatched_workouts FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = coachid);
CREATE POLICY "update_own_dispatched_workouts" ON dispatched_workouts FOR UPDATE
  TO authenticated USING (
    auth.jwt() ->> 'email' = coachid
    OR (auth.jwt() ->> 'email') = ANY(clientids)
  ) WITH CHECK (
    auth.jwt() ->> 'email' = coachid
    OR (auth.jwt() ->> 'email') = ANY(clientids)
  );
CREATE POLICY "delete_own_dispatched_workouts" ON dispatched_workouts FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'email' = coachid);

-- ============================================================
-- SHARE_CONSENT_REQUESTS (coach_email / client_email)
-- ============================================================
DROP POLICY IF EXISTS "select_share_consent_requests" ON share_consent_requests;
DROP POLICY IF EXISTS "insert_share_consent_requests" ON share_consent_requests;
DROP POLICY IF EXISTS "update_share_consent_requests" ON share_consent_requests;
DROP POLICY IF EXISTS "delete_share_consent_requests" ON share_consent_requests;
DROP POLICY IF EXISTS "anon_select_share_consent" ON share_consent_requests;
DROP POLICY IF EXISTS "anon_insert_share_consent" ON share_consent_requests;
DROP POLICY IF EXISTS "anon_update_share_consent" ON share_consent_requests;
DROP POLICY IF EXISTS "anon_delete_share_consent" ON share_consent_requests;
DROP POLICY IF EXISTS "select_own_share_consent" ON share_consent_requests;
DROP POLICY IF EXISTS "insert_own_share_consent" ON share_consent_requests;
DROP POLICY IF EXISTS "update_own_share_consent" ON share_consent_requests;
DROP POLICY IF EXISTS "delete_own_share_consent" ON share_consent_requests;

CREATE POLICY "select_own_share_consent" ON share_consent_requests FOR SELECT
  TO authenticated USING (
    auth.jwt() ->> 'email' = coach_email
    OR auth.jwt() ->> 'email' = client_email
  );
CREATE POLICY "insert_own_share_consent" ON share_consent_requests FOR INSERT
  TO authenticated WITH CHECK (auth.jwt() ->> 'email' = coach_email);
CREATE POLICY "update_own_share_consent" ON share_consent_requests FOR UPDATE
  TO authenticated USING (
    auth.jwt() ->> 'email' = coach_email
    OR auth.jwt() ->> 'email' = client_email
  ) WITH CHECK (
    auth.jwt() ->> 'email' = coach_email
    OR auth.jwt() ->> 'email' = client_email
  );
CREATE POLICY "delete_own_share_consent" ON share_consent_requests FOR DELETE
  TO authenticated USING (auth.jwt() ->> 'email' = coach_email);

-- ============================================================
-- PROFILES: Fix SELECT policy (remove OR true backdoor)
-- Profiles should be publicly readable by all authenticated users (for buddy radar, coach search)
-- But not by anon. The OR true was excessive because it made them readable by anon too.
-- We'll allow all authenticated users to see profiles (intentional for social features).
-- ============================================================
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

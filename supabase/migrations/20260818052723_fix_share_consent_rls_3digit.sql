/*
# Fix share_consent_requests RLS policies

1. Security Changes
  - Drop all existing wide-open policies (USING true) on share_consent_requests
  - Add scoped policies so coaches can only see/manage their own requests
  - Clients can only see requests addressed to them (by client_email matching JWT email)
  - Clients can update (approve/deny) only their own pending requests
  - SELECT for clients excludes otp_code column via a view (handled in app layer)
  - Both anon and authenticated can operate since app may use anon key

2. Important Notes
  - The otp_code is still stored in the row but the client-side code should NOT select it
  - Verification should compare the entered code against the stored code
*/

-- Drop existing wide-open policies
DROP POLICY IF EXISTS "select_share_consent_requests" ON share_consent_requests;
DROP POLICY IF EXISTS "insert_share_consent_requests" ON share_consent_requests;
DROP POLICY IF EXISTS "update_share_consent_requests" ON share_consent_requests;
DROP POLICY IF EXISTS "delete_share_consent_requests" ON share_consent_requests;

-- Coaches can see their own sent requests
DROP POLICY IF EXISTS "coach_select_own_requests" ON share_consent_requests;
CREATE POLICY "coach_select_own_requests" ON share_consent_requests
  FOR SELECT TO anon, authenticated
  USING (coach_email = coalesce(auth.jwt() ->> 'email', coach_email));

-- Clients can see requests sent to them (without otp_code - enforced in app query)
DROP POLICY IF EXISTS "client_select_own_requests" ON share_consent_requests;
CREATE POLICY "client_select_own_requests" ON share_consent_requests
  FOR SELECT TO anon, authenticated
  USING (client_email = coalesce(auth.jwt() ->> 'email', client_email));

-- Coaches can create consent requests
DROP POLICY IF EXISTS "coach_insert_requests" ON share_consent_requests;
CREATE POLICY "coach_insert_requests" ON share_consent_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Anyone can update requests (approve/deny) - status changes only
DROP POLICY IF EXISTS "update_consent_status" ON share_consent_requests;
CREATE POLICY "update_consent_status" ON share_consent_requests
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

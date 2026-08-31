/*
# User consent recording table

Records explicit acceptance of the three mandatory legal consents at sign-up,
satisfying Apple App Store Guideline 5.1.1 and Google Play data-safety documentation
requirements.

## Tables created
- user_consent — one row per consent acceptance event, scoped to the authenticated user.

## Security
- RLS enabled.
- 4 separate CRUD policies scoped to `authenticated` using `auth.jwt() ->> 'email' = user_email`.
- No anon access.
*/

CREATE TABLE IF NOT EXISTS user_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  health_consent boolean NOT NULL DEFAULT false,
  coach_liability_consent boolean NOT NULL DEFAULT false,
  terms_consent boolean NOT NULL DEFAULT false,
  app_version text,
  accepted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_consent" ON user_consent
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "insert_own_consent" ON user_consent
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "update_own_consent" ON user_consent
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "delete_own_consent" ON user_consent
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);

CREATE INDEX idx_user_consent_email ON user_consent(user_email);

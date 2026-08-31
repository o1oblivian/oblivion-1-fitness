/*
# Create complication_interactions table

1. New Tables
- `complication_interactions`
  - `id` (uuid, primary key)
  - `user_email` (text, not null) — identifies which user tapped a complication
  - `feature` (text, not null) — which dial was tapped: 'hydration', 'cycle_sync', 'supplements', 'clean_streak'
  - `action` (text, not null) — what happened: 'tap', 'popup_open', 'quick_log', 'open_full_tracker'
  - `current_value` (text, nullable) — the value at time of interaction (e.g. "1.5L", "DAY 7", "2/3", "12")
  - `created_at` (timestamptz, defaults to now)

2. Security
- Enable RLS on `complication_interactions`.
- Owner-scoped CRUD via user_email matching the authenticated user's JWT email.
- All four CRUD verbs as separate policies scoped TO authenticated.
*/

CREATE TABLE IF NOT EXISTS complication_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  feature text NOT NULL,
  action text NOT NULL DEFAULT 'tap',
  current_value text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE complication_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_interactions" ON complication_interactions;
CREATE POLICY "select_own_interactions"
  ON complication_interactions FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "insert_own_interactions" ON complication_interactions;
CREATE POLICY "insert_own_interactions"
  ON complication_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "update_own_interactions" ON complication_interactions;
CREATE POLICY "update_own_interactions"
  ON complication_interactions FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "delete_own_interactions" ON complication_interactions;
CREATE POLICY "delete_own_interactions"
  ON complication_interactions FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);

CREATE INDEX IF NOT EXISTS idx_complication_interactions_user_email
  ON complication_interactions(user_email);
CREATE INDEX IF NOT EXISTS idx_complication_interactions_feature
  ON complication_interactions(feature);
CREATE INDEX IF NOT EXISTS idx_complication_interactions_created_at
  ON complication_interactions(created_at DESC);

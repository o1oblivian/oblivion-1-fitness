/*
# Create rate_limits table for edge function rate limiting

## Summary
Creates a table to track per-user request counts with automatic expiry windows.
Edge functions will INSERT a row per request and COUNT recent rows to enforce limits.
A scheduled cleanup can remove old entries, but the query uses a time window so
stale rows don't affect correctness.

## New Tables:
- rate_limits
  - id (uuid, primary key)
  - user_email (text, not null) - the authenticated user
  - function_name (text, not null) - which edge function was called
  - created_at (timestamptz, default now()) - when the request was made

## Indexes:
- Composite index on (user_email, function_name, created_at DESC) for fast window queries

## Security:
- RLS enabled, service role only (edge functions use service role key)
- No policies for anon/authenticated since only edge functions write via service role
*/

CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_fn_time
  ON rate_limits (user_email, function_name, created_at DESC);

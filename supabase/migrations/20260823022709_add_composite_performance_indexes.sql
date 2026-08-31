/*
# Add composite performance indexes for high-volume query paths

## Summary
Adds composite B-tree indexes on (user_email, time_column DESC) across all
telemetry and workout tables for fast recency-ordered lookups. These cover
the dominant query pattern: "fetch my recent data ordered by newest first."

## Tables receiving new indexes:
- workout_logs: (user_email, created_at DESC)
- daily_macros: (user_email, created_at DESC)
- bodyweight_logs: (user_email, created_at DESC)
- live_workout_logs: (client_email, completed_at DESC)
- complication_interactions: (user_email, created_at DESC) composite
- weekly_report_cards: (user_email, created_at DESC)
- meal_logs: (user_email, created_at DESC)
- completed_sessions: composite (user_email, created_at DESC)
- coach_activity_logs: already has (user_email, created_at DESC) -- skip

## Notes:
1. IF NOT EXISTS for idempotency
2. Non-unique, read-optimized indexes
3. DESC on time column puts newest rows at index front
*/

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_created
  ON workout_logs (user_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_macros_user_created
  ON daily_macros (user_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bodyweight_logs_user_created
  ON bodyweight_logs (user_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_workout_logs_client_completed
  ON live_workout_logs (client_email, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_complication_user_created
  ON complication_interactions (user_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_cards_user_created
  ON weekly_report_cards (user_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_created
  ON meal_logs (user_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_completed_sessions_user_created
  ON completed_sessions (user_email, created_at DESC);

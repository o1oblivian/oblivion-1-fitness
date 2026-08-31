/*
# Add completed_at column to program_schedule

1. Modified Tables
  - `program_schedule`
    - `completed_at` (timestamptz, nullable) — timestamp when the athlete completed this session
    - `completed` (boolean, default false) — whether this session has been finished

2. Important Notes
  - This enables progressive unlock: the next session only becomes active once the previous session's `completed` is true.
  - Both coach and athlete can query completed sessions to see progress.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'program_schedule' AND column_name = 'completed'
  ) THEN
    ALTER TABLE program_schedule ADD COLUMN completed boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'program_schedule' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE program_schedule ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schedule_completed ON program_schedule(enrollment_id, completed);

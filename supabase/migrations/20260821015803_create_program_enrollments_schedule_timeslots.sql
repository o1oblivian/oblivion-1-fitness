/*
# Create Program Auto-Dispatch System

1. New Tables

  - `program_enrollments`
    - `id` (uuid, primary key)
    - `athlete_email` (text, not null) - the enrolled athlete
    - `program_id` (uuid, not null) - references coach_programs
    - `coach_email` (text, not null) - from the program
    - `dispatch_mode` (text, 'auto' or 'manual', default 'auto')
    - `start_date` (date) - when the program kicks off
    - `training_days` (jsonb) - which weekdays are training days, e.g. ["Mon","Tue","Thu","Fri"]
    - `current_week` (int, default 1)
    - `current_day` (int, default 1)
    - `status` (text, default 'active') - active, paused, completed
    - `created_at` (timestamptz)

  - `program_schedule`
    - `id` (uuid, primary key)
    - `enrollment_id` (uuid, references program_enrollments)
    - `athlete_email` (text, not null)
    - `program_id` (uuid, not null)
    - `week_number` (int, not null)
    - `day_number` (int, not null)
    - `scheduled_date` (date) - the target delivery date
    - `exercises` (jsonb) - the workout content for that session
    - `focus_label` (text) - e.g. "Push", "Pull", "Legs"
    - `dispatched` (boolean, default false)
    - `dispatched_at` (timestamptz, nullable)
    - `dispatch_ref_id` (text, nullable) - links to dispatched_workouts.id
    - `created_at` (timestamptz)

  - `training_time_slots`
    - `id` (uuid, primary key)
    - `athlete_email` (text, not null)
    - `day_of_week` (text, not null) - Mon, Tue, Wed, Thu, Fri, Sat, Sun
    - `time_slot` (time, not null) - e.g. 06:00, 17:30
    - `notify_before_minutes` (int, default 60)
    - `created_at` (timestamptz)
    - UNIQUE(athlete_email, day_of_week)

2. Security
  - RLS enabled on all three tables.
  - anon + authenticated can CRUD (this app uses email-based auth without auth.uid() ownership).

3. Important Notes
  - program_schedule rows are pre-generated when an enrollment is created with dispatch_mode='auto'.
  - The daily cron picks up rows where scheduled_date = today AND dispatched = false AND the enrollment is in auto mode.
  - training_time_slots stores the athlete's preferred workout hours for notification scheduling.
*/

-- program_enrollments
CREATE TABLE IF NOT EXISTS program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_email text NOT NULL,
  program_id uuid NOT NULL,
  coach_email text NOT NULL,
  dispatch_mode text NOT NULL DEFAULT 'auto' CHECK (dispatch_mode IN ('auto', 'manual')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  training_days jsonb NOT NULL DEFAULT '["Mon","Tue","Wed","Thu","Fri"]'::jsonb,
  current_week integer NOT NULL DEFAULT 1,
  current_day integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_athlete ON program_enrollments(athlete_email);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON program_enrollments(status);

ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_enrollments" ON program_enrollments;
CREATE POLICY "select_enrollments" ON program_enrollments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_enrollments" ON program_enrollments;
CREATE POLICY "insert_enrollments" ON program_enrollments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_enrollments" ON program_enrollments;
CREATE POLICY "update_enrollments" ON program_enrollments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_enrollments" ON program_enrollments;
CREATE POLICY "delete_enrollments" ON program_enrollments FOR DELETE
  TO anon, authenticated USING (true);

-- program_schedule
CREATE TABLE IF NOT EXISTS program_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES program_enrollments(id) ON DELETE CASCADE,
  athlete_email text NOT NULL,
  program_id uuid NOT NULL,
  week_number integer NOT NULL,
  day_number integer NOT NULL,
  scheduled_date date NOT NULL,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  focus_label text NOT NULL DEFAULT '',
  dispatched boolean NOT NULL DEFAULT false,
  dispatched_at timestamptz,
  dispatch_ref_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_date ON program_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedule_enrollment ON program_schedule(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_schedule_pending ON program_schedule(scheduled_date, dispatched) WHERE dispatched = false;

ALTER TABLE program_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_schedule" ON program_schedule;
CREATE POLICY "select_schedule" ON program_schedule FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_schedule" ON program_schedule;
CREATE POLICY "insert_schedule" ON program_schedule FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_schedule" ON program_schedule;
CREATE POLICY "update_schedule" ON program_schedule FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_schedule" ON program_schedule;
CREATE POLICY "delete_schedule" ON program_schedule FOR DELETE
  TO anon, authenticated USING (true);

-- training_time_slots
CREATE TABLE IF NOT EXISTS training_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_email text NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  time_slot time NOT NULL DEFAULT '06:00',
  notify_before_minutes integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(athlete_email, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_timeslots_athlete ON training_time_slots(athlete_email);

ALTER TABLE training_time_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_timeslots" ON training_time_slots;
CREATE POLICY "select_timeslots" ON training_time_slots FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_timeslots" ON training_time_slots;
CREATE POLICY "insert_timeslots" ON training_time_slots FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_timeslots" ON training_time_slots;
CREATE POLICY "update_timeslots" ON training_time_slots FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_timeslots" ON training_time_slots;
CREATE POLICY "delete_timeslots" ON training_time_slots FOR DELETE
  TO anon, authenticated USING (true);

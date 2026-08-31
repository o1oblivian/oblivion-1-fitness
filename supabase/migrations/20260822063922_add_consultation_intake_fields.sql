/*
# Add deep intake fields to consultation_requests

## Purpose
Enhances the consultation intake form so clients provide thorough information for the AI Coach Intelligence Engine:
current supplements, dietary preferences/restrictions, injuries, step goals, and desired coaching services.

## Modified Tables
- `consultation_requests`
  - `current_supplements` (text) - client's current supplement stack (freeform)
  - `diet_preferences` (text) - dietary restrictions or preferences (vegan, keto, allergies, etc.)
  - `injuries_limitations` (text) - any injuries, mobility issues, or medical considerations
  - `daily_step_goal` (integer) - client's desired daily step target
  - `current_daily_steps` (integer) - client's current average daily steps
  - `desired_services` (text[]) - array of coaching services requested (program, nutrition plan, accountability, etc.)
  - `budget_range` (text) - preferred budget tier (budget, standard, premium)
  - `timeline_goal` (text) - when client wants to achieve goal (4wk, 8wk, 12wk, 16wk, ongoing)

## Security
- No policy changes needed; existing RLS policies cover all columns.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'current_supplements') THEN
    ALTER TABLE consultation_requests ADD COLUMN current_supplements text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'diet_preferences') THEN
    ALTER TABLE consultation_requests ADD COLUMN diet_preferences text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'injuries_limitations') THEN
    ALTER TABLE consultation_requests ADD COLUMN injuries_limitations text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'daily_step_goal') THEN
    ALTER TABLE consultation_requests ADD COLUMN daily_step_goal integer DEFAULT 10000;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'current_daily_steps') THEN
    ALTER TABLE consultation_requests ADD COLUMN current_daily_steps integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'desired_services') THEN
    ALTER TABLE consultation_requests ADD COLUMN desired_services text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'budget_range') THEN
    ALTER TABLE consultation_requests ADD COLUMN budget_range text DEFAULT 'standard';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultation_requests' AND column_name = 'timeline_goal') THEN
    ALTER TABLE consultation_requests ADD COLUMN timeline_goal text DEFAULT '12wk';
  END IF;
END $$;

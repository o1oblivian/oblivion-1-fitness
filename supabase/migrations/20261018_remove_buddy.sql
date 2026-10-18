-- Removes Buddy and Radar from the database. Safe to run more than once in the Supabase SQL editor.
-- The app is a workout, fuel and coaching app only. Earlier migrations stay as history; this one undoes them.
-- Run once, after every earlier migration. Nothing here touches coaching, reels, payouts or safety_reports rows
-- that belong to coaching or reels.

-- 1. Buddy tables. CASCADE also removes their policies, triggers and indexes.
DROP TABLE IF EXISTS public.buddy_likes CASCADE;
DROP TABLE IF EXISTS public.buddy_messages CASCADE;
DROP TABLE IF EXISTS public.buddy_locations CASCADE;
DROP TABLE IF EXISTS public.buddy_profiles CASCADE;

-- 2. Buddy functions.
DROP FUNCTION IF EXISTS public.buddy_within_radius(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS public.send_buddy_like(text, boolean);
DROP FUNCTION IF EXISTS public.buddy_can_message(text, text);
DROP FUNCTION IF EXISTS public.buddy_profiles_guard();

-- 3. The founding-queue switch only ever gated Buddy.
DROP TABLE IF EXISTS public.app_config CASCADE;

-- 4. safety_reports stays for coaching and reels. Buddy reports have no feature left to act on.
DELETE FROM public.safety_reports WHERE context = 'buddy';
ALTER TABLE public.safety_reports DROP CONSTRAINT IF EXISTS safety_reports_context_check;
ALTER TABLE public.safety_reports ADD CONSTRAINT safety_reports_context_check
  CHECK (context IN ('coach', 'reel'));
ALTER TABLE public.safety_reports ALTER COLUMN context SET DEFAULT 'coach';

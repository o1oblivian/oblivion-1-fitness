-- AbsoluFit: Gym Date & Venue Intelligence Schema Migration
-- Created: 2026-08-08

-- 1. GYM VENUES TABLE
CREATE TABLE IF NOT EXISTS public.gym_venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  postcode TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  is_partner BOOLEAN DEFAULT true,
  vibe_tags TEXT[] DEFAULT '{}',
  pass_price_aud NUMERIC DEFAULT 15.00,
  active_checkins_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast postcode lookup
CREATE INDEX IF NOT EXISTS idx_gym_venues_postcode ON public.gym_venues(postcode);

-- 2. USER TRAINING VECTORS & SOCIAL CHECKINS
CREATE TABLE IF NOT EXISTS public.user_training_vectors (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  partner_status TEXT DEFAULT 'Open for Gym Date', -- 'Open for Gym Date' | 'Training Partner' | 'Busy / Solo Grind'
  venue_id TEXT REFERENCES public.gym_venues(id) ON DELETE SET NULL,
  rpe_target NUMERIC DEFAULT 8.0,
  volume_level NUMERIC DEFAULT 16.0, -- sets/week
  training_focus TEXT DEFAULT 'Hypertrophy', -- 'Powerlifting' | 'Hypertrophy' | 'Functional' | 'Bodybuilding'
  vector_array NUMERIC[] NOT NULL DEFAULT '{0.8, 0.8, 0, 1, 0, 0}',
  bio TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_vectors_venue ON public.user_training_vectors(venue_id);

-- 3. GYM DAY PASSES TABLE
CREATE TABLE IF NOT EXISTS public.gym_passes (
  id TEXT PRIMARY KEY,
  pass_token TEXT NOT NULL UNIQUE,
  venue_id TEXT REFERENCES public.gym_venues(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  pass_type TEXT DEFAULT 'Single Day Pass',
  price_aud NUMERIC DEFAULT 15.00,
  valid_until TIMESTAMPTZ NOT NULL,
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_passes_user ON public.gym_passes(user_email);
CREATE INDEX IF NOT EXISTS idx_gym_passes_token ON public.gym_passes(pass_token);

-- Enable RLS
ALTER TABLE public.gym_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_passes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to venues
CREATE POLICY "Public read gym venues" ON public.gym_venues FOR SELECT USING (true);

-- Allow public/authenticated read and write to user vectors
CREATE POLICY "Public access user vectors" ON public.user_training_vectors FOR ALL USING (true);

-- Allow public/authenticated read and write to passes
CREATE POLICY "Public access passes" ON public.gym_passes FOR ALL USING (true);

-- 4. SEED PARTNER GYM VENUES (Postcodes 3134, 3000, 3121)
INSERT INTO public.gym_venues (id, name, postcode, address, lat, lng, image_url, is_partner, vibe_tags, pass_price_aud, active_checkins_count)
VALUES 
  (
    'venue_lime_3134',
    'Club Lime Ringwood',
    '3134',
    '88 Maroondah Hwy, Ringwood VIC 3134',
    -37.8153,
    145.2289,
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
    true,
    ARRAY['Powerlifting Platform', 'Sauna & Ice Bath', '24/7 Access', 'Open for Gym Dates'],
    14.99,
    12
  ),
  (
    'venue_anytime_3134',
    'Anytime Fitness Ringwood East',
    '3134',
    '62 Railway Ave, Ringwood East VIC 3134',
    -37.8188,
    145.2421,
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop',
    true,
    ARRAY['Hammer Strength', 'Dumbbells up to 60kg', 'Hydration Station'],
    12.50,
    8
  ),
  (
    'venue_zap_3134',
    'Zap Fitness Heathmont',
    '3134',
    '142 Canterbury Rd, Heathmont VIC 3134',
    -37.8280,
    145.2460,
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=800&auto=format&fit=crop',
    true,
    ARRAY['Cardio Deck', 'Functional Rig', 'Quiet Vibes'],
    10.00,
    5
  ),
  (
    'venue_golds_3000',
    'Gold’s Gym Melbourne CBD',
    '3000',
    '180 Russell St, Melbourne VIC 3000',
    -37.8122,
    144.9680,
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
    true,
    ARRAY['Heavy Iron', 'Pose Room', 'Protein Bar', 'High Energy'],
    20.00,
    24
  ),
  (
    'venue_virgin_3000',
    'Virgin Active Collins Street',
    '3000',
    '567 Collins St, Melbourne VIC 3000',
    -37.8190,
    144.9575,
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop',
    true,
    ARRAY['Luxury Hydrotherapy', 'Reformer Pilates', 'Rooftop Track'],
    25.00,
    18
  )
ON CONFLICT (id) DO NOTHING;

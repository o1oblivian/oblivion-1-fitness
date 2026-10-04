/**
 * Seed Founder Coach Profile into Production Supabase coach_profiles table
 * Production URL: https://qkfvepjeyreicqomatyt.supabase.co
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qkfvepjeyreicqomatyt.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZnZlcGpleXJlaWNxb21hdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MTgxMTUsImV4cCI6MjEwMzI5NDExNX0.mHwZdAANv_Ii4t-oKyz--EeQR64A0lVhUgqtuOfNXpA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function runSeed() {
  console.log('[Supabase Seed] Connecting to', SUPABASE_URL);

  const founderRecord = {
    display_name: 'Founder & Head Coach',
    bio: 'Head Coach & Founder at Oblivion 1 Fitness Club. Leading strength, conditioning, and telemetry programming.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    is_active: true,
  };

  console.log('[Supabase Seed] Writing to coach_profiles with payload:', founderRecord);

  // 1. Direct write attempt with full payload
  const res = await supabase.from('coach_profiles').insert(founderRecord).select();
  console.log('[Supabase Seed] Direct write response (full):', JSON.stringify(res, null, 2));

  // 2. Direct write attempt with base schema payload
  const baseRecord = {
    display_name: founderRecord.display_name,
    bio: founderRecord.bio,
    avatar_url: founderRecord.avatar_url,
  };
  const baseRes = await supabase.from('coach_profiles').insert(baseRecord).select();
  console.log('[Supabase Seed] Direct write response (base):', JSON.stringify(baseRes, null, 2));

  return { res, baseRes };
}

runSeed()
  .then(() => {
    console.log('[Supabase Seed] Finished execution.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Supabase Seed] Execution error:', err);
    process.exit(1);
  });

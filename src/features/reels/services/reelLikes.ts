import { supabase } from '../../../services/supabaseClient';
import { isValidUuid } from '../../coach/services/coachService';

export async function loadMyLikes(userId: string): Promise<Record<string, boolean>> {
  if (!isValidUuid(userId)) return {};
  const { data, error } = await supabase.from('reel_likes').select('reel_id').eq('user_id', userId);
  if (error || !Array.isArray(data)) return {};
  const next: Record<string, boolean> = {};
  for (const row of data) {
    if (row?.reel_id) next[String(row.reel_id)] = true;
  }
  return next;
}

/** Null when the table is unavailable, so the rail shows a label instead of a made-up number. */
export async function fetchLikeCount(reelId: string): Promise<number | null> {
  if (!reelId) return null;
  const { count, error } = await supabase.from('reel_likes').select('reel_id', { count: 'exact', head: true }).eq('reel_id', reelId);
  return error ? null : count ?? null;
}

export async function setReelLike(userId: string, reelId: string, liked: boolean): Promise<boolean> {
  if (!isValidUuid(userId) || !reelId) return false;
  const res = liked
    ? await supabase.from('reel_likes').insert({ user_id: userId, reel_id: reelId })
    : await supabase.from('reel_likes').delete().eq('user_id', userId).eq('reel_id', reelId);
  return !res.error || res.error.code === '23505';
}

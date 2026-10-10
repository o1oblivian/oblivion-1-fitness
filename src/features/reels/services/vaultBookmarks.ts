import { supabase } from '../../../services/supabaseClient';

const LOCAL_KEY = 'o1_vault_bookmarks';

function readLocal(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocal(map: Record<string, boolean>) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
  } catch {
    /* private mode */
  }
}

export async function loadVaultBookmarks(userId: string): Promise<Record<string, boolean>> {
  const local = readLocal();
  if (!userId) return local;
  const { data, error } = await supabase.from('vault_bookmarks').select('reel_id').eq('user_id', userId);
  if (error || !Array.isArray(data)) return local;
  const next = { ...local };
  for (const row of data) {
    if (row?.reel_id) next[String(row.reel_id)] = true;
  }
  writeLocal(next);
  return next;
}

export async function saveVaultBookmark(userId: string, reelId: string, saved: boolean): Promise<void> {
  const next = readLocal();
  if (saved) next[reelId] = true;
  else delete next[reelId];
  writeLocal(next);
  if (!userId) return;
  if (saved) {
    await supabase.from('vault_bookmarks').upsert({
      id: `${userId}|${reelId}`,
      user_id: userId,
      reel_id: reelId,
      created_at: new Date().toISOString(),
    });
    return;
  }
  await supabase.from('vault_bookmarks').delete().eq('user_id', userId).eq('reel_id', reelId);
}

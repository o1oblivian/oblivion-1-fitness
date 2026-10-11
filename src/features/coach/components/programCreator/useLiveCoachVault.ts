import { useState, useEffect } from 'react';
import { supabase } from '../../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../../services/authUser';
import { saveVaultRow, storeMedia } from '../../../../services/mediaStorage';

export interface VaultUploadItem {
  id: string;
  url: string;
  title: string;
}

const STORAGE_KEY = 'o1_coach_exercise_vault_media';

export function useLiveCoachVault() {
  const [vaultItems, setVaultItems] = useState<VaultUploadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadCoachVault() {
      setLoading(true);
      try {
        const coachId = await getAuthenticatedUserId();
        if (!coachId) {
          if (isMounted) setLoading(false);
          return;
        }

        const { data: supabaseItems } = await supabase
          .from('media_vault')
          .select('id, media_url, thumbnail_url, url, title')
          .eq('user_id', coachId)
          .order('created_at', { ascending: false });

        const mappedCloud: VaultUploadItem[] = (Array.isArray(supabaseItems) ? supabaseItems : [])
          .map((item: any) => ({
            id: item.id,
            url: item.media_url || item.thumbnail_url || item.url,
            title: item.title || 'Vault Upload',
          }))
          .filter((item) => Boolean(item.url));

        const localRaw = localStorage.getItem(STORAGE_KEY);
        const mappedLocal: VaultUploadItem[] = [];
        if (localRaw) {
          try {
            const parsed = JSON.parse(localRaw);
            if (Array.isArray(parsed)) {
              parsed.forEach((item: any) => {
                const u = item.url || item.thumbnailUrl;
                if (u && !mappedCloud.some((c) => c.url === u)) {
                  mappedLocal.push({ id: item.id || `loc-${Math.random()}`, url: u, title: item.title || 'Upload' });
                }
              });
            }
          } catch {}
        }

        if (isMounted) setVaultItems([...mappedCloud, ...mappedLocal]);
      } catch (err) {
        console.warn('[LiveVault] Query notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCoachVault();
    return () => { isMounted = false; };
  }, []);

  /** Uploads the artwork and returns the link to use as the cover. */
  const addVaultItem = async (source: Blob | string, title: string): Promise<string> => {
    const stored = await storeMedia(source, 'covers');
    const newItem: VaultUploadItem = { id: `vault-media-${Date.now()}`, url: stored.url, title };
    setVaultItems((prev) => [newItem, ...prev]);
    void saveVaultRow({ id: newItem.id, type: 'photo', title, media_url: stored.url, storage_path: stored.path });

    try {
      const prevLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const localItem = {
        id: newItem.id,
        type: 'photo',
        title,
        category: 'Transformation',
        athleteName: '',
        url: stored.url,
        createdAt: 'Just now',
        storagePaths: stored.path ? [stored.path] : undefined,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([localItem, ...prevLocal]));
    } catch {}
    return stored.url;
  };

  return { vaultItems, loading, addVaultItem };
}

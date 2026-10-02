import { useState, useEffect } from 'react';
import { supabase } from '../../../../services/supabaseClient';

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
        const { data: authData } = await supabase.auth.getUser();
        const coachId = authData?.user?.id || localStorage.getItem('o1fc_user_id') || 'default-athlete';

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

  const addVaultItem = async (dataUrl: string, title: string) => {
    const newItem: VaultUploadItem = { id: `vault-media-${Date.now()}`, url: dataUrl, title };
    setVaultItems((prev) => [newItem, ...prev]);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const coachId = authData?.user?.id || localStorage.getItem('o1fc_user_id') || 'default-athlete';
      await supabase.from('media_vault').insert([{
        id: newItem.id,
        user_id: coachId,
        title,
        media_url: dataUrl,
        thumbnail_url: dataUrl,
        type: 'photo',
        created_at: new Date().toISOString(),
      }]);
    } catch {}

    try {
      const prevLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newItem, ...prevLocal]));
    } catch {}
  };

  return { vaultItems, loading, addVaultItem };
}

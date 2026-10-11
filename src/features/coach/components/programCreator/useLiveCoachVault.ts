import { useState, useEffect } from 'react';
import { fetchVaultRows, saveVaultRow, storeMedia } from '../../../../services/mediaStorage';
import { safeStorage } from '../../../../utils/safeStorage';

export interface VaultUploadItem {
  id: string;
  url: string;
  title: string;
}

interface LocalVaultItem {
  id?: string;
  type?: 'photo' | 'video';
  title?: string;
  url?: string;
  thumbnailUrl?: string;
}

const STORAGE_KEY = 'o1_coach_exercise_vault_media';

function readLocal(): LocalVaultItem[] {
  const stored = safeStorage.getItem<unknown>(STORAGE_KEY, []);
  return Array.isArray(stored) ? (stored as LocalVaultItem[]) : [];
}

/** A still image for an item: the photo itself, or a video's poster. Session-only links are skipped. */
function coverUrl(type: string | undefined, url?: string | null, poster?: string | null): string {
  const pick = type === 'video' ? poster : url || poster;
  return pick && !pick.startsWith('blob:') ? pick : '';
}

export function useLiveCoachVault() {
  const [vaultItems, setVaultItems] = useState<VaultUploadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const cloud: VaultUploadItem[] = (await fetchVaultRows().catch(() => []))
        .map((row) => ({ id: row.id, url: coverUrl(row.type, row.media_url, row.thumbnail_url), title: row.title || 'Vault' }))
        .filter((item) => item.url);
      const seen = new Set(cloud.map((item) => item.url));
      const local: VaultUploadItem[] = [];
      readLocal().forEach((item, idx) => {
        const url = coverUrl(item.type, item.url, item.thumbnailUrl);
        if (!url || seen.has(url)) return;
        seen.add(url);
        local.push({ id: item.id || `local-${idx}`, url, title: item.title || 'Vault' });
      });
      if (isMounted) {
        setVaultItems([...cloud, ...local]);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  /** Uploads the artwork and returns the link to use as the cover. */
  const addVaultItem = async (source: Blob | string, title: string): Promise<string> => {
    const stored = await storeMedia(source, 'covers');
    const newItem: VaultUploadItem = { id: `vault-media-${Date.now()}`, url: stored.url, title };
    setVaultItems((prev) => [newItem, ...prev]);
    void saveVaultRow({ id: newItem.id, type: 'photo', title, media_url: stored.url, storage_path: stored.path });

    const prevLocal = readLocal();
    safeStorage.setItem(STORAGE_KEY, [
      {
        id: newItem.id,
        type: 'photo',
        title,
        category: 'Transformation',
        athleteName: '',
        url: stored.url,
        createdAt: 'Just now',
        storagePaths: stored.path ? [stored.path] : undefined,
      },
      ...prevLocal,
    ]);
    return stored.url;
  };

  return { vaultItems, loading, addVaultItem };
}

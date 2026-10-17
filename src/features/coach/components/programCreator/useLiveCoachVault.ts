import { useState, useEffect } from 'react';
import {
  fetchVaultRows,
  saveVaultRow,
  uploadMedia,
  isSharedUrl,
} from '../../../../services/mediaStorage';

export interface VaultUploadItem {
  id: string;
  url: string;
  title: string;
}

/** A still image for an item: the photo itself, or a video's poster. */
function coverUrl(type: string | undefined, url?: string | null, poster?: string | null): string {
  const pick = type === 'video' ? poster : url || poster;
  return pick && isSharedUrl(pick) ? pick : '';
}

export function useLiveCoachVault() {
  const [vaultItems, setVaultItems] = useState<VaultUploadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    void fetchVaultRows()
      .catch(() => [])
      .then((rows) => {
        if (!isMounted) return;
        setVaultItems(
          rows
            .map((row) => ({
              id: row.id,
              url: coverUrl(row.type, row.media_url, row.thumbnail_url),
              title: row.title || 'Vault',
            }))
            .filter((item) => item.url),
        );
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  /** Uploads the artwork to the Vault and returns its link, or null when the upload failed. */
  const addVaultItem = async (source: Blob | string, title: string): Promise<string | null> => {
    const stored = await uploadMedia(source, 'covers');
    if (!stored) return null;
    const newItem: VaultUploadItem = { id: `vault-media-${Date.now()}`, url: stored.url, title };
    setVaultItems((prev) => [newItem, ...prev]);
    void saveVaultRow({
      id: newItem.id,
      type: 'photo',
      title,
      media_url: stored.url,
      storage_path: stored.path,
    });
    return stored.url;
  };

  return { vaultItems, loading, addVaultItem };
}

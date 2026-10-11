import { supabase } from './supabaseClient';
import { getAuthenticatedUserId } from './authUser';

export const MEDIA_BUCKET = 'media';

export type MediaFolder = 'vault' | 'reels' | 'avatars' | 'covers';

export interface StoredMedia {
  url: string;
  /** Storage object path, or null when the file stayed on this phone. */
  path: string | null;
  remote: boolean;
}

const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

async function toBlob(source: Blob | string): Promise<Blob | null> {
  if (typeof source !== 'string') return source;
  if (!source.startsWith('blob:') && !source.startsWith('data:')) return null;
  try {
    return await (await fetch(source)).blob();
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** True for links that still work after a restart and on other phones. */
export function isSharedUrl(url: string | null | undefined): boolean {
  return Boolean(url) && /^https?:\/\//.test(String(url));
}

/** Uploads into `<user id>/<folder>/` of the public media bucket. Null when signed out or the upload fails. */
export async function uploadMedia(source: Blob | string, folder: MediaFolder): Promise<StoredMedia | null> {
  if (typeof source === 'string' && isSharedUrl(source)) return { url: source, path: null, remote: true };
  const uid = await getAuthenticatedUserId();
  if (!uid) return null;
  const blob = await toBlob(source);
  if (!blob || blob.size === 0) return null;
  const type = blob.type || 'application/octet-stream';
  const ext = EXTENSIONS[type] || type.split('/')[1] || 'bin';
  const path = `${uid}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, {
    contentType: type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) {
    console.warn('[mediaStorage] upload failed:', error.message);
    return null;
  }
  return { url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl, path, remote: true };
}

/**
 * Uploads when possible. Otherwise keeps a copy on this phone: photos become data URLs so they
 * survive a restart; videos stay as a session link because they are too large to inline.
 */
export async function storeMedia(source: Blob | string, folder: MediaFolder): Promise<StoredMedia> {
  const uploaded = await uploadMedia(source, folder);
  if (uploaded) return uploaded;
  const blob = await toBlob(source);
  if (blob && blob.type.startsWith('image/')) {
    try {
      return { url: await blobToDataUrl(blob), path: null, remote: false };
    } catch {
      /* fall through to a session link */
    }
  }
  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  return { url, path: null, remote: false };
}

export async function removeMedia(paths: (string | null | undefined)[]): Promise<void> {
  const own = paths.filter((p): p is string => Boolean(p));
  if (!own.length) return;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(own);
  if (error) console.warn('[mediaStorage] remove failed:', error.message);
}

export interface VaultRow {
  id: string;
  type: 'photo' | 'video';
  title: string;
  media_url: string;
  thumbnail_url?: string | null;
  storage_path?: string | null;
  created_at?: string;
}

/** Saves a Vault item to the signed-in member's cloud library. Skips links that only work on this phone. */
export async function saveVaultRow(row: VaultRow): Promise<boolean> {
  if (!isSharedUrl(row.media_url)) return false;
  const uid = await getAuthenticatedUserId();
  if (!uid) return false;
  const { error } = await supabase.from('media_vault').upsert({
    ...row,
    thumbnail_url: isSharedUrl(row.thumbnail_url) ? row.thumbnail_url : null,
    user_id: uid,
    created_at: row.created_at || new Date().toISOString(),
  });
  if (error) console.warn('[mediaStorage] vault row failed:', error.message);
  return !error;
}

export async function fetchVaultRows(): Promise<VaultRow[]> {
  const uid = await getAuthenticatedUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('media_vault')
    .select('id, type, title, media_url, thumbnail_url, storage_path, created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error || !Array.isArray(data)) return [];
  return data as VaultRow[];
}

export async function deleteVaultRow(id: string): Promise<void> {
  const { error } = await supabase.from('media_vault').delete().eq('id', id);
  if (error) console.warn('[mediaStorage] vault delete failed:', error.message);
}

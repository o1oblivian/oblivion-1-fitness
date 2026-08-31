import { supabase, isSupabaseConfigured } from './supabase';
import {
  fileToBase64,
  getSavedAthleteVaultItems,
  saveAthleteVaultItems,
  deleteAthleteVaultItem,
  persistUploadedVaultMedia,
} from './vaultPersistenceStore';
import { idbDeleteVaultItem } from './indexedDbMediaVault';

export interface VaultPhoto {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  sort_order: number;
  caption: string | null;
  show_on_buddy: boolean;
  created_at: string;
}

const MAX_VAULT_PHOTOS = 12;
const LOCAL_VAULT_FALLBACK_KEY = 'o1fc_athlete_vault_photos_v1';

function getLocalVaultPhotos(): VaultPhoto[] {
  try {
    const raw = localStorage.getItem(LOCAL_VAULT_FALLBACK_KEY);
    const photos: VaultPhoto[] = raw ? JSON.parse(raw) : [];

    // Merge with athlete vault items for unified storage
    const athleteItems = getSavedAthleteVaultItems();
    if (athleteItems.length > 0) {
      athleteItems.forEach((it, idx) => {
        if (!photos.some((p) => p.id === it.id)) {
          photos.push({
            id: it.id,
            user_id: 'current_user',
            media_url: it.url,
            media_type: it.type === 'video' ? 'video' : 'image',
            sort_order: idx,
            caption: it.title || null,
            show_on_buddy: it.show_on_buddy !== false,
            created_at: it.date || new Date().toISOString(),
          });
        }
      });
    }
    return photos;
  } catch {
    return [];
  }
}

function saveLocalVaultPhotos(photos: VaultPhoto[]): void {
  try {
    localStorage.setItem(LOCAL_VAULT_FALLBACK_KEY, JSON.stringify(photos));
    // Also sync to athlete media vault
    const athleteItems = photos.map((p) => ({
      id: p.id,
      title: p.caption || (p.media_type === 'video' ? 'Form Check Video' : 'Physique Check-In'),
      type: p.media_type === 'video' ? ('video' as const) : ('photo' as const),
      url: p.media_url,
      thumbnailUrl: p.media_url,
      category: p.media_type === 'video' ? ('Videos' as const) : ('Photos' as const),
      date: new Date(p.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      likes: 1,
      show_on_buddy: p.show_on_buddy,
    }));
    saveAthleteVaultItems(athleteItems);
  } catch {
    // ignore
  }
}

export async function fetchVaultPhotos(userId: string): Promise<VaultPhoto[]> {
  const localItems = getLocalVaultPhotos();
  if (!isSupabaseConfigured()) return localItems;
  try {
    const { data, error } = await supabase
      .from('profile_media')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return localItems;
    const combined = [...(data as VaultPhoto[])];
    for (const l of localItems) {
      if (!combined.some((c) => c.id === l.id)) {
        combined.push(l);
      }
    }
    return combined;
  } catch {
    return localItems;
  }
}

export async function fetchBuddyVisiblePhotos(userId: string): Promise<string[]> {
  const local = getLocalVaultPhotos().filter((p) => p.show_on_buddy).map((p) => p.media_url);
  if (!isSupabaseConfigured()) return local;
  try {
    const { data, error } = await supabase
      .from('profile_media')
      .select('media_url')
      .eq('user_id', userId)
      .eq('show_on_buddy', true)
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return local;
    return data.map((r) => r.media_url);
  } catch {
    return local;
  }
}

export async function uploadVaultPhoto(file: File): Promise<VaultPhoto | null> {
  try {
    const persisted = await persistUploadedVaultMedia(file, 'athlete');
    const newPhoto: VaultPhoto = {
      id: persisted.id,
      user_id: 'current_user',
      media_url: persisted.url,
      media_type: persisted.type === 'video' ? 'video' : 'image',
      sort_order: 0,
      caption: persisted.title,
      show_on_buddy: true,
      created_at: new Date().toISOString(),
    };

    const existingLocal = getLocalVaultPhotos();
    const updated = [newPhoto, ...existingLocal.filter((p) => p.id !== newPhoto.id)];
    saveLocalVaultPhotos(updated);
    return newPhoto;
  } catch (err) {
    console.error('Error uploading vault photo', err);
    return null;
  }
}

export async function deleteVaultPhoto(id: string, mediaUrl?: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_VAULT_FALLBACK_KEY);
    const photos: VaultPhoto[] = raw ? JSON.parse(raw) : [];
    const filtered = photos.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_VAULT_FALLBACK_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }

  // Clean IndexedDB and Athlete store
  deleteAthleteVaultItem(id);
  idbDeleteVaultItem(id);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('profile_media').delete().eq('id', id);
      if (mediaUrl) {
        const urlParts = mediaUrl.split('/profile-media/');
        if (urlParts.length > 1) {
          await supabase.storage.from('profile-media').remove([urlParts[1]]);
        }
      }
    } catch {
      // ignore
    }
  }
  return true;
}

export async function toggleBuddyVisibility(id: string, show: boolean): Promise<boolean> {
  const local = getLocalVaultPhotos().map((p) => (p.id === id ? { ...p, show_on_buddy: show } : p));
  saveLocalVaultPhotos(local);

  if (!isSupabaseConfigured()) return true;
  try {
    const { error } = await supabase
      .from('profile_media')
      .update({ show_on_buddy: show })
      .eq('id', id);
    return !error;
  } catch {
    return true;
  }
}

export async function updatePhotoCaption(id: string, caption: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase
    .from('profile_media')
    .update({ caption })
    .eq('id', id);
  return !error;
}

export async function updateProfileBio(bio: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data: session } = await supabase.auth.getSession();
  const email = session?.session?.user?.email;
  if (!email) return false;
  const { error } = await supabase
    .from('user_profiles')
    .update({ bio })
    .eq('email', email);
  return !error;
}

export async function updateTrainingTags(tags: string[]): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data: session } = await supabase.auth.getSession();
  const email = session?.session?.user?.email;
  if (!email) return false;
  const { error } = await supabase
    .from('user_profiles')
    .update({ training_tags: tags })
    .eq('email', email);
  return !error;
}

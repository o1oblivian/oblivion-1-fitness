import { supabase, isSupabaseConfigured } from './supabase';
import { VaultMediaItem } from '../components/MediaVaultModal';
import { idbSaveVaultItem, idbSaveVaultItems, idbGetVaultItems, idbDeleteVaultItem } from './indexedDbMediaVault';

const ATHLETE_VAULT_KEY = 'o1fc_athlete_media_vault_v1';
const COACH_VAULT_KEY = 'o1fc_coach_media_vault_v1';

// In-memory memory cache to always provide instant synchronous retrieval
let inMemoryAthleteVault: VaultMediaItem[] = [];
let inMemoryCoachVault: VaultMediaItem[] = [];
let hasHydratedFromIdb = false;

// Async hydration from durable IndexedDB
export async function hydrateVaultsFromIndexedDb(): Promise<void> {
  if (hasHydratedFromIdb) return;
  try {
    const idbItems = await idbGetVaultItems();
    if (idbItems && idbItems.length > 0) {
      const athleteItems = idbItems.filter((i: any) => i._vaultType === 'athlete' || !i._vaultType);
      const coachItems = idbItems.filter((i: any) => i._vaultType === 'coach');

      if (athleteItems.length > 0) {
        inMemoryAthleteVault = mergeVaultLists(inMemoryAthleteVault, athleteItems);
        window.dispatchEvent(new CustomEvent('o1fc_athlete_vault_updated', { detail: inMemoryAthleteVault }));
      }
      if (coachItems.length > 0) {
        inMemoryCoachVault = mergeVaultLists(inMemoryCoachVault, coachItems);
        window.dispatchEvent(new CustomEvent('o1fc_coach_vault_updated', { detail: inMemoryCoachVault }));
      }
    }
    hasHydratedFromIdb = true;
  } catch (err) {
    console.warn('IDB hydration warning:', err);
  }
}

// Kick off hydration immediately on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    hydrateVaultsFromIndexedDb();
  }, 30);
}

function mergeVaultLists(existing: VaultMediaItem[], incoming: VaultMediaItem[]): VaultMediaItem[] {
  const map = new Map<string, VaultMediaItem>();
  incoming.forEach((item) => map.set(item.id, item));
  existing.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

// Safely write to localStorage with quota protection
function safeLocalStorageSet(key: string, items: VaultMediaItem[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    try {
      const lightweight = items.map((item) => {
        if (item.url && item.url.startsWith('data:') && item.url.length > 50000) {
          return {
            ...item,
            url: item.thumbnailUrl && !item.thumbnailUrl.startsWith('data:') ? item.thumbnailUrl : '',
          };
        }
        return item;
      });
      localStorage.setItem(key, JSON.stringify(lightweight));
    } catch {
      try {
        const minimal = items.slice(0, 4).map((item) => ({
          ...item,
          url: item.url?.startsWith('http') ? item.url : '',
        }));
        localStorage.setItem(key, JSON.stringify(minimal));
      } catch {
        // Suppress error since IndexedDB preserves full media
      }
    }
  }
}

// Convert a File object into Base64 or Blob URL
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Generate a fast video thumbnail canvas frame from a video file/blob
export async function generateVideoThumbnail(videoSrc: string): Promise<string> {
  return new Promise((resolve) => {
    if (!videoSrc) {
      resolve('');
      return;
    }

    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';

      if (videoSrc.startsWith('http://') || videoSrc.startsWith('https://')) {
        video.crossOrigin = 'anonymous';
      }

      let timeoutId: any = setTimeout(() => {
        cleanup();
        resolve('');
      }, 2500);

      const cleanup = () => {
        clearTimeout(timeoutId);
        video.onloadeddata = null;
        video.onloadedmetadata = null;
        video.onerror = null;
        video.onseeked = null;
        video.src = '';
      };

      video.onloadedmetadata = () => {
        try {
          if (video.duration > 0.1) {
            video.currentTime = Math.min(0.5, video.duration / 2);
          }
        } catch {
          // ignore seek error
        }
      };

      const captureFrame = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 360, 360);
          canvas.height = Math.min(video.videoHeight || 480, 480);
          const ctx = canvas.getContext('2d');
          if (ctx && canvas.width > 0 && canvas.height > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            cleanup();
            resolve(dataUrl);
            return;
          }
        } catch {
          // canvas error
        }
        cleanup();
        resolve('');
      };

      video.onseeked = captureFrame;
      video.onloadeddata = () => {
        setTimeout(captureFrame, 100);
      };

      video.onerror = () => {
        cleanup();
        resolve('');
      };

      video.src = videoSrc;
    } catch {
      resolve('');
    }
  });
}

// Load Athlete Vault Items (Combines In-Memory, LocalStorage & IndexedDB)
export function getSavedAthleteVaultItems(): VaultMediaItem[] {
  if (inMemoryAthleteVault.length > 0) return inMemoryAthleteVault;
  try {
    const raw = localStorage.getItem(ATHLETE_VAULT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryAthleteVault = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error loading athlete vault from localStorage', err);
  }
  return inMemoryAthleteVault;
}

// Save Athlete Vault Items to LocalStorage, Memory & IndexedDB
export function saveAthleteVaultItems(items: VaultMediaItem[]): void {
  inMemoryAthleteVault = items;
  safeLocalStorageSet(ATHLETE_VAULT_KEY, items);
  idbSaveVaultItems(items.map((it) => ({ ...it, _vaultType: 'athlete' })));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o1fc_athlete_vault_updated', { detail: items }));
    window.dispatchEvent(new CustomEvent('o1fc_vault_sync', { detail: { type: 'athlete', items } }));
  }
}

// Explicit Delete from Athlete Vault
export function deleteAthleteVaultItem(id: string): void {
  inMemoryAthleteVault = inMemoryAthleteVault.filter((i) => i.id !== id);
  safeLocalStorageSet(ATHLETE_VAULT_KEY, inMemoryAthleteVault);
  idbDeleteVaultItem(id);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o1fc_athlete_vault_updated', { detail: inMemoryAthleteVault }));
    window.dispatchEvent(new CustomEvent('o1fc_vault_sync', { detail: { type: 'athlete', items: inMemoryAthleteVault } }));
  }
}

// Load Coach Vault Items
export function getSavedCoachVaultItems(): VaultMediaItem[] {
  if (inMemoryCoachVault.length > 0) return inMemoryCoachVault;
  try {
    const raw = localStorage.getItem(COACH_VAULT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryCoachVault = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error loading coach vault from localStorage', err);
  }
  return inMemoryCoachVault;
}

// Save Coach Vault Items to LocalStorage, Memory & IndexedDB
export function saveCoachVaultItems(items: VaultMediaItem[]): void {
  inMemoryCoachVault = items;
  safeLocalStorageSet(COACH_VAULT_KEY, items);
  idbSaveVaultItems(items.map((it) => ({ ...it, _vaultType: 'coach' })));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o1fc_coach_vault_updated', { detail: items }));
    window.dispatchEvent(new CustomEvent('o1fc_vault_sync', { detail: { type: 'coach', items } }));
  }
}

// Explicit Delete from Coach Vault
export function deleteCoachVaultItem(id: string): void {
  inMemoryCoachVault = inMemoryCoachVault.filter((i) => i.id !== id);
  safeLocalStorageSet(COACH_VAULT_KEY, inMemoryCoachVault);
  idbDeleteVaultItem(id);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('o1fc_coach_vault_updated', { detail: inMemoryCoachVault }));
    window.dispatchEvent(new CustomEvent('o1fc_vault_sync', { detail: { type: 'coach', items: inMemoryCoachVault } }));
  }
}

// Persist a newly uploaded media item (photo or video) across local, IndexedDB and cloud
export async function persistUploadedVaultMedia(
  file: File,
  targetVault: 'athlete' | 'coach',
  customTitle?: string
): Promise<VaultMediaItem> {
  const isVideo = file.type.startsWith('video');
  const mediaType: 'photo' | 'video' = isVideo ? 'video' : 'photo';
  const category = mediaType === 'video' ? 'Videos' : 'Photos';
  const dateFormatted = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // 1. Create a fast preview Object URL for instant UI response & generate thumbnail
  const tempObjectUrl = URL.createObjectURL(file);
  let finalMediaUrl = tempObjectUrl;
  let thumbnailUrl = '';

  if (isVideo) {
    try {
      thumbnailUrl = await generateVideoThumbnail(tempObjectUrl);
    } catch {
      thumbnailUrl = '';
    }
  }

  try {
    // For photos or reasonably sized videos, convert Base64 for persistent offline access
    if (!isVideo || file.size < 15 * 1024 * 1024) {
      const base64 = await fileToBase64(file);
      finalMediaUrl = base64;
    }
  } catch {
    // Keep blob url
  }

  // 2. Attempt Supabase cloud upload if configured
  if (isSupabaseConfigured()) {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id || 'guest_user';
      const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const filename = `${userId}/${targetVault}_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('profile-media')
        .upload(filename, file, { upsert: true });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from('profile-media')
          .getPublicUrl(filename);
        if (urlData?.publicUrl) {
          finalMediaUrl = urlData.publicUrl;
        }
      }
    } catch (cloudErr) {
      console.warn('Supabase storage upload bypassed, saved safely to IndexedDB', cloudErr);
    }
  }

  const newItem: VaultMediaItem = {
    id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: customTitle || file.name.replace(/\.[^/.]+$/, '') || (isVideo ? 'Form Check Video' : 'Physique Progress Shot'),
    type: mediaType,
    url: finalMediaUrl,
    thumbnailUrl: thumbnailUrl || finalMediaUrl,
    category: category,
    date: dateFormatted,
    likes: 1,
    coachNote: isVideo ? 'Form check & technique assessment recording' : 'Athlete physique & biometric progress log',
    show_on_buddy: true,
  };

  // 3. Save to IndexedDB directly (preserves raw file blob safely)
  await idbSaveVaultItem({ ...newItem, rawBlob: file, _vaultType: targetVault });

  // 4. Save to target store & memory
  if (targetVault === 'athlete') {
    const current = getSavedAthleteVaultItems();
    const updated = [newItem, ...current.filter((i) => i.id !== newItem.id)];
    saveAthleteVaultItems(updated);
  } else {
    const current = getSavedCoachVaultItems();
    const updated = [newItem, ...current.filter((i) => i.id !== newItem.id)];
    saveCoachVaultItems(updated);
  }

  return newItem;
}

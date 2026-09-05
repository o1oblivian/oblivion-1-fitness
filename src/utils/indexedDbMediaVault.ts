// Robust IndexedDB Media Storage for OFC Media Vaults (Physique Photos & Video Clips)
// Solves browser LocalStorage 5MB quota exhaustion permanently.
import { isCloudSyncEnabled } from './cloudSyncPreferences';

const DB_NAME = 'o1fc_media_vault_db';
const DB_VERSION = 2;
const STORE_NAME = 'vault_items';
const QUEUE_STORE = 'media_sync_queue';

export interface PendingMediaUpload {
  id: string;
  type: 'physique_photo' | 'form_video' | 'recipe_image';
  userEmail: string;
  dataUrl: string;
  filename: string;
  timestamp: number;
  metadata?: Record<string, any>;
  retryCount: number;
}

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSaveVaultItem(item: any): Promise<void> {
  try {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB Save failed', err);
  }
}

export async function idbSaveVaultItems(items: any[]): Promise<void> {
  try {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      items.forEach((it) => store.put(it));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB Save bulk failed', err);
  }
}

export async function idbGetVaultItems(): Promise<any[]> {
  try {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB Get items failed', err);
    return [];
  }
}

export async function idbGetVaultItem(id: string): Promise<any | null> {
  try {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB Get item failed', err);
    return null;
  }
}

export async function idbDeleteVaultItem(id: string): Promise<void> {
  try {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB Delete item failed', err);
  }
}

// ─── Offline Media Sync Queue ─────────────────────────────

export async function enqueueMediaForSync(item: Omit<PendingMediaUpload, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
  const id = `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  // If user disabled cloud sync, keep item purely local and skip cloud queue
  if (!isCloudSyncEnabled()) {
    return id;
  }

  const record: PendingMediaUpload = {
    ...item,
    id,
    timestamp: Date.now(),
    retryCount: 0,
  };

  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('o1fc_media_queue_updated'));
    }
  } catch (e) {
    console.warn('[OfflineMediaQueue] Enqueue warning:', e);
  }
  return id;
}

export async function getPendingMediaUploads(): Promise<PendingMediaUpload[]> {
  try {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineMediaQueue] Get pending failed:', err);
    return [];
  }
}

export async function removePendingMediaUpload(id: string): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('o1fc_media_queue_updated'));
    }
  } catch (e) {
    console.warn('[OfflineMediaQueue] Delete pending failed:', e);
  }
}

export async function flushMediaSyncQueue(
  uploader?: (item: PendingMediaUpload) => Promise<string>
): Promise<number> {
  if (!isCloudSyncEnabled()) {
    return 0;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 0;
  }

  const items = await getPendingMediaUploads();
  if (items.length === 0) return 0;

  let syncedCount = 0;
  for (const item of items) {
    try {
      if (uploader) {
        await uploader(item);
      }
      await removePendingMediaUpload(item.id);
      syncedCount++;
    } catch (err) {
      console.warn(`[OfflineMediaQueue] Failed to sync ${item.id}:`, err);
    }
  }

  return syncedCount;
}

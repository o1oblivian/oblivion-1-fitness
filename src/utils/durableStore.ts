/**
 * IndexedDB copy of the athlete's training data. localStorage is small (about 5 MB) and can be
 * cleared by the OS; this copy has no practical size cap and is restored before any store loads.
 */
const DB_NAME = 'o1fc_durable';
const STORE = 'kv';
const OWNER_KEY = 'o1fc_device_owner';
const RESTORE_CAP_MS = 10_000;

/** Keys that hold logged training, food and the sync queue. */
export const DURABLE_KEYS = new Set([
  'o1fc_telemetry_5day_history_v1',
  'o1fc_active_workout_session',
  'o1fc_athlete_saved_day_routines',
  'o1fc_fuel_cache_v6',
  'o1fc_weighins_v1',
  'o1fc_dexa_scans_v1',
  'o1fc_log_forgotten_v1',
  'o1fc_day_edits_v1',
  'o1fc_sync_outbox_v1',
]);

interface Entry {
  value: string;
  /** Account that owned the device when written; another account never gets it back. */
  owner: string;
  at: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
/** Set when restore never finished: writes this session must not replace the saved copy. */
let mirrorPaused = false;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function currentOwner(): string {
  try {
    return localStorage.getItem(OWNER_KEY) || '';
  } catch {
    return '';
  }
}

function run(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest | void): Promise<unknown> {
  return openDb().then((db) => new Promise((resolve) => {
    if (!db) return resolve(undefined);
    try {
      const tx = db.transaction(STORE, mode);
      const req = work(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => resolve(undefined);
      tx.onabort = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  }));
}

export function isDurableKey(key: string): boolean {
  return DURABLE_KEYS.has(key);
}

export function durablePut(key: string, value: string): void {
  if (mirrorPaused) return;
  const entry: Entry = { value, owner: currentOwner(), at: Date.now() };
  void run('readwrite', (store) => store.put(entry, key));
}

export function durableDelete(key: string): void {
  if (mirrorPaused) return;
  void run('readwrite', (store) => store.delete(key));
}

export function durableClear(): void {
  void run('readwrite', (store) => store.clear());
}

/**
 * Before the app loads: keys still in localStorage are copied in here; keys localStorage lost are
 * handed back through `restore`. Launch waits for this to finish on slow devices. If the database
 * hangs past the safety cap, the app starts without it and the copy is left untouched for the next launch.
 */
export async function restoreDurable(restore: (key: string, value: string) => void): Promise<void> {
  try {
    void navigator.storage?.persist?.();
  } catch {
    // persistence is best-effort
  }
  let abandoned = false;
  const work = (async () => {
    if (!(await openDb())) return;
    const owner = currentOwner();
    for (const key of DURABLE_KEYS) {
      let local: string | null = null;
      try {
        local = localStorage.getItem(key);
      } catch {
        local = null;
      }
      if (local !== null) {
        durablePut(key, local);
        continue;
      }
      const entry = (await run('readonly', (store) => store.get(key))) as Entry | undefined;
      if (abandoned) return;
      if (entry && typeof entry.value === 'string' && (entry.owner === owner || entry.owner === '')) {
        restore(key, entry.value);
      }
    }
  })().then(() => true);
  const finished = await Promise.race([
    work,
    new Promise<false>((resolve) => setTimeout(() => resolve(false), RESTORE_CAP_MS)),
  ]);
  if (!finished) {
    abandoned = true;
    mirrorPaused = true;
  }
}

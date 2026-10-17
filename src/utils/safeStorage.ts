// Safe Storage utility with memory fallback and typed JSON serialization
// Protects against browser storage restrictions (Brave Shields, Safari Private, iFrame security)
import {
  durableClear,
  durableDelete,
  durablePut,
  isDurableKey,
  restoreDurable,
} from './durableStore';

const memoryStore = new Map<string, string>();

export const safeStorage = {
  getItem<T = any>(key: string, fallback?: T): T {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          try {
            return JSON.parse(item) as T;
          } catch {
            return item as unknown as T;
          }
        }
      }
    } catch {
      // Storage access blocked or denied
    }

    const memItem = memoryStore.get(key);
    if (memItem !== undefined) {
      try {
        return JSON.parse(memItem) as T;
      } catch {
        return memItem as unknown as T;
      }
    }

    return fallback as T;
  },

  setItem(key: string, value: unknown): boolean {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    memoryStore.set(key, serialized);
    const durable = isDurableKey(key);
    if (durable) durablePut(key, serialized);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, serialized);
        return true;
      }
    } catch {
      // Full or blocked. A durable key lives on in memory and IndexedDB; drop the stale localStorage copy.
      if (durable) {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // nothing more to do
        }
      }
    }
    return true;
  },

  removeItem(key: string): boolean {
    memoryStore.delete(key);
    if (isDurableKey(key)) durableDelete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return true;
      }
    } catch {
      // Storage access blocked
    }
    return true;
  },

  clear(): boolean {
    memoryStore.clear();
    durableClear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        return true;
      }
    } catch {
      // Storage access blocked
    }
    return true;
  },
};

/** Runs once before the app loads so stores read data that localStorage lost or could not hold. */
export function restoreDurableStorage(): Promise<void> {
  return restoreDurable((key, value) => {
    memoryStore.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // too large for localStorage; served from memory
    }
  });
}

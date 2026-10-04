// Safe Storage utility with memory fallback and typed JSON serialization
// Protects against browser storage restrictions (Brave Shields, Safari Private, iFrame security)

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

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, serialized);
        return true;
      }
    } catch {
      // Storage access blocked or quota exceeded
    }
    return true;
  },

  removeItem(key: string): boolean {
    memoryStore.delete(key);
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

export default safeStorage;

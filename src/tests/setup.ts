// Minimal test setup - polyfill only what's missing
const storageMap = new Map<string, string>();

const mockStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => storageMap.set(key, String(val)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

if (typeof localStorage === 'undefined' || !localStorage.getItem) {
  (globalThis as any).localStorage = mockStorage;
}

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { href: 'http://localhost:3000', pathname: '/', hash: '' },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    screen: { width: 1920, height: 1080 },
    innerWidth: 1920,
    innerHeight: 1080,
    localStorage: (globalThis as any).localStorage || mockStorage,
  };
} else {
  if (!(window as any).localStorage) {
    (window as any).localStorage = (globalThis as any).localStorage || mockStorage;
  }
  if (!(window as any).dispatchEvent) {
    (window as any).dispatchEvent = () => true;
  }
}

if (typeof CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}

// Minimal test setup - polyfill only what's missing
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { href: 'http://localhost:3000', pathname: '/', hash: '' },
    addEventListener: () => {},
    screen: { width: 1920, height: 1080 },
    innerWidth: 1920,
    innerHeight: 1080,
  };
}

if (typeof document === 'undefined') {
  (globalThis as any).document = {
    referrer: '',
    visibilityState: 'visible',
    addEventListener: () => {},
  };
}

if (typeof localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };
}

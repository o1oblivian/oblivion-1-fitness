import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const STORAGE_KEY = 'o1fc_theme_preference';

const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  return 'dark';
};

const syncThemeToDOM = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors in restricted contexts
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getStoredTheme(),
  setTheme: (theme: ThemeMode) => {
    syncThemeToDOM(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    syncThemeToDOM(nextTheme);
    set({ theme: nextTheme });
  },
  initTheme: () => {
    const initialTheme = getStoredTheme();
    syncThemeToDOM(initialTheme);
    set({ theme: initialTheme });
  },
}));

export default useThemeStore;

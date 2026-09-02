import { Capacitor } from '@capacitor/core';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';

export type DisplayTheme = 'dark' | 'light' | 'system';

export const THEME_STORAGE_KEY = 'theme';
export const PREFERENCE_THEME_KEY = 'o1fc_theme_preference';
export const LEGACY_THEME_KEY = 'o1fc_theme';

/**
 * Get current theme preference synchronously from localStorage with failover
 */
export function getSavedThemePreference(): DisplayTheme {
  try {
    const pref =
      localStorage.getItem(PREFERENCE_THEME_KEY) ||
      localStorage.getItem(LEGACY_THEME_KEY) ||
      localStorage.getItem(THEME_STORAGE_KEY);
    if (pref === 'dark' || pref === 'light' || pref === 'system') {
      return pref as DisplayTheme;
    }
  } catch (e) {
    // ignore
  }
  return 'dark'; // OFC standard default
}

/**
 * Persist and immediately apply theme to DOM and Native Status Bar
 */
export function applyAndSaveTheme(theme: DisplayTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(PREFERENCE_THEME_KEY, theme);
    localStorage.setItem(LEGACY_THEME_KEY, theme);
  } catch (e) {
    // ignore
  }

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', isDark);
    document.body?.classList.toggle('dark', isDark);
    document.documentElement.style.backgroundColor = isDark ? '#000000' : '#FFFFFF';
    if (document.body) {
      document.body.style.backgroundColor = isDark ? '#000000' : '#FFFFFF';
    }

    // Update meta theme-color tag for Android & iOS browser bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#000000' : '#FFFFFF');
    }
  }

  if (Capacitor.isNativePlatform()) {
    try {
      StatusBar.setStyle({ style: isDark ? StatusBarStyle.Dark : StatusBarStyle.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: isDark ? '#000000' : '#FFFFFF' }).catch(() => {});
    } catch {}
  }
}

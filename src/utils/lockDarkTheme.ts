/** Pure OLED dark is the only supported appearance. Clears any legacy stored theme preference. */
export const lockDarkTheme = (): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('dark');
  root.classList.remove('light');
  root.style.colorScheme = 'dark';
  try {
    localStorage.removeItem('o1fc_theme_preference');
  } catch {
    // ignore storage errors in restricted contexts
  }
};

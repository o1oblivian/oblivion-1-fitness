import React, { createContext, useContext, useEffect, useState } from 'react';

type DisplayTheme = 'light' | 'dark' | 'system';
type ColorPalette = 'organic' | 'neon';

interface ThemeContextType {
  theme: DisplayTheme;
  setTheme: (theme: DisplayTheme) => void;
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<DisplayTheme>(() => {
    try {
      return (localStorage.getItem('fitlab_theme') as DisplayTheme) || 'system';
    } catch {
      return 'system';
    }
  });

  const [palette, setPaletteState] = useState<ColorPalette>(() => {
    try {
      return (localStorage.getItem('fitlab_palette') as ColorPalette) || 'organic';
    } catch {
      return 'organic';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    let currentTheme: 'light' | 'dark' = 'dark';

    if (theme === 'system') {
      const systemDark = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
      currentTheme = systemDark ? 'dark' : 'light';
    } else {
      currentTheme = theme;
    }

    setResolvedTheme(currentTheme);
    try {
      localStorage.setItem('fitlab_theme', theme);
    } catch {}

    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    try {
      localStorage.setItem('fitlab_palette', palette);
    } catch {}

    if (palette === 'organic') {
      root.style.setProperty('--color-bg-light', '#FBF9F5');
      root.style.setProperty('--color-card-light', '#F3EFEA');
      root.style.setProperty('--color-bg-dark', '#121110');
      root.style.setProperty('--color-card-dark', '#1A1817');
      root.style.setProperty('--color-accent-primary', '#587B73');
      root.style.setProperty('--color-accent-secondary', '#C28E67');
    } else {
      root.style.setProperty('--color-bg-light', '#F4F4F5');
      root.style.setProperty('--color-card-light', '#FFFFFF');
      root.style.setProperty('--color-bg-dark', '#09090B');
      root.style.setProperty('--color-card-dark', '#121216');
      root.style.setProperty('--color-accent-primary', '#06B6D4');
      root.style.setProperty('--color-accent-secondary', '#84CC16');
    }
  }, [palette]);

  const setTheme = (newTheme: DisplayTheme) => {
    setThemeState(newTheme);
  };

  const setPalette = (newPalette: ColorPalette) => {
    setPaletteState(newPalette);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, palette, setPalette, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#000000',
          deep: '#000000',
          elevated: '#0E0E0E',
          card: '#0E0E0E',
          surface: '#161616',
        },
        crimson: {
          50: '#F2EFE6',
          100: '#F2EFE6',
          200: '#D4D0C4',
          300: '#A39E92',
          400: '#C4121A',
          500: '#C4121A',
          600: '#C4121A',
          700: '#A30F16',
          800: '#800C11',
          900: '#520609',
          dark: '#520609',
        },
        tactical: {
          black: '#000000',
          panel: '#0E0E0E',
          card: '#0E0E0E',
          border: 'rgba(255, 255, 255, 0.07)',
          'border-active': 'rgba(196, 18, 26, 0.4)',
          zinc: '#1C1C1C',
          muted: '#A39E92',
          amber: '#D4A017',
          cyan: '#4F8F9A',
          indigo: '#4F8F9A',
          emerald: '#6B8F5E',
          purple: '#7A756A',
        },
        brand: {
          red: '#C4121A',
          'red-hover': '#A30F16',
          'red-active': '#800C11',
          'red-dark': '#800C11',
          'red-light': '#C4121A',
        },
      },
      fontFamily: {
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        pill: '9999px',
      },
      boxShadow: {
        tactical: '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
        'glow-crimson': '0 0 25px -3px rgba(196, 18, 26, 0.45)',
        'glow-crimson-sm': '0 0 12px 0 rgba(196, 18, 26, 0.35)',
        'card-recessed': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
        'elevated-ring': '0 0 0 1px rgba(255, 255, 255, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};

export default config;

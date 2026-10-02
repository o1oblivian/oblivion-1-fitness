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
          DEFAULT: '#0A0A0C',
          deep: '#000000',
          elevated: '#0E0E11',
          card: '#121217',
          surface: '#18181F',
        },
        crimson: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#C4121A',
          800: '#A30F16',
          900: '#800C11',
          dark: '#520609',
        },
        tactical: {
          black: '#0A0A0C',
          panel: '#0E0E11',
          card: '#121217',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-active': 'rgba(196, 18, 26, 0.4)',
          zinc: '#1C1C22',
          muted: '#8E8E93',
          amber: '#F59E0B',
          cyan: '#0284C7',
          indigo: '#6366F1',
          emerald: '#10B981',
          purple: '#A855F7',
        },
        brand: {
          red: '#C4121A',
          'red-hover': '#A30F16',
          'red-active': '#800C11',
          'red-dark': '#7F1D1D',
          'red-light': '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
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

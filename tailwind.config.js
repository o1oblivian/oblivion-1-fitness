/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        numbers: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Luxury accent system
        accent: {
          DEFAULT: '#2D7FF9',
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#BADEFF',
          300: '#7FC2FF',
          400: '#4AA3FF',
          500: '#2D7FF9',
          600: '#1E66E0',
          700: '#1A4FB0',
          800: '#1A3F8A',
          900: '#163070',
        },
        // Dark mode surfaces — true black foundation with subtle elevation
        ink: {
          950: '#000000',
          900: '#0A0C10',
          850: '#12141A',
          800: '#161A1F',
          750: '#1B2026',
          700: '#222733',
          600: '#2D3340',
          500: '#3A4150',
        },
        // Light mode surfaces
        linen: {
          50: '#FDFCFB',
          100: '#F7F5F0',
          200: '#EAE6DF',
          300: '#D8D2C8',
          400: '#B8B0A2',
        },
        // Functional colors
        success: {
          DEFAULT: '#3FB98E',
          light: '#7FD4B5',
          dark: '#2A8C68',
        },
        warning: {
          DEFAULT: '#E8B04A',
          light: '#F0CC7C',
          dark: '#B88530',
        },
        error: {
          DEFAULT: '#D94F4F',
          light: '#EE7E7E',
          dark: '#A52E2E',
        },
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
        '3xl': '24px',
      },
      letterSpacing: {
        'tight-display': '-0.025em',
        'tight-mid': '-0.015em',
      },
      spacing: {
        '18': '4.5rem',
      },
      fontSize: {
        'xs': ['10.5px', { lineHeight: '1.4' }],
        'sm': ['12px', { lineHeight: '1.45' }],
        'base': ['13px', { lineHeight: '1.5' }],
        'lg': ['14px', { lineHeight: '1.5' }],
        'xl': ['16px', { lineHeight: '1.4' }],
        '2xl': ['18px', { lineHeight: '1.35' }],
        '3xl': ['22px', { lineHeight: '1.3' }],
      },
    },
  },
  plugins: [],
};

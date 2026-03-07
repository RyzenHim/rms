/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Blue-Gray Palette
        slate: {
          950: '#1a2332',
          900: '#27374D',
          800: '#2f3f54',
          700: '#526D82',
          600: '#6d8299',
          500: '#8896b0',
          400: '#9DB2BF',
          300: '#b8c8d6',
          200: '#d3dce4',
          100: '#DDE6ED',
          50: '#e8f0f7',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(39, 55, 77, 0.08)',
        'medium': '0 4px 16px rgba(39, 55, 77, 0.12)',
        'lg': '0 8px 32px rgba(39, 55, 77, 0.15)',
        'xl': '0 12px 48px rgba(39, 55, 77, 0.2)',
        'inset-light': 'inset 0 1px 3px rgba(255, 255, 255, 0.12)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      fontFamily: {
        'sans': ['Manrope', 'Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #27374D 0%, #526D82 100%)',
        'gradient-light': 'linear-gradient(135deg, #DDE6ED 0%, #9DB2BF 100%)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

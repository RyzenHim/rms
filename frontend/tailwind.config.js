/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Feane inspired - Warm food restaurant theme
        brand: {
          50: '#fff7f0',
          100: '#ffe8d6',
          200: '#ffd4ad',
          300: '#ffb880',
          400: '#ff9d52',
          500: '#ff8c3a', // Primary - warm orange
          600: '#e67e2f',
          700: '#cc7029',
          800: '#b35f23',
          900: '#8b491b',
        }
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(15, 23, 42, 0.08)',
        'medium': '0 4px 16px rgba(15, 23, 42, 0.12)',
        'lg': '0 8px 32px rgba(15, 23, 42, 0.15)',
        'xl': '0 12px 48px rgba(15, 23, 42, 0.2)',
        'orange': '0 10px 30px rgba(255, 140, 58, 0.2)',
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
      }
    },
  },
  plugins: [],
};

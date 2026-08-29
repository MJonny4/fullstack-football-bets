import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: '#effdf6',
          100: '#d8fbea',
          200: '#b3f5d5',
          300: '#7de8ba',
          400: '#40d296',
          500: '#1ab778',
          600: '#0e9361',
          700: '#0c754f',
          800: '#0c5d40',
          900: '#0a4d36',
          950: '#042b1f'
        },
        ink: '#10211a',
        cream: '#f4f1e8',
        gold: '#f3bd4d'
      },
      fontFamily: {
        sans: ['Manrope Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk Variable', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 18px 50px -30px rgba(4, 43, 31, 0.42)',
        glow: '0 16px 40px -22px rgba(26, 183, 120, 0.8)'
      },
      backgroundImage: {
        'stadium-grid': 'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)'
      }
    }
  },
  plugins: []
} satisfies Config;

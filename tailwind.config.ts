import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Earthy Editorial palette (base surfaces)
        shadow: '#272727',
        sand: '#D4AA7D',
        'off-white': '#F5F0E8',
        mist: '#9E8E78',
        border: '#E4DCCE',
        // Action brand
        brand: '#0050FF',
        'brand-dark': '#003DD9',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
        body: ['var(--font-body)', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
        tight: '-0.02em',
        wide: '0.04em',
        wider: '0.14em',
        widest: '0.24em',
      },
      borderRadius: {
        DEFAULT: '4px',
        lg: '12px',
      },
      maxWidth: {
        reading: '680px',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;

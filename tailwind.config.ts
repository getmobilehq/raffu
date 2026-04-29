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
        // Earthy Editorial substrate (text, borders, neutral surfaces).
        // These STAY — they're the page substrate, not branding.
        shadow: '#272727',
        sand: '#D4AA7D',
        'off-white': '#F5F0E8',
        mist: '#9E8E78',
        border: '#E4DCCE',
        // Raffu brand colours — sit on top of the substrate.
        // brand-red is the primary CTA colour. brand-blue is the accent.
        // shadow stays as ink/text/borders — don't reach for brand-red there.
        'brand-red': '#E10A0A',
        'brand-blue': '#0050FF',
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

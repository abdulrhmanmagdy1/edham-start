import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'edham-black': '#0D0D0D',
        'edham-red': '#DC2626',
      },
      fontFamily: {
        sans: ['var(--font-ibm-plex-arabic)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

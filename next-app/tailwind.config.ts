import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#010A2A',
        blue: '#428BCA',
        coral: '#F9AC8A',
        paper: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 24px 70px rgba(1, 10, 42, 0.12)',
        lift: '0 34px 90px rgba(1, 10, 42, 0.18)',
      },
      transitionTimingFunction: {
        'slow-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        rubber: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}

export default config

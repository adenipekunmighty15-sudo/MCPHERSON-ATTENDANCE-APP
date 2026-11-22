import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#24352A',
        forest: '#3D684B',
        clay: '#C87958',
        parchment: '#F5F1E7',
        navy: '#24352A',
        blue: '#3D684B',
        coral: '#C87958',
        paper: '#F5F1E7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        soft: '0 24px 70px rgba(36, 53, 42, 0.12)',
        lift: '0 34px 90px rgba(36, 53, 42, 0.18)',
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

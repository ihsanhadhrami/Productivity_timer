/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./Components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        surface: '#0B101E',
        accent: '#39FF14',
        'accent-dim': 'rgba(57, 255, 20, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 40px -5px rgba(57, 255, 20, 0.3)',
        'glow-sm': '0 0 15px -3px rgba(57, 255, 20, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(57, 255, 20, 0.05)',
      }
    },
  },
  plugins: [],
}

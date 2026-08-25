/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        med: {
          dark: '#0a0f1d',
          navy: '#0f172a',
          surface: '#1e293b',
          card: '#131c31',
          border: '#334155',
          accent: '#06b6d4',
          primary: '#3b82f6',
          purple: '#8b5cf6',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
        patient: {
          bg: '#f8fafc',
          card: '#ffffff',
          primary: '#0284c7',
          secondary: '#0d9488',
          accent: '#38bdf8',
          text: '#1e293b',
          subtext: '#64748b',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}

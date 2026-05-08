import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans Thai', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Inter', 'serif'],
      },
      colors: {
        ink: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        delegate: { 500: '#F59E0B', 700: '#B45309' },
        coach: { 500: '#3B82F6', 700: '#1D4ED8' },
        inspire: { 500: '#A855F7', 700: '#7E22CE' },
        tell: { 500: '#EF4444', 700: '#B91C1C' },
      },
      backgroundImage: {
        'holo-foil':
          'conic-gradient(from var(--holo-angle, 0deg) at 50% 50%, #ff5e7e, #ffd166, #06d6a0, #118ab2, #8338ec, #ff5e7e)',
        'card-frame':
          'linear-gradient(140deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 60%), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.18), transparent 60%)',
      },
      boxShadow: {
        card: '0 25px 60px -20px rgba(2,6,23,0.55), 0 6px 18px -10px rgba(2,6,23,0.4)',
        glow: '0 0 32px -2px var(--glow-color, rgba(255,255,255,0.4))',
      },
      animation: {
        'card-shine': 'cardShine 2.5s linear infinite',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        cardShine: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config

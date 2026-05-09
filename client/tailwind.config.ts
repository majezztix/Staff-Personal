import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans Thai', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'IBM Plex Sans Thai', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0D1117',
          950: '#07090F',
        },
        delegate: { 400: '#FCD34D', 500: '#F59E0B', 600: '#D97706', 700: '#B45309' },
        coach:    { 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
        inspire:  { 400: '#C084FC', 500: '#A855F7', 600: '#9333EA', 700: '#7E22CE' },
        tell:     { 400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C' },
      },
      backgroundImage: {
        'holo-foil':
          'conic-gradient(from var(--holo-angle, 0deg) at 50% 50%, #ff5e7e, #ffd166, #06d6a0, #118ab2, #8338ec, #ff5e7e)',
        'card-frame':
          'linear-gradient(155deg, rgba(255,255,255,0.07), rgba(255,255,255,0) 55%), radial-gradient(circle at 28% 0%, rgba(255,255,255,0.15), transparent 55%)',
        'sidebar-glow':
          'radial-gradient(ellipse at 20% 50%, rgba(168,85,247,0.08), transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.06), transparent 50%)',
      },
      boxShadow: {
        card:    '0 32px 72px -24px rgba(0,0,0,0.7), 0 8px 24px -8px rgba(0,0,0,0.5)',
        panel:   '0 1px 3px rgba(0,0,0,0.4), 0 8px 32px -8px rgba(0,0,0,0.3)',
        glow:    '0 0 28px -4px var(--glow-color, rgba(255,255,255,0.3))',
        'glow-sm':'0 0 14px -4px var(--glow-color, rgba(255,255,255,0.3))',
        'inset-top': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'card-shine':   'cardShine 2.5s linear infinite',
        'pulse-soft':   'pulseSoft 3s ease-in-out infinite',
        'fade-up':      'fadeUp 0.4s ease both',
        'shimmer':      'shimmer 1.8s linear infinite',
      },
      keyframes: {
        cardShine: {
          '0%':   { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config

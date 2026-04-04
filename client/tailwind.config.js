/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      '#060912',
          bg2:     '#0d1220',
          bg3:     '#111827',
          border:  'rgba(255,255,255,0.08)',
          border2: 'rgba(255,255,255,0.14)',
        },
        cyan:   { DEFAULT: '#00e5ff', dim: 'rgba(0,229,255,0.12)', mid: 'rgba(0,229,255,0.3)' },
        neon:   { violet: '#a78bfa', amber: '#ffb830', green: '#34d399' },
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm:   ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up':   'slideUp 0.4s ease forwards',
        'fade-in':    'fadeIn 0.3s ease forwards',
        'spin-slow':  'spin 3s linear infinite',
        'marquee':    'marquee 25s linear infinite',
        'blink':      'blink 1.5s ease-in-out infinite',
      },
      keyframes: {
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        pulseGlow:  { '0%,100%': { boxShadow: '0 0 10px #00e5ff' }, '50%': { boxShadow: '0 0 30px #00e5ff, 0 0 60px rgba(0,229,255,0.3)' } },
        slideUp:    { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'none' } },
        fadeIn:     { from: { opacity: 0 }, to: { opacity: 1 } },
        marquee:    { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        blink:      { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
    },
  },
  plugins: [],
};

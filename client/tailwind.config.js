/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      'var(--bg)',
          bg2:     'var(--bg2)',
          card:    'var(--card)',
          border:  'var(--border)',
          border2: 'var(--border2)',
        },
        primary:     { DEFAULT: '#7C3AED', light: '#A78BFA' },
        accent:      { teal: '#06B6D4', pink: '#EC4899', amber: '#F59E0B', green: '#10B981', red: '#EF4444' },
        txt:         { pri: '#F8FAFC', sec: '#94A3B8', muted: '#475569' },
      },
      fontFamily: {
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        inter:   ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        nunito:  ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 24px rgba(124,58,237,0.4)',
        'glow-card':    '0 8px 32px rgba(124,58,237,0.12)',
        'glow-ring':    '0 0 0 3px rgba(124,58,237,0.25)',
      },
      animation: {
        'float':      'float 5s ease-in-out infinite',
        'mascot-float': 'mascotFloat 3s infinite',
        'slide-up':   'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in':    'fadeIn 0.4s ease forwards',
        'spin-slow':  'spin 3s linear infinite',
        'marquee':    'marquee 25s linear infinite',
        'blink':      'blink 1.5s ease-in-out infinite',
        'badge-pop':  'badgePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        float:     { '0%,100%':{transform:'translateY(0)'}, '50%':{transform:'translateY(-10px)'} },
        mascotFloat: { '0%,100%':{transform:'translateY(0) rotate(-3deg)'}, '50%':{transform:'translateY(-8px) rotate(3deg)'} },
        slideUp:   { from:{opacity:0,transform:'translateY(24px)'}, to:{opacity:1,transform:'none'} },
        fadeIn:    { from:{opacity:0}, to:{opacity:1} },
        marquee:   { from:{transform:'translateX(0)'}, to:{transform:'translateX(-50%)'} },
        blink:     { '0%,100%':{opacity:1}, '50%':{opacity:0} },
        badgePop:  { from:{opacity:0,transform:'scale(0)'}, to:{opacity:1,transform:'scale(1)'} },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      'var(--bg)',
          bg2:     'var(--bg2)',
          bg3:     'var(--bg3)',
          border:  'var(--border)',
          border2: 'var(--border2)',
        },
        cyan:        { DEFAULT:'var(--cyan)',   dim:'var(--cyan-bg)',  mid:'var(--cyan-bdr)' },
        neon:        { violet:'var(--violet)',  amber:'var(--amber)',  green:'var(--green)' },
        'txt-pri':   'var(--txt)',
        'txt-sec':   'var(--txt2)',
        'txt-muted': 'var(--txt3)',
      },
      fontFamily: {
        syne:   ['Syne', 'Nunito', 'sans-serif'],
        dm:     ['DM Sans', 'sans-serif'],
        mono:   ['DM Mono', 'monospace'],
        nunito: ['Nunito', 'sans-serif'],
      },
      animation: {
        'float':      'float 5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up':   'slideUp 0.4s ease forwards',
        'fade-in':    'fadeIn 0.3s ease forwards',
        'spin-slow':  'spin 3s linear infinite',
        'marquee':    'marquee 25s linear infinite',
        'blink':      'blink 1.5s ease-in-out infinite',
      },
      keyframes: {
        float:     { '0%,100%':{transform:'translateY(0)'}, '50%':{transform:'translateY(-10px)'} },
        pulseGlow: { '0%,100%':{boxShadow:'0 0 8px var(--cyan)'}, '50%':{boxShadow:'0 0 24px var(--cyan)'} },
        slideUp:   { from:{opacity:0,transform:'translateY(16px)'}, to:{opacity:1,transform:'none'} },
        fadeIn:    { from:{opacity:0}, to:{opacity:1} },
        marquee:   { from:{transform:'translateX(0)'}, to:{transform:'translateX(-50%)'} },
        blink:     { '0%,100%':{opacity:1}, '50%':{opacity:0} },
      },
    },
  },
  plugins: [],
};

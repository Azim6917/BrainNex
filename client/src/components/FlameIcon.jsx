import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Single ember particle ─────────────────────────────────────────────── */
function Ember({ onDone, size = 'md' }) {
  const scale  = size === 'sm' ? 0.6 : size === 'lg' ? 1.4 : 1;
  const side   = Math.random() < 0.5 ? -1 : 1;
  const x0     = (Math.random() * 14 - 7) * scale;
  const xEnd   = x0 + side * (Math.random() * 28 + 12) * scale;
  const yEnd   = -(Math.random() * 55 + 30) * scale;
  const dur    = 0.7 + Math.random() * 0.5;
  const colors = ['#FCD34D', '#F97316', '#FBBF24', '#FB923C', '#FEF08A'];
  const color  = colors[Math.floor(Math.random() * colors.length)];
  const pSize  = (1.5 + Math.random() * 2) * scale;

  return (
    <motion.div
      initial={{ x: x0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x: xEnd, y: yEnd, opacity: 0, scale: 0.1 }}
      transition={{ duration: dur, ease: [0.2, 0.8, 0.4, 1] }}
      onAnimationComplete={onDone}
      style={{
        position: 'absolute',
        bottom: '20%',
        left: '50%',
        width: pSize,
        height: pSize,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 ${pSize * 3}px ${color}`,
        pointerEvents: 'none',
        zIndex: 20,
        willChange: 'transform, opacity',
      }}
    />
  );
}

/* ─── CSS animations ─────────────────────────────────────────────────────── */
const FLICKER_CSS = `
  @keyframes flick1 {
    0%   { transform: skewX(-2deg) scale(0.96, 0.97); }
    100% { transform: skewX( 2deg) scale(1.04, 1.05); }
  }
  @keyframes flick2 {
    0%   { transform: skewX(-3deg) scale(0.93, 0.95); }
    100% { transform: skewX( 2deg) scale(1.07, 1.08); }
  }
  @keyframes flick3 {
    0%   { transform: skewX(-1deg) scale(0.97, 0.98); }
    100% { transform: skewX( 1deg) scale(1.03, 1.04); }
  }
  @keyframes flick-fast1 {
    0%   { transform: skewX(-2deg) scale(0.95, 0.96); }
    100% { transform: skewX( 2deg) scale(1.05, 1.06); }
  }
  @keyframes flick-fast2 {
    0%   { transform: skewX(-3deg) scale(0.92, 0.94); }
    100% { transform: skewX( 2deg) scale(1.08, 1.09); }
  }
  @keyframes flick-fast3 {
    0%   { transform: skewX(-1deg) scale(0.96, 0.97); }
    100% { transform: skewX( 1deg) scale(1.04, 1.05); }
  }
  .fl-layer1      { transform-origin: 50% 95%; animation: flick1      1.9s alternate infinite ease-in-out; }
  .fl-layer2      { transform-origin: 50% 95%; animation: flick2      1.4s alternate infinite ease-in-out; }
  .fl-layer3      { transform-origin: 50% 95%; animation: flick3      2.1s alternate infinite ease-in-out; }
  .fl-layer1-fast { transform-origin: 50% 95%; animation: flick-fast1 1.2s alternate infinite ease-in-out; }
  .fl-layer2-fast { transform-origin: 50% 95%; animation: flick-fast2 0.9s alternate infinite ease-in-out; }
  .fl-layer3-fast { transform-origin: 50% 95%; animation: flick-fast3 1.1s alternate infinite ease-in-out; }
`;

/* ─── FlameIcon ─────────────────────────────────────────────────────────── */
/**
 * Props:
 *   size        – pixel size (default 120)
 *   burst       – triggers ignite burst when flipped to true
 *   showSidebar – compact inline mode (no glow, no embers)
 */
export default function FlameIcon({ size = 120, burst = false, showSidebar = false }) {
  const [hovered,  setHovered]  = useState(false);
  const [embers,   setEmbers]   = useState([]);
  const [burstKey, setBurstKey] = useState(0);
  const prevBurst = useRef(false);
  const eidRef    = useRef(0);

  /* ── Spawn embers */
  const spawn = useCallback((count = 1, sz = 'md') => {
    if (showSidebar) return;
    setEmbers(prev => [
      ...prev,
      ...Array.from({ length: count }, () => ({ id: eidRef.current++, sz })),
    ]);
  }, [showSidebar]);

  /* ── Continuous drip loop */
  useEffect(() => {
    if (showSidebar) return;
    const t = setInterval(() => {
      if (Math.random() < 0.38) spawn(1, hovered ? 'lg' : 'sm');
    }, hovered ? 380 : 850);
    return () => clearInterval(t);
  }, [hovered, showSidebar, spawn]);

  /* ── Burst on streak increase */
  useEffect(() => {
    if (burst && !prevBurst.current) {
      setBurstKey(k => k + 1);
      spawn(9, 'lg');
    }
    prevBurst.current = burst;
  }, [burst, spawn]);

  const killEmber = useCallback((id) => {
    setEmbers(prev => prev.filter(e => e.id !== id));
  }, []);

  const l1 = hovered ? 'fl-layer1-fast' : 'fl-layer1';
  const l2 = hovered ? 'fl-layer2-fast' : 'fl-layer2';
  const l3 = hovered ? 'fl-layer3-fast' : 'fl-layer3';

  /* Unique IDs per instance to avoid gradient collision */
  const uid = showSidebar ? 'sb' : 'mn';

  return (
    <div
      style={{ position: 'relative', width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <style>{FLICKER_CSS}</style>

      {/* Ambient glow bloom */}
      {!showSidebar && (
        <motion.div
          animate={{ opacity: [0.18, 0.48, 0.18], scale: [0.86, 1.14, 0.86] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: '-30%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.28) 0%, transparent 70%)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Flame SVG */}
      <motion.div
        key={burstKey}
        initial={burstKey > 0 ? { scale: 1.35, filter: 'brightness(2.2)' } : false}
        animate={{ scale: hovered && !showSidebar ? 1.1 : 1, filter: 'brightness(1)' }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        style={{ width: '100%', height: '100%', position: 'relative', zIndex: 10 }}
      >
        {/*
          ┌─────────────────────────────────────────────────────┐
          │  100×100 viewBox — matching reference image exactly  │
          │  • Tall narrow flame, pointed tip                    │
          │  • 3-layer gradient (outer=deep red-orange,          │
          │    mid=bright orange, inner=golden yellow)           │
          │  • White-yellow teardrop highlight near base         │
          │  • Two curved gloss streaks on left side             │
          │  • Sparkle dot clusters upper-left & upper-right     │
          │  • Side wisp shapes (pale yellow)                    │
          └─────────────────────────────────────────────────────┘
        */}
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          style={{ overflow: 'visible', display: 'block' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer flame: deep orange-red → bright orange */}
            <linearGradient id={`fl-out-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%"   stopColor="#E8450A" />
              <stop offset="50%"  stopColor="#F97316" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>

            {/* Mid flame: bright orange → amber */}
            <linearGradient id={`fl-mid-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%"   stopColor="#F97316" />
              <stop offset="100%" stopColor="#FED7AA" />
            </linearGradient>

            {/* Inner core: golden → pale yellow */}
            <linearGradient id={`fl-inn-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%"   stopColor="#FACC15" />
              <stop offset="100%" stopColor="#FEF9C3" />
            </linearGradient>

            {/* Teardrop base highlight */}
            <radialGradient id={`fl-drop-${uid}`} cx="45%" cy="25%" r="65%">
              <stop offset="0%"   stopColor="#FFFDE7" stopOpacity="1"   />
              <stop offset="55%"  stopColor="#FACC15" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0"   />
            </radialGradient>

            {/* Soft glow filter for layers */}
            <filter id={`fl-glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── DECORATIVE SIDE WISPS (pale yellow, like reference) ── */}
          {/* Left wisp — large curved shape */}
          <path
            d="M 30 82 C 5 68, -2 42, 16 16 C 10 34, 18 58, 34 70 Z"
            fill="#FDE68A"
            opacity="0.80"
          />
          {/* Right wisp */}
          <path
            d="M 70 82 C 95 68, 102 42, 84 16 C 90 34, 82 58, 66 70 Z"
            fill="#FDE68A"
            opacity="0.80"
          />

          {/* ── FLAME LAYERS ── */}
          <g filter={showSidebar ? 'none' : `url(#fl-glow-${uid})`}>

            {/* LAYER 1 — Outer body: wide, deep orange-red */}
            <path
              className={l1}
              d="
                M 50 4
                C 54 12, 62 24, 66 34
                C 71 22, 75 12, 72 6
                C 84 18, 84 36, 78 50
                C 85 58, 87 70, 82 80
                C 76 90, 64 97, 50 97
                C 36 97, 24 90, 18 80
                C 13 70, 15 58, 22 50
                C 16 36, 16 18, 28 6
                C 25 12, 29 22, 34 34
                C 38 24, 46 12, 50 4 Z
              "
              fill={`url(#fl-out-${uid})`}
            />

            {/* LAYER 2 — Mid flame: narrower, bright orange */}
            <path
              className={l2}
              d="
                M 50 16
                C 53 24, 59 34, 61 44
                C 66 32, 68 20, 65 14
                C 76 26, 74 44, 68 56
                C 74 64, 74 76, 70 84
                C 66 92, 58 97, 50 97
                C 42 97, 34 92, 30 84
                C 26 76, 26 64, 32 56
                C 26 44, 24 26, 35 14
                C 32 20, 34 32, 39 44
                C 41 34, 47 24, 50 16 Z
              "
              fill={`url(#fl-mid-${uid})`}
            />

            {/* LAYER 3 — Inner core: tall teardrop, golden yellow */}
            <path
              className={l3}
              d="
                M 50 30
                C 52 38, 57 48, 58 58
                C 63 46, 63 34, 60 26
                C 68 38, 66 56, 62 66
                C 66 74, 64 84, 60 90
                C 56 95, 53 97, 50 97
                C 47 97, 44 95, 40 90
                C 36 84, 34 74, 38 66
                C 34 56, 32 38, 40 26
                C 37 34, 37 46, 42 58
                C 43 48, 48 38, 50 30 Z
              "
              fill={`url(#fl-inn-${uid})`}
            />
          </g>

          {/* ── TEARDROP BASE HIGHLIGHT ── */}
          <ellipse
            cx="44"
            cy="78"
            rx="10"
            ry="13"
            fill={`url(#fl-drop-${uid})`}
            opacity="0.88"
          />

          {/* ── GLOSS STREAKS — two curved white strokes on left side ── */}
          {/* Upper long streak */}
          <path
            d="M 37 26 C 30 38, 28 52, 31 66"
            stroke="rgba(255,255,255,0.70)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Lower short streak */}
          <path
            d="M 39 56 C 34 64, 33 72, 36 80"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* ── SPARKLE DOTS — upper-left cluster ── */}
          <circle cx="17" cy="28" r="2.4" fill="#FACC15" opacity="0.95" />
          <circle cx="10" cy="40" r="1.6" fill="#FDE68A" opacity="0.90" />
          <circle cx="21" cy="50" r="1.3" fill="#FACC15" opacity="0.80" />
          <circle cx="7"  cy="55" r="1.9" fill="#FEF08A" opacity="0.85" />

          {/* ── SPARKLE DOTS — upper-right cluster ── */}
          <circle cx="83" cy="28" r="2.4" fill="#FACC15" opacity="0.95" />
          <circle cx="90" cy="40" r="1.6" fill="#FDE68A" opacity="0.90" />
          <circle cx="79" cy="50" r="1.3" fill="#FACC15" opacity="0.80" />
          <circle cx="93" cy="55" r="1.9" fill="#FEF08A" opacity="0.85" />
        </svg>
      </motion.div>

      {/* Ember particles */}
      {!showSidebar && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 15 }}>
          <AnimatePresence>
            {embers.map(e => (
              <Ember key={e.id} size={e.sz} onDone={() => killEmber(e.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

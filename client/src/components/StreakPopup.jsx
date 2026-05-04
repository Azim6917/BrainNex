import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, X } from 'lucide-react';

export default function StreakPopup({ streak, activeDays = new Set(), onClose }) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toDateString();

  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    weekDays.push({
      label:    d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      key:      d.toDateString(),
      isToday:  d.toDateString() === todayStr,
      isFuture: d.getTime() > today.getTime(),
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        key="streak-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          key="streak-card"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          onClick={e => e.stopPropagation()}
          className="relative max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center text-center px-8 py-10"
          style={{
            background: 'linear-gradient(160deg, #1a1226 0%, #0f0f1a 60%, #1a1226 100%)',
            border: '1px solid rgba(249,115,22,0.25)',
            boxShadow: '0 0 60px rgba(249,115,22,0.15), 0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Dismiss */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>

          {/* SVG Animated Flame */}
          <div className="relative mb-2" style={{ width: 100, height: 130 }}>
            {/* Glow beneath */}
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              style={{
                width: 80, height: 30, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(249,115,22,0.6) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
              animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.9, 1.2, 0.9] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <svg width="100" height="130" viewBox="240 80 200 270" xmlns="http://www.w3.org/2000/svg">
              <style>{`
                .fp1{animation:ff1 1.8s ease-in-out infinite alternate;transform-origin:340px 320px}
                .fp2{animation:ff2 1.4s ease-in-out infinite alternate;transform-origin:340px 300px}
                .fp3{animation:ff3 1.1s ease-in-out infinite alternate;transform-origin:340px 280px}
                .fp4{animation:ff4 0.9s ease-in-out infinite alternate;transform-origin:340px 260px}
                @keyframes ff1{
                  0%  {transform:scaleX(1)    scaleY(1)    skewX(0deg)}
                  30% {transform:scaleX(1.06) scaleY(1.03) skewX(2deg)}
                  60% {transform:scaleX(0.95) scaleY(1.05) skewX(-3deg)}
                  100%{transform:scaleX(1.04) scaleY(0.97) skewX(1deg)}
                }
                @keyframes ff2{
                  0%  {transform:scaleX(1)    scaleY(1)    skewX(0deg)}
                  25% {transform:scaleX(0.94) scaleY(1.06) skewX(-4deg)}
                  70% {transform:scaleX(1.08) scaleY(0.96) skewX(3deg)}
                  100%{transform:scaleX(0.97) scaleY(1.04) skewX(-2deg)}
                }
                @keyframes ff3{
                  0%  {transform:scaleX(1)    scaleY(1)    skewX(0deg)}
                  40% {transform:scaleX(1.1)  scaleY(0.94) skewX(5deg)}
                  80% {transform:scaleX(0.92) scaleY(1.08) skewX(-4deg)}
                  100%{transform:scaleX(1.05) scaleY(1.02) skewX(2deg)}
                }
                @keyframes ff4{
                  0%  {transform:scaleY(1)    scaleX(1)}
                  50% {transform:scaleY(1.12) scaleX(0.9)}
                  100%{transform:scaleY(0.92) scaleX(1.1)}
                }
              `}</style>

              {/* Outer flame — deep red */}
              <g className="fp1">
                <path d="M340 95C290 130,230 160,220 220C210 270,230 310,260 330C280 342,310 348,340 348C370 348,400 342,420 330C450 310,470 270,460 220C450 160,390 130,340 95Z" fill="#CC1100"/>
              </g>

              {/* Mid flame — orange-red */}
              <g className="fp2">
                <path d="M340 120C300 155,248 185,242 238C236 278,252 312,278 330C297 341,320 346,340 346C360 346,383 341,402 330C428 312,444 278,438 238C432 185,380 155,340 120Z" fill="#E83000"/>
              </g>

              {/* Inner flame — orange */}
              <g className="fp3">
                <path d="M340 150C312 182,270 210,265 252C260 284,275 314,298 330C314 340,328 344,340 344C352 344,366 340,382 330C405 314,420 284,415 252C410 210,368 182,340 150Z" fill="#F55000"/>
              </g>

              {/* Core — amber */}
              <g className="fp4">
                <path d="M340 190C322 215,296 238,293 266C290 290,304 316,322 330C330 336,336 339,340 339C344 339,350 336,358 330C376 316,390 290,387 266C384 238,358 215,340 190Z" fill="#FF8C00"/>
              </g>

              {/* Tip — yellow */}
              <g className="fp4">
                <path d="M340 210C330 228,315 248,314 268C313 283,322 305,332 322C335 328,338 332,340 333C342 332,345 328,348 322C358 305,367 283,366 268C365 248,350 228,340 210Z" fill="#FFCC00"/>
              </g>

              {/* Bright center */}
              <g className="fp4">
                <ellipse cx="340" cy="285" rx="14" ry="22" fill="#FFE566" opacity="0.9"/>
              </g>
            </svg>
          </div>

          {/* Streak count */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 14 }}
            className="font-jakarta font-black leading-none mb-1"
            style={{
              fontSize: '5rem',
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {streak}
          </motion.div>
          <p className="text-2xl font-black text-white mb-6 tracking-tight">day streak!</p>

          {/* Mon–Sun week row */}
          <div className="flex items-center gap-2 mb-6">
            {weekDays.map(({ label, key, isToday, isFuture }, i) => {
              const active = activeDays.has(key);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isToday ? 'text-amber-400' : 'text-white/40'}`}>
                    {label}
                  </span>
                  {active ? (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-md" style={{ background: 'rgba(249,115,22,0.5)' }} />
                      <CheckCircle size={24} className="relative z-10" fill="#F97316" style={{ color: '#F59E0B' }} />
                    </div>
                  ) : isToday ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #F97316', opacity: 0.7 }}
                    />
                  ) : isFuture ? (
                    <Circle size={24} className="text-white/10" />
                  ) : (
                    <Circle size={24} className="text-white/20" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Message */}
          <p className="text-sm font-medium text-white/60 mb-8 leading-relaxed max-w-[240px]">
            {streak >= 30
              ? "Absolutely legendary. You're unstoppable! 🏆"
              : streak >= 7
              ? "You're on fire! Don't break the chain! 🔥"
              : "Great start! Keep showing up every day."}
          </p>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-black text-white text-base tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
              boxShadow: '0 0 30px rgba(249,115,22,0.45)',
            }}
          >
            Keep it going! 🔥
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
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
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      key: d.toDateString(),
      isToday: d.toDateString() === todayStr,
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
          <div className="relative mb-2" style={{ width: 140, height: 140 }}>
            {/* pulsing glow underneath */}
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              style={{
                width: 90, height: 28, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(232,93,78,0.55) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
              animate={{ opacity: [0.4, 0.9, 0.4], scaleX: [0.85, 1.2, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <svg viewBox="0 0 24 24" width="140" height="140">
              <style>{`
                .fo {
                  transform-origin: center bottom;
                  animation: ff1 1.8s alternate infinite ease-in-out;
                }
                .fi {
                  transform-origin: center bottom;
                  animation: ff2 1.3s alternate infinite ease-in-out;
                }
                @keyframes ff1 {
                  0%   { transform: skewX(-2deg) scaleX(0.96) scaleY(0.97); }
                  100% { transform: skewX(2deg)  scaleX(1.04) scaleY(1.05); }
                }
                @keyframes ff2 {
                  0%   { transform: skewX(-3deg)  scaleX(0.93) scaleY(0.95); }
                  100% { transform: skewX(2.5deg) scaleX(1.07) scaleY(1.08); }
                }
              `}</style>
              <g style={{ filter: 'drop-shadow(0px 6px 18px rgba(232,93,78,0.65))' }}>
                {/* Outer Red/Coral Flame */}
                <path className="fo" d="M12,22 C6,22 4,16 5,12 C4.5,10 3,8 3,8 C5.5,9 7.5,7 9,2 C9.5,5.5 11,7.5 12,8 C13,5.5 15,4 17,4 C15.5,7 16,9 18,11 C20,16 18,22 12,22 Z" fill="#E85D4E"/>
                {/* Inner Yellow/Gold Flame */}
                <path className="fi" d="M12,20 C9,20 8,17 8,14 C8,12 9,10 10,8 C10.5,11 11.5,12.5 12.5,12.5 C13.5,12.5 14,11 14.5,10 C14.5,12 15,13 16,14 C17,17 15,20 12,20 Z" fill="#F9C646"/>
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
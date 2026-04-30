import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle, Circle, X } from 'lucide-react';

/**
 * StreakPopup — Chess.com-style streak celebration modal.
 *
 * Props:
 *  streak       {number}  – current streak count
 *  activeDays   {Set}     – Set of Date.toDateString() strings for days user studied (last 7 days)
 *  onClose      {fn}      – called when user dismisses
 */
export default function StreakPopup({ streak, activeDays = new Set(), onClose }) {
  /* Build the last 5 weekdays (Mon → today, or today-4 → today) */
  const days = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2),
      key:   d.toDateString(),
    });
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="streak-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        {/* Card — stop click propagation so clicking inside doesn't close */}
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
          {/* Dismiss button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Glow ring behind flame */}
          <div className="relative mb-4">
            <motion.div
              className="absolute inset-0 rounded-full blur-2xl"
              style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.45) 0%, transparent 70%)' }}
              animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Animated Flame icon */}
            <motion.div
              className="relative z-10 flex items-center justify-center"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ filter: 'drop-shadow(0 0 18px rgba(249,115,22,0.75))' }}
            >
              <Flame
                size={72}
                fill="#F97316"
                style={{ color: '#F59E0B' }}
              />
            </motion.div>
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
              textShadow: 'none',
            }}
          >
            {streak}
          </motion.div>
          <p className="text-2xl font-black text-white mb-6 tracking-tight">day streak!</p>

          {/* Last 5 days indicator row */}
          <div className="flex items-center gap-3 mb-6">
            {days.map(({ label, key }, i) => {
              const active = activeDays.has(key);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</span>
                  {active ? (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-md" style={{ background: 'rgba(249,115,22,0.5)' }} />
                      <CheckCircle
                        size={28}
                        className="relative z-10"
                        fill="#F97316"
                        style={{ color: '#F59E0B' }}
                      />
                    </div>
                  ) : (
                    <Circle size={28} className="text-white/15" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Motivational message */}
          <p className="text-sm font-medium text-white/60 mb-8 leading-relaxed max-w-[240px]">
            You're on a roll! Keep your streak going today.
          </p>

          {/* CTA button */}
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

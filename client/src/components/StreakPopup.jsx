import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, X } from 'lucide-react';
import FlameIcon from './FlameIcon';

export default function StreakPopup({ streak, activeDays = new Set(), onClose }) {
  const [burst,    setBurst]    = useState(false);
  const [displayed, setDisplayed] = useState(streak);
  const prevStreak = useRef(streak);

  /* trigger burst when streak increases */
  useEffect(() => {
    if (streak > prevStreak.current) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 800);
      prevStreak.current = streak;
      return () => clearTimeout(t);
    }
    prevStreak.current = streak;
  }, [streak]);

  /* mount: animate number from 0 → streak */
  useEffect(() => {
    setDisplayed(0);
    let frame;
    const start = performance.now();
    const dur   = 650;
    const tick  = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(ease * streak));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          onClick={e => e.stopPropagation()}
          className="relative max-w-sm w-full rounded-3xl overflow-visible shadow-2xl flex flex-col items-center text-center px-8 py-10"
          style={{
            background: 'linear-gradient(160deg, #1a1226 0%, #0f0f1a 60%, #1a1226 100%)',
            border: '1px solid rgba(249,115,22,0.25)',
            boxShadow: '0 0 80px rgba(249,115,22,0.18), 0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Flame */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, type: 'spring', damping: 14, stiffness: 200 }}
            className="mb-1"
            style={{ overflow: 'visible' }}
          >
            <FlameIcon size={140} burst={burst} />
          </motion.div>

          {/* Streak number */}
          <motion.div
            className="font-jakarta font-black leading-none mb-1"
            style={{
              fontSize: '5rem',
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EF4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 12px rgba(249,115,22,0.5))',
            }}
          >
            {displayed}
          </motion.div>
          <p className="text-2xl font-black text-white mb-6 tracking-tight">day streak!</p>

          {/* Week calendar */}
          <div className="flex items-center gap-2 mb-6">
            {weekDays.map(({ label, key, isToday, isFuture }, i) => {
              const active = activeDays.has(key);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isToday ? 'text-amber-400' : 'text-white/40'}`}>
                    {label}
                  </span>
                  {active ? (
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{ opacity: [0.4, 0.9, 0.4] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        style={{ background: 'rgba(249,115,22,0.55)', filter: 'blur(6px)' }}
                      />
                      <CheckCircle size={24} className="relative z-10" fill="#F97316" style={{ color: '#F59E0B' }} />
                    </div>
                  ) : isToday ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], borderColor: ['#F97316', '#FCD34D', '#F97316'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #F97316', opacity: 0.8 }}
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-sm font-medium text-white/60 mb-8 leading-relaxed max-w-[240px]"
          >
            {streak >= 30
              ? "Absolutely legendary. You're unstoppable! 🏆"
              : streak >= 7
              ? "You're on fire! Don't break the chain! 🔥"
              : "Great start! Keep showing up every day."}
          </motion.p>

          {/* CTA button */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(249,115,22,0.65)' }}
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
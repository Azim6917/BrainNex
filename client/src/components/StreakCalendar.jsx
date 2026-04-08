import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getQuizHistoryFromFirestore } from '../utils/firestoreUtils';
import { useAuth } from '../context/AuthContext';

/**
 * Shows last 35 days as a colored grid like GitHub contributions.
 * Green = studied, empty = missed.
 */
export default function StreakCalendar() {
  const { user } = useAuth();
  const [dayMap, setDayMap] = useState({});

  useEffect(() => {
    if (!user?.uid) return;
    getQuizHistoryFromFirestore(user.uid, 100).then(history => {
      const map = {};
      history.forEach(q => {
        if (!q.timestamp) return;
        const key = new Date(q.timestamp).toDateString();
        map[key] = (map[key] || 0) + 1;
      });
      setDayMap(map);
    });
  }, [user]);

  // Build last 35 days
  const days = Array.from({ length: 35 }, (_, i) => {
    const d    = new Date();
    d.setDate(d.getDate() - (34 - i));
    const key  = d.toDateString();
    const count= dayMap[key] || 0;
    const isToday = key === new Date().toDateString();
    return { date: d, key, count, isToday };
  });

  // Split into rows of 7
  const rows = [];
  for (let i = 0; i < 5; i++) rows.push(days.slice(i * 7, i * 7 + 7));

  const intensityClass = (count) => {
    if (count === 0) return 'bg-white/[0.06]';
    if (count === 1) return 'bg-cyan/30';
    if (count === 2) return 'bg-cyan/55';
    if (count === 3) return 'bg-cyan/75';
    return 'bg-cyan';
  };

  const totalDays   = Object.keys(dayMap).length;
  const totalQuizzes= Object.values(dayMap).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-syne font-bold text-sm text-white/70">Activity — last 35 days</h3>
        <div className="text-xs text-white/30">{totalDays} active days · {totalQuizzes} quizzes</div>
      </div>

      <div className="space-y-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.map(({ key, count, isToday, date }) => (
              <motion.div key={key}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: (ri * 7 + row.indexOf(row.find(d => d.key === key))) * 0.01 }}
                title={`${date.toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' })}: ${count} quiz${count !== 1 ? 'zes' : ''}`}
                className={`flex-1 aspect-square rounded-sm transition-all cursor-default ${intensityClass(count)} ${isToday ? 'ring-1 ring-cyan ring-offset-1 ring-offset-brand-bg2' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[10px] text-white/25">Less</span>
        {[0, 1, 2, 3, 4].map(n => (
          <div key={n} className={`w-3 h-3 rounded-sm ${intensityClass(n)}`} />
        ))}
        <span className="text-[10px] text-white/25">More</span>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';

export default function StreakCalendar({ compact = false }) {
  const { user } = useAuth();
  const [dayMap, setDayMap] = useState({});

  useEffect(() => {
    if (!user?.uid) return;
    getDocs(collection(db, 'quizResults', user.uid, 'results')).then(snap => {
      const map = {};
      snap.docs.forEach(d => {
        const ts = d.data().timestamp;
        if (!ts) return;
        const key = (ts.toDate ? ts.toDate() : new Date(ts)).toDateString();
        map[key] = (map[key] || 0) + 1;
      });
      setDayMap(map);
    }).catch(() => {});
  }, [user]);

  // 35 days, split into 5 weeks of 7
  const days = Array.from({ length: 35 }, (_, i) => {
    const d   = new Date();
    d.setDate(d.getDate() - (34 - i));
    const key = d.toDateString();
    return { d, key, count: dayMap[key] || 0, isToday: key === new Date().toDateString() };
  });

  const weeks = [];
  for (let i = 0; i < 5; i++) weeks.push(days.slice(i * 7, i * 7 + 7));

  const color = (n) => {
    if (n === 0) return 'rgba(255,255,255,0.06)';
    if (n === 1) return 'rgba(0,229,255,0.25)';
    if (n === 2) return 'rgba(0,229,255,0.50)';
    if (n === 3) return 'rgba(0,229,255,0.75)';
    return '#00e5ff';
  };

  const totalActive = Object.keys(dayMap).length;
  const totalQuizzes = Object.values(dayMap).reduce((a,b) => a+b, 0);

  const DAYS_LABEL = ['M','T','W','T','F','S','S'];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white/50">Activity — last 35 days</span>
        <span className="text-[10px] text-white/25">{totalActive} active days · {totalQuizzes} quizzes</span>
      </div>

      <div className="flex gap-1 items-start">
        {/* Day labels on left */}
        <div className="flex flex-col gap-1 mr-1 mt-0.5">
          {DAYS_LABEL.map((l, i) => (
            <div key={i} className="text-[9px] text-white/20 h-3 flex items-center">{i % 2 === 0 ? l : ''}</div>
          ))}
        </div>

        {/* Grid — weeks as columns */}
        <div className="flex gap-1 flex-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 flex-1">
              {week.map(({ d, key, count, isToday }) => (
                <motion.div
                  key={key}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: wi * 0.02, duration: 0.15 }}
                  title={`${d.toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' })}: ${count} quiz${count !== 1 ? 'zes' : ''}`}
                  className={`rounded-[2px] cursor-default transition-all ${isToday ? 'ring-1 ring-cyan ring-offset-[1px] ring-offset-brand-bg2' : ''}`}
                  style={{
                    background: color(count),
                    width: '100%',
                    aspectRatio: '1 / 1',
                    minWidth: 10,
                    maxWidth: 16,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[9px] text-white/20">Less</span>
        {[0,1,2,3,4].map(n => (
          <div key={n} className="w-2.5 h-2.5 rounded-[2px]" style={{ background: color(n) }} />
        ))}
        <span className="text-[9px] text-white/20">More</span>
      </div>
    </div>
  );
}

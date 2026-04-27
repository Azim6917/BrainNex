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

  // 13 weeks of 7 days = 91 days
  const numDays = 91;
  const days = Array.from({ length: numDays }, (_, i) => {
    const d   = new Date();
    d.setDate(d.getDate() - (numDays - 1 - i));
    const key = d.toDateString();
    return { d, key, count: dayMap[key] || 0, isToday: key === new Date().toDateString() };
  });

  const weeks = [];
  for (let i = 0; i < 13; i++) weeks.push(days.slice(i * 7, i * 7 + 7));

  const color = (n) => {
    if (n === 0) return 'var(--border2)'; // bg-space-800 or border2
    if (n === 1) return 'rgba(124, 58, 237, 0.25)'; // primary with opacity
    if (n === 2) return 'rgba(124, 58, 237, 0.50)';
    if (n === 3) return 'rgba(124, 58, 237, 0.75)';
    return 'var(--primary)'; // full primary
  };

  const totalActive = Object.keys(dayMap).length;
  const totalQuizzes = Object.values(dayMap).reduce((a,b) => a+b, 0);

  const DAYS_LABEL = ['M','T','W','T','F','S','S'];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-jakarta font-bold text-sm text-txt">Activity Calendar</h2>
        <span className="text-[11px] font-medium text-txt3 bg-white/5 px-2 py-1 rounded-md">{totalQuizzes} quizzes in 90 days</span>
      </div>

      <div className="flex gap-2 items-start w-full overflow-x-auto pb-1 custom-scrollbar">
        {/* Day labels on left */}
        <div className="flex flex-col gap-[3px] mr-1 mt-0.5 flex-shrink-0">
          {DAYS_LABEL.map((l, i) => (
            <div key={i} className="text-[10px] font-bold text-txt3 h-3.5 flex items-center">{i % 2 === 0 ? l : ''}</div>
          ))}
        </div>

        {/* Grid — weeks as columns */}
        <div className="flex gap-[3px] flex-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px] flex-1 min-w-[12px]">
              {week.map(({ d, key, count, isToday }) => (
                <motion.div
                  key={key}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: wi * 0.02, duration: 0.15 }}
                  title={`${d.toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' })}: ${count} quiz${count !== 1 ? 'zes' : ''}`}
                  className={`rounded-[3px] cursor-default transition-all hover:scale-125 hover:z-10 relative ${isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-space-dark' : ''}`}
                  style={{
                    background: color(count),
                    width: '100%',
                    aspectRatio: '1 / 1',
                    minHeight: '12px'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] font-medium text-txt3">Less</span>
        {[0,1,2,3,4].map(n => (
          <div key={n} className="w-3 h-3 rounded-[3px]" style={{ background: color(n) }} />
        ))}
        <span className="text-[10px] font-medium text-txt3">More</span>
      </div>
    </div>
  );
}

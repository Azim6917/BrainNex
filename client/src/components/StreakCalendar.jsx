import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';

export default function StreakCalendar() {
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

  // Build last 90 days
  const numDays = 90;
  const today = new Date();
  const allDays = Array.from({ length: numDays }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (numDays - 1 - i));
    const key = d.toDateString();
    return { d, key, count: dayMap[key] || 0, isToday: key === today.toDateString() };
  });

  // Pad so first column starts on Monday
  const firstDayOfWeek = allDays[0].d.getDay(); // 0=Sun..6=Sat
  const mondayOffset = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);
  const padded = [...Array(mondayOffset).fill(null), ...allDays];
  while (padded.length % 7 !== 0) padded.push(null);
  const numWeeks = padded.length / 7;

  // Build columns (week = column of 7 days Mon-Sun)
  const columns = [];
  for (let w = 0; w < numWeeks; w++) {
    columns.push(padded.slice(w * 7, w * 7 + 7));
  }

  const cellColor = (n) => {
    if (!n || n === 0) return 'rgba(255,255,255,0.06)';
    if (n === 1) return 'rgba(139,92,246,0.3)';
    if (n === 2) return 'rgba(139,92,246,0.55)';
    if (n === 3) return 'rgba(139,92,246,0.75)';
    return 'rgb(139,92,246)';
  };

  // Month labels: find first column index where month changes
  const monthLabels = [];
  let lastMonth = -1;
  columns.forEach((col, wi) => {
    const firstReal = col.find(c => c !== null);
    if (firstReal) {
      const m = firstReal.d.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ wi, label: firstReal.d.toLocaleString('default', { month: 'short' }) });
        lastMonth = m;
      }
    }
  });

  const DAY_LABELS = ['M', '', 'W', '', 'F', '', ''];
  const totalQuizzes = Object.values(dayMap).reduce((a, b) => a + b, 0);
  const totalActive = Object.keys(dayMap).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-jakarta font-bold text-sm text-txt">Activity Calendar</h2>
        <span className="text-[11px] font-medium text-txt3 bg-white/5 px-2 py-1 rounded-md">
          {totalQuizzes} quizzes · {totalActive} active days
        </span>
      </div>

      <div className="flex gap-1 items-start overflow-hidden">
        {/* Day labels col */}
        <div className="flex flex-col gap-[3px] mr-1 flex-shrink-0" style={{ marginTop: '20px' }}>
          {DAY_LABELS.map((l, i) => (
            <div key={i} style={{ width: 12, height: 12, fontSize: 9, lineHeight: '12px', color: 'var(--txt3)', fontWeight: 700, textAlign: 'right' }}>
              {l}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 w-full">
          {/* Month labels */}
          <div className="flex justify-between mb-1 w-full" style={{ height: 16 }}>
            {columns.map((_, wi) => {
              const ml = monthLabels.find(m => m.wi === wi);
              return (
                <div key={wi} style={{ width: 12, flexShrink: 0, fontSize: 9, color: 'var(--txt3)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'visible' }}>
                  {ml ? ml.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid columns */}
          <div className="flex justify-between w-full">
            {columns.map((col, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]" style={{ flexShrink: 0 }}>
                {col.map((day, di) => (
                  <div
                    key={di}
                    title={day ? `${day.d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}: ${day.count} quiz${day.count !== 1 ? 'zes' : ''}` : ''}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: day ? cellColor(day.count) : 'transparent',
                      outline: day?.isToday ? '1.5px solid rgba(139,92,246,0.9)' : 'none',
                      outlineOffset: 1,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span style={{ fontSize: 9, color: 'var(--txt3)', fontWeight: 600 }}>Less</span>
        {[0, 1, 2, 3, 4].map(n => (
          <div key={n} style={{ width: 12, height: 12, borderRadius: 2, background: cellColor(n === 0 ? 0 : n) }} />
        ))}
        <span style={{ fontSize: 9, color: 'var(--txt3)', fontWeight: 600 }}>More</span>
      </div>
    </div>
  );
}

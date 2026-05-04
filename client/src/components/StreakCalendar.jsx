import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';

export default function StreakCalendar() {
  const { user } = useAuth();
  const [dayMap, setDayMap] = useState({});
  const containerRef = useRef(null);
  const [numWeeks, setNumWeeks] = useState(30);

  const CELL = 13;
  const GAP  = 3;

  // Calculate how many weeks fit in container width
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const W = containerRef.current.offsetWidth - 32; // subtract day-label col + gaps
      const weeks = Math.floor(W / (CELL + GAP));
      setNumWeeks(Math.max(15, weeks));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from Monday of (numWeeks) weeks ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - numWeeks * 7 + 1);
  const startDay = startDate.getDay();
  const rewind = startDay === 0 ? 6 : startDay - 1;
  startDate.setDate(startDate.getDate() - rewind);

  // Build cells
  const cells = [];
  const cur = new Date(startDate);
  while (cur <= today) {
    const key = cur.toDateString();
    cells.push({
      d: new Date(cur),
      key,
      count: dayMap[key] || 0,
      isToday: cur.getTime() === today.getTime(),
    });
    cur.setDate(cur.getDate() + 1);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  // Build week columns
  const totalWeeks = cells.length / 7;
  const columns = [];
  for (let w = 0; w < totalWeeks; w++) {
    columns.push(cells.slice(w * 7, w * 7 + 7));
  }

  // Month labels
  const monthLabels = [];
  let lastMonth = -1;
  columns.forEach((col, wi) => {
    const first = col.find(c => c !== null);
    if (first) {
      const m = first.d.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ wi, label: first.d.toLocaleString('default', { month: 'short' }) });
        lastMonth = m;
      }
    }
  });

  const cellColor = n => {
    if (!n) return 'rgba(255,255,255,0.07)';
    if (n === 1) return 'rgba(139,92,246,0.35)';
    if (n === 2) return 'rgba(139,92,246,0.55)';
    if (n === 3) return 'rgba(139,92,246,0.75)';
    return 'rgb(139,92,246)';
  };

  const totalQuizzes = Object.values(dayMap).reduce((a, b) => a + b, 0);
  const totalActive  = Object.keys(dayMap).length;
  const DAY_LABELS   = ['M', '', 'W', '', 'F', '', ''];

  return (
    <div ref={containerRef} style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt)' }}>Activity Calendar</span>
        <span style={{ fontSize: 11, color: 'var(--txt3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 6 }}>
          {totalQuizzes} quizzes · {totalActive} active days
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, width: '100%' }}>

        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginTop: 20, flexShrink: 0, width: CELL }}>
          {DAY_LABELS.map((l, i) => (
            <div key={i} style={{
              width: CELL, height: CELL,
              fontSize: 9, lineHeight: `${CELL}px`,
              color: 'var(--txt3)', fontWeight: 700,
              textAlign: 'right', flexShrink: 0,
            }}>{l}</div>
          ))}
        </div>

        {/* Grid area */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>

          {/* Month labels */}
          <div style={{ position: 'relative', height: 16, marginBottom: 4, width: '100%' }}>
            {monthLabels.map(({ wi, label }) => (
              <span key={wi} style={{
                position: 'absolute',
                left: wi * (CELL + GAP),
                fontSize: 9, fontWeight: 700,
                color: 'var(--txt3)',
                whiteSpace: 'nowrap',
                lineHeight: '16px',
              }}>{label}</span>
            ))}
          </div>

          {/* Week columns — stretched to fill full width */}
          <div style={{ display: 'flex', gap: GAP, width: '100%' }}>
            {columns.map((col, wi) => (
              <div key={wi} style={{
                display: 'flex', flexDirection: 'column',
                gap: GAP, flex: 1, minWidth: CELL,
              }}>
                {col.map((day, di) => (
                  <div
                    key={di}
                    title={
                      day
                        ? `${day.d.toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' })}: ${day.count} quiz${day.count !== 1 ? 'zes':''}`
                        : ''
                    }
                    style={{
                      width: '100%',
                      height: CELL,
                      borderRadius: 2,
                      background: day ? cellColor(day.count) : 'transparent',
                      boxShadow: day?.isToday ? '0 0 0 1.5px rgba(255,255,255,0.9)' : 'none',
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
      <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 10, justifyContent:'flex-end' }}>
        <span style={{ fontSize: 9, color:'var(--txt3)', fontWeight: 600 }}>Less</span>
        {[0,1,2,3,4].map(n => (
          <div key={n} style={{ width: CELL, height: CELL, borderRadius: 2, background: cellColor(n), flexShrink: 0 }} />
        ))}
        <span style={{ fontSize: 9, color:'var(--txt3)', fontWeight: 600 }}>More</span>
      </div>

    </div>
  );
}
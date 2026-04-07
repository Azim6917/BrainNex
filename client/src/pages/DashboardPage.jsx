import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Flame, Target, BookOpen, AlertTriangle, ArrowRight, MessageSquare, FileQuestion, TrendingUp, Sparkles, Lightbulb, Clock, Brain, BarChart2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { getQuizHistoryFromFirestore } from '../utils/firestoreUtils';

function AnimNum({ target }) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || !target) { setVal(target || 0); return; }
    ran.current = true;
    let v = 0; const step = target / 40;
    const t = setInterval(() => {
      v = Math.min(v + step, target); setVal(Math.floor(v));
      if (v >= target) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <>{val}</>;
}

function MiniBar({ data }) {
  const max = Math.max(...data, 1);
  const days = ['M','T','W','T','F','S','S'];
  return (
    <div className="flex items-end gap-1.5 h-12">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(4, (v/max)*100)}%` }}
            transition={{ duration: 0.8, delay: i * 0.06 }}
            className="w-full rounded-t-sm min-h-[4px]"
            style={{ background: v > 0 ? '#a78bfa' : 'rgba(255,255,255,0.08)' }} />
          <span className="text-[9px] text-white/20">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function RingProgress({ pct, color, size = 48, stroke = 4, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * Math.min(pct,100)) / 100 }}
          transition={{ duration: 1.2, delay: 0.4 }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

const TIPS = [
  { icon:'🧠', tip:'Try the Pomodoro Technique — 25 min study, 5 min break.' },
  { icon:'📝', tip:'Writing notes by hand improves retention by up to 40%.' },
  { icon:'🎯', tip:'Review your weakest topic first when your mind is fresh.' },
  { icon:'🔄', tip:'Spaced repetition is the most effective memorization method.' },
  { icon:'💤', tip:'Sleep consolidates memories. Aim for 7–8 hours after studying.' },
  { icon:'🌊', tip:'Study in short bursts of focus, not marathon sessions.' },
  { icon:'🗣️', tip:'Teach the concept to yourself out loud to test your understanding.' },
];
const QUOTES = [
  "Every expert was once a beginner. Keep going! 🚀",
  "Consistency beats intensity. Show up every day! 💪",
  "You're closer to your goal than yesterday. 🌟",
  "Hard work + AI guidance = unstoppable you! 🧠",
  "The best time to study was yesterday. The second best is now! ⚡",
];
const SUBJECTS = [
  { emoji:'🧮', name:'Mathematics', color:'#00e5ff' },
  { emoji:'⚗️', name:'Chemistry',   color:'#a78bfa' },
  { emoji:'⚡', name:'Physics',      color:'#ffb830' },
  { emoji:'🔬', name:'Biology',      color:'#34d399' },
  { emoji:'💻', name:'Computer Sci.',color:'#00e5ff' },
  { emoji:'🌍', name:'Geography',    color:'#f87171' },
];

export default function DashboardPage() {
  const { user }                        = useAuth();
  const { profile, subjectProgress, refreshProfile } = useUserData();
  const [quizHistory, setQuizHistory]   = useState([]);
  const tip   = TIPS[new Date().getDay()  % TIPS.length];
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  // Load quiz history from Firestore directly
  useEffect(() => {
    if (!user?.uid) return;
    getQuizHistoryFromFirestore(user.uid, 20).then(setQuizHistory);
  }, [user, profile?.totalQuizzes]); // re-fetch when quiz count changes

  // Refresh subject progress when quiz count changes
  useEffect(() => { if (profile?.totalQuizzes > 0) refreshProfile(); }, [profile?.totalQuizzes]);

  const avgScore = quizHistory.length
    ? Math.round(quizHistory.reduce((a, b) => a + b.score, 0) / quizHistory.length) : 0;
  const totalAccuracy = profile?.totalQuestions > 0
    ? Math.round((profile.totalCorrect / profile.totalQuestions) * 100) : 0;
  const xpInLevel = (profile?.xp || 0) % 500;
  const xpPct     = Math.round((xpInLevel / 500) * 100);
  const level     = profile?.level || 1;
  const todayQ    = quizHistory.filter(q => q.timestamp && new Date(q.timestamp).toDateString() === new Date().toDateString()).length;
  const goalPct   = Math.min(100, (todayQ / 5) * 100);
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.displayName || 'Student').split(' ')[0];

  // Weekly activity (mock based on quiz history)
  const weeklyData = [0,0,0,0,0,0,0].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return quizHistory.filter(q => q.timestamp && new Date(q.timestamp).toDateString() === d.toDateString()).length;
  });

  return (
    <div className="p-4 md:p-6 lg:p-7 space-y-4 max-w-[1400px]">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-10 lg:pt-0">
        <div>
          <h1 className="font-syne font-black text-2xl md:text-3xl">{greeting}, {firstName}! {hour < 12 ? '☀️' : hour < 17 ? '👋' : '🌙'}</h1>
          <p className="text-white/40 text-sm mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2 glass border border-cyan/20 rounded-full px-3 py-1.5 text-xs text-white/50 max-w-xs">
          <Sparkles size={11} className="text-cyan flex-shrink-0" />
          <span className="italic truncate">{quote}</span>
        </div>
      </motion.div>

      {/* Streak banner */}
      {(profile?.streak || 0) >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-amber-500/15 to-transparent border border-neon-amber/20 rounded-2xl p-3.5 flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div className="flex-1 min-w-0">
            <p className="font-syne font-bold text-neon-amber text-sm">{profile.streak}-Day Streak!</p>
            <p className="text-xs text-white/40 truncate">Best: {profile.longestStreak} days · Keep studying today!</p>
          </div>
          <div className="hidden sm:flex items-center gap-0.5">
            {Array.from({ length: Math.min(profile.streak, 7) }).map((_, i) => (
              <span key={i} className="text-base">🔥</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Zap,      color: '#00e5ff', val: profile?.xp || 0,       label: 'Total XP',       sub: `Level ${level}`,            pct: xpPct },
          { icon: Flame,    color: '#ffb830', val: profile?.streak || 0,   label: 'Day Streak',     sub: '🔥 Keep going!',            pct: Math.min(100, (profile?.streak||0)*10) },
          { icon: Target,   color: '#34d399', val: null,                   label: 'Avg Quiz Score', sub: avgScore > 0 ? `${totalAccuracy}% accuracy` : 'Take a quiz!', pct: avgScore, display: `${avgScore}%` },
          { icon: BookOpen, color: '#a78bfa', val: profile?.totalQuizzes||0, label: 'Quizzes Taken', sub: `${profile?.subjects?.length||0} subjects`, pct: Math.min(100,(profile?.totalQuizzes||0)*4) },
        ].map(({ icon: Icon, color, val, label, sub, pct, display }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ y: -2 }}
            className="glass border border-brand-border rounded-2xl p-4 flex flex-col gap-2.5 hover:border-brand-border2 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <RingProgress pct={pct} color={color} size={38} stroke={3}>
                <span className="text-[8px] font-bold" style={{ color }}>{Math.round(pct)}%</span>
              </RingProgress>
            </div>
            <div>
              <div className="font-syne font-black text-2xl" style={{ color }}>
                {display || <AnimNum target={val} />}
              </div>
              <div className="text-xs text-white/40">{label}</div>
            </div>
            <div className="text-[10px] font-medium" style={{ color: `${color}90` }}>{sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Row: Subject Progress + Daily Goal + Weekly */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-bold text-base flex items-center gap-2"><BarChart2 size={15} className="text-cyan" />Subject Progress</h2>
            <Link to="/app/quiz" className="text-xs text-cyan hover:underline">Take a quiz →</Link>
          </div>
          {subjectProgress.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-white/40 text-sm mb-3">No data yet. Take a quiz to track progress!</p>
              <Link to="/app/quiz"><button className="btn-cyan text-xs py-2 px-5">Start a Quiz</button></Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {subjectProgress.map(({ subject, averageScore, totalQuizzes }) => {
                const c = averageScore >= 80 ? '#34d399' : averageScore >= 60 ? '#00e5ff' : '#ffb830';
                return (
                  <div key={subject}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-white/80">{subject}</span>
                      <span className="text-xs text-white/30">{totalQuizzes} quiz{totalQuizzes !== 1 ? 'zes' : ''} · <span className="font-bold" style={{ color: c }}>{averageScore}%</span></span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${averageScore}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${c}88, ${c})` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <div className="flex flex-col gap-4">
          {/* Daily goal */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass border border-brand-border rounded-2xl p-4">
            <h2 className="font-syne font-bold text-sm mb-3 flex items-center gap-2"><Target size={14} className="text-neon-amber" />Daily Goal</h2>
            <div className="flex items-center gap-3">
              <RingProgress pct={goalPct} color="#ffb830" size={56} stroke={4}>
                <span className="text-[10px] font-bold text-neon-amber">{Math.round(goalPct)}%</span>
              </RingProgress>
              <div>
                <p className="font-syne font-black text-xl text-neon-amber">{todayQ}<span className="text-sm text-white/30 font-normal"> / 5</span></p>
                <p className="text-xs text-white/40">Quizzes today</p>
                {todayQ >= 5 ? <p className="text-xs text-neon-green font-semibold mt-0.5">✅ Goal done!</p>
                  : <p className="text-xs text-white/25 mt-0.5">{5-todayQ} more to go</p>}
              </div>
            </div>
          </motion.div>
          {/* Weekly */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass border border-brand-border rounded-2xl p-4 flex-1">
            <h2 className="font-syne font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-violet-400" />Weekly Activity</h2>
            <MiniBar data={weeklyData} />
          </motion.div>
        </div>
      </div>

      {/* Row: Quick Actions + Study Tip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass border border-brand-border rounded-2xl p-5">
          <h2 className="font-syne font-bold text-base mb-4 flex items-center gap-2"><Sparkles size={15} className="text-cyan" />Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to:'/app/tutor',         icon: MessageSquare, label:'Ask AI Tutor',   sub:'Get instant help',   color:'#00e5ff' },
              { to:'/app/quiz',          icon: FileQuestion,  label:'Generate Quiz',  sub:'Test knowledge',     color:'#ffb830' },
              { to:'/app/learning-path', icon: Brain,         label:'Learning Path',  sub:'See roadmap',        color:'#a78bfa' },
              { to:'/app/goals',         icon: Target,        label:'Study Goals',    sub:'Set & track goals',  color:'#34d399' },
            ].map(({ to, icon: Icon, label, sub, color }) => (
              <Link key={to} to={to}>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  className="flex flex-col gap-2 p-3.5 rounded-2xl border border-brand-border cursor-pointer transition-all hover:border-brand-border2"
                  style={{ background: `${color}08` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight" style={{ color }}>{label}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>
                  </div>
                  <ArrowRight size={11} style={{ color: `${color}60` }} />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass border border-cyan/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-cyan/5 blur-xl" />
          <h2 className="font-syne font-bold text-sm mb-3 flex items-center gap-2"><Lightbulb size={14} className="text-neon-amber" />Study Tip</h2>
          <div className="text-3xl mb-3">{tip.icon}</div>
          <p className="text-sm text-white/60 leading-relaxed">{tip.tip}</p>
        </motion.div>
      </div>

      {/* Row: Start Studying + Recent Quizzes + Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start studying */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="glass border border-brand-border rounded-2xl p-5">
          <h2 className="font-syne font-bold text-sm mb-3 flex items-center gap-2"><BookOpen size={14} className="text-neon-green" />Start Studying</h2>
          <div className="grid grid-cols-3 gap-2">
            {SUBJECTS.map(({ emoji, name, color }) => (
              <Link key={name} to="/app/tutor">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center text-center p-2 rounded-xl border border-brand-border hover:border-brand-border2 transition-all"
                  style={{ background: `${color}08` }}>
                  <span className="text-xl mb-1">{emoji}</span>
                  <span className="text-[10px] text-white/50 leading-tight">{name}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent quizzes */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass border border-brand-border rounded-2xl p-5">
          <h2 className="font-syne font-bold text-sm mb-3 flex items-center gap-2"><Clock size={14} className="text-violet-400" />Recent Quizzes</h2>
          {quizHistory.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-xs text-white/40 mb-3">No quizzes yet!</p>
              <Link to="/app/quiz"><button className="btn-cyan text-xs py-1.5 px-4">Generate Quiz</button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {quizHistory.slice(0, 5).map((q) => {
                const c = q.score >= 80 ? '#34d399' : q.score >= 60 ? '#00e5ff' : '#ffb830';
                return (
                  <div key={q.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${c}20`, color: c }}>{q.score}%</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{q.topic}</p>
                      <p className="text-[10px] text-white/30">{q.subject}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Badge showcase */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="glass border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-syne font-bold text-sm">🏆 Badges</h2>
            <Link to="/app/achievements" className="text-xs text-cyan hover:underline">View all</Link>
          </div>
          {(profile?.badges || []).length === 0 ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-2">🔓</p>
              <p className="text-xs text-white/40">Complete quizzes to earn badges!</p>
              <div className="flex justify-center gap-2 mt-3 opacity-25">
                {['📝','💯','🏆','⚡','🔥'].map((b, i) => (
                  <span key={i} className="text-xl grayscale">{b}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.badges || []).slice(0, 9).map((badge, i) => (
                <motion.div key={badge.id}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.15 }}
                  title={`${badge.name}: ${badge.desc || ''}`}
                  className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-xl cursor-pointer">
                  {badge.icon}
                </motion.div>
              ))}
              {(profile.badges?.length || 0) > 9 && (
                <Link to="/app/achievements">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-brand-border flex items-center justify-center text-xs text-white/40">
                    +{profile.badges.length - 9}
                  </div>
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

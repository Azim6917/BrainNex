// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { Zap, Flame, Target, BookOpen, AlertTriangle, TrendingUp, ArrowRight, MessageSquare, FileQuestion } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import { useUserData } from '../context/UserDataContext';
// import { fetchQuizHistory, detectWeakTopics, getAdaptiveDifficulty } from '../utils/api';
// import toast from 'react-hot-toast';

// function StatCard({ icon: Icon, color, value, label, sub, delay = 0 }) {
//   return (
//     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
//       className="glass border border-brand-border rounded-2xl p-5">
//       <div className="flex items-center justify-between mb-3">
//         <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
//           <Icon size={18} style={{ color }} />
//         </div>
//         {sub && <span className="text-xs font-medium text-neon-green">{sub}</span>}
//       </div>
//       <div className="font-syne font-black text-3xl" style={{ color }}>{value}</div>
//       <div className="text-xs text-white/40 mt-1">{label}</div>
//     </motion.div>
//   );
// }

// export default function DashboardPage() {
//   const { user } = useAuth();
//   const { profile, subjectProgress } = useUserData();
//   const [quizHistory, setQuizHistory]   = useState([]);
//   const [weakTopics, setWeakTopics]     = useState(null);
//   const [adaptiveTip, setAdaptiveTip]   = useState(null);
//   const [loadingWeak, setLoadingWeak]   = useState(false);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const h = await fetchQuizHistory(30);
//         setQuizHistory(h.data);

//         if (h.data.length > 0) {
//           setLoadingWeak(true);
//           const [weakRes, adaptRes] = await Promise.all([
//             detectWeakTopics(h.data),
//             getAdaptiveDifficulty(
//               h.data.slice(0, 10).map(q => q.score),
//               profile?.currentDifficulty || 'intermediate'
//             ),
//           ]);
//           setWeakTopics(weakRes.data);
//           setAdaptiveTip(adaptRes.data);
//           setLoadingWeak(false);
//         }
//       } catch (err) {
//         console.error('Dashboard load error:', err);
//       }
//     };
//     if (profile) load();
//   }, [profile]);

//   const avgScore = quizHistory.length
//     ? Math.round(quizHistory.reduce((a, b) => a + b.score, 0) / quizHistory.length)
//     : 0;

//   const hour = new Date().getHours();
//   const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
//   const firstName = (user?.displayName || 'Student').split(' ')[0];

//   return (
//     <div className="p-6 lg:p-8 max-w-7xl">
//       {/* Header */}
//       <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
//         <h1 className="font-syne font-black text-3xl">{greeting}, {firstName}! 👋</h1>
//         <p className="text-white/40 text-sm mt-1">
//           {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
//         </p>
//       </motion.div>

//       {/* Streak banner */}
//       {(profile?.streak || 0) >= 3 && (
//         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
//           className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-neon-amber/20 rounded-2xl p-4 flex items-center gap-4">
//           <div className="text-3xl">🔥</div>
//           <div>
//             <p className="font-syne font-bold text-neon-amber">{profile.streak}-Day Streak!</p>
//             <p className="text-xs text-white/40">Keep it up — you're on a roll! Come back tomorrow to keep your streak alive.</p>
//           </div>
//           {profile.longestStreak > profile.streak && (
//             <div className="ml-auto text-xs text-white/30">Best: {profile.longestStreak} days</div>
//           )}
//         </motion.div>
//       )}

//       {/* Stat cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//         <StatCard icon={Zap}      color="#00e5ff" value={(profile?.xp || 0).toLocaleString()} label="Total XP"         sub={`Lv. ${profile?.level || 1}`}  delay={0} />
//         <StatCard icon={Flame}    color="#ffb830" value={profile?.streak || 0}                label="Day Streak"      sub="🔥 Active"                          delay={0.1} />
//         <StatCard icon={Target}   color="#34d399" value={`${avgScore}%`}                     label="Avg Quiz Score"  sub={quizHistory.length > 0 ? `+${Math.max(0, avgScore - 65)}% vs start` : 'Take quizzes!'} delay={0.2} />
//         <StatCard icon={BookOpen} color="#a78bfa" value={profile?.totalQuizzes || 0}         label="Quizzes Taken"   delay={0.3} />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Subject Progress */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
//           className="lg:col-span-2 glass border border-brand-border rounded-2xl p-6">
//           <div className="flex items-center justify-between mb-5">
//             <h2 className="font-syne font-bold text-lg">Subject Progress</h2>
//             <Link to="/app/quiz" className="text-xs text-cyan hover:underline">Take a quiz →</Link>
//           </div>
//           {subjectProgress.length === 0 ? (
//             <div className="text-center py-10">
//               <p className="text-4xl mb-3">📚</p>
//               <p className="text-white/40 text-sm">No subject data yet. Start quizzing to track progress!</p>
//               <Link to="/app/quiz"><button className="btn-cyan mt-4 text-sm py-2 px-6">Start a Quiz</button></Link>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {subjectProgress.map(({ subject, averageScore, totalQuizzes, topicsAttempted }) => (
//                 <div key={subject}>
//                   <div className="flex items-center justify-between text-sm mb-1.5">
//                     <span className="font-medium">{subject}</span>
//                     <span className="text-white/40">{averageScore}% · {totalQuizzes} quizzes</span>
//                   </div>
//                   <div className="h-2 bg-white/10 rounded-full overflow-hidden">
//                     <motion.div
//                       initial={{ width: 0 }}
//                       animate={{ width: `${averageScore}%` }}
//                       transition={{ duration: 1, delay: 0.3 }}
//                       className="h-full rounded-full"
//                       style={{ background: averageScore >= 80 ? '#34d399' : averageScore >= 60 ? '#00e5ff' : '#ffb830' }}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </motion.div>

//         {/* Quick actions */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
//           className="glass border border-brand-border rounded-2xl p-6">
//           <h2 className="font-syne font-bold text-lg mb-5">Quick Actions</h2>
//           <div className="space-y-3">
//             <Link to="/app/tutor">
//               <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 p-3 rounded-xl bg-cyan/10 border border-cyan/20 cursor-pointer mb-3">
//                 <MessageSquare size={18} className="text-cyan" />
//                 <div><p className="text-sm font-semibold text-cyan">Ask AI Tutor</p><p className="text-xs text-white/40">Get instant help</p></div>
//                 <ArrowRight size={14} className="ml-auto text-cyan" />
//               </motion.div>
//             </Link>
//             <Link to="/app/quiz">
//               <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 p-3 rounded-xl bg-neon-amber/10 border border-neon-amber/20 cursor-pointer mb-3">
//                 <FileQuestion size={18} className="text-neon-amber" />
//                 <div><p className="text-sm font-semibold text-neon-amber">Generate Quiz</p><p className="text-xs text-white/40">Test your knowledge</p></div>
//                 <ArrowRight size={14} className="ml-auto text-neon-amber" />
//               </motion.div>
//             </Link>
//             <Link to="/app/learning-path">
//               <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 p-3 rounded-xl glass border border-brand-border cursor-pointer">
//                 <TrendingUp size={18} className="text-neon-violet" />
//                 <div><p className="text-sm font-semibold">My Learning Path</p><p className="text-xs text-white/40">See your roadmap</p></div>
//                 <ArrowRight size={14} className="ml-auto text-white/30" />
//               </motion.div>
//             </Link>
//           </div>
//         </motion.div>
//       </div>

//       {/* Weak Topic Detector */}
//       {(weakTopics || loadingWeak) && (
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
//           className="mt-6 glass border border-brand-border rounded-2xl p-6">
//           <div className="flex items-center gap-2 mb-4">
//             <AlertTriangle size={18} className="text-neon-amber" />
//             <h2 className="font-syne font-bold text-lg">AI Weak Topic Detector</h2>
//           </div>
//           {loadingWeak ? (
//             <div className="flex items-center gap-3 text-sm text-white/40">
//               <div className="w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
//               Analyzing your quiz history...
//             </div>
//           ) : weakTopics ? (
//             <>
//               <p className="text-sm text-white/60 mb-4 italic">{weakTopics.insights}</p>
//               {weakTopics.weakTopics?.length > 0 ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
//                   {weakTopics.weakTopics.map((t) => (
//                     <div key={t.topic} className={`p-3 rounded-xl border ${t.priority === 'high' ? 'border-red-500/30 bg-red-500/10' : t.priority === 'medium' ? 'border-neon-amber/30 bg-neon-amber/10' : 'border-brand-border2 bg-white/[0.03]'}`}>
//                       <div className="flex items-center justify-between mb-1">
//                         <span className="text-sm font-semibold">{t.topic}</span>
//                         <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-neon-amber/20 text-neon-amber'}`}>
//                           {t.averageScore}%
//                         </span>
//                       </div>
//                       <p className="text-xs text-white/40 leading-relaxed">{t.recommendation}</p>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-sm text-neon-green">🎉 No weak topics detected — you're performing great across the board!</p>
//               )}
//               {weakTopics.suggestedFocus && (
//                 <div className="flex items-center gap-2 text-sm">
//                   <span className="text-white/40">Suggested focus:</span>
//                   <span className="text-cyan font-semibold">{weakTopics.suggestedFocus}</span>
//                   <Link to="/app/quiz"><button className="ml-auto btn-cyan text-xs py-1.5 px-4">Study Now</button></Link>
//                 </div>
//               )}
//             </>
//           ) : null}
//           {adaptiveTip && (
//             <div className="mt-4 pt-4 border-t border-brand-border flex items-center gap-3">
//               <Zap size={15} className="text-cyan flex-shrink-0" />
//               <p className="text-xs text-white/50"><span className="text-cyan font-semibold">Difficulty Tip: </span>{adaptiveTip.reason}</p>
//             </div>
//           )}
//         </motion.div>
//       )}

//       {/* Recent Quiz History */}
//       {quizHistory.length > 0 && (
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
//           className="mt-6 glass border border-brand-border rounded-2xl p-6">
//           <div className="flex items-center justify-between mb-5">
//             <h2 className="font-syne font-bold text-lg">Recent Quizzes</h2>
//           </div>
//           <div className="space-y-2">
//             {quizHistory.slice(0, 6).map((q) => (
//               <div key={q.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
//                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${q.score >= 80 ? 'bg-neon-green/20 text-neon-green' : q.score >= 60 ? 'bg-cyan/20 text-cyan' : 'bg-neon-amber/20 text-neon-amber'}`}>
//                   {q.score}%
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium truncate">{q.topic}</p>
//                   <p className="text-xs text-white/30">{q.subject} · {q.difficulty}</p>
//                 </div>
//                 <div className="text-xs text-white/20">
//                   {q.timestamp ? new Date(q.timestamp).toLocaleDateString() : 'Recent'}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </motion.div>
//       )}
//     </div>
//   );
// }


import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Flame, Target, BookOpen, AlertTriangle,
  ArrowRight, MessageSquare, FileQuestion, TrendingUp,
  Star, Clock, Brain, Trophy, ChevronRight, Lightbulb,
  BarChart2, CheckCircle2, Circle, Sparkles, Map
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { fetchQuizHistory, detectWeakTopics, getAdaptiveDifficulty } from '../utils/api';

/* ─── Animated number ─── */
function AnimNum({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || target === 0) return;
    ran.current = true;
    let v = 0;
    const step = target / 40;
    const t = setInterval(() => {
      v = Math.min(v + step, target);
      setVal(Math.floor(v));
      if (v >= target) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <>{target === 0 ? 0 : val}{suffix}</>;
}

/* ─── Mini bar chart ─── */
function MiniBarChart({ data, color = '#00e5ff' }) {
  const max = Math.max(...data, 1);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="flex items-end gap-1.5 h-14">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ duration: 0.8, delay: i * 0.06 }}
            className="w-full rounded-t-sm min-h-[3px]"
            style={{ background: v > 0 ? color : 'rgba(255,255,255,0.08)' }}
          />
          <span className="text-[9px] text-white/20">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Circular progress ring ─── */
function RingProgress({ pct, color, size = 56, stroke = 4, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
          transition={{ duration: 1.2, delay: 0.4 }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

const MOTIVATIONAL = [
  "Every expert was once a beginner. Keep going! 🚀",
  "Consistency beats intensity. Show up every day! 💪",
  "You're closer to your goal than yesterday. 🌟",
  "Hard work + AI guidance = unstoppable you! 🧠",
  "The best time to study was yesterday. The second best is now! ⚡",
];

const QUICK_SUBJECTS = [
  { emoji: '🧮', name: 'Mathematics',    color: '#00e5ff' },
  { emoji: '⚗️', name: 'Chemistry',      color: '#a78bfa' },
  { emoji: '⚡', name: 'Physics',         color: '#ffb830' },
  { emoji: '🔬', name: 'Biology',         color: '#34d399' },
  { emoji: '💻', name: 'Computer Sci.',  color: '#00e5ff' },
  { emoji: '🌍', name: 'Geography',      color: '#f87171' },
];

const DAILY_TIPS = [
  { icon: '🧠', tip: 'Try the Pomodoro Technique — 25 min study, 5 min break.' },
  { icon: '📝', tip: 'Writing notes by hand improves retention by up to 40%.' },
  { icon: '🎯', tip: 'Review your weakest topic first when your mind is fresh.' },
  { icon: '🔄', tip: 'Spaced repetition is the most effective memorization method.' },
  { icon: '💤', tip: 'Sleep consolidates memories. Aim for 7–8 hours after studying.' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile, subjectProgress } = useUserData();
  const [quizHistory, setQuizHistory]   = useState([]);
  const [weakTopics, setWeakTopics]     = useState(null);
  const [adaptiveTip, setAdaptiveTip]   = useState(null);
  const [loadingWeak, setLoadingWeak]   = useState(false);
  const [weeklyData]                    = useState([2, 5, 3, 8, 6, 4, 7]);
  const tipOfDay = DAILY_TIPS[new Date().getDay() % DAILY_TIPS.length];
  const quote    = MOTIVATIONAL[new Date().getDate() % MOTIVATIONAL.length];

  useEffect(() => {
    const load = async () => {
      try {
        const h = await fetchQuizHistory(30);
        setQuizHistory(h.data);
        if (h.data.length > 0) {
          setLoadingWeak(true);
          const [weakRes, adaptRes] = await Promise.all([
            detectWeakTopics(h.data),
            getAdaptiveDifficulty(h.data.slice(0, 10).map(q => q.score), profile?.currentDifficulty || 'intermediate'),
          ]);
          setWeakTopics(weakRes.data);
          setAdaptiveTip(adaptRes.data);
          setLoadingWeak(false);
        }
      } catch {}
    };
    if (profile) load();
  }, [profile]);

  const avgScore    = quizHistory.length ? Math.round(quizHistory.reduce((a, b) => a + b.score, 0) / quizHistory.length) : 0;
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName   = (user?.displayName || 'Student').split(' ')[0];
  const level       = profile?.level || 1;
  const xpInLevel   = (profile?.xp || 0) % 500;
  const xpPct       = Math.round((xpInLevel / 500) * 100);
  const totalAccuracy = profile?.totalQuestions > 0
    ? Math.round((profile.totalCorrect / profile.totalQuestions) * 100) : 0;

  /* daily goal: 5 quizzes per day */
  const todayQuizzes = quizHistory.filter(q => {
    if (!q.timestamp) return false;
    return new Date(q.timestamp).toDateString() === new Date().toDateString();
  }).length;
  const dailyGoalPct = Math.min(100, (todayQuizzes / 5) * 100);

  return (
    <div className="p-5 lg:p-7 space-y-5 max-w-[1400px]">

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-syne font-black text-2xl lg:text-3xl">
            {greeting}, {firstName}! {hour < 12 ? '☀️' : hour < 17 ? '👋' : '🌙'}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {/* Motivational quote pill */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center gap-2.5 glass border border-cyan/20 rounded-full px-4 py-2 text-xs text-white/60 max-w-xs">
          <Sparkles size={12} className="text-cyan flex-shrink-0" />
          <span className="italic">{quote}</span>
        </motion.div>
      </motion.div>

      {/* ── STREAK BANNER ── */}
      {(profile?.streak || 0) >= 3 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-neon-amber/25 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-3xl">🔥</div>
          <div className="flex-1">
            <p className="font-syne font-bold text-neon-amber text-sm">{profile.streak}-Day Streak! You're on fire!</p>
            <p className="text-xs text-white/40 mt-0.5">Keep studying today to maintain your streak. Longest: {profile.longestStreak} days</p>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {Array.from({ length: Math.min(profile.streak, 7) }).map((_, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
                className="w-6 h-6 rounded-full bg-neon-amber/20 border border-neon-amber/40 flex items-center justify-center text-xs">🔥</motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── ROW 1: STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Zap,      color: '#00e5ff', value: (profile?.xp || 0).toLocaleString(), label: 'Total XP',      sub: `Level ${level}`,                 pct: xpPct },
          { icon: Flame,    color: '#ffb830', value: profile?.streak || 0,                label: 'Day Streak',    sub: profile?.streak >= 1 ? '🔥 Keep going!' : 'Start today!', pct: Math.min(100, (profile?.streak || 0) * 3) },
          { icon: Target,   color: '#34d399', value: `${avgScore}%`,                      label: 'Avg Quiz Score',sub: avgScore >= 80 ? '🎯 Excellent!' : avgScore > 0 ? 'Keep practicing' : 'Take a quiz!', pct: avgScore },
          { icon: BookOpen, color: '#a78bfa', value: profile?.totalQuizzes || 0,          label: 'Quizzes Taken', sub: `${totalAccuracy}% accuracy`,      pct: Math.min(100, (profile?.totalQuizzes || 0) * 5) },
        ].map(({ icon: Icon, color, value, label, sub, pct }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ y: -2 }}
            className="glass border border-brand-border rounded-2xl p-4 flex flex-col gap-3 transition-all hover:border-brand-border2 group">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon size={17} style={{ color }} />
              </div>
              <RingProgress pct={pct} color={color} size={40} stroke={3}>
                <span className="text-[9px] font-bold" style={{ color }}>{Math.round(pct)}%</span>
              </RingProgress>
            </div>
            <div>
              <div className="font-syne font-black text-2xl" style={{ color }}>
                <AnimNum target={typeof value === 'string' ? 0 : (value || 0)} />
                {typeof value === 'string' ? value : ''}
              </div>
              <div className="text-xs text-white/40 mt-0.5">{label}</div>
            </div>
            <div className="text-[10px] font-medium" style={{ color: `${color}99` }}>{sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── ROW 2: SUBJECT PROGRESS + DAILY GOAL + ACTIVITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Subject Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-bold text-base flex items-center gap-2">
              <BarChart2 size={16} className="text-cyan" /> Subject Progress
            </h2>
            <Link to="/app/quiz" className="text-xs text-cyan hover:underline flex items-center gap-1">
              Take a quiz <ChevronRight size={12} />
            </Link>
          </div>

          {subjectProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-white/40 text-sm mb-4">No subject data yet. Start quizzing to track progress!</p>
              <Link to="/app/quiz"><button className="btn-cyan text-xs py-2 px-5">Start a Quiz</button></Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {subjectProgress.map(({ subject, averageScore, totalQuizzes }) => {
                const color = averageScore >= 80 ? '#34d399' : averageScore >= 60 ? '#00e5ff' : '#ffb830';
                return (
                  <div key={subject} className="group">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-white/80 group-hover:text-white transition-colors">{subject}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-white/30">{totalQuizzes} quiz{totalQuizzes !== 1 ? 'zes' : ''}</span>
                        <span className="font-bold" style={{ color }}>{averageScore}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${averageScore}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full rounded-full relative"
                        style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Daily Goal + Weekly Activity */}
        <div className="flex flex-col gap-4">
          {/* Daily Goal */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass border border-brand-border rounded-2xl p-5">
            <h2 className="font-syne font-bold text-base mb-3 flex items-center gap-2">
              <Target size={16} className="text-neon-amber" /> Daily Goal
            </h2>
            <div className="flex items-center gap-4">
              <RingProgress pct={dailyGoalPct} color="#ffb830" size={64} stroke={5}>
                <span className="text-xs font-bold text-neon-amber">{Math.round(dailyGoalPct)}%</span>
              </RingProgress>
              <div>
                <p className="font-syne font-black text-xl text-neon-amber">{todayQuizzes}<span className="text-sm text-white/30 font-normal"> / 5</span></p>
                <p className="text-xs text-white/40">Quizzes today</p>
                {todayQuizzes >= 5
                  ? <p className="text-xs text-neon-green font-semibold mt-1">✅ Goal complete!</p>
                  : <p className="text-xs text-white/30 mt-1">{5 - todayQuizzes} more to go</p>}
              </div>
            </div>
          </motion.div>

          {/* Weekly Activity chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass border border-brand-border rounded-2xl p-5 flex-1">
            <h2 className="font-syne font-bold text-base mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-400" /> Weekly Activity
            </h2>
            <MiniBarChart data={weeklyData} color="#a78bfa" />
          </motion.div>
        </div>
      </div>

      {/* ── ROW 3: QUICK ACTIONS + TIP OF DAY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass border border-brand-border rounded-2xl p-5">
          <h2 className="font-syne font-bold text-base mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-cyan" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: '/app/tutor',         icon: MessageSquare, label: 'Ask AI Tutor',    sub: 'Get instant help',  color: '#00e5ff' },
              { to: '/app/quiz',          icon: FileQuestion,  label: 'Generate Quiz',   sub: 'Test your knowledge', color: '#ffb830' },
              { to: '/app/learning-path', icon: Map,           label: 'Learning Path',   sub: 'See your roadmap',  color: '#a78bfa' },
              { to: '/app/study-rooms',   icon: Brain,         label: 'Study Rooms',     sub: 'Learn with peers',  color: '#34d399' },
            ].map(({ to, icon: Icon, label, sub, color }) => (
              <Link key={to} to={to}>
                <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex flex-col gap-2.5 p-4 rounded-2xl border border-brand-border cursor-pointer transition-all hover:border-brand-border2"
                  style={{ background: `${color}08` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={17} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight" style={{ color }}>{label}</p>
                    <p className="text-xs text-white/30 mt-0.5">{sub}</p>
                  </div>
                  <ArrowRight size={13} style={{ color: `${color}60` }} />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Tip of the Day */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass border border-cyan/15 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan/5 blur-2xl" />
          <h2 className="font-syne font-bold text-base mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-neon-amber" /> Study Tip
          </h2>
          <div className="text-3xl mb-3">{tipOfDay.icon}</div>
          <p className="text-sm text-white/70 leading-relaxed">{tipOfDay.tip}</p>
          <div className="mt-4 pt-3 border-t border-brand-border flex gap-1">
            {DAILY_TIPS.map((_, i) => (
              <div key={i} className={`h-0.5 flex-1 rounded-full ${i === new Date().getDay() % DAILY_TIPS.length ? 'bg-cyan' : 'bg-white/10'}`} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── ROW 4: START STUDYING + WEAK TOPICS + RECENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Quick Start Subjects */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="glass border border-brand-border rounded-2xl p-5">
          <h2 className="font-syne font-bold text-base mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-neon-green" /> Start Studying
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_SUBJECTS.map(({ emoji, name, color }) => (
              <Link key={name} to={`/app/tutor`}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center text-center p-2.5 rounded-xl border border-brand-border cursor-pointer transition-all hover:border-brand-border2"
                  style={{ background: `${color}08` }}>
                  <span className="text-2xl mb-1">{emoji}</span>
                  <span className="text-[10px] text-white/50 leading-tight">{name}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Weak Topics / AI Insight */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass border border-brand-border rounded-2xl p-5">
          <h2 className="font-syne font-bold text-base mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-neon-amber" /> AI Insights
          </h2>
          {loadingWeak ? (
            <div className="flex items-center gap-3 text-sm text-white/40">
              <div className="w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
              Analyzing your performance...
            </div>
          ) : weakTopics && weakTopics.weakTopics?.length > 0 ? (
            <div className="space-y-2.5">
              {weakTopics.weakTopics.slice(0, 3).map(t => (
                <div key={t.topic} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-brand-border">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.priority === 'high' ? 'bg-red-400' : 'bg-neon-amber'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{t.topic}</p>
                    <p className="text-[10px] text-white/30">{t.subject}</p>
                  </div>
                  <span className={`text-xs font-bold ${t.priority === 'high' ? 'text-red-400' : 'text-neon-amber'}`}>{t.averageScore}%</span>
                </div>
              ))}
              {weakTopics.suggestedFocus && (
                <Link to="/app/quiz">
                  <div className="mt-1 text-xs text-cyan flex items-center gap-1.5 hover:underline cursor-pointer">
                    <Zap size={11} /> Focus on: {weakTopics.suggestedFocus}
                  </div>
                </Link>
              )}
            </div>
          ) : weakTopics ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm text-neon-green font-semibold">All caught up!</p>
              <p className="text-xs text-white/30 mt-1">No weak topics detected. Keep it up!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-4">
              <div className="text-3xl mb-2">🤖</div>
              <p className="text-xs text-white/40">Take a few quizzes and AI will analyze your performance automatically.</p>
              <Link to="/app/quiz"><button className="btn-cyan mt-3 text-xs py-1.5 px-4">Start Quiz</button></Link>
            </div>
          )}
        </motion.div>

        {/* Recent Quiz History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="glass border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-bold text-base flex items-center gap-2">
              <Clock size={16} className="text-violet-400" /> Recent Quizzes
            </h2>
          </div>
          {quizHistory.length === 0 ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-xs text-white/40">No quizzes yet. Generate your first AI quiz!</p>
              <Link to="/app/quiz"><button className="btn-cyan mt-3 text-xs py-1.5 px-4">Generate Quiz</button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {quizHistory.slice(0, 5).map((q) => {
                const color = q.score >= 80 ? '#34d399' : q.score >= 60 ? '#00e5ff' : '#ffb830';
                return (
                  <div key={q.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors group">
                    <RingProgress pct={q.score} color={color} size={34} stroke={3}>
                      <span className="text-[8px] font-bold" style={{ color }}>{q.score}</span>
                    </RingProgress>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-white transition-colors">{q.topic}</p>
                      <p className="text-[10px] text-white/30">{q.subject}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold`}
                      style={{ background: `${color}20`, color }}>
                      {q.difficulty || 'mid'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── ROW 5: ACHIEVEMENTS PREVIEW + ADAPTIVE DIFFICULTY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Badge showcase */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-bold text-base flex items-center gap-2">
              <Trophy size={16} className="text-neon-amber" /> Achievements
            </h2>
            <Link to="/app/achievements" className="text-xs text-cyan hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {(profile?.badges || []).length === 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex gap-3">
                {['📝', '💯', '🏆', '⚡', '🔥'].map((b, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-brand-border flex items-center justify-center text-2xl opacity-30 cursor-pointer grayscale">
                    {b}
                  </motion.div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-white/60">No badges yet</p>
                <p className="text-xs text-white/30 mt-0.5">Complete your first quiz to earn your first badge!</p>
                <Link to="/app/quiz"><button className="btn-cyan mt-2 text-xs py-1.5 px-4">Earn Badges</button></Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.badges || []).slice(0, 8).map((badge, i) => (
                <motion.div key={badge.id}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.07 }}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  title={badge.name}
                  className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-2xl cursor-pointer">
                  {badge.icon}
                </motion.div>
              ))}
              {(profile.badges?.length || 0) > 8 && (
                <Link to="/app/achievements">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-brand-border flex items-center justify-center text-xs text-white/40 cursor-pointer hover:border-brand-border2 transition-all">
                    +{profile.badges.length - 8}
                  </div>
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* Adaptive Difficulty Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
          className="glass border border-brand-border rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-violet-500/5 blur-2xl" />
          <h2 className="font-syne font-bold text-base mb-4 flex items-center gap-2">
            <Brain size={16} className="text-violet-400" /> AI Difficulty Engine
          </h2>
          <div className="flex items-center gap-4 mb-4">
            {['beginner', 'intermediate', 'advanced'].map((d) => {
              const active = (adaptiveTip?.recommendedDifficulty || profile?.currentDifficulty || 'intermediate') === d;
              const colors = { beginner: '#34d399', intermediate: '#00e5ff', advanced: '#a78bfa' };
              return (
                <div key={d} className={`flex-1 py-2 rounded-xl text-center text-xs font-semibold capitalize border transition-all ${active ? 'border-opacity-60' : 'border-brand-border opacity-30'}`}
                  style={active ? { borderColor: colors[d], background: `${colors[d]}15`, color: colors[d] } : {}}>
                  {d}
                  {active && <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: colors[d] }} />}
                </div>
              );
            })}
          </div>
          {adaptiveTip ? (
            <div className="flex items-start gap-2.5 text-xs text-white/60 bg-white/[0.03] rounded-xl p-3 border border-brand-border">
              <Zap size={13} className="text-cyan flex-shrink-0 mt-0.5" />
              <span>{adaptiveTip.reason}</span>
            </div>
          ) : (
            <div className="text-xs text-white/40 bg-white/[0.03] rounded-xl p-3 border border-brand-border">
              🤖 Take 3+ quizzes and the AI will automatically adjust your difficulty level based on your performance.
            </div>
          )}
          <div className="mt-4 flex gap-3 text-xs text-white/40">
            <div className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-neon-green" /> {profile?.totalQuizzes || 0} quizzes analyzed</div>
            <div className="flex items-center gap-1.5"><Star size={11} className="text-neon-amber" /> {totalAccuracy}% accuracy</div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}

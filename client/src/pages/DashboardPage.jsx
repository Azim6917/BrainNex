import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Flame, Target, BookOpen, AlertTriangle, ArrowRight, X,
  MessageSquare, FileQuestion, TrendingUp, Lightbulb,
  Clock, Brain, BarChart2, Trophy,
  Calculator, FlaskConical, Microscope, Monitor, Globe,
  FileText, Star, Timer, CheckCircle, Lock, Sparkles
} from 'lucide-react';
import { useAuth }     from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { getWeeklyReport } from '../utils/api';
import { ALL_BADGES } from './AchievementsPage';
import StreakCalendar from '../components/StreakCalendar';
import StreakPopup    from '../components/StreakPopup';
import { audioSystem } from '../utils/audio';

function AnimNum({ target }) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    if (!target) { setVal(0); return; }
    ran.current = true;
    let v=0; const step=target/40;
    const t=setInterval(()=>{ v=Math.min(v+step,target); setVal(Math.floor(v)); if(v>=target) clearInterval(t); },30);
    return ()=>clearInterval(t);
  }, [target]);
  return <>{val}</>;
}

function RingProgress({ pct, color, size=48, stroke=4, children }) {
  const r = (size-stroke)/2; const circ = 2*Math.PI*r;
  return (
    <div className="relative flex-shrink-0" style={{ width:size, height:size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset:circ }}
          animate={{ strokeDashoffset: circ-(circ*Math.min(pct,100)/100) }}
          transition={{ duration:1.2, delay:0.4 }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

const TIPS = [
  {tip:'Try Pomodoro — 25 min study, 5 min break.'},
  {tip:'Writing notes by hand boosts retention 40%.'},
  {tip:'Review your weakest topic first, mind is freshest.'},
  {tip:'Spaced repetition is the #1 memorization technique.'},
  {tip:'Sleep consolidates memories. Aim for 7-8 hours.'},
  {tip:'Short bursts of focus beat marathon sessions.'},
  {tip:'Teach the concept aloud to test your understanding.'},
];
const QUOTES = [
  "Every expert was once a beginner. Keep going.",
  "Consistency beats intensity. Show up every day.",
  "You are closer to your goal than yesterday.",
  "Hard work and AI guidance make you unstoppable.",
  "The best time to study was yesterday. Now is second best.",
];
const SUBJECTS = [
  {name:'Mathematics',color:'#0EA5E9', lucideIcon:'Calculator'},
  {name:'Chemistry',  color:'#8B5CF6', lucideIcon:'FlaskConical'},
  {name:'Physics',    color:'#F59E0B', lucideIcon:'Zap'},
  {name:'Biology',    color:'#10B981', lucideIcon:'Microscope'},
  {name:'Comp. Sci.', color:'#0EA5E9', lucideIcon:'Monitor'},
  {name:'Geography',  color:'#EF4444', lucideIcon:'Globe'},
];

export default function DashboardPage() {
  const { user }                                     = useAuth();
  const { profile, subjectProgress, refreshProfile } = useUserData();
  const [quizHistory,   setQuizHistory]              = useState([]);
  const [weeklyReport,  setWeeklyReport]             = useState('');
  const [reportLoading, setReportLoading]            = useState(false);
  const [showReport,    setShowReport]               = useState(false);
  const [spacedTopics,  setSpacedTopics]             = useState([]);
  const [showStreak,    setShowStreak]               = useState(sessionStorage.getItem('streakBannerDismissed') !== 'true');
  const [showSpaced,    setShowSpaced]               = useState(sessionStorage.getItem('needsReviewDismissed') !== 'true');
  const [showStreakPopup, setShowStreakPopup]         = useState(false);
  const [activeDays,    setActiveDays]               = useState(new Set());

  const tip   = TIPS[new Date().getDay()   % TIPS.length];
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  useEffect(() => {
    if (!user?.uid) return;
    const loadHistory = async () => {
      try {
        const q    = query(collection(db, 'quizResults', user.uid, 'results'), orderBy('timestamp','desc'), limit(30));
        const snap = await getDocs(q);
        const history = snap.docs.map(d => ({
          id: d.id, ...d.data(),
          timestamp: d.data().timestamp?.toDate?.()?.toISOString() || null,
        }));
        setQuizHistory(history);

        // Spaced repetition: topics below 65% not revisited in 2+ days
        const topicMap = {};
        history.forEach(q => {
          const key = `${q.subject}:${q.topic}`;
          if (!topicMap[key]) topicMap[key] = { subject:q.subject, topic:q.topic, scores:[], lastDate:null };
          topicMap[key].scores.push(q.score);
          const d = q.timestamp ? new Date(q.timestamp) : null;
          if (d && (!topicMap[key].lastDate || d > topicMap[key].lastDate)) topicMap[key].lastDate = d;
        });
        const reminders = Object.values(topicMap).filter(t => {
          const avg     = t.scores.reduce((a,b)=>a+b,0)/t.scores.length;
          const daysSince = t.lastDate ? (Date.now()-t.lastDate.getTime())/86400000 : 999;
          return avg < 65 && daysSince >= 2;
        }).slice(0,3);
        setSpacedTopics(reminders);

        // Build active days Set for streak popup
        const actSet = new Set();
        history.forEach(q => { if (q.timestamp) actSet.add(new Date(q.timestamp).toDateString()); });
        setActiveDays(actSet);
      } catch (err) { console.error('Dashboard quiz load:', err.message); }
    };
    loadHistory();
  }, [user, profile?.totalQuizzes]);

  /* ── Streak popup: show 1.5s after load, once per session ── */
  useEffect(() => {
    if (!profile) return;
    const already = sessionStorage.getItem('streakPopupShown') === 'true';
    if (already || (profile.streak || 0) < 2) return;
    const t = setTimeout(() => {
      setShowStreakPopup(true);
      sessionStorage.setItem('streakPopupShown', 'true');
    }, 1500);
    return () => clearTimeout(t);
  }, [profile]);

  useEffect(() => { if (profile?.totalQuizzes > 0) refreshProfile(); }, [profile?.totalQuizzes]);

  const loadReport = async () => {
    audioSystem.playClick(); setReportLoading(true); setShowReport(true);
    try {
      const weekH = quizHistory.filter(q => q.timestamp && (Date.now()-new Date(q.timestamp).getTime()) < 7*86400000);
      const res   = await getWeeklyReport(weekH, profile?.streak||0, profile?.xp||0);
      setWeeklyReport(res.data.report);
    } catch { setWeeklyReport('Start the backend server to get your AI weekly report!'); }
    finally { setReportLoading(false); }
  };

  const avgScore      = quizHistory.length ? Math.round(quizHistory.reduce((a,b)=>a+b.score,0)/quizHistory.length) : 0;
  const totalAccuracy = profile?.totalQuestions>0 ? Math.round((profile.totalCorrect/profile.totalQuestions)*100) : 0;
  const xpPct         = Math.round(((profile?.xp||0)%500)/500*100);
  const level         = profile?.level || 1;
  const todayQ        = quizHistory.filter(q => q.timestamp && new Date(q.timestamp).toDateString()===new Date().toDateString()).length;
  const goalPct       = Math.min(100, (todayQ/5)*100);
  const hour          = new Date().getHours();
  const greeting      = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const firstName     = (user?.displayName||'Student').split(' ')[0];
  // Mon=0 .. Sun=6 of current week
  const todayWeekday = new Date().getDay(); // 0=Sun
  const mondayOffset = todayWeekday === 0 ? 6 : todayWeekday - 1;
  const weeklyData    = [0,0,0,0,0,0,0].map((_,i) => {
    const d=new Date(); d.setDate(d.getDate()-mondayOffset+i);
    const cnt = quizHistory.filter(q => q.timestamp && new Date(q.timestamp).toDateString()===d.toDateString()).length;
    return cnt;
  });

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-[1400px] mx-auto w-full">

      {/* Streak popup */}
      {showStreakPopup && (
        <StreakPopup
          streak={profile?.streak || 0}
          activeDays={activeDays}
          onClose={() => setShowStreakPopup(false)}
        />
      )}

      {/* Header */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-12 lg:pt-0">
        <div>
          <h1 className="font-jakarta font-black text-3xl md:text-4xl text-txt">
            {greeting}, {firstName}!
          </h1>
          <p className="text-txt3 text-sm mt-1">{new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-start gap-2 glass-card rounded-full px-4 py-2 text-xs text-txt2 max-w-[200px] shadow-sm">
            <Sparkles size={12} className="text-primary flex-shrink-0" />
            <span className="italic font-medium leading-snug">{quote}</span>
          </div>
          <button onClick={loadReport} disabled={reportLoading}
            className="flex items-center gap-2 text-sm font-semibold glass-card border-primary/20 text-primary rounded-full px-5 py-2 hover:bg-primary/5 hover:border-primary/40 transition-all shadow-sm">
            {reportLoading ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Brain size={16} />}
            AI Weekly Report
          </button>
        </div>
      </motion.div>

      {/* Weekly AI Report */}
      {showReport && (
        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}>
          <div className="glass-card border-primary/30 p-5 flex items-start gap-4 bg-gradient-to-r from-primary/5 to-transparent relative">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 shadow-sm"><Brain size={20} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary mb-1.5">Your AI Weekly Insights</p>
              {reportLoading ? <p className="text-sm text-txt3">Analyzing your performance data...</p>
                : <p className="text-sm text-txt2 leading-relaxed whitespace-pre-wrap">{weeklyReport}</p>}
            </div>
            <button onClick={() => setShowReport(false)} className="text-txt3 hover:text-txt absolute top-4 right-4 p-1"><X size={16} /></button>
          </div>
        </motion.div>
      )}

      {/* Streak banner */}
      {(profile?.streak||0) >= 2 && showStreak && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="bg-gradient-to-r from-amber-500/15 to-transparent border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 z-10">
            <Flame size={26} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0 z-10">
            <p className="font-jakarta font-black text-amber-500 text-lg sm:text-xl tracking-tight">{profile.streak} Day Streak!</p>
            <p className="text-sm text-txt3 font-medium">Your personal best is {profile.longestStreak||0} days.</p>
          </div>
          <div className="hidden md:flex gap-1 flex-shrink-0 z-10">
            {Array.from({length:Math.min(profile.streak,7)}).map((_,i)=>(
              <motion.div key={i} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:i*0.1 }}>
                <Flame size={20} className="text-amber-500 opacity-70" />
              </motion.div>
            ))}
          </div>
          <button onClick={() => { setShowStreak(false); sessionStorage.setItem('streakBannerDismissed', 'true'); }} className="z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-amber-500/10 transition-colors text-amber-500/60 hover:text-amber-500">
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Spaced repetition */}
      {spacedTopics.length > 0 && showSpaced && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="glass-card border-red-500/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-red-400 flex items-center gap-2"><AlertTriangle size={16} />Needs Review (Spaced Repetition)</p>
            <button onClick={() => { setShowSpaced(false); sessionStorage.setItem('needsReviewDismissed', 'true'); }} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500/10 transition-colors text-red-400/60 hover:text-red-400">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {spacedTopics.map((t,i) => (
              <Link key={i} to={`/app/study-sessions?subject=${encodeURIComponent(t.subject)}&topic=${encodeURIComponent(t.topic)}`}>
                <div className="flex items-center gap-2 text-sm font-medium bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 hover:bg-red-500/20 hover:border-red-500/40 transition-all cursor-pointer shadow-sm">
                  <Clock size={13} className="text-red-400 flex-shrink-0" />
                  <span className="text-txt">{t.topic}</span>
                  <ArrowRight size={14} className="text-red-400" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { icon:Zap,      color:'#0EA5E9', val:profile?.xp||0,           label:'Total XP',       sub:`Level ${level}`,          pct:xpPct },
          { icon:Flame,    color:'#F59E0B', val:profile?.streak||0,       label:'Day Streak',     sub:'Keep going!',           pct:Math.min(100,(profile?.streak||0)*10) },
          { icon:Target,   color:'#10B981', val:null,                     label:'Avg Score',      sub:avgScore>0?`${totalAccuracy}% accuracy`:'Take a quiz!', pct:avgScore, display:`${avgScore}%` },
          { icon:BookOpen, color:'#8B5CF6', val:profile?.totalQuizzes||0, label:'Quizzes Taken',  sub:`${profile?.subjects?.length||0} subjects`, pct:Math.min(100,(profile?.totalQuizzes||0)*4) },
        ].map(({ icon:Icon, color, val, label, sub, pct, display }, i) => (
          <motion.div key={label}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
            whileHover={{ y:-4, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)' }}
            className="glass-card p-5 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom left, ${color}20, transparent)` }} />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background:`${color}20`, color }}>
                <Icon size={24} />
              </div>
              <RingProgress pct={pct} color={color} size={56} stroke={4}>
                <span className="text-[10px] font-bold text-txt">{Math.round(pct)}%</span>
              </RingProgress>
            </div>
            <div className="relative z-10">
              <div className="font-jakarta font-black text-3xl tracking-tight text-txt drop-shadow-sm mb-1">
                {display || <AnimNum target={val||0} />}
              </div>
              <div className="text-sm font-medium text-txt2">{label}</div>
              <div className="text-xs font-medium mt-1 text-txt3">{sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Subject Progress + Right column */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="xl:col-span-2 glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-jakarta font-bold text-lg flex items-center gap-2"><BarChart2 size={18} className="text-cyan" />Subject Mastery</h2>
            <Link to="/app/quiz" onClick={() => audioSystem.playClick()} className="text-sm font-bold text-primary hover:text-primary-light transition-colors">Practice now →</Link>
          </div>
          {subjectProgress.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <div className="w-20 h-20 bg-space-800 rounded-full flex items-center justify-center mb-4 shadow-sm"><BookOpen size={36} className="text-txt3" /></div>
              <p className="text-txt font-medium mb-1">No data yet</p>
              <p className="text-txt3 text-sm mb-5 max-w-xs">Take a quiz or complete a study session to see your subject mastery here.</p>
              <Link to="/app/quiz" onClick={() => audioSystem.playClick()}><button className="btn-primary text-sm px-6 py-2.5">Start a Quiz</button></Link>
            </div>
          ) : (
            <div className="space-y-5 flex-1">
              {subjectProgress.map(({ subject, averageScore, totalQuizzes }) => {
                const c = averageScore>=80?'#10B981':averageScore>=60?'#0EA5E9':'#F59E0B';
                return (
                  <div key={subject}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-bold text-txt">{subject}</span>
                      <span className="text-xs font-semibold text-txt2"><span className="text-txt3 mr-2">{totalQuizzes} quizzes</span> <span style={{ color:c }}>{averageScore}% avg</span></span>
                    </div>
                    <div className="h-2.5 bg-space-800 rounded-full overflow-hidden shadow-inner">
                      <motion.div initial={{ width:0 }} animate={{ width:`${averageScore}%` }} transition={{ duration:1, delay:0.3 }}
                         className="h-full rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] relative" style={{ background: c }}>
                           <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
            className="glass-card p-6 flex-1 flex flex-col justify-center">
            <h2 className="font-jakarta font-bold text-sm mb-5 flex items-center gap-2 text-txt2"><Target size={16} className="text-amber-500" />Daily Goal</h2>
            <div className="flex items-center justify-center gap-6">
              <RingProgress pct={goalPct} color="#F59E0B" size={80} stroke={6}>
                <span className="text-sm font-black text-txt">{Math.round(goalPct)}%</span>
              </RingProgress>
              <div>
                <p className="font-jakarta font-black text-3xl text-txt">{todayQ}<span className="text-lg text-txt3 font-bold"> / 5</span></p>
                <p className="text-sm font-medium text-txt2 mt-1">Quizzes today</p>
                {todayQ>=5 ? <p className="text-xs text-green-500 mt-2 font-bold bg-green-500/10 inline-block px-2 py-1 rounded-md flex items-center gap-1"><CheckCircle size={12} /> Goal Met!</p>
                  : <p className="text-xs text-amber-500 mt-2 font-bold bg-amber-500/10 inline-block px-2 py-1 rounded-md">{5-todayQ} left to hit goal</p>}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            className="glass-card p-6 flex-1 flex flex-col justify-end">
            <h2 className="font-jakarta font-bold text-sm mb-5 flex items-center gap-2 text-txt2"><TrendingUp size={16} className="text-primary" />Weekly Activity</h2>
            <div className="flex items-end gap-2 h-20 w-full">
              {weeklyData.map((v,i) => {
                const max=Math.max(...weeklyData,1);
                const days=['M','T','W','T','F','S','S'];
                const isToday = i === 6;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full relative flex items-end justify-center h-full">
                      <motion.div initial={{ height:0 }} animate={{ height:`${Math.max(10,(v/max)*100)}%` }}
                        transition={{ duration:0.8, delay:i*0.06 }}
                        className={`w-full max-w-[20px] rounded-sm transition-all ${isToday ? 'bg-primary shadow-glow-primary' : 'bg-primary/30 group-hover:bg-primary/50'}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${isToday ? 'text-txt' : 'text-txt3'}`}>{days[i]}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Activity Calendar */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
        className="glass-card p-6 overflow-hidden">
        <StreakCalendar />
      </motion.div>

      {/* Quick Actions + Tip */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.38 }}
          className="xl:col-span-2 glass-card p-6">
          <h2 className="font-jakarta font-bold text-lg mb-5 flex items-center gap-2"><Zap size={18} className="text-cyan" />Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { to:'/app/tutor',          icon:MessageSquare, label:'AI Tutor',      sub:'Ask anything',      color:'#8B5CF6' },
              { to:'/app/quiz',           icon:FileQuestion,  label:'Quick Quiz',    sub:'Test knowledge',    color:'#F59E0B' },
              { to:'/app/study-sessions', icon:BookOpen,      label:'Study Session', sub:'Learn then quiz',   color:'#14B8A6' },
              { to:'/app/goals',          icon:Target,        label:'My Goals',      sub:'Track progress',    color:'#10B981' },
            ].map(({ to, icon:Icon, label, sub, color }) => (
              <Link key={to} to={to} onClick={() => audioSystem.playClick()}>
                <motion.div whileHover={{ y:-4, scale:1.02, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} whileTap={{ scale:0.97 }}
                  className="flex flex-col gap-3 p-4 rounded-2xl bg-space-800 transition-all cursor-pointer h-full"
                  style={{ border: `1px solid rgba(255,255,255,0.06)`, boxShadow: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color + '4D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background:`${color}20` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-txt">{label}</p>
                    <p className="text-xs font-medium text-txt3 mt-0.5">{sub}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.42 }}
          className="glass-card p-6 relative overflow-hidden bg-gradient-to-br from-space-card to-space-900 flex flex-col justify-center">

          <h2 className="font-jakarta font-bold text-sm mb-4 flex items-center gap-2 text-txt2"><Lightbulb size={16} className="text-amber-400" />Study Tip of the Day</h2>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center flex-shrink-0"><Lightbulb size={20} className="text-amber-400" /></div>
            <p className="text-sm font-medium text-txt leading-relaxed">{tip.tip}</p>
          </div>
        </motion.div>
      </div>

      {/* Start Studying + Recent Quizzes + Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}
          className="glass-card p-6">
          <h2 className="font-jakarta font-bold text-lg mb-5 flex items-center gap-2"><BookOpen size={18} className="text-green-400" />Jump Back In</h2>
          <div className="grid grid-cols-3 gap-3">
            {SUBJECTS.map(({ name, color, lucideIcon: LI }) => {
              const IconMap = { Calculator, FlaskConical, Zap, Microscope, Monitor, Globe };
              const SubIcon = IconMap[LI] || BookOpen;
              return (
                <Link key={name} to={`/app/study-sessions?subject=${encodeURIComponent(name)}`} onClick={() => audioSystem.playClick()}>
                  <motion.div whileHover={{ y:-2 }} className="flex flex-col items-center justify-center p-3 rounded-xl bg-space-800 cursor-pointer transition-all aspect-square"
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: color + '20' }}>
                      <SubIcon size={16} style={{ color }} />
                    </div>
                    <span className="text-[10px] font-bold text-txt2 text-center leading-tight">{name}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.47 }}
          className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-jakarta font-bold text-lg flex items-center gap-2"><Clock size={18} className="text-primary" />Recent Quizzes</h2>
            <Link to="/app/quiz" className="text-xs font-bold text-primary hover:text-primary-light transition-colors">See all →</Link>
          </div>
          {quizHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 mb-3 rounded-xl bg-space-800 flex items-center justify-center"><FileQuestion size={22} className="text-txt3" /></div>
              <p className="text-sm font-medium text-txt2 mb-4">No quizzes taken yet.</p>
              <Link to="/app/quiz" onClick={() => audioSystem.playClick()}><button className="btn-primary text-xs py-2 px-5 shadow-sm">Take a Quiz</button></Link>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {quizHistory.slice(0,5).map(q => {
                const sc = q.score >= 80 ? { c:'#10B981', bg:'#10B98115' } : q.score >= 50 ? { c:'#F59E0B', bg:'#F59E0B15' } : { c:'#EF4444', bg:'#EF444415' };
                return (
                  <div key={q.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors hover:bg-white/[0.03] cursor-default"
                    style={{ borderLeft: `3px solid ${sc.c}` }}>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm" style={{ background: sc.bg, color: sc.c }}>{q.score}%</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-txt truncate">{q.topic}</p>
                      <p className="text-[11px] font-medium text-txt3 mt-0.5">{q.subject}</p>
                    </div>
                    <span className="text-[10px] font-medium text-txt3 flex-shrink-0">{q.timestamp ? new Date(q.timestamp).toLocaleDateString('en-IN',{month:'short',day:'numeric'}) : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.49 }}
          className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-jakarta font-bold text-lg flex items-center gap-2"><Trophy size={18} className="text-amber-500" />Badges</h2>
            <Link to="/app/achievements" className="text-xs font-bold text-primary hover:text-primary-light transition-colors">Gallery →</Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-3">
            {ALL_BADGES.slice(0,12).map((badge, i) => {
              const earned = (profile?.badges||[]).some(b => b.id === badge.id);
              const BI = badge.Icon;
              return (
                <motion.div key={badge.id}
                  initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:i*0.05 }}
                  whileHover={earned ? { scale:1.1 } : {}} title={badge.name}
                  className="aspect-square rounded-xl flex items-center justify-center relative"
                  style={{ 
                    background: earned ? badge.color + '1E' : 'var(--space-800)', 
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: earned ? 'pointer' : 'default'
                  }}>
                  <BI size={badge.size === 'large' ? 24 : 20} 
                    style={{ color: earned ? badge.color : '#888' }} 
                    fill={badge.filled && earned ? badge.color : 'none'}
                    className={!earned ? 'grayscale opacity-35' : ''} 
                  />
                  {earned ? (
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-space-900 flex items-center justify-center">
                      <CheckCircle size={10} className="text-green-500" />
                    </div>
                  ) : (
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded bg-space-900 flex items-center justify-center text-txt3 opacity-60">
                      <Lock size={8} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, CheckCircle, Circle, Zap, Trophy } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import { playCreate, playClick, playGoalComplete } from '../utils/soundEffects';
import { triggerConfetti } from '../utils/confetti';
import toast from 'react-hot-toast';

const GOALS_KEY       = 'brainnex-study-goals';
const PERIODS         = ['daily','week','month'];
const TYPES           = ['quiz','streak','xp','custom'];
const SUBJECTS        = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Economics'];
const GOAL_TEMPLATES  = [
  { title:'Complete 5 quizzes this week',       type:'quiz',   target:5,   period:'week',  icon:'📝' },
  { title:'Maintain a 7-day streak',            type:'streak', target:7,   period:'month', icon:'🔥' },
  { title:'Earn 500 XP this week',              type:'xp',     target:500, period:'week',  icon:'⚡' },
  { title:'Complete 10 quizzes this month',     type:'quiz',   target:10,  period:'month', icon:'🏆' },
  { title:'Maintain a 3-day streak',            type:'streak', target:3,   period:'week',  icon:'🎯' },
  { title:'Earn 1000 XP this month',            type:'xp',     target:1000,period:'month', icon:'🌟' },
];

function loadGoals() { try { return JSON.parse(localStorage.getItem(GOALS_KEY)||'[]'); } catch { return []; } }
function saveGoals(g) { localStorage.setItem(GOALS_KEY, JSON.stringify(g)); }

/** Compute real progress for a goal */
function computeProgress(goal, profile, quizHistory) {
  if (!goal) return 0;
  const now   = Date.now();
  const range = goal.period === 'daily' ? 86400000 : goal.period === 'week' ? 7*86400000 : 30*86400000;

  if (goal.type === 'quiz') {
    const count = quizHistory.filter(q => {
      if (!q.timestamp) return false;
      return (now - new Date(q.timestamp).getTime()) <= range;
    }).length;
    return Math.min(100, Math.round((count / goal.target) * 100));
  }
  if (goal.type === 'streak') {
    return Math.min(100, Math.round(((profile?.streak||0) / goal.target) * 100));
  }
  if (goal.type === 'xp') {
    // XP earned in the period (approximate using profile xp vs target)
    return Math.min(100, Math.round(((profile?.xp||0) / goal.target) * 100));
  }
  if (goal.type === 'custom') {
    return goal.completed ? 100 : 0;
  }
  return 0;
}

function GoalCard({ goal, profile, quizHistory, onDelete, onToggle }) {
  const pct   = computeProgress(goal, profile, quizHistory);
  const done  = pct >= 100;
  const color = done ? '#34d399' : pct >= 50 ? '#00e5ff' : '#ffb830';
  const r = 22; const circ = 2*Math.PI*r;

  // Fire celebration when newly completed
  const prevPct = React.useRef(pct);
  useEffect(() => {
    if (pct >= 100 && prevPct.current < 100) {
      playGoalComplete();
      triggerConfetti({ duration:2000, particleCount:60 });
      toast.success(`🎯 Goal completed: ${goal.title}!`, { duration:4000 });
    }
    prevPct.current = pct;
  }, [pct]);

  return (
    <motion.div whileHover={{ y:-2 }}
      className={`glass border rounded-2xl p-5 relative group transition-all ${done ? 'border-neon-green/30 bg-neon-green/5' : 'border-brand-border hover:border-brand-border2'}`}>
      <button onClick={() => { playClick(); onDelete(goal.id); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
        <Trash2 size={11} />
      </button>

      <div className="flex items-center gap-4 mb-4">
        {/* Ring */}
        <div className="relative flex-shrink-0" style={{ width:52, height:52 }}>
          <svg width={52} height={52} className="-rotate-90">
            <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
            <motion.circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset:circ }}
              animate={{ strokeDashoffset: circ - (circ * pct / 100) }}
              transition={{ duration:1.2, delay:0.2 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl">{goal.icon||'🎯'}</div>
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <p className="font-semibold text-sm leading-tight mb-1">{goal.title}</p>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 capitalize">{goal.period}</span>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 capitalize">{goal.type}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/40">{done ? '✅ Completed!' : `Progress: ${pct}%`}</span>
          <span className="font-bold" style={{ color }}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: color }}
            initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1.2 }} />
        </div>
        {/* Show actual value for context */}
        <p className="text-[10px] text-white/25 mt-1.5">
          {goal.type==='quiz'   && `${quizHistory.filter(q => q.timestamp && (Date.now()-new Date(q.timestamp).getTime()) <= (goal.period==='week'?604800000:2592000000)).length} / ${goal.target} quizzes`}
          {goal.type==='streak' && `${profile?.streak||0} / ${goal.target} day streak`}
          {goal.type==='xp'     && `${(profile?.xp||0).toLocaleString()} / ${goal.target.toLocaleString()} XP`}
          {goal.type==='custom' && (goal.completed ? 'Marked complete' : 'Not marked yet')}
        </p>
      </div>

      {goal.type === 'custom' && (
        <button onClick={() => { playClick(); onToggle(goal.id); }}
          className={`mt-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${goal.completed ? 'bg-neon-green/20 border-neon-green/30 text-neon-green' : 'border-brand-border text-white/40 hover:border-brand-border2'}`}>
          {goal.completed ? <><CheckCircle size={11} />Completed!</> : <><Circle size={11} />Mark complete</>}
        </button>
      )}
    </motion.div>
  );
}

export default function StudyGoalsPage() {
  const { user }    = useAuth();
  const { profile } = useUserData();
  const [goals,       setGoals]       = useState(loadGoals);
  const [quizHistory, setQuizHistory] = useState([]);
  const [showCreate,  setShowCreate]  = useState(false);
  const [form, setForm] = useState({ title:'', type:'quiz', target:5, period:'week', icon:'🎯' });

  // Load quiz history for progress computation
  useEffect(() => {
    if (!user?.uid) return;
    getDocs(collection(db, 'quizResults', user.uid, 'results')).then(snap => {
      setQuizHistory(snap.docs.map(d => ({
        ...d.data(),
        timestamp: d.data().timestamp?.toDate?.()?.toISOString() || null,
      })));
    }).catch(() => {});
  }, [user, profile?.totalQuizzes]);

  useEffect(() => { saveGoals(goals); }, [goals]);

  const addTemplate = (t) => {
    playCreate();
    setGoals(prev => [{ ...t, id:Date.now().toString(), createdAt:new Date().toISOString(), completed:false }, ...prev]);
    toast.success('Goal added!');
  };

  const createGoal = () => {
    if (!form.title.trim()) { toast.error('Enter a title'); return; }
    playCreate();
    setGoals(prev => [{ ...form, id:Date.now().toString(), createdAt:new Date().toISOString(), completed:false }, ...prev]);
    setShowCreate(false);
    setForm({ title:'', type:'quiz', target:5, period:'week', icon:'🎯' });
    toast.success('Goal created!');
  };

  const deleteGoal = (id) => {
    playClick();
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const toggleGoal = (id) => {
    playClick();
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed:!g.completed } : g));
  };

  const completedCount = goals.filter(g => computeProgress(g, profile, quizHistory) >= 100).length;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 pt-12 lg:pt-0">
        <div>
          <h1 className="font-syne font-black text-2xl md:text-3xl mb-1">Study Goals</h1>
          <p className="text-white/40 text-sm">Set targets, track real progress automatically</p>
        </div>
        <button onClick={() => { playClick(); setShowCreate(true); }} className="btn-cyan flex items-center gap-2 text-sm py-2.5">
          <Plus size={15} />New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon:'🎯', label:'Total',     val:goals.length },
          { icon:'⚡', label:'In Progress',val:goals.filter(g=>{ const p=computeProgress(g,profile,quizHistory); return p>0&&p<100; }).length },
          { icon:'✅', label:'Completed', val:completedCount },
        ].map(({ icon, label, val }) => (
          <div key={label} className="glass border border-brand-border rounded-xl p-4 text-center">
            <div className="text-xl mb-1">{icon}</div>
            <div className="font-syne font-black text-xl text-cyan">{val}</div>
            <div className="text-[10px] text-white/30">{label}</div>
          </div>
        ))}
      </div>

      {/* Goals grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} profile={profile} quizHistory={quizHistory} onDelete={deleteGoal} onToggle={toggleGoal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <p className="font-syne font-bold text-xl mb-2">No goals yet</p>
          <p className="text-white/40 text-sm mb-5">Set your first study goal to start tracking real progress.</p>
        </div>
      )}

      {/* Templates */}
      <div>
        <h2 className="font-syne font-bold text-base mb-3 flex items-center gap-2"><Zap size={15} className="text-cyan" />Quick Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GOAL_TEMPLATES.map((t, i) => (
            <motion.div key={i} whileHover={{ y:-2 }}
              className="glass border border-brand-border rounded-xl p-4 cursor-pointer hover:border-brand-border2 transition-all"
              onClick={() => addTemplate(t)}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-xs font-semibold leading-tight">{t.title}</p>
                  <p className="text-[10px] text-white/30 mt-0.5 capitalize">{t.period} · {t.type}</p>
                </div>
              </div>
              <p className="text-xs text-cyan font-semibold">+ Add goal</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}
              className="glass border border-brand-border2 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto">
              <h2 className="font-syne font-bold text-xl mb-5">Create Goal</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Goal Title</label>
                  <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                    placeholder="e.g. Score 90% on 5 physics quizzes" className="input-dark w-full text-sm" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {['🎯','📝','🔥','⚡','🏆','🧠','📚','💯','🌟','🎓'].map(e => (
                      <button key={e} onClick={() => setForm(f=>({...f,icon:e}))}
                        className={`w-9 h-9 rounded-xl text-xl transition-all ${form.icon===e ? 'bg-cyan/20 border border-cyan/40' : 'bg-white/[0.04] hover:bg-white/[0.08]'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map(t => (
                      <button key={t} onClick={() => setForm(f=>({...f,type:t}))}
                        className={`py-2 rounded-xl text-xs capitalize border transition-all ${form.type===t ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'border-brand-border text-white/40'}`}>
                        {t==='quiz' ? '📝 Quizzes' : t==='streak' ? '🔥 Streak' : t==='xp' ? '⚡ XP' : '🎯 Custom'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Period</label>
                  <div className="flex gap-2">
                    {PERIODS.map(p => (
                      <button key={p} onClick={() => setForm(f=>({...f,period:p}))}
                        className={`flex-1 py-2 rounded-xl text-xs capitalize border transition-all ${form.period===p ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'border-brand-border text-white/40'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {form.type !== 'custom' && (
                  <div>
                    <label className="text-xs font-medium text-white/50 mb-1.5 block">Target: <span className="text-cyan">{form.target}</span></label>
                    <input type="range" min={1} max={form.type==='xp'?5000:form.type==='streak'?100:50} value={form.target}
                      onChange={e => setForm(f=>({...f,target:+e.target.value}))} className="w-full accent-cyan" />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCreate(false)} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
                <button onClick={createGoal} className="flex-1 btn-cyan py-2.5 text-sm">Create Goal</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

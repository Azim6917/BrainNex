import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, CheckCircle, Circle, Calendar, Zap, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserData } from '../context/UserDataContext';

const GOALS_KEY = 'brainnex-study-goals';
const GOAL_TEMPLATES = [
  { title: 'Complete 5 quizzes this week',      type: 'quiz',    target: 5,   period: 'week',  icon: '📝' },
  { title: 'Study Physics for 7 days straight', type: 'streak',  target: 7,   period: 'month', icon: '🔥' },
  { title: 'Score above 80% on 3 quizzes',      type: 'score',   target: 3,   period: 'week',  icon: '🎯' },
  { title: 'Master Mathematics basics',         type: 'subject', target: 100, period: 'month', icon: '🧮' },
  { title: 'Earn 500 XP this week',             type: 'xp',      target: 500, period: 'week',  icon: '⚡' },
  { title: 'Complete 10 quizzes this month',    type: 'quiz',    target: 10,  period: 'month', icon: '🏆' },
];

function loadGoals() {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || '[]'); } catch { return []; }
}
function saveGoals(goals) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

const TYPES    = ['quiz', 'streak', 'score', 'xp', 'subject', 'custom'];
const PERIODS  = ['daily', 'week', 'month'];
const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History'];

function GoalCard({ goal, profile, quizCount, onDelete, onToggle }) {
  // Calculate progress based on goal type
  let progress = 0;
  if (goal.type === 'quiz')    progress = Math.min(100, Math.round(((goal.currentProgress || 0) / goal.target) * 100));
  if (goal.type === 'streak')  progress = Math.min(100, Math.round(((profile?.streak||0) / goal.target) * 100));
  if (goal.type === 'xp')      progress = Math.min(100, Math.round(((profile?.xp||0) / goal.target) * 100));
  if (goal.type === 'custom')  progress = goal.completed ? 100 : Math.min(100, goal.currentProgress || 0);

  const color  = progress >= 100 ? '#34d399' : progress >= 50 ? '#00e5ff' : '#ffb830';
  const r      = 20;
  const circ   = 2 * Math.PI * r;

  return (
    <motion.div whileHover={{ y: -2 }}
      className={`glass border rounded-2xl p-4 relative group transition-all ${progress >= 100 ? 'border-neon-green/30 bg-neon-green/5' : 'border-brand-border hover:border-brand-border2'}`}>
      <button onClick={() => onDelete(goal.id)}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-xs">
        <Trash2 size={11} />
      </button>

      <div className="flex items-start gap-3">
        {/* Ring progress */}
        <div className="relative flex-shrink-0" style={{ width:48, height:48 }}>
          <svg width={48} height={48} className="-rotate-90">
            <circle cx={24} cy={24} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3.5} />
            <motion.circle cx={24} cy={24} r={r} fill="none" stroke={color} strokeWidth={3.5}
              strokeLinecap="round" strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - (circ * progress / 100) }}
              transition={{ duration: 1, delay: 0.3 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg">{goal.icon || '🎯'}</div>
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <p className="font-semibold text-sm leading-tight mb-0.5">{goal.title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 capitalize">{goal.period}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 capitalize">{goal.type}</span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/40">Progress</span>
          <span className="font-bold" style={{ color }}>{progress}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: color }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} />
        </div>
      </div>

      {/* For custom goals — manual toggle */}
      {goal.type === 'custom' && (
        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => onToggle(goal.id)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${goal.completed ? 'bg-neon-green/20 border-neon-green/30 text-neon-green' : 'border-brand-border text-white/40 hover:border-brand-border2'}`}>
            {goal.completed ? <><CheckCircle size={11} />Completed!</> : <><Circle size={11} />Mark done</>}
          </button>
        </div>
      )}

      {progress >= 100 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-neon-green">
          <CheckCircle size={12} /><span className="font-semibold">Goal achieved! 🎉</span>
        </div>
      )}
    </motion.div>
  );
}

export default function StudyGoalsPage() {
  const { profile } = useUserData();
  const [goals,      setGoals]      = useState(loadGoals);
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState({
    title:'', type:'quiz', target:5, period:'week', icon:'🎯', subject:''
  });

  // Persist goals
  useEffect(() => { saveGoals(goals); }, [goals]);

  // Auto-update quiz-based goals from profile
  useEffect(() => {
    if (!profile) return;
    setGoals(prev => prev.map(g => {
      if (g.type === 'xp')     return { ...g, currentProgress: profile.xp || 0 };
      if (g.type === 'streak') return { ...g, currentProgress: profile.streak || 0 };
      return g;
    }));
  }, [profile?.xp, profile?.streak]);

  const addFromTemplate = (template) => {
    const newGoal = {
      ...template,
      id:              Date.now().toString(),
      createdAt:       new Date().toISOString(),
      currentProgress: 0,
      completed:       false,
    };
    setGoals(prev => [newGoal, ...prev]);
    toast.success('Goal added!');
  };

  const createCustomGoal = () => {
    if (!form.title.trim()) { toast.error('Enter a goal title'); return; }
    const newGoal = {
      ...form,
      id:              Date.now().toString(),
      createdAt:       new Date().toISOString(),
      currentProgress: 0,
      completed:       false,
    };
    setGoals(prev => [newGoal, ...prev]);
    setShowCreate(false);
    setForm({ title:'', type:'quiz', target:5, period:'week', icon:'🎯', subject:'' });
    toast.success('Goal created!');
  };

  const deleteGoal  = (id) => { setGoals(prev => prev.filter(g => g.id !== id)); };
  const toggleGoal  = (id) => { setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed, currentProgress: !g.completed ? g.target : 0 } : g)); };

  const done    = goals.filter(g => g.type === 'custom' ? g.completed : (g.type === 'xp' ? (profile?.xp||0) >= g.target : (g.type === 'streak' ? (profile?.streak||0) >= g.target : false))).length;
  const active  = goals.filter(g => !g.completed).length;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 pt-10 lg:pt-0">
        <div>
          <h1 className="font-syne font-black text-2xl md:text-3xl mb-1">Study Goals</h1>
          <p className="text-white/40 text-sm">Set targets, track progress, stay motivated</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-cyan flex items-center gap-2 text-sm py-2.5">
          <Plus size={15} />New Goal
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon:'🎯', label:'Total Goals',  val: goals.length },
          { icon:'⚡', label:'Active',        val: active       },
          { icon:'✅', label:'Completed',     val: done         },
        ].map(({ icon, label, val }) => (
          <div key={label} className="glass border border-brand-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="font-syne font-black text-xl text-cyan">{val}</div>
            <div className="text-[10px] text-white/30">{label}</div>
          </div>
        ))}
      </div>

      {/* Active goals */}
      {goals.length > 0 ? (
        <div className="mb-8">
          <h2 className="font-syne font-bold text-base mb-3">My Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(g => (
              <GoalCard key={g.id} goal={g} profile={profile} onDelete={deleteGoal} onToggle={toggleGoal} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <p className="font-syne font-bold text-xl mb-2">No goals yet</p>
          <p className="text-white/40 text-sm mb-5">Set your first study goal to stay motivated and track your progress.</p>
        </div>
      )}

      {/* Templates */}
      <div>
        <h2 className="font-syne font-bold text-base mb-3 flex items-center gap-2">
          <Zap size={15} className="text-cyan" />Quick Goal Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GOAL_TEMPLATES.map((t, i) => (
            <motion.div key={i} whileHover={{ y: -2 }}
              className="glass border border-brand-border rounded-xl p-4 cursor-pointer hover:border-brand-border2 transition-all"
              onClick={() => addFromTemplate(t)}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-xs font-semibold leading-tight">{t.title}</p>
                  <p className="text-[10px] text-white/30 mt-0.5 capitalize">{t.period} · {t.type}</p>
                </div>
              </div>
              <div className="text-xs text-cyan font-semibold">+ Add this goal</div>
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
              className="glass border border-brand-border2 rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="font-syne font-bold text-xl mb-5">Create Custom Goal</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Goal Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Score 90% on 5 physics quizzes"
                    className="input-dark w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {['🎯','📝','🔥','⚡','🏆','🧠','📚','💯','🌟','🎓'].map(e => (
                      <button key={e} onClick={() => setForm(f => ({ ...f, icon:e }))}
                        className={`w-9 h-9 rounded-xl text-xl transition-all ${form.icon===e ? 'bg-cyan/20 border border-cyan/40' : 'bg-white/[0.04] hover:bg-white/[0.08]'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TYPES.map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, type:t }))}
                        className={`py-2 rounded-xl text-xs capitalize border transition-all ${form.type===t ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'border-brand-border text-white/40'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Period</label>
                  <div className="flex gap-2">
                    {PERIODS.map(p => (
                      <button key={p} onClick={() => setForm(f => ({ ...f, period:p }))}
                        className={`flex-1 py-2 rounded-xl text-xs capitalize border transition-all ${form.period===p ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'border-brand-border text-white/40'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {form.type !== 'custom' && (
                  <div>
                    <label className="text-xs font-medium text-white/50 mb-1.5 block">Target: {form.target}</label>
                    <input type="range" min={1} max={100} value={form.target}
                      onChange={e => setForm(f => ({ ...f, target:+e.target.value }))}
                      className="w-full accent-cyan" />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCreate(false)} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
                <button onClick={createCustomGoal} className="flex-1 btn-cyan py-2.5 text-sm">Create Goal</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

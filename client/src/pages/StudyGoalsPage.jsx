import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Trash2, CheckCircle, Circle, Zap, Trophy, Flame,
  BookOpen, Star, Clock, BarChart2, TrendingUp, Award, Brain,
  Layers, Calendar, X
} from 'lucide-react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import { audioSystem } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';
import toast from 'react-hot-toast';

const GOALS_KEY = 'brainnex-study-goals';
const PERIODS   = ['daily', 'week', 'month'];
const TYPES     = ['quiz', 'streak', 'xp', 'custom'];

// Lucide icon options for the icon picker
const ICON_OPTIONS = [
  { key: 'Target',      component: Target },
  { key: 'BookOpen',    component: BookOpen },
  { key: 'Zap',         component: Zap },
  { key: 'Trophy',      component: Trophy },
  { key: 'Flame',       component: Flame },
  { key: 'Star',        component: Star },
  { key: 'CheckCircle', component: CheckCircle },
  { key: 'Brain',       component: Brain },
  { key: 'Layers',      component: Layers },
  { key: 'Award',       component: Award },
  { key: 'TrendingUp',  component: TrendingUp },
  { key: 'Calendar',    component: Calendar },
];

const TYPE_ICONS = {
  quiz:   BookOpen,
  streak: Flame,
  xp:     Zap,
  custom: Target,
};

const GOAL_TEMPLATES = [
  { title: 'Complete 5 quizzes this week',   type: 'quiz',   target: 5,    period: 'week',  iconKey: 'BookOpen' },
  { title: 'Maintain a 7-day streak',        type: 'streak', target: 7,    period: 'month', iconKey: 'Flame' },
  { title: 'Earn 500 XP this week',          type: 'xp',     target: 500,  period: 'week',  iconKey: 'Zap' },
  { title: 'Complete 10 quizzes this month', type: 'quiz',   target: 10,   period: 'month', iconKey: 'Trophy' },
  { title: 'Maintain a 3-day streak',        type: 'streak', target: 3,    period: 'week',  iconKey: 'Flame' },
  { title: 'Earn 1000 XP this month',        type: 'xp',     target: 1000, period: 'month', iconKey: 'Star' },
];

function loadGoals() {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || '[]'); } catch { return []; }
}
function saveGoals(g) { localStorage.setItem(GOALS_KEY, JSON.stringify(g)); }

function getIconComponent(iconKey) {
  const found = ICON_OPTIONS.find(o => o.key === iconKey);
  return found ? found.component : Target;
}

/**
 * Compute real progress for a goal.
 *
 * KEY FIX: every type now anchors to goal.startedAt so a brand-new goal
 * always starts at 0%, regardless of historical data.
 */
function computeProgress(goal, profile, quizHistory, xpAtStart) {
  if (!goal) return 0;

  const startedAt = goal.startedAt ? new Date(goal.startedAt).getTime() : Date.now();

  if (goal.type === 'quiz') {
    // Only count quizzes completed AFTER this goal was created
    const count = quizHistory.filter(q => {
      if (!q.timestamp) return false;
      const ts = new Date(q.timestamp).getTime();
      return ts >= startedAt;
    }).length;
    return Math.min(100, Math.round((count / goal.target) * 100));
  }

  if (goal.type === 'streak') {
    // Use current streak directly — streak goals are inherently "reach N days"
    // But cap at 0 if streak is less than 1 to avoid negative display
    const current = Math.max(0, profile?.streak || 0);
    return Math.min(100, Math.round((current / goal.target) * 100));
  }

  if (goal.type === 'xp') {
    // XP earned SINCE goal creation = current XP minus XP at start
    const currentXp = profile?.xp || 0;
    const baseline  = typeof xpAtStart === 'number' ? xpAtStart : (goal.xpAtStart || 0);
    const earned    = Math.max(0, currentXp - baseline);
    return Math.min(100, Math.round((earned / goal.target) * 100));
  }

  if (goal.type === 'custom') {
    return goal.completed ? 100 : 0;
  }

  return 0;
}

function GoalCard({ goal, profile, quizHistory, onDelete, onToggle }) {
  const pct  = computeProgress(goal, profile, quizHistory, goal.xpAtStart);
  const done = pct >= 100;
  const color = done ? '#10B981' : pct >= 50 ? 'var(--primary)' : '#F59E0B';
  const r = 26; const circ = 2 * Math.PI * r;

  const IconComp = getIconComponent(goal.iconKey);

  const prevPct = useRef(pct);
  useEffect(() => {
    if (pct >= 100 && prevPct.current < 100) {
      audioSystem.playGoalComplete?.();
      triggerConfetti({ duration: 2000, particleCount: 60 });
      toast.success(`Goal completed: ${goal.title}!`, { duration: 4000 });
    }
    prevPct.current = pct;
  }, [pct, goal.title]);

  // Count quizzes since startedAt for display
  const startedAt = goal.startedAt ? new Date(goal.startedAt).getTime() : Date.now();
  const quizCount = quizHistory.filter(q => {
    if (!q.timestamp) return false;
    return new Date(q.timestamp).getTime() >= startedAt;
  }).length;

  const xpEarned = Math.max(0, (profile?.xp || 0) - (goal.xpAtStart || 0));

  return (
    <motion.div whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}
      className={`glass-card p-6 relative group transition-all shadow-sm ${done ? 'border-green-500/30 bg-green-500/5' : 'border-transparent hover:border-white/10'}`}>
      <button onClick={() => { audioSystem.playClick(); onDelete(goal.id); }}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20">
        <Trash2 size={16} />
      </button>

      <div className="flex items-center gap-5 mb-5">
        <div className="relative flex-shrink-0" style={{ width: 60, height: 60 }}>
          <svg width={60} height={60} className="-rotate-90">
            <circle cx={30} cy={30} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={5} />
            <motion.circle cx={30} cy={30} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - (circ * pct / 100) }}
              transition={{ duration: 1.2, delay: 0.2 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center" style={{ color }}>
            <IconComp size={22} />
          </div>
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <p className={`font-jakarta font-bold text-base leading-tight mb-2 truncate ${done ? 'text-green-500' : 'text-txt'}`}>{goal.title}</p>
          {goal.description && (
            <p className="text-xs text-txt3 mb-2 leading-relaxed line-clamp-2">{goal.description}</p>
          )}
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-txt3">
            <span className="px-2.5 py-1 rounded-md bg-space-800 border border-white/5">{goal.period}</span>
            <span className="px-2.5 py-1 rounded-md bg-space-800 border border-white/5">{goal.type}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
          <span className="text-txt3">{done ? 'Completed!' : `Progress: ${pct}%`}</span>
          <span className="drop-shadow-sm" style={{ color }}>{pct}%</span>
        </div>
        <div className="h-2 bg-space-800 rounded-full overflow-hidden shadow-inner mb-3">
          <motion.div className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}80` }}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2 }} />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-txt3 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg w-fit">
          <Clock size={10} className="text-txt3 opacity-60" />
          {goal.type === 'quiz'   && `${quizCount} / ${goal.target} quizzes since goal start`}
          {goal.type === 'streak' && `${Math.max(0, profile?.streak || 0)} / ${goal.target} day streak`}
          {goal.type === 'xp'    && `${xpEarned.toLocaleString()} / ${goal.target.toLocaleString()} XP earned`}
          {goal.type === 'custom' && (goal.completed ? 'Marked complete' : 'Not marked yet')}
        </div>
      </div>

      {goal.type === 'custom' && (
        <button onClick={() => { audioSystem.playClick(); onToggle(goal.id); }}
          className={`mt-4 flex items-center justify-center gap-2 text-xs font-bold w-full py-3 rounded-xl border transition-all shadow-sm ${goal.completed ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt'}`}>
          {goal.completed ? <><CheckCircle size={16} />Completed!</> : <><Circle size={16} />Mark complete</>}
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
  const [form, setForm] = useState({
    title: '', type: 'quiz', target: 5, period: 'week', iconKey: 'Target', description: ''
  });

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
    audioSystem.playCreate?.();
    const now = new Date().toISOString();
    setGoals(prev => [{
      ...t,
      id: Date.now().toString(),
      startedAt: now,
      createdAt: now,
      completed: false,
      xpAtStart: profile?.xp || 0,
    }, ...prev]);
    toast.success('Goal added!');
  };

  const createGoal = () => {
    if (!form.title.trim()) { toast.error('Enter a title'); return; }
    audioSystem.playCreate?.();
    const now = new Date().toISOString();
    setGoals(prev => [{
      ...form,
      id: Date.now().toString(),
      startedAt: now,
      createdAt: now,
      completed: false,
      xpAtStart: profile?.xp || 0,
    }, ...prev]);
    setShowCreate(false);
    setForm({ title: '', type: 'quiz', target: 5, period: 'week', iconKey: 'Target', description: '' });
    toast.success('Goal created!');
  };

  const deleteGoal = (id) => {
    audioSystem.playClick();
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const toggleGoal = (id) => {
    audioSystem.playClick();
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const completedCount = goals.filter(g =>
    computeProgress(g, profile, quizHistory, g.xpAtStart) >= 100
  ).length;

  const inProgressCount = goals.filter(g => {
    const p = computeProgress(g, profile, quizHistory, g.xpAtStart);
    return p > 0 && p < 100;
  }).length;

  const STATS = [
    { Icon: BarChart2, label: 'Total',       val: goals.length },
    { Icon: TrendingUp, label: 'In Progress', val: inProgressCount },
    { Icon: Trophy,    label: 'Completed',   val: completedCount },
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 pt-2 lg:pt-0 gap-4">
        <div>
          <h1 className="font-jakarta font-black text-2xl md:text-4xl text-txt mb-2">Study Goals</h1>
          <p className="text-sm font-medium text-txt3">Set targets, track real progress automatically</p>
        </div>
        <button onClick={() => { audioSystem.playClick(); setShowCreate(true); }}
          className="btn-primary flex items-center justify-center gap-2 text-sm py-3 px-6 shadow-glow-primary self-start md:self-auto">
          <Plus size={18} />New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
        {STATS.map(({ Icon, label, val }) => (
          <div key={label} className="glass-card p-4 md:p-6 text-center shadow-sm">
            <div className="flex justify-center mb-2 md:mb-3">
              <Icon size={28} className="text-primary opacity-80" />
            </div>
            <div className="font-jakarta font-black text-3xl md:text-4xl text-primary mb-1">{val}</div>
            <div className="text-[9px] md:text-[10px] font-bold text-txt3 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} profile={profile} quizHistory={quizHistory}
              onDelete={deleteGoal} onToggle={toggleGoal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 mb-10 glass-card shadow-sm border-dashed border-border border-2">
          <div className="flex justify-center mb-6">
            <Target size={64} className="text-primary opacity-40" />
          </div>
          <p className="font-jakarta font-black text-2xl mb-2 text-txt">No goals yet</p>
          <p className="text-txt3 text-sm font-medium">Set your first study goal to start tracking real progress.</p>
        </div>
      )}

      {/* Templates */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 bg-cyan rounded-full shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
          <h2 className="font-jakarta font-black text-xl text-txt flex items-center gap-2">
            <Zap size={20} className="text-cyan" />Quick Templates
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
          {GOAL_TEMPLATES.map((t, i) => {
            const TIcon = getIconComponent(t.iconKey);
            return (
              <motion.div key={i} whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}
                className="glass-card p-5 cursor-pointer hover:border-cyan/30 transition-all group shadow-sm border-transparent"
                onClick={() => addTemplate(t)}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TIcon size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight text-txt">{t.title}</p>
                    <p className="text-[10px] font-bold text-txt3 mt-1.5 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="bg-space-800 px-2 py-0.5 rounded-md border border-white/5">{t.period}</span>
                      <span className="bg-space-800 px-2 py-0.5 rounded-md border border-white/5">{t.type}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-cyan font-bold flex items-center gap-1 uppercase tracking-wider group-hover:text-cyan-light">
                  <Plus size={14} /> Add goal
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(5, 8, 22, 0.92)' }}
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto border-primary/20 relative custom-scrollbar">

              {/* Close button */}
              <button onClick={() => setShowCreate(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-space-800 border border-border text-txt3 hover:text-txt flex items-center justify-center transition-all">
                <X size={16} />
              </button>

              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-bl-full pointer-events-none" />
              <h2 className="font-jakarta font-black text-2xl mb-6 text-txt relative z-10">Create Goal</h2>

              <div className="space-y-5 relative z-10">
                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-txt3 mb-2.5 block">Goal Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Score 90% on 5 physics quizzes"
                    className="input-field w-full text-sm py-3" autoFocus />
                </div>

                {/* Icon Picker — Lucide grid */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-txt3 mb-2.5 block">Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {ICON_OPTIONS.map(({ key, component: IconC }) => (
                      <button key={key} title={key}
                        onClick={() => { audioSystem.playClick(); setForm(f => ({ ...f, iconKey: key })); }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm
                          ${form.iconKey === key
                            ? 'bg-primary/20 border border-primary/50 text-primary scale-110'
                            : 'bg-space-800 border border-transparent hover:border-white/10 hover:bg-space-700 text-txt3 hover:text-txt'}`}>
                        <IconC size={18} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-txt3 mb-2.5 block">Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {TYPES.map(t => {
                      const TIcon = TYPE_ICONS[t];
                      return (
                        <button key={t} onClick={() => { audioSystem.playClick(); setForm(f => ({ ...f, type: t })); }}
                          className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all shadow-sm flex items-center justify-center gap-2
                            ${form.type === t
                              ? 'bg-primary/10 border-primary/40 text-primary'
                              : 'bg-space-800 border-border text-txt3 hover:border-white/20'}`}>
                          <TIcon size={14} />
                          {t === 'quiz' ? 'Quizzes' : t === 'streak' ? 'Streak' : t === 'xp' ? 'XP' : 'Custom'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom description — shown only when type === custom */}
                {form.type === 'custom' && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-txt3 mb-2.5 block">
                      Describe your custom goal
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="e.g. Read chapter 5 of my textbook and take notes"
                      rows={3}
                      className="input-field w-full text-sm py-3 resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-txt3 mt-1.5 font-medium">
                      You can manually mark this goal complete when done.
                    </p>
                  </div>
                )}

                {/* Period */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-txt3 mb-2.5 block">Period</label>
                  <div className="flex gap-3">
                    {PERIODS.map(p => (
                      <button key={p} onClick={() => { audioSystem.playClick(); setForm(f => ({ ...f, period: p })); }}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all shadow-sm
                          ${form.period === p
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-space-800 border-border text-txt3 hover:border-white/20'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target — hidden for custom */}
                {form.type !== 'custom' && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-txt3 mb-3 block flex justify-between">
                      <span>Target Value</span>
                      <span className="text-primary text-sm bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 ml-2">{form.target}</span>
                    </label>
                    <input type="range"
                      min={1}
                      max={form.type === 'xp' ? 5000 : form.type === 'streak' ? 100 : 50}
                      value={form.target}
                      onChange={e => setForm(f => ({ ...f, target: +e.target.value }))}
                      className="w-full accent-primary h-2 bg-space-800 rounded-lg appearance-none cursor-pointer" />
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8 relative z-10">
                <button onClick={() => { audioSystem.playClick(); setShowCreate(false); }}
                  className="flex-1 btn-outline py-3.5 text-sm bg-space-800">Cancel</button>
                <button onClick={createGoal}
                  className="flex-1 btn-primary py-3.5 text-sm shadow-glow-primary">Create Goal</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

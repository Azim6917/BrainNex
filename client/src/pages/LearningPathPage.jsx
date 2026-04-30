import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Lock, CheckCircle, Circle, Zap, ChevronDown, Clock } from 'lucide-react';
import { generateLearningPath } from '../utils/api';
import { useUserData } from '../context/UserDataContext';
import { audioSystem } from '../utils/audio';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Economics','Geography','Literature','Psychology'];
const LEVELS   = ['beginner','intermediate','advanced'];

const statusStyles = {
  completed: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', Icon: CheckCircle },
  current:   { bg: 'bg-primary/10',   border: 'border-primary/40',   text: 'text-primary',   Icon: Circle },
  locked:    { bg: 'bg-space-800',    border: 'border-border',       text: 'text-txt3',      Icon: Lock },
};
const levelColors = { beginner: '#10B981', intermediate: '#0EA5E9', advanced: '#8B5CF6' };

function NodeCard({ node, onClick }) {
  const { bg, border, text, Icon } = statusStyles[node.status] || statusStyles.locked;
  return (
    <motion.div
      whileHover={node.status !== 'locked' ? { scale: 1.02, y: -2, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' } : {}}
      whileTap={node.status !== 'locked' ? { scale: 0.98 } : {}}
      onClick={() => {
        if (node.status !== 'locked') {
          audioSystem.playClick();
          onClick(node);
        }
      }}
      className={`relative p-5 rounded-2xl border ${bg} ${border} transition-all shadow-sm
        ${node.status === 'locked' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${node.status === 'current' ? 'ring-1 ring-primary/30 ring-offset-2 ring-offset-space-dark' : ''}`}
    >
      {node.status === 'current' && (
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary border-4 border-space-dark shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-1.5 rounded-lg bg-space-900 ${border} shadow-inner`}>
          <Icon size={16} className={text} />
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm"
          style={{ background: `${levelColors[node.level]}20`, color: levelColors[node.level] }}>
          {node.level}
        </span>
      </div>
      <h3 className={`font-jakarta font-bold text-base mb-1 tracking-tight ${node.status === 'locked' ? 'text-txt3' : 'text-txt'}`}>
        {node.title}
      </h3>
      <p className="text-xs font-medium text-txt3 leading-relaxed mb-4 line-clamp-2">{node.description}</p>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[10px] font-bold text-txt3 uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md">⏱ {node.estimatedMinutes} min</span>
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md shadow-sm">+{node.xpReward} XP</span>
      </div>
    </motion.div>
  );
}

/* ── Custom dark select ── */
function DarkSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { audioSystem.playClick(); setOpen(o => !o); }}
        className="w-full flex items-center justify-between input-field text-sm py-3 px-4 shadow-sm"
      >
        <span className="text-txt font-semibold">{value}</span>
        <ChevronDown size={16} className={`text-txt3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-space-800 border border-border rounded-xl py-1 z-50 shadow-2xl max-h-56 overflow-y-auto custom-scrollbar"
          >
            {options.map(opt => (
              <button key={opt} type="button"
                onClick={() => { audioSystem.playClick(); onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5 font-medium
                  ${opt === value ? 'text-primary bg-primary/5' : 'text-txt2'}`}>
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LearningPathPage() {
  const { subjectProgress } = useUserData();
  const [subject,  setSubject]  = useState('Mathematics');
  const [level,    setLevel]    = useState('intermediate');
  const [pathData, setPathData] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);

  const generate = async () => {
    audioSystem.playClick();
    setLoading(true);
    setPathData(null);
    try {
      const completedTopics = subjectProgress
        .filter(s => s.subject === subject && s.averageScore >= 70)
        .map(s => s.subject);
      const res = await generateLearningPath(subject, level, completedTopics);
      setPathData(res.data);
    } catch { toast.error('Failed to generate path. Please try again.'); }
    finally { setLoading(false); }
  };

  const rows = pathData
    ? pathData.nodes.reduce((acc, n, i) => {
        const r = Math.floor(i / 3);
        if (!acc[r]) acc[r] = [];
        acc[r].push(n);
        return acc;
      }, [])
    : [];

  const completedCount = pathData?.nodes.filter(n => n.status === 'completed').length || 0;

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
      <div className="mb-6 md:mb-8 pt-2 lg:pt-0">
        <h1 className="font-jakarta font-black text-2xl md:text-4xl text-txt mb-2">Learning Path Visualizer</h1>
        <p className="text-sm font-medium text-txt3">AI-generated visual roadmap of topics to master — in the right order</p>
      </div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 md:p-6 mb-6 md:mb-8 flex flex-col sm:flex-row flex-wrap gap-4 md:gap-5 items-start sm:items-end shadow-sm">
        <div className="w-full sm:flex-1 sm:min-w-[200px]">
          <label className="text-xs font-bold text-txt3 uppercase tracking-widest mb-3 block">Subject</label>
          <DarkSelect value={subject} onChange={setSubject} options={SUBJECTS} />
        </div>
        <div className="w-full sm:w-auto">
          <label className="text-xs font-bold text-txt3 uppercase tracking-widest mb-3 block">Level</label>
          <div className="flex gap-2">
            {LEVELS.map(l => (
              <button key={l} onClick={() => { audioSystem.playClick(); setLevel(l); }}
                className={`flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl border capitalize font-bold transition-all shadow-sm
                  ${l === level ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-space-800 border-border text-txt3 hover:border-white/20 hover:text-txt2'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={loading}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 text-sm shadow-glow-primary">
          {loading
            ? <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating...</>
            : <><Map size={18} /> Generate Path</>}
        </button>
      </motion.div>

      {/* Path */}
      {pathData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Topics',  val: pathData.totalTopics,                                           color: '#0EA5E9' },
              { label: 'Completed',     val: completedCount,                                                  color: '#10B981' },
              { label: 'In Progress',   val: 1,                                                               color: '#F59E0B' },
              { label: 'XP Available',  val: pathData.nodes.reduce((a, b) => a + b.xpReward, 0),             color: '#8B5CF6' },
            ].map(({ label, val, color }) => (
              <div key={label} className="glass-card p-5 group hover:-translate-y-1 transition-transform">
                <div className="font-jakarta font-black text-3xl mb-1 drop-shadow-sm" style={{ color }}>{val}</div>
                <div className="text-xs font-bold text-txt3 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="glass-card p-6 mb-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between text-sm mb-3 relative z-10">
              <span className="font-bold text-txt2 uppercase tracking-widest text-xs">Overall Progress</span>
              <span className="font-black text-primary text-lg">
                {Math.round((completedCount / pathData.nodes.length) * 100)}%
              </span>
            </div>
            <div className="h-3 bg-space-800 rounded-full overflow-hidden shadow-inner relative z-10">
              <motion.div className="h-full rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] relative"
                style={{ background: 'var(--primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / pathData.nodes.length) * 100}%` }}
                transition={{ duration: 1 }}>
                 <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
              </motion.div>
            </div>
          </div>

          {/* Nodes */}
          <div className="space-y-8 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-border -translate-x-1/2 hidden md:block z-0" />
            {rows.map((row, rowIdx) => (
              <div key={rowIdx} className="relative z-10">
                {rowIdx > 0 && (
                  <div className="flex justify-center my-6 md:hidden">
                    <div className="flex flex-col items-center gap-1.5">
                      {[0,1,2].map(i => <div key={i} className="w-1 h-3 bg-border rounded-full" />)}
                      <ChevronDown size={16} className="text-txt3 mt-1" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {row.map(node => <NodeCard key={node.id} node={node} onClick={setSelected} />)}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 p-4 glass-card inline-flex mx-auto">
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-green-500/10 border border-green-500/30 flex items-center justify-center"><CheckCircle size={12} className="text-green-500" /></div><span className="text-xs font-bold text-txt3 uppercase tracking-wider">Completed</span></div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/40 flex items-center justify-center"><Circle size={12} className="text-primary" /></div><span className="text-xs font-bold text-txt3 uppercase tracking-wider">Current</span></div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-space-800 border border-border flex items-center justify-center"><Lock size={12} className="text-txt3" /></div><span className="text-xs font-bold text-txt3 uppercase tracking-wider">Locked</span></div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!pathData && !loading && (
        <div className="text-center py-24 glass-card mt-8">
          <div className="w-20 h-20 bg-space-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
            <Map size={32} className="text-primary opacity-80" />
          </div>
          <p className="font-jakarta font-black text-2xl mb-2 text-txt">Generate Your Learning Path</p>
          <p className="text-sm text-txt3 font-medium max-w-md mx-auto leading-relaxed">Select a subject and level, then click Generate to get your AI-powered roadmap to mastery.</p>
        </div>
      )}

      {/* Node detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-space-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card border-primary/20 p-8 max-w-lg w-full relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-bl-full pointer-events-none" />
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-2 text-txt3 hover:text-txt transition-colors">
                ✕
              </button>
              
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg mb-5 shadow-sm"
                style={{ background: `${levelColors[selected.level]}15`, color: levelColors[selected.level], border: `1px solid ${levelColors[selected.level]}30` }}>
                {selected.level}
              </div>
              
              <h2 className="font-jakarta font-black text-2xl mb-3 text-txt pr-8">{selected.title}</h2>
              <p className="text-txt2 text-sm leading-relaxed mb-6 font-medium">{selected.description}</p>
              
              <div className="flex gap-4 text-sm mb-8 bg-space-800 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/5 rounded-md"><Zap size={14} className="text-amber-500" /></div>
                  <span className="font-bold text-amber-500">+{selected.xpReward} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/5 rounded-md"><Clock size={14} className="text-txt2" /></div>
                  <span className="font-bold text-txt2">{selected.estimatedMinutes} min est.</span>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button onClick={() => { audioSystem.playClick(); setSelected(null); }} className="flex-1 btn-outline py-3.5 text-sm bg-space-800 shadow-sm">Close</button>
                <button onClick={() => { audioSystem.playClick(); setSelected(null); }} className="flex-1 btn-primary py-3.5 text-sm shadow-glow-primary">Start Topic →</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

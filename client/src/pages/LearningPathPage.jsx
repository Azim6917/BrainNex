import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Lock, CheckCircle, Circle, Zap, RefreshCw } from 'lucide-react';
import { generateLearningPath } from '../utils/api';
import { useUserData } from '../context/UserDataContext';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Economics'];
const LEVELS   = ['beginner', 'intermediate', 'advanced'];

const statusStyles = {
  completed: { bg: 'bg-neon-green/20', border: 'border-neon-green/50', text: 'text-neon-green', icon: CheckCircle },
  current:   { bg: 'bg-cyan/20',       border: 'border-cyan/50',       text: 'text-cyan',      icon: Circle },
  locked:    { bg: 'bg-white/[0.04]',  border: 'border-brand-border',  text: 'text-white/30',  icon: Lock },
};

const levelColors = { beginner: '#34d399', intermediate: '#00e5ff', advanced: '#a78bfa' };

function NodeCard({ node, onClick }) {
  const { bg, border, text, icon: Icon } = statusStyles[node.status] || statusStyles.locked;
  return (
    <motion.div
      whileHover={node.status !== 'locked' ? { scale: 1.03 } : {}}
      whileTap={node.status !== 'locked' ? { scale: 0.97 } : {}}
      onClick={() => node.status !== 'locked' && onClick(node)}
      className={`relative p-4 rounded-2xl border ${bg} ${border} cursor-pointer transition-all ${node.status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''} ${node.status === 'current' ? 'ring-1 ring-cyan/30' : ''}`}
    >
      {node.status === 'current' && (
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan border-2 border-brand-bg" />
      )}
      <div className="flex items-start justify-between mb-2">
        <Icon size={16} className={text} />
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${levelColors[node.level]}20`, color: levelColors[node.level] }}>
          {node.level}
        </span>
      </div>
      <h3 className={`font-syne font-bold text-sm mb-1 ${node.status === 'locked' ? 'text-white/30' : 'text-white'}`}>{node.title}</h3>
      <p className="text-xs text-white/40 leading-relaxed mb-3">{node.description}</p>
      <div className="flex items-center justify-between text-[10px] text-white/30">
        <span>⏱ {node.estimatedMinutes} min</span>
        <span className="text-neon-amber font-semibold">+{node.xpReward} XP</span>
      </div>
    </motion.div>
  );
}

export default function LearningPathPage() {
  const { profile, subjectProgress } = useUserData();
  const [subject, setSubject]   = useState('Mathematics');
  const [level, setLevel]       = useState('intermediate');
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);

  const generate = async () => {
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

  // Group nodes in rows of 3 for visual flow
  const rows = pathData ? pathData.nodes.reduce((acc, n, i) => {
    const rowIdx = Math.floor(i / 3);
    if (!acc[rowIdx]) acc[rowIdx] = [];
    acc[rowIdx].push(n);
    return acc;
  }, []) : [];

  const completedCount = pathData?.nodes.filter(n => n.status === 'completed').length || 0;
  const totalXP        = pathData?.nodes.filter(n => n.status === 'completed').reduce((a, b) => a + b.xpReward, 0) || 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-syne font-black text-3xl mb-1">Learning Path Visualizer</h1>
        <p className="text-white/40 text-sm">AI-generated visual roadmap of topics to master — in the right order</p>
      </div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass border border-brand-border rounded-2xl p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-white/50 mb-2 block">Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="input-dark w-full text-sm">
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-white/50 mb-2 block">Level</label>
          <div className="flex gap-2">
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l)}
                className={`text-xs px-3 py-2 rounded-xl border capitalize transition-all ${l === level ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'border-brand-border text-white/40 hover:border-brand-border2'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={generate} disabled={loading}
          className="btn-cyan flex items-center gap-2 py-2.5 px-6 text-sm disabled:opacity-50">
          {loading ? <><div className="w-4 h-4 border-2 border-brand-bg/40 border-t-brand-bg rounded-full animate-spin" /> Generating...</>
            : <><Map size={15} /> Generate Path</>}
        </motion.button>
      </motion.div>

      {/* Path visualization */}
      {pathData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Topics', val: pathData.totalTopics, color: '#00e5ff' },
              { label: 'Completed',    val: completedCount,       color: '#34d399' },
              { label: 'In Progress',  val: 1,                    color: '#ffb830' },
              { label: 'XP Available', val: pathData.nodes.reduce((a,b) => a+b.xpReward,0), color: '#a78bfa' },
            ].map(({ label, val, color }) => (
              <div key={label} className="glass border border-brand-border rounded-xl p-4">
                <div className="font-syne font-black text-2xl" style={{ color }}>{val}</div>
                <div className="text-xs text-white/40 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="glass border border-brand-border rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60">Overall Progress</span>
              <span className="font-semibold text-cyan">{Math.round((completedCount / pathData.nodes.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-cyan to-violet-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / pathData.nodes.length) * 100}%` }}
                transition={{ duration: 1 }} />
            </div>
          </div>

          {/* Node grid */}
          <div className="space-y-6">
            {rows.map((row, rowIdx) => (
              <div key={rowIdx}>
                {/* Connector line from previous row */}
                {rowIdx > 0 && (
                  <div className="flex justify-center mb-6">
                    <div className="flex flex-col items-center gap-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="w-px h-2 bg-brand-border" />
                      ))}
                      <div className="text-white/20 text-xs">↓</div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {row.map((node) => (
                    <NodeCard key={node.id} node={node} onClick={setSelected} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-white/40">
            <div className="flex items-center gap-1.5"><CheckCircle size={12} className="text-neon-green" /> Completed</div>
            <div className="flex items-center gap-1.5"><Circle size={12} className="text-cyan" /> Current</div>
            <div className="flex items-center gap-1.5"><Lock size={12} className="text-white/30" /> Locked</div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!pathData && !loading && (
        <div className="text-center py-20 text-white/30">
          <Map size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-syne font-bold text-xl mb-2">Generate Your Learning Path</p>
          <p className="text-sm">Select a subject and level, then click Generate to get your AI-powered roadmap.</p>
        </div>
      )}

      {/* Node detail modal */}
      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
            className="glass border border-brand-border2 rounded-2xl p-6 max-w-md w-full">
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-4`}
              style={{ background: `${levelColors[selected.level]}20`, color: levelColors[selected.level] }}>
              {selected.level}
            </div>
            <h2 className="font-syne font-bold text-xl mb-2">{selected.title}</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-4">{selected.description}</p>
            <div className="flex gap-4 text-sm text-white/40 mb-5">
              <span>⏱ {selected.estimatedMinutes} min</span>
              <span className="text-neon-amber">+{selected.xpReward} XP</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 btn-outline py-2.5 text-sm">Close</button>
              <button className="flex-1 btn-cyan py-2.5 text-sm" onClick={() => setSelected(null)}>Start Topic →</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, Lock, CheckCircle, Circle, Zap, ChevronDown, Clock, X, Trash2, BookOpen, ChevronRight, Layers } from 'lucide-react';
import {
  collection, addDoc, getDocs, query, where, orderBy, doc, getDoc,
  serverTimestamp, deleteDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { generateLearningPath } from '../utils/api';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import { audioSystem } from '../utils/audio';
import { awardBadgeToFirestore } from '../utils/firestoreUtils';
import toast from 'react-hot-toast';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'History', 'Economics', 'Geography', 'Literature', 'Psychology', 'Other',
];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

const GOALS = [
  '🎯 Master the Basics',
  '🚀 Quick Overview',
  '📚 Deep Understanding',
  '🏆 Exam Preparation',
  '💼 Project-Based',
];

const statusStyles = {
  completed: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', Icon: CheckCircle },
  current:   { bg: 'bg-primary/10',   border: 'border-primary/40',   text: 'text-primary',   Icon: Circle },
  locked:    { bg: 'bg-space-800',    border: 'border-border',       text: 'text-txt3',      Icon: Lock },
};
const levelColors = { beginner: '#10B981', intermediate: '#0EA5E9', advanced: '#8B5CF6' };

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Inline saved path row ── */
function SavedPathRow({ path, onLoad, onDelete }) {
  const lc = levelColors[path.level] || '#8B5CF6';
  const completed = path.nodes?.filter(n => n.status === 'completed').length || 0;
  const total     = path.totalTopics || path.nodes?.length || 0;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 flex items-center gap-4 group hover:border-white/10 border-transparent transition-all">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${lc}18` }}>
        <Map size={18} style={{ color: lc }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-bold text-sm text-txt truncate">{path.subject}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded capitalize"
            style={{ background: `${lc}18`, color: lc, border: `1px solid ${lc}30` }}>{path.level}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold text-txt3">
          <span className="flex items-center gap-1"><Layers size={9}/>{total} topics</span>
          <span className="flex items-center gap-1"><CheckCircle size={9}/>{completed} done · {pct}%</span>
          <span className="flex items-center gap-1"><Clock size={9}/>{formatDate(path.createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onLoad(path)}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all">
          Load<ChevronRight size={12}/>
        </button>
        <button onClick={() => onDelete(path)}
          className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
          <Trash2 size={13}/>
        </button>
      </div>
    </motion.div>
  );
}

/* ── Delete confirm ── */
function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,22,0.90)' }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="glass-card p-7 max-w-sm w-full border-red-500/20 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-jakarta font-black text-lg text-txt mb-2">Delete Learning Path?</h3>
        <p className="text-sm text-txt3 mb-6 leading-relaxed">
          Are you sure you want to delete this learning path? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-outline py-3 text-sm bg-space-800">No, keep it</button>
          <button onClick={onConfirm}
            className="flex-1 py-3 text-sm font-bold rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all">
            Yes, delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Node Card ── */
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
    <div className="relative" style={{ zIndex: 100 }}>
      <button
        type="button"
        onClick={() => { audioSystem.playClick(); setOpen(o => !o); }}
        className="w-full flex items-center justify-between input-field text-sm py-3 px-4 shadow-sm"
        style={{ border: '1px solid rgba(139, 92, 246, 0.25)', background: 'var(--bg2)' }}
      >
        <span className="text-txt font-semibold">{value}</span>
        <ChevronDown size={16} className={`text-txt3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl py-1 z-[200] max-h-56 overflow-y-auto custom-scrollbar"
            style={{
              background: 'var(--bg2)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              position: 'absolute',
            }}
          >
            {options.map(opt => (
              <button key={opt} type="button"
                onClick={() => { audioSystem.playClick(); onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-medium
                  ${opt === value ? 'text-primary bg-primary/5' : 'text-txt2'}`}
                style={{ background: opt === value ? 'rgba(139, 92, 246, 0.08)' : undefined }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)'; }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = ''; }}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Duplicate Modal ── */
function DuplicateModal({ subject, level, onLoad, onGenerateNew, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-space-dark/80 backdrop-blur-md z-[300] flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="glass-card p-8 max-w-md w-full relative overflow-hidden shadow-2xl"
        style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-bl-full pointer-events-none" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-txt3 hover:text-txt transition-colors">
          <X size={18} />
        </button>
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
          <Map size={22} className="text-amber-500" />
        </div>
        <h2 className="font-jakarta font-black text-xl mb-2 text-txt">Path Already Exists</h2>
        <p className="text-txt2 text-sm leading-relaxed mb-6">
          You already have a saved path for <span className="font-bold text-primary">{level} {subject}</span>. 
          Would you like to load the existing path or generate a new one?
        </p>
        <div className="flex gap-3">
          <button onClick={onLoad}
            className="flex-1 btn-outline py-3 text-sm"
            style={{ background: 'var(--bg2)' }}>
            Load Existing
          </button>
          <button onClick={onGenerateNew} className="flex-1 btn-primary py-3 text-sm">
            Generate New
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function LearningPathPage() {
  const { subjectProgress } = useUserData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [subject,       setSubject]       = useState('Mathematics');
  const [customSubject, setCustomSubject] = useState('');
  const [level,         setLevel]         = useState('intermediate');
  const [goal,          setGoal]          = useState('🎯 Master the Basics');
  const [pathData,      setPathData]      = useState(null);
  const [savedPathId,   setSavedPathId]   = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [showDupModal,  setShowDupModal]  = useState(false);
  const [dupDoc,        setDupDoc]        = useState(null);
  const [savedPaths,    setSavedPaths]    = useState([]);
  const [pathsLoading,  setPathsLoading]  = useState(true);
  const [toDelete,      setToDelete]      = useState(null); // path object pending deletion
  const [deleting,      setDeleting]      = useState(false);
  const [showPaths,     setShowPaths]     = useState(true);

  /* Load path from SavedPathsPage navigation */
  useEffect(() => {
    if (location.state?.loadedPath) {
      setPathData(location.state.loadedPath);
      setSavedPathId(location.state.pathId || null);
      window.history.replaceState({}, '');
    }
  }, []);

  /* Load all saved paths */
  const loadSavedPaths = async () => {
    if (!user?.uid) return;
    setPathsLoading(true);
    try {
      const q    = query(collection(db, 'users', user.uid, 'savedPaths'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setSavedPaths(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error('loadSavedPaths:', e); }
    finally { setPathsLoading(false); }
  };

  useEffect(() => { loadSavedPaths(); }, [user?.uid]);

  const actualSubject = subject === 'Other' ? customSubject.trim() : subject;

  /* ── Check duplicate (subject + level + goal) ── */
  const checkDuplicate = async () => {
    if (!user?.uid || !actualSubject) return null;
    const q = query(
      collection(db, 'users', user.uid, 'savedPaths'),
      where('subject', '==', actualSubject),
      where('level',   '==', level),
      where('goal',    '==', goal)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0];
    return null;
  };

  /* ── Save path to Firestore ── */
  const savePath = async (data) => {
    if (!user?.uid) return null;
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'savedPaths'), {
        subject: actualSubject,
        level,
        goal,
        nodes: data.nodes,
        totalTopics: data.totalTopics,
        createdAt: serverTimestamp(),
      });
      setSavedPathId(ref.id);
      return ref.id;
    } catch (err) {
      console.error('Save path error:', err);
      return null;
    }
  };

  /* ── Generate flow ── */
  const generate = async (forceNew = false) => {
    audioSystem.playClick();
    if (!actualSubject) { toast.error('Please enter a subject name.'); return; }

    if (!forceNew) {
      setLoading(true);
      try {
        const existing = await checkDuplicate();
        if (existing) {
          setDupDoc(existing);
          setShowDupModal(true);
          setLoading(false);
          return;
        }
      } catch { /* continue */ }
    }

    setLoading(true);
    setPathData(null);
    setSavedPathId(null);
    try {
      const completedTopics = (subjectProgress || [])
        .filter(s => s.subject === actualSubject && s.averageScore >= 70)
        .map(s => s.subject);
      const res = await generateLearningPath(actualSubject, level, completedTopics, goal);
      const data = res.data;
      setPathData(data);
      await savePath(data);
      await loadSavedPaths(); // refresh list
      awardBadgeToFirestore(user.uid, 'learning-path-gen');
      toast.success('Learning path generated & saved!');
    } catch {
      toast.error('Failed to generate path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExisting = () => {
    if (!dupDoc) return;
    audioSystem.playClick();
    setShowDupModal(false);
    const data = dupDoc.data();
    setPathData({ nodes: data.nodes, totalTopics: data.totalTopics, subject: data.subject });
    setSavedPathId(dupDoc.id);
    // Update lastAccessedAt
    updateDoc(doc(db, 'users', user.uid, 'savedPaths', dupDoc.id), { lastAccessedAt: serverTimestamp() }).catch(() => {});
    toast.success('Existing path loaded!');
  };

  const handleGenerateNew = () => {
    audioSystem.playClick();
    setShowDupModal(false);
    generate(true);
  };

  /* ── Load a saved path from the inline list ── */
  const handleLoadSaved = (path) => {
    audioSystem.playClick();
    setPathData({ nodes: path.nodes, totalTopics: path.totalTopics, subject: path.subject });
    setSavedPathId(path.id);
    updateDoc(doc(db, 'users', user.uid, 'savedPaths', path.id), { lastAccessedAt: serverTimestamp() }).catch(() => {});
    toast.success(`Loaded: ${path.subject}`);
    // Scroll to path
    setTimeout(() => document.getElementById('path-display')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  /* ── Delete a saved path ── */
  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savedPaths', toDelete.id));
      setSavedPaths(prev => prev.filter(p => p.id !== toDelete.id));
      if (savedPathId === toDelete.id) { setPathData(null); setSavedPathId(null); }
      toast.success('Path deleted.');
    } catch { toast.error('Failed to delete.'); }
    finally { setDeleting(false); setToDelete(null); }
  };

  /* ── Click node → navigate ── */
  const handleNodeClick = async (node) => {
    const nodeIndex = pathData.nodes.indexOf(node);
    let pid = savedPathId;
    if (!pid) {
      pid = await savePath(pathData);
    }
    if (!pid) { toast.error('Could not save path. Try again.'); return; }
    navigate(`/app/learn/${pid}/${nodeIndex}`);
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

      {/* ── My Learning Paths ── */}
      {(savedPaths.length > 0 || pathsLoading) && (
        <div className="mb-6">
          <button
            onClick={() => { audioSystem.playClick(); setShowPaths(p => !p); }}
            className="flex items-center gap-2 mb-3 text-sm font-bold text-txt2 hover:text-txt transition-colors">
            <BookOpen size={16} className="text-primary" />
            My Learning Paths
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              {savedPaths.length}
            </span>
            <ChevronRight size={14} className={`text-txt3 transition-transform ${showPaths ? 'rotate-90' : ''}`} />
          </button>
          <AnimatePresence>
            {showPaths && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden">
                {pathsLoading ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="glass-card p-4 animate-pulse h-16 rounded-xl" />)}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {savedPaths.map(p => (
                      <SavedPathRow key={p.id} path={p}
                        onLoad={handleLoadSaved}
                        onDelete={path => { audioSystem.playClick(); setToDelete(path); }} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 md:p-6 mb-6 md:mb-8 shadow-sm"
        style={{ position: 'relative', zIndex: 100 }}>

        {/* Row 1: Subject + Level */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 md:gap-5 items-start sm:items-end mb-5">
          <div className="w-full sm:flex-1 sm:min-w-[200px]">
            <label className="text-xs font-bold text-txt3 uppercase tracking-widest mb-3 block">Subject</label>
            <DarkSelect value={subject} onChange={val => { setSubject(val); setCustomSubject(''); }} options={SUBJECTS} />
            {subject === 'Other' && (
              <input
                type="text"
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                placeholder="e.g. Web Development, Chess Strategy, Quantum Physics"
                className="mt-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                style={{
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  background: 'var(--bg2)',
                  color: 'var(--txt)',
                }}
              />
            )}
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
        </div>

        {/* Row 2: Goal */}
        <div className="mb-5">
          <label className="text-xs font-bold text-txt3 uppercase tracking-widest mb-3 block">Learning Goal</label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map(g => (
              <button key={g} onClick={() => { audioSystem.playClick(); setGoal(g); }}
                className="text-xs font-bold px-3 py-2 rounded-xl border transition-all"
                style={g === goal
                  ? { border: '1px solid rgba(139, 92, 246, 0.5)', background: 'rgba(139, 92, 246, 0.12)', color: 'var(--primary-light)' }
                  : { border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--txt3)' }
                }>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button onClick={() => generate(false)} disabled={loading}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 text-sm shadow-glow-primary">
          {loading
            ? <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating...</>
            : <><Map size={18} /> Generate Path</>}
        </button>
      </motion.div>

      {/* Path */}
      {pathData && (
        <motion.div id="path-display" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Topics', val: pathData.totalTopics,                                          color: '#0EA5E9' },
              { label: 'Completed',    val: completedCount,                                                 color: '#10B981' },
              { label: 'In Progress',  val: 1,                                                              color: '#F59E0B' },
              { label: 'XP Available', val: pathData.nodes.reduce((a, b) => a + b.xpReward, 0),            color: '#8B5CF6' },
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
                      {[0, 1, 2].map(i => <div key={i} className="w-1 h-3 bg-border rounded-full" />)}
                      <ChevronDown size={16} className="text-txt3 mt-1" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {row.map(node => <NodeCard key={node.id} node={node} onClick={handleNodeClick} />)}
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

      {/* Empty state — show most recent saved path or generate CTA */}
      {!pathData && !loading && (
        <div className="text-center py-24 glass-card mt-8">
          {savedPaths.length > 0 ? (
            <>
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20">
                <Map size={32} className="text-primary" />
              </div>
              <p className="font-jakarta font-black text-2xl mb-2 text-txt">Continue where you left off</p>
              <p className="text-sm text-txt3 font-medium max-w-md mx-auto leading-relaxed mb-6">
                You have {savedPaths.length} saved path{savedPaths.length > 1 ? 's' : ''}. Load one above or generate a new path.
              </p>
              <button onClick={() => handleLoadSaved(savedPaths[0])}
                className="btn-primary px-8 py-3 flex items-center gap-2 mx-auto">
                <Map size={16} /> Load Latest: {savedPaths[0]?.subject}
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-space-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
                <Map size={32} className="text-primary opacity-80" />
              </div>
              <p className="font-jakarta font-black text-2xl mb-2 text-txt">Generate Your Learning Path</p>
              <p className="text-sm text-txt3 font-medium max-w-md mx-auto leading-relaxed">
                Select a subject and level, then click Generate to get your AI-powered roadmap to mastery.
              </p>
            </>
          )}
        </div>
      )}

      {/* Duplicate detection modal */}
      <AnimatePresence>
        {showDupModal && (
          <DuplicateModal
            subject={actualSubject}
            level={level}
            onLoad={handleLoadExisting}
            onGenerateNew={handleGenerateNew}
            onClose={() => setShowDupModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {toDelete && (
          <DeleteConfirm
            onConfirm={handleDeleteConfirm}
            onCancel={() => setToDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

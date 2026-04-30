import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Map, Bookmark, ChevronRight, Clock, Layers } from 'lucide-react';
import {
  collection, getDocs, query, orderBy,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { audioSystem } from '../utils/audio';

const levelColors = { beginner: '#10B981', intermediate: '#0EA5E9', advanced: '#8B5CF6' };

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PathCard({ path, pathId }) {
  const navigate = useNavigate();
  const completedCount = path.nodes?.filter(n => n.status === 'completed').length || 0;
  const total          = path.totalTopics || path.nodes?.length || 0;
  const pct            = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const levelColor     = levelColors[path.level] || '#8B5CF6';

  const handleContinue = () => {
    audioSystem.playClick();
    navigate('/app/learning-path', {
      state: {
        loadedPath: { nodes: path.nodes, totalTopics: path.totalTopics, subject: path.subject },
        pathId,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
      className="glass-card p-6 flex flex-col gap-4 cursor-pointer group transition-all"
      onClick={handleContinue}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-jakarta font-black text-lg text-txt leading-tight mb-1 group-hover:text-primary transition-colors">
            {path.subject}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md capitalize"
              style={{ background: `${levelColor}18`, color: levelColor, border: `1px solid ${levelColor}30` }}>
              {path.level}
            </span>
            {path.goal && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(139,92,246,0.08)', color: 'var(--txt3)', border: '1px solid rgba(139,92,246,0.15)' }}>
                {path.goal}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Map size={18} className="text-primary" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs font-bold text-txt3">
        <span className="flex items-center gap-1.5"><Layers size={12} /> {total} topics</span>
        <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDate(path.createdAt)}</span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-txt3 uppercase tracking-wider">Progress</span>
          <span style={{ color: levelColor }}>{completedCount}/{total} · {pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${levelColor}, ${levelColor}aa)` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8 }} />
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={e => { e.stopPropagation(); handleContinue(); }}
        className="btn-primary py-2.5 text-sm flex items-center justify-center gap-2 mt-auto">
        Continue Path <ChevronRight size={15} />
      </button>
    </motion.div>
  );
}

export default function SavedPathsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [paths,    setPaths]   = useState([]);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      setLoading(true);
      try {
        const q    = query(collection(db, 'users', user.uid, 'savedPaths'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setPaths(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Load paths error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="mb-6 md:mb-8 pt-2 lg:pt-0">
        <h1 className="font-jakarta font-black text-2xl md:text-4xl text-txt mb-2 flex items-center gap-3">
          <Bookmark size={28} className="text-primary" /> My Learning Paths
        </h1>
        <p className="text-sm font-medium text-txt3">All your saved AI-generated study roadmaps in one place</p>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6 animate-pulse space-y-4">
              <div className="h-6 bg-white/10 rounded-lg w-2/3" />
              <div className="h-4 bg-white/5 rounded-lg w-1/3" />
              <div className="h-2 bg-white/5 rounded-full" />
              <div className="h-10 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Paths grid */}
      {!loading && paths.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paths.map(p => (
            <PathCard key={p.id} path={p} pathId={p.id} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && paths.length === 0 && (
        <div className="text-center py-24 glass-card mt-8">
          <div className="w-20 h-20 bg-space-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
            <Map size={32} className="text-primary opacity-80" />
          </div>
          <p className="font-jakarta font-black text-2xl mb-2 text-txt">No saved paths yet</p>
          <p className="text-sm text-txt3 font-medium max-w-md mx-auto leading-relaxed mb-6">
            Generate your first AI-powered learning path to get started on your study journey.
          </p>
          <button onClick={() => { audioSystem.playClick(); navigate('/app/learning-path'); }}
            className="btn-primary px-8 py-3 flex items-center gap-2 mx-auto">
            <Map size={16} /> Generate First Path
          </button>
        </div>
      )}
    </div>
  );
}

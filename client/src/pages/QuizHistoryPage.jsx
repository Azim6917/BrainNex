import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, BookOpen, CheckCircle, XCircle, Trash2, ChevronRight,
  BarChart2, AlertTriangle, X, FileQuestion, ArrowLeft
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { deleteQuizResultFromFirestore } from '../utils/firestoreUtils';
import { useAuth } from '../context/AuthContext';
import { audioSystem } from '../utils/audio';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

/* ── Score colour helper ── */
function scoreStyle(score) {
  if (score >= 80) return { color: '#10B981', bg: '#10B98115', label: 'Excellent' };
  if (score >= 50) return { color: '#F59E0B', bg: '#F59E0B15', label: 'Good' };
  return { color: '#EF4444', bg: '#EF444415', label: 'Needs Work' };
}

/* ── Per-question row inside the detail modal ── */
function QuestionRow({ q, index }) {
  const correct   = q.userSelectedIndex === q.correctIndex;
  const unanswered = q.userSelectedIndex < 0 || q.userSelectedIndex == null;
  return (
    <div className={`rounded-xl p-4 border mb-3 ${correct ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
      <div className="flex items-start gap-3 mb-3">
        {correct
          ? <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
          : <XCircle    size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
        <p className="text-sm font-semibold text-txt leading-snug">
          <span className="text-txt3 font-bold mr-1">Q{index + 1}.</span>{q.question}
        </p>
      </div>

      <div className="space-y-1.5 pl-7">
        {(q.options || []).map((opt, i) => {
          const isCorrect  = i === q.correctIndex;
          const isSelected = i === q.userSelectedIndex;
          let cls = 'text-txt3 bg-space-800 border-transparent';
          if (isCorrect && isSelected) cls = 'text-green-500 bg-green-500/10 border-green-500/30 font-bold';
          else if (isCorrect)          cls = 'text-green-500 bg-green-500/5 border-green-500/20 font-semibold';
          else if (isSelected)         cls = 'text-red-500 bg-red-500/10 border-red-500/30 font-bold line-through';
          return (
            <div key={i} className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-2 ${cls}`}>
              <span className="font-bold opacity-60 w-4 flex-shrink-0">{['A','B','C','D'][i]}.</span>
              <span>{opt}</span>
              {isCorrect  && <CheckCircle size={11} className="ml-auto text-green-500 flex-shrink-0" />}
              {isSelected && !isCorrect && <XCircle size={11} className="ml-auto text-red-500 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {q.explanation && (
        <p className="text-xs text-txt3 mt-3 pl-7 leading-relaxed border-t border-white/5 pt-2">
          <span className="font-bold text-primary mr-1">Explanation:</span>{q.explanation}
        </p>
      )}
      {unanswered && !correct && (
        <p className="text-xs text-amber-500 mt-2 pl-7 font-medium">Time ran out — no answer selected.</p>
      )}
    </div>
  );
}

/* ── Detail modal ── */
function DetailModal({ quiz, onClose }) {
  const ss = scoreStyle(quiz.score);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,22,0.92)' }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="glass-card w-full max-w-2xl max-h-[88vh] overflow-y-auto custom-scrollbar border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-card rounded-none border-0 border-b border-white/5 px-6 py-4 flex items-start justify-between gap-4 backdrop-blur-xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-txt3 mb-0.5">{quiz.subject}</p>
            <h2 className="font-jakarta font-black text-lg text-txt leading-tight">{quiz.topic}</h2>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-center px-4 py-2 rounded-xl border font-black text-xl"
              style={{ color: ss.color, background: ss.bg, borderColor: ss.color + '40' }}>
              {quiz.score}%
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl bg-space-800 border border-border text-txt3 hover:text-txt flex items-center justify-center transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-white/5">
          {[
            { label: 'Correct',    val: `${quiz.correctAnswers} / ${quiz.totalQuestions}` },
            { label: 'Difficulty', val: quiz.difficulty || '—' },
            { label: 'Date',       val: quiz.timestamp ? new Date(quiz.timestamp).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—' },
          ].map(({ label, val }) => (
            <div key={label} className="text-center bg-space-800 rounded-xl py-3 px-2 border border-white/5">
              <p className="text-xs font-bold text-txt3 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-sm font-bold text-txt capitalize">{val}</p>
            </div>
          ))}
        </div>

        {/* Questions */}
        <div className="px-6 py-5">
          {(!quiz.questions || quiz.questions.length === 0) ? (
            <div className="text-center py-10">
              <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3 opacity-60" />
              <p className="text-sm text-txt2 font-medium">Detailed question data is not available for this quiz.</p>
              <p className="text-xs text-txt3 mt-1">Questions are saved for quizzes taken after this feature was added.</p>
            </div>
          ) : (
            quiz.questions.map((q, i) => <QuestionRow key={i} q={q} index={i} />)
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Delete confirmation dialog ── */
function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,22,0.88)' }}
      onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="glass-card p-7 max-w-sm w-full border-red-500/20 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="font-jakarta font-black text-lg text-txt mb-2">Delete Quiz?</h3>
        <p className="text-sm text-txt3 mb-6 leading-relaxed">
          Are you sure you want to delete this quiz from your history? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 btn-outline py-3 text-sm bg-space-800">No, keep it</button>
          <button onClick={onConfirm}
            className="flex-1 py-3 text-sm font-bold rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all">
            Yes, delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ── */
export default function QuizHistoryPage() {
  const { user } = useAuth();
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null); // quiz to show in detail modal
  const [toDelete,    setToDelete]    = useState(null); // quiz id pending deletion
  const [deleting,    setDeleting]    = useState(false);
  const [filterScore, setFilterScore] = useState('all'); // all | good | bad

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      try {
        const q    = query(collection(db, 'quizResults', user.uid, 'results'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        setHistory(snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          timestamp: d.data().timestamp?.toDate?.()?.toISOString() || null,
        })));
      } catch (err) {
        toast.error('Could not load quiz history.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteQuizResultFromFirestore(user.uid, toDelete);
      setHistory(prev => prev.filter(q => q.id !== toDelete));
      toast.success('Quiz deleted.');
      if (selected?.id === toDelete) setSelected(null);
    } catch {
      toast.error('Failed to delete quiz.');
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const filtered = history.filter(q => {
    if (filterScore === 'great')  return q.score >= 80;
    if (filterScore === 'mid')    return q.score >= 50 && q.score < 80;
    if (filterScore === 'low')    return q.score < 50;
    return true;
  });

  const totalQuizzes = history.length;
  const avgScore     = totalQuizzes > 0 ? Math.round(history.reduce((a, b) => a + b.score, 0) / totalQuizzes) : 0;
  const bestScore    = totalQuizzes > 0 ? Math.max(...history.map(q => q.score)) : 0;

  return (
    <div className="p-4 md:p-8 max-w-[1100px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pt-12 lg:pt-0">
        <Link to="/app/dashboard"
          className="w-9 h-9 rounded-xl bg-space-800 border border-border flex items-center justify-center text-txt3 hover:text-txt transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-jakarta font-black text-2xl md:text-3xl text-txt">Quiz History</h1>
          <p className="text-sm text-txt3 font-medium">All quizzes you've ever taken</p>
        </div>
      </div>

      {/* Summary stats */}
      {totalQuizzes > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { Icon: FileQuestion, label: 'Total Quizzes', val: totalQuizzes, color: '#8B5CF6' },
            { Icon: BarChart2,    label: 'Avg Score',     val: `${avgScore}%`, color: '#0EA5E9' },
            { Icon: CheckCircle,  label: 'Best Score',    val: `${bestScore}%`, color: '#10B981' },
          ].map(({ Icon, label, val, color }) => (
            <div key={label} className="glass-card p-4 text-center shadow-sm">
              <div className="flex justify-center mb-2">
                <Icon size={22} style={{ color }} />
              </div>
              <div className="font-jakarta font-black text-2xl mb-0.5" style={{ color }}>{val}</div>
              <div className="text-[10px] font-bold text-txt3 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter pills */}
      {totalQuizzes > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { key: 'all',   label: 'All' },
            { key: 'great', label: '≥ 80%' },
            { key: 'mid',   label: '50–79%' },
            { key: 'low',   label: '< 50%' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => { audioSystem.playClick(); setFilterScore(key); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all
                ${filterScore === key
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-space-800 border-border text-txt3 hover:border-white/20'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-24 glass-card border-dashed border-border border-2">
          <FileQuestion size={56} className="mx-auto text-primary opacity-30 mb-4" />
          <p className="font-jakarta font-black text-xl text-txt mb-2">No quizzes yet</p>
          <p className="text-txt3 text-sm mb-6">Take your first quiz to see your history here.</p>
          <Link to="/app/quiz">
            <button className="btn-primary px-6 py-2.5 text-sm">Take a Quiz</button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <p className="text-txt3 text-sm">No quizzes match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((q, i) => {
              const ss = scoreStyle(q.score);
              return (
                <motion.div key={q.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-4 flex items-center gap-4 group hover:border-white/10 transition-all border-transparent">
                  {/* Score badge */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 border"
                    style={{ color: ss.color, background: ss.bg, borderColor: ss.color + '40' }}>
                    {q.score}%
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-txt truncate">{q.topic}</p>
                    <p className="text-xs text-txt3 font-medium mt-0.5">{q.subject}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-txt3 flex items-center gap-1">
                        <CheckCircle size={9} className="text-green-500" />
                        {q.correctAnswers ?? '?'} / {q.totalQuestions ?? '?'} correct
                      </span>
                      {q.difficulty && (
                        <span className="text-[10px] font-bold text-txt3 capitalize">{q.difficulty}</span>
                      )}
                      {q.timestamp && (
                        <span className="text-[10px] font-bold text-txt3 flex items-center gap-1">
                          <Clock size={9} />
                          {new Date(q.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { audioSystem.playClick(); setSelected(q); }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all">
                      View Details <ChevronRight size={12} />
                    </button>
                    <button
                      onClick={() => { audioSystem.playClick(); setToDelete(q.id); }}
                      className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && <DetailModal quiz={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {toDelete && (
          <DeleteConfirm
            onConfirm={handleDelete}
            onCancel={() => setToDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

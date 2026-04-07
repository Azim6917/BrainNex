import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, CheckCircle, XCircle, RotateCcw, Brain } from 'lucide-react';
import { generateQuiz } from '../utils/api';
import { saveQuizResultToFirestore, getQuizHistoryFromFirestore } from '../utils/firestoreUtils';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SUBJECTS    = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Geography','Literature','Economics','Psychology'];
const DIFFICULTIES = ['beginner','intermediate','advanced'];

/* ── Setup ── */
function QuizSetup({ onStart, currentDifficulty }) {
  const [subject,    setSubject]    = useState(SUBJECTS[0]);
  const [topic,      setTopic]      = useState('');
  const [difficulty, setDifficulty] = useState(currentDifficulty || 'intermediate');
  const [numQ,       setNumQ]       = useState(5);
  const [loading,    setLoading]    = useState(false);

  const start = async () => {
    if (!topic.trim()) { toast.error('Please enter a topic'); return; }
    setLoading(true);
    try {
      const res = await generateQuiz(subject, topic, difficulty, numQ);
      onStart(res.data);
    } catch (err) {
      // If backend not running, create a simple fallback quiz
      if (!err.response) {
        toast.error('Backend server not running. Start it with: npm run dev in /server');
      } else {
        toast.error('Failed to generate quiz. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass border border-brand-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-cyan/20 flex items-center justify-center flex-shrink-0">
            <Brain size={20} className="text-cyan" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-xl">Generate AI Quiz</h2>
            <p className="text-xs text-white/40">Powered by Claude AI</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Subject</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s} onClick={() => setSubject(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${s === subject ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'border-brand-border text-white/40 hover:border-brand-border2'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Topic <span className="text-white/20">(be specific for best results)</span></label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && start()}
              placeholder="e.g. Newton's Laws, Photosynthesis, Quadratic Equations..."
              className="input-dark w-full text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    d === difficulty
                      ? d === 'beginner'     ? 'bg-neon-green/20 border-neon-green/40 text-neon-green'
                      : d === 'intermediate' ? 'bg-cyan/20 border-cyan/40 text-cyan'
                      :                        'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'border-brand-border text-white/40 hover:border-brand-border2'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Questions: <span className="text-cyan">{numQ}</span></label>
            <input type="range" min={3} max={10} step={1} value={numQ}
              onChange={e => setNumQ(+e.target.value)} className="w-full accent-cyan" />
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={start} disabled={loading}
            className="btn-cyan w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-semibold">
            {loading
              ? <><div className="w-4 h-4 border-2 border-brand-bg/40 border-t-brand-bg rounded-full animate-spin" />Generating Quiz...</>
              : <><Zap size={16} />Generate Quiz with AI</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Active Quiz ── */
function ActiveQuiz({ quiz, onComplete }) {
  const [current,  setCurrent]  = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers,  setAnswers]  = useState([]);
  const [showExp,  setShowExp]  = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);

  const q     = quiz.questions[current];
  const total = quiz.questions.length;

  useEffect(() => {
    setTimeLeft(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSelect(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const handleSelect = (idx) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(idx);
    setShowExp(true);
    setAnswers(prev => [...prev, { questionIndex: current, selectedIndex: idx, correct: idx === q.correctIndex }]);
  };

  const next = () => {
    if (current + 1 >= total) {
      // answers already has this question's answer from handleSelect
      const correct = answers.filter(a => a.correct).length;
      onComplete({ quiz, answers, correct, total });
    } else {
      setSelected(null);
      setShowExp(false);
      setCurrent(c => c + 1);
    }
  };

  const timerColor = timeLeft <= 10 ? '#f87171' : timeLeft <= 20 ? '#ffb830' : '#00e5ff';

  return (
    <div className="max-w-2xl mx-auto px-2">
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-white/40 text-xs truncate max-w-[200px] md:max-w-xs">{quiz.title}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono text-sm flex items-center gap-1" style={{ color: timerColor }}>
            <Clock size={13} />{timeLeft}s
          </span>
          <span className="text-white/40 text-sm">{current + 1}/{total}</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-5">
        <motion.div className="h-full bg-cyan rounded-full"
          animate={{ width: `${(current / total) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="glass border border-brand-border rounded-2xl p-5 md:p-6 mb-4">
          <p className="text-xs text-cyan font-bold uppercase tracking-widest mb-3">Question {current + 1}</p>
          <p className="text-base md:text-lg font-semibold leading-relaxed mb-5">{q.question}</p>
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              let cls = 'border-brand-border text-white/70 hover:border-brand-border2 hover:bg-white/[0.03]';
              if (selected !== null) {
                if (i === q.correctIndex)       cls = 'border-neon-green bg-neon-green/10 text-neon-green';
                else if (i === selected)        cls = 'border-red-400 bg-red-500/10 text-red-400';
                else                            cls = 'border-brand-border text-white/25 opacity-50';
              }
              return (
                <motion.button key={i} whileHover={selected === null ? { x: 3 } : {}}
                  onClick={() => handleSelect(i)} disabled={selected !== null}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all disabled:cursor-default ${cls}`}>
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {['A','B','C','D'][i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {selected !== null && i === q.correctIndex && <CheckCircle size={15} className="flex-shrink-0" />}
                  {selected !== null && i === selected && i !== q.correctIndex && <XCircle size={15} className="flex-shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showExp && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl px-4 py-3.5 mb-4 border text-sm leading-relaxed ${selected === q.correctIndex ? 'bg-neon-green/10 border-neon-green/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <p className="font-semibold mb-1 text-white">{selected === q.correctIndex ? '✅ Correct!' : '❌ Incorrect'}</p>
            <p className="text-white/60 text-xs leading-relaxed">{q.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {selected !== null && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={next} className="btn-cyan w-full py-3 text-sm font-semibold">
          {current + 1 >= total ? 'See Results →' : 'Next Question →'}
        </motion.button>
      )}
    </div>
  );
}

/* ── Results ── */
function QuizResults({ result, onRetry, onNew }) {
  const { user }                           = useAuth();
  const { updateProfileLocal, refreshProfile } = useUserData();
  const [saved,   setSaved]   = useState(false);
  const [xpInfo,  setXpInfo]  = useState(null);

  // ── correct score calculation ──
  const score    = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const xpEarned = result.correct * 10 + (score === 100 ? 50 : score >= 80 ? 25 : 10);
  const emoji    = score === 100 ? '🏆' : score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚';
  const color    = score >= 80 ? '#34d399' : score >= 60 ? '#00e5ff' : '#ffb830';

  useEffect(() => {
    if (saved) return;
    const save = async () => {
      // Save DIRECTLY to Firestore — no backend needed
      const res = await saveQuizResultToFirestore(user?.uid, {
        subject:        result.quiz.subject,
        topic:          result.quiz.topic,
        score,
        totalQuestions: result.total,
        correctAnswers: result.correct,
        difficulty:     result.quiz.difficulty,
      });
      if (res) {
        if (res.newBadges?.length > 0) {
          res.newBadges.forEach(b => toast.success(`🏆 Badge unlocked: ${b.name}!`, { duration: 4000 }));
        }
        updateProfileLocal({ xp: res.newXp, level: res.newLevel });
        await refreshProfile();
        setXpInfo(res);
      }
      setSaved(true);
    };
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto px-2">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass border border-brand-border rounded-2xl p-6 md:p-8 text-center">
        <div className="text-5xl mb-3">{emoji}</div>
        <h2 className="font-syne font-black text-5xl mb-1" style={{ color }}>{score}%</h2>
        <p className="text-white/40 text-sm mb-1">{result.correct} correct out of {result.total}</p>
        <p className="text-white/25 text-xs mb-4">{result.quiz.topic} · {result.quiz.difficulty}</p>
        <div className="flex items-center justify-center gap-2 text-neon-amber text-sm font-bold mb-6">
          <Zap size={14} />+{xpEarned} XP earned
          {!saved && <span className="text-white/30 text-xs">saving...</span>}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: 'Score',   val: `${score}%`,              c: color },
            { label: 'Correct', val: `${result.correct}/${result.total}`, c: '#34d399' },
            { label: 'XP',      val: `+${xpEarned}`,           c: '#ffb830' },
          ].map(({ label, val, c }) => (
            <div key={label} className="bg-white/[0.04] rounded-xl p-3">
              <div className="font-syne font-black text-lg" style={{ color: c }}>{val}</div>
              <div className="text-[10px] text-white/30">{label}</div>
            </div>
          ))}
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-1.5 mb-6 text-left max-h-44 overflow-y-auto">
          {result.quiz.questions.map((q, i) => {
            const correct = result.answers[i]?.correct ?? false;
            return (
              <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl text-xs ${correct ? 'bg-neon-green/10' : 'bg-red-500/10'}`}>
                {correct ? <CheckCircle size={12} className="text-neon-green flex-shrink-0 mt-0.5" /> : <XCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />}
                <span className={correct ? 'text-neon-green/80' : 'text-red-400/80'}>
                  {q.question.length > 65 ? q.question.substring(0, 65) + '...' : q.question}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onRetry} className="flex-1 btn-outline py-2.5 text-sm flex items-center justify-center gap-1.5">
            <RotateCcw size={13} />Retry
          </button>
          <button onClick={onNew} className="flex-1 btn-cyan py-2.5 text-sm">New Quiz →</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function QuizPage() {
  const { profile }  = useUserData();
  const [phase,  setPhase]  = useState('setup');
  const [quiz,   setQuiz]   = useState(null);
  const [result, setResult] = useState(null);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-syne font-black text-2xl md:text-3xl mb-1">AI Quiz Generator</h1>
        <p className="text-white/40 text-sm">Generate custom quizzes on any topic, powered by Claude AI</p>
      </div>
      {phase === 'setup'   && <QuizSetup onStart={q => { setQuiz(q); setPhase('active'); }} currentDifficulty={profile?.currentDifficulty} />}
      {phase === 'active'  && quiz   && <ActiveQuiz quiz={quiz} onComplete={r => { setResult(r); setPhase('results'); }} />}
      {phase === 'results' && result && <QuizResults result={result} onRetry={() => setPhase('active')} onNew={() => setPhase('setup')} />}
    </div>
  );
}

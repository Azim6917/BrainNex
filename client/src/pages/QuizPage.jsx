import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, CheckCircle, XCircle, RotateCcw, Trophy, Brain } from 'lucide-react';
import { generateQuiz, saveQuizResult, getAdaptiveDifficulty, fetchQuizHistory } from '../utils/api';
import { useUserData } from '../context/UserDataContext';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Geography', 'Literature', 'Economics', 'Psychology'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

/* ── Quiz Setup Screen ── */
function QuizSetup({ onStart, currentDifficulty, adaptiveTip }) {
  const [subject, setSubject]       = useState(SUBJECTS[0]);
  const [topic, setTopic]           = useState('');
  const [difficulty, setDifficulty] = useState(currentDifficulty || 'intermediate');
  const [numQ, setNumQ]             = useState(5);
  const [loading, setLoading]       = useState(false);

  const start = async () => {
    if (!topic.trim()) { toast.error('Please enter a topic'); return; }
    setLoading(true);
    try {
      const res = await generateQuiz(subject, topic, difficulty, numQ);
      onStart(res.data, difficulty);
    } catch { toast.error('Failed to generate quiz. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass border border-brand-border rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan/20 flex items-center justify-center">
            <Brain size={22} className="text-cyan" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-xl">Generate AI Quiz</h2>
            <p className="text-xs text-white/40">Powered by Claude AI</p>
          </div>
        </div>

        {adaptiveTip && (
          <div className="mb-5 flex items-start gap-2 text-xs bg-cyan/10 border border-cyan/20 rounded-xl px-4 py-3 text-cyan">
            <Zap size={13} className="flex-shrink-0 mt-0.5" />
            <span><strong>AI Suggestion:</strong> {adaptiveTip.reason} Recommended: <strong>{adaptiveTip.recommendedDifficulty}</strong></span>
          </div>
        )}

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
            <label className="text-xs font-medium text-white/50 mb-2 block">Topic <span className="text-white/20">(be specific)</span></label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && start()}
              placeholder={`e.g. Newton's Laws, Photosynthesis, World War II...`}
              className="input-dark w-full" />
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${d === difficulty ? d === 'beginner' ? 'bg-neon-green/20 border-neon-green/40 text-neon-green' : d === 'intermediate' ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-brand-border text-white/40 hover:border-brand-border2'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Number of Questions: {numQ}</label>
            <input type="range" min={3} max={10} value={numQ} onChange={e => setNumQ(+e.target.value)}
              className="w-full accent-cyan" />
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={start} disabled={loading}
            className="btn-cyan w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><div className="w-4 h-4 border-2 border-brand-bg/40 border-t-brand-bg rounded-full animate-spin" /> Generating Quiz...</> : <><Zap size={16} /> Generate Quiz with AI</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Active Quiz Screen ── */
function ActiveQuiz({ quiz, onComplete }) {
  const [current, setCurrent]   = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers]   = useState([]);
  const [showExp, setShowExp]   = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);

  const q = quiz.questions[current];
  const total = quiz.questions.length;

  useEffect(() => {
    setTimeLeft(60);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); if (selected === null) handleSelect(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [current]);

  const handleSelect = (idx) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(idx);
    setShowExp(true);
    setAnswers(a => [...a, { questionIndex: current, selectedIndex: idx, correct: idx === q.correctIndex }]);
  };

  const next = () => {
    if (current + 1 >= total) {
      const correct = answers.filter(a => a.correct).length + (selected === q.correctIndex ? 1 : 0);
      onComplete({ quiz, answers: [...answers], correct, total });
    } else {
      setSelected(null);
      setShowExp(false);
      setCurrent(c => c + 1);
    }
  };

  const pct = Math.round(((current) / total) * 100);
  const timerColor = timeLeft <= 10 ? '#f87171' : timeLeft <= 20 ? '#ffb830' : '#00e5ff';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-white/40">{quiz.title}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" style={{ color: timerColor }}>
            <Clock size={14} /> {timeLeft}s
          </div>
          <span className="text-white/40">{current + 1}/{total}</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
        <motion.div className="h-full bg-cyan rounded-full" animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="glass border border-brand-border rounded-2xl p-6 mb-4">
          <p className="text-xs text-cyan font-semibold uppercase tracking-widest mb-3">Question {current + 1}</p>
          <p className="text-lg font-semibold leading-relaxed mb-6">{q.question}</p>
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              let cls = 'border-brand-border text-white/70 hover:border-brand-border2 hover:bg-white/[0.03]';
              if (selected !== null) {
                if (i === q.correctIndex)       cls = 'border-neon-green bg-neon-green/10 text-neon-green';
                else if (i === selected)        cls = 'border-red-400 bg-red-500/10 text-red-400';
                else                            cls = 'border-brand-border text-white/30';
              }
              return (
                <motion.button key={i} whileHover={selected === null ? { x: 4 } : {}}
                  onClick={() => handleSelect(i)}
                  disabled={selected !== null}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm text-left transition-all ${cls}`}>
                  <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {['A','B','C','D'][i]}
                  </span>
                  {opt}
                  {selected !== null && i === q.correctIndex && <CheckCircle size={16} className="ml-auto flex-shrink-0" />}
                  {selected === i && i !== q.correctIndex && <XCircle size={16} className="ml-auto flex-shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Explanation */}
      <AnimatePresence>
        {showExp && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl px-5 py-4 mb-4 border text-sm leading-relaxed ${selected === q.correctIndex ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
            <p className="font-semibold mb-1">{selected === q.correctIndex ? '✅ Correct!' : '❌ Incorrect'}</p>
            <p className="text-white/70">{q.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {selected !== null && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={next} className="btn-cyan w-full py-3.5">
          {current + 1 >= total ? 'See Results →' : 'Next Question →'}
        </motion.button>
      )}
    </div>
  );
}

/* ── Results Screen ── */
function QuizResults({ result, onRetry, onNew }) {
  const { updateProfileLocal } = useUserData();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const save = async () => {
      try {
        const score = Math.round((result.correct / result.total) * 100);
        const res = await saveQuizResult({
          subject: result.quiz.subject,
          topic: result.quiz.topic,
          score,
          totalQuestions: result.total,
          correctAnswers: result.correct,
          difficulty: result.quiz.difficulty,
        });
        if (res.data.newBadges?.length > 0) {
          res.data.newBadges.forEach(b => toast.success(`🏆 New badge: ${b.name}`));
        }
        updateProfileLocal({ xp: res.data.newXp, level: res.data.newLevel });
        setSaved(true);
      } catch (err) { console.error('Save error:', err); }
    };
    if (!saved) save();
  }, []);

  const score = Math.round((result.correct / result.total) * 100);
  const emoji = score === 100 ? '🏆' : score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚';
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#00e5ff' : '#ffb830';
  const xpEarned = result.correct * 10 + (score === 100 ? 100 : score >= 80 ? 50 : 20);

  return (
    <div className="max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass border border-brand-border rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="font-syne font-black text-4xl mb-1" style={{ color }}>{score}%</h2>
        <p className="text-white/50 mb-2">{result.correct}/{result.total} correct · {result.quiz.topic}</p>
        <div className="flex items-center justify-center gap-2 text-neon-amber text-sm font-semibold mb-8">
          <Zap size={15} /> +{xpEarned} XP earned
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Score', val: `${score}%` },
            { label: 'Correct', val: result.correct },
            { label: 'XP Earned', val: `+${xpEarned}` },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/[0.04] rounded-xl p-3">
              <div className="font-syne font-bold text-xl" style={{ color }}>{val}</div>
              <div className="text-xs text-white/30 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-2 mb-8 text-left max-h-52 overflow-y-auto">
          {result.quiz.questions.map((q, i) => {
            const ans = result.answers[i];
            const correct = ans?.correct;
            return (
              <div key={i} className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs ${correct ? 'bg-neon-green/10' : 'bg-red-500/10'}`}>
                {correct ? <CheckCircle size={13} className="text-neon-green flex-shrink-0 mt-0.5" /> : <XCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />}
                <span className={correct ? 'text-neon-green/80' : 'text-red-400/80'}>{q.question.substring(0, 70)}...</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onRetry} className="flex-1 btn-outline py-3 flex items-center justify-center gap-2 text-sm">
            <RotateCcw size={14} /> Retry Quiz
          </button>
          <button onClick={onNew} className="flex-1 btn-cyan py-3 text-sm">
            New Quiz →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Quiz Page ── */
export default function QuizPage() {
  const { profile } = useUserData();
  const [phase, setPhase]     = useState('setup'); // setup | active | results
  const [quiz, setQuiz]       = useState(null);
  const [result, setResult]   = useState(null);
  const [adaptiveTip, setAdaptiveTip] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const h = await fetchQuizHistory(10);
        if (h.data.length > 0) {
          const r = await getAdaptiveDifficulty(
            h.data.map(q => q.score),
            profile?.currentDifficulty || 'intermediate'
          );
          setAdaptiveTip(r.data);
        }
      } catch {}
    };
    if (profile) load();
  }, [profile]);

  const handleStart = (quizData, difficulty) => {
    setQuiz(quizData);
    setPhase('active');
  };

  const handleComplete = (r) => {
    setResult(r);
    setPhase('results');
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-syne font-black text-3xl mb-1">AI Quiz Generator</h1>
        <p className="text-white/40 text-sm">Generate custom quizzes on any topic, powered by Claude AI</p>
      </div>

      {phase === 'setup'   && <QuizSetup onStart={handleStart} currentDifficulty={profile?.currentDifficulty} adaptiveTip={adaptiveTip} />}
      {phase === 'active'  && quiz && <ActiveQuiz quiz={quiz} onComplete={handleComplete} />}
      {phase === 'results' && result && <QuizResults result={result} onRetry={() => { setPhase('active'); }} onNew={() => setPhase('setup')} />}
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Clock, CheckCircle, XCircle, RotateCcw,
  Brain, Keyboard, HelpCircle, Layers, Loader, ChevronRight, ChevronLeft, Eye
} from 'lucide-react';
import { generateQuiz, generateFlashcards, explainAnswer } from '../utils/api';
import { saveQuizResultToFirestore, getQuizHistoryFromFirestore } from '../utils/firestoreUtils';
import { useUserData } from '../context/UserDataContext';
import { useAuth }     from '../context/AuthContext';
import { playCorrect, playWrong, playXP, playPerfect, playClick } from '../utils/soundEffects';
import { triggerConfetti } from '../utils/confetti';
import toast from 'react-hot-toast';

const SUBJECTS     = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Geography','Literature','Economics','Psychology'];
const DIFFICULTIES = ['beginner','intermediate','advanced'];
const TIMER_OPTIONS = [
  { label:'Chill 😊',    seconds: 0,   desc:'No timer — relaxed mode' },
  { label:'Normal ⏱',   seconds: 60,  desc:'60 seconds per question' },
  { label:'Pressure 🔥', seconds: 30,  desc:'30 seconds per question' },
];

/* ── Setup ── */
function QuizSetup({ onStart, currentDifficulty }) {
  const [subject,    setSubject]    = useState(SUBJECTS[0]);
  const [topic,      setTopic]      = useState('');
  const [difficulty, setDifficulty] = useState(currentDifficulty || 'intermediate');
  const [numQ,       setNumQ]       = useState(5);
  const [timerIdx,   setTimerIdx]   = useState(1);
  const [loading,    setLoading]    = useState(false);

  const start = async () => {
    if (!topic.trim()) { toast.error('Please enter a topic'); return; }
    setLoading(true);
    try {
      const res = await generateQuiz(subject, topic, difficulty, numQ);
      playClick();
      onStart(res.data, TIMER_OPTIONS[timerIdx].seconds);
    } catch (err) {
      if (!err.response) toast.error('Backend server not running — start it with: npm run dev in /server');
      else toast.error('Failed to generate quiz. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="glass border border-brand-border rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-cyan/20 flex items-center justify-center flex-shrink-0">
            <Brain size={20} className="text-cyan" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-xl">AI Quiz Generator</h2>
            <p className="text-xs text-white/40">Powered by Claude AI</p>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="flex items-center gap-2 text-xs text-white/30 bg-white/[0.03] border border-brand-border rounded-xl px-3 py-2 mb-5">
          <Keyboard size={12} /><span>Tip: Press <kbd className="bg-white/10 px-1.5 rounded text-white/50">1</kbd> <kbd className="bg-white/10 px-1.5 rounded text-white/50">2</kbd> <kbd className="bg-white/10 px-1.5 rounded text-white/50">3</kbd> <kbd className="bg-white/10 px-1.5 rounded text-white/50">4</kbd> to select answers · <kbd className="bg-white/10 px-1.5 rounded text-white/50">Enter</kbd> for next</span>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Subject</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s} onClick={() => { playClick(); setSubject(s); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${s===subject ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'border-brand-border text-white/40 hover:border-brand-border2'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Topic</label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key==='Enter' && start()}
              placeholder="e.g. Newton's Laws, Photosynthesis..."
              className="input-dark w-full text-sm" />
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => { playClick(); setDifficulty(d); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${d===difficulty ? d==='beginner' ? 'bg-neon-green/20 border-neon-green/40 text-neon-green' : d==='intermediate' ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-brand-border text-white/40'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Timer Mode</label>
            <div className="flex gap-2">
              {TIMER_OPTIONS.map((t, i) => (
                <button key={t.label} onClick={() => { playClick(); setTimerIdx(i); }}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-center border transition-all ${i===timerIdx ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'border-brand-border text-white/40'}`}>
                  <div className="text-sm">{t.label}</div>
                  <div className="text-[9px] mt-0.5 opacity-70">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Questions: <span className="text-cyan">{numQ}</span></label>
            <input type="range" min={3} max={10} step={1} value={numQ}
              onChange={e => setNumQ(+e.target.value)} className="w-full accent-cyan" />
          </div>

          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={start} disabled={loading}
            className="btn-cyan w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-semibold">
            {loading ? <><Loader size={15} className="animate-spin" />Generating Quiz...</> : <><Zap size={15} />Generate Quiz with AI</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Active Quiz ── */
function ActiveQuiz({ quiz, timerSeconds, onComplete }) {
  const [current,  setCurrent]  = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers,  setAnswers]  = useState([]);
  const [showExp,  setShowExp]  = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerSeconds || 60);
  const [explaining, setExplaining] = useState(false);
  const [deepExp,  setDeepExp]  = useState('');
  const timerRef = useRef(null);

  const q     = quiz.questions[current];
  const total = quiz.questions.length;
  const hasTimer = timerSeconds > 0;

  const handleSelect = useCallback((idx) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    setSelected(idx);
    setShowExp(true);
    setDeepExp('');
    if (idx === q.correctIndex) playCorrect();
    else playWrong();
    setAnswers(prev => [...prev, { questionIndex:current, selectedIndex:idx, correct: idx===q.correctIndex }]);
  }, [selected, q, current]);

  // Timer
  useEffect(() => {
    if (!hasTimer) return;
    setTimeLeft(timerSeconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSelect(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, hasTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (['1','2','3','4'].includes(e.key)) {
        const idx = +e.key - 1;
        if (idx < q.options.length) handleSelect(idx);
      }
      if (e.key === 'Enter' && selected !== null) next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, current]);

  const next = () => {
    playClick();
    if (current + 1 >= total) {
      const correct = answers.filter(a => a.correct).length;
      onComplete({ quiz, answers, correct, total });
    } else {
      setSelected(null);
      setShowExp(false);
      setDeepExp('');
      setCurrent(c => c + 1);
    }
  };

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const res = await explainAnswer(q.question, q.options[q.correctIndex], quiz.subject);
      setDeepExp(res.data.explanation);
    } catch { setDeepExp('Backend server not running. Start it to get detailed explanations.'); }
    finally { setExplaining(false); }
  };

  const pct        = Math.round((current / total) * 100);
  const timerColor = !hasTimer ? '#00e5ff' : timeLeft <= 10 ? '#f87171' : timeLeft <= 20 ? '#ffb830' : '#00e5ff';
  const timerPct   = hasTimer ? (timeLeft / timerSeconds) * 100 : 100;

  return (
    <div className="max-w-2xl mx-auto px-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-white/40 text-xs truncate max-w-[200px]">{quiz.title}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          {hasTimer && (
            <div className="flex items-center gap-1.5 font-mono" style={{ color:timerColor }}>
              <Clock size={13} />{timeLeft}s
            </div>
          )}
          <span className="text-white/40">{current+1}/{total}</span>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-1 mb-5">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-cyan rounded-full" animate={{ width:`${pct}%` }} />
        </div>
        {hasTimer && (
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background:timerColor }}
              animate={{ width:`${timerPct}%` }} transition={{ duration:1, ease:'linear' }} />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
          className="glass border border-brand-border rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-cyan font-bold uppercase tracking-widest">Question {current+1}</p>
            <p className="text-[10px] text-white/20 flex items-center gap-1"><Keyboard size={10} />Use keys 1-4</p>
          </div>
          <p className="text-base md:text-lg font-semibold leading-relaxed mb-5">{q.question}</p>
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              let cls = 'border-brand-border text-white/70 hover:border-brand-border2 hover:bg-white/[0.03]';
              if (selected !== null) {
                if (i===q.correctIndex)  cls = 'border-neon-green bg-neon-green/10 text-neon-green';
                else if (i===selected)   cls = 'border-red-400 bg-red-500/10 text-red-400';
                else                     cls = 'border-brand-border text-white/25 opacity-50';
              }
              return (
                <motion.button key={i} whileHover={selected===null ? {x:3} : {}}
                  onClick={() => handleSelect(i)} disabled={selected!==null}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all disabled:cursor-default ${cls}`}>
                  <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {['1','2','3','4'][i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {selected!==null && i===q.correctIndex && <CheckCircle size={15} className="flex-shrink-0" />}
                  {selected!==null && i===selected && i!==q.correctIndex && <XCircle size={15} className="flex-shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showExp && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className={`rounded-2xl px-4 py-3.5 mb-3 border text-sm ${selected===q.correctIndex ? 'bg-neon-green/10 border-neon-green/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <p className="font-semibold text-white mb-1">{selected===q.correctIndex ? '✅ Correct!' : '❌ Incorrect'}</p>
            <p className="text-white/60 text-xs leading-relaxed">{q.explanation}</p>
            {selected !== q.correctIndex && (
              <div className="mt-3">
                {deepExp ? (
                  <div className="bg-cyan/10 border border-cyan/20 rounded-xl p-3 text-xs text-cyan/90 leading-relaxed">
                    🧠 {deepExp}
                  </div>
                ) : (
                  <button onClick={handleExplain} disabled={explaining}
                    className="flex items-center gap-1.5 text-xs text-cyan hover:text-cyan/80 transition-colors disabled:opacity-50">
                    {explaining ? <Loader size={11} className="animate-spin" /> : <HelpCircle size={11} />}
                    Explain this in more detail
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selected !== null && (
        <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }}
          onClick={next} className="btn-cyan w-full py-3 text-sm font-semibold flex items-center justify-center gap-2">
          {current+1 >= total ? 'See Results →' : <>Next Question <span className="text-xs text-brand-bg/60 ml-1">[Enter]</span></>}
        </motion.button>
      )}
    </div>
  );
}

/* ── Results ── */
function QuizResults({ result, quiz, timerSeconds, onRetry, onNew }) {
  const { user }                            = useAuth();
  const { updateProfileLocal, refreshProfile } = useUserData();
  const [saved,      setSaved]      = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [fcLoading,  setFcLoading]  = useState(false);
  const [currentFc,  setCurrentFc]  = useState(0);
  const [showBack,   setShowBack]   = useState(false);

  const score    = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const xpEarned = result.correct * 10 + (score===100 ? 50 : score>=80 ? 25 : 10);
  const emoji    = score===100 ? '🏆' : score>=80 ? '🎉' : score>=60 ? '👍' : '📚';
  const color    = score>=80 ? '#34d399' : score>=60 ? '#00e5ff' : '#ffb830';

  useEffect(() => {
    if (saved) return;
    const save = async () => {
      if (score === 100) { triggerConfetti(); playPerfect(); }
      else { playXP(); }

      const res = await saveQuizResultToFirestore(user?.uid, {
        subject: quiz.subject, topic: quiz.topic,
        score, totalQuestions: result.total,
        correctAnswers: result.correct, difficulty: quiz.difficulty,
      });
      if (res?.newBadges?.length > 0)
        res.newBadges.forEach(b => toast.success(`🏆 Badge: ${b.name}!`, { duration:4000 }));
      if (res) { updateProfileLocal({ xp:res.newXp, level:res.newLevel }); await refreshProfile(); }
      setSaved(true);

      // Generate flashcards for wrong answers
      const wrongQs = quiz.questions
        .filter((_, i) => !result.answers[i]?.correct)
        .map(q => q.question);
      if (wrongQs.length > 0) {
        setFcLoading(true);
        generateFlashcards(quiz.subject, quiz.topic, wrongQs)
          .then(r => { setFlashcards(r.data.flashcards || []); setFcLoading(false); })
          .catch(() => setFcLoading(false));
      }
    };
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-4 px-2">
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="glass border border-brand-border rounded-2xl p-6 text-center" style={{ borderColor:`${color}30` }}>
        <div className="text-5xl mb-3">{emoji}</div>
        <h2 className="font-syne font-black text-5xl mb-1" style={{ color }}>{score}%</h2>
        <p className="text-white/40 text-sm mb-0.5">{result.correct} correct out of {result.total}</p>
        <p className="text-white/25 text-xs mb-5">{quiz.topic} · {quiz.difficulty}</p>

        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.4, type:'spring' }}
          className="flex items-center justify-center gap-2 text-neon-amber font-bold mb-5">
          <Zap size={14} />+{xpEarned} XP earned
        </motion.div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[{l:'Score',v:`${score}%`,c:color},{l:'Correct',v:`${result.correct}/${result.total}`,c:'#34d399'},{l:'XP',v:`+${xpEarned}`,c:'#ffb830'}].map(({l,v,c}) => (
            <div key={l} className="bg-white/[0.04] rounded-xl p-3">
              <div className="font-syne font-black text-lg" style={{ color:c }}>{v}</div>
              <div className="text-[10px] text-white/30">{l}</div>
            </div>
          ))}
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-1.5 mb-5 text-left max-h-40 overflow-y-auto">
          {quiz.questions.map((q, i) => {
            const correct = result.answers[i]?.correct ?? false;
            return (
              <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl text-xs ${correct ? 'bg-neon-green/10' : 'bg-red-500/10'}`}>
                {correct ? <CheckCircle size={11} className="text-neon-green mt-0.5 flex-shrink-0" /> : <XCircle size={11} className="text-red-400 mt-0.5 flex-shrink-0" />}
                <span className={correct ? 'text-neon-green/80' : 'text-red-400/80'}>{q.question.length>65 ? q.question.substring(0,65)+'...' : q.question}</span>
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

      {/* Flashcards */}
      {(fcLoading || flashcards.length > 0) && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="glass border border-cyan/20 rounded-2xl p-5">
          <h3 className="font-syne font-bold text-sm mb-1 flex items-center gap-2">
            <Layers size={14} className="text-cyan" />Review Flashcards
          </h3>
          <p className="text-xs text-white/40 mb-4">AI-generated for questions you got wrong</p>

          {fcLoading ? (
            <div className="flex items-center gap-2 text-sm text-white/40 py-4 justify-center">
              <Loader size={14} className="animate-spin text-cyan" />Generating flashcards...
            </div>
          ) : (
            <>
              <div className="relative h-32 mb-4 cursor-pointer" onClick={() => { playClick(); setShowBack(b => !b); }}>
                <AnimatePresence mode="wait">
                  {!showBack ? (
                    <motion.div key="front" initial={{ rotateY:90 }} animate={{ rotateY:0 }} exit={{ rotateY:-90 }}
                      className="absolute inset-0 rounded-2xl bg-cyan/10 border border-cyan/20 flex flex-col items-center justify-center px-4 text-center">
                      <p className="text-[10px] text-cyan font-bold mb-2">QUESTION</p>
                      <p className="text-sm font-semibold">{flashcards[currentFc]?.front}</p>
                      <p className="text-[10px] text-white/30 mt-2 flex items-center gap-1"><Eye size={10} />Tap to reveal</p>
                    </motion.div>
                  ) : (
                    <motion.div key="back" initial={{ rotateY:-90 }} animate={{ rotateY:0 }} exit={{ rotateY:90 }}
                      className="absolute inset-0 rounded-2xl bg-neon-green/10 border border-neon-green/20 flex flex-col items-center justify-center px-4 text-center">
                      <p className="text-[10px] text-neon-green font-bold mb-2">ANSWER</p>
                      <p className="text-sm text-white leading-relaxed">{flashcards[currentFc]?.back}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => { playClick(); setShowBack(false); setCurrentFc(i => Math.max(0,i-1)); }}
                  disabled={currentFc===0} className="p-2 rounded-xl glass border border-brand-border disabled:opacity-30">
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs text-white/40">{currentFc+1}/{flashcards.length}</span>
                <button onClick={() => { playClick(); setShowBack(false); setCurrentFc(i => Math.min(flashcards.length-1,i+1)); }}
                  disabled={currentFc===flashcards.length-1} className="p-2 rounded-xl glass border border-brand-border disabled:opacity-30">
                  <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function QuizPage() {
  const { profile }  = useUserData();
  const [phase,      setPhase]      = useState('setup');
  const [quiz,       setQuiz]       = useState(null);
  const [timerSec,   setTimerSec]   = useState(60);
  const [result,     setResult]     = useState(null);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6 pt-10 lg:pt-0">
        <h1 className="font-syne font-black text-2xl md:text-3xl mb-1">AI Quiz Generator</h1>
        <p className="text-white/40 text-sm">Custom quizzes · Keyboard shortcuts · AI explanations · Auto flashcards</p>
      </div>
      {phase==='setup'   && <QuizSetup onStart={(q,t) => { setQuiz(q); setTimerSec(t); setPhase('active'); }} currentDifficulty={profile?.currentDifficulty} />}
      {phase==='active'  && quiz   && <ActiveQuiz quiz={quiz} timerSeconds={timerSec} onComplete={r => { setResult(r); setPhase('results'); }} />}
      {phase==='results' && result && <QuizResults result={result} quiz={quiz} timerSeconds={timerSec} onRetry={() => setPhase('active')} onNew={() => { setQuiz(null); setPhase('setup'); }} />}
    </div>
  );
}

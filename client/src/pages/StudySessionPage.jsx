import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronRight, ChevronLeft, Zap, CheckCircle,
  XCircle, Brain, RotateCcw, Trophy, Layers, ArrowRight,
  HelpCircle, Eye, EyeOff, Loader
} from 'lucide-react';
import { generateStudySession, generateQuiz, generateFlashcards, explainAnswer } from '../utils/api';
import { saveQuizResultToFirestore } from '../utils/firestoreUtils';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { playClick, playCorrect, playWrong, playXP, playPerfect, playComplete } from '../utils/soundEffects';
import { triggerConfetti } from '../utils/confetti';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Geography','Literature','Economics','Psychology'];

/* ─── PHASE: Setup ─────────────────────────────────────────────────────────── */
function SessionSetup({ onStart }) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic,   setTopic]   = useState('');
  const [level,   setLevel]   = useState('intermediate');
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!topic.trim()) { toast.error('Enter a topic to study'); return; }
    setLoading(true);
    try {
      const res = await generateStudySession(subject, topic, level);
      playClick();
      onStart(res.data);
    } catch (err) {
      if (!err.response) {
        toast.error('Backend server not running — start it with: npm run dev in /server');
      } else {
        toast.error('Failed to generate session. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="glass border border-brand-border rounded-3xl p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <BookOpen size={22} className="text-violet-400" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-xl">Start Study Session</h2>
            <p className="text-xs text-white/40">AI teaches you step by step, then quizzes you</p>
          </div>
        </div>

        {/* How it works mini-guide */}
        <div className="bg-white/[0.03] border border-brand-border rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-white/60 mb-2">How it works:</p>
          <div className="flex items-center gap-0 overflow-hidden">
            {[
              { icon:'📖', label:'5 lesson cards' },
              { icon:'✅', label:'2 checkpoints' },
              { icon:'📝', label:'End quiz' },
              { icon:'🏆', label:'XP + badges' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center text-center flex-1">
                  <span className="text-lg mb-1">{s.icon}</span>
                  <span className="text-[10px] text-white/40">{s.label}</span>
                </div>
                {i < 3 && <ChevronRight size={12} className="text-white/20 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Subject</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s} onClick={() => { playClick(); setSubject(s); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${s===subject ? 'bg-violet-500/20 border-violet-500/40 text-violet-400' : 'border-brand-border text-white/40 hover:border-brand-border2'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">
              Topic <span className="text-white/20">(be specific for best lessons)</span>
            </label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key==='Enter' && start()}
              placeholder="e.g. Photosynthesis, Quadratic Equations, French Revolution..."
              className="input-dark w-full text-sm" autoFocus />
          </div>

          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Your Level</label>
            <div className="flex gap-2">
              {['beginner','intermediate','advanced'].map(l => (
                <button key={l} onClick={() => { playClick(); setLevel(l); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${l===level ? l==='beginner' ? 'bg-neon-green/20 border-neon-green/40 text-neon-green' : l==='intermediate' ? 'bg-violet-500/20 border-violet-500/40 text-violet-400' : 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-brand-border text-white/40'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={start} disabled={loading}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background:'linear-gradient(135deg, #a78bfa, #00e5ff)', color:'#060912' }}>
            {loading
              ? <><Loader size={16} className="animate-spin" />Generating your lesson...</>
              : <><BookOpen size={16} />Start Learning Session</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── PHASE: Lesson Cards ──────────────────────────────────────────────────── */
function LessonCards({ session, onComplete }) {
  const [cardIdx,    setCardIdx]    = useState(0);
  const [checkpoint, setCheckpoint] = useState(null); // null | {data, answered}
  const [cpSelected, setCpSelected] = useState(null);
  const [cpShown,    setCpShown]    = useState(false);
  const [flipped,    setFlipped]    = useState(false);

  const card      = session.cards[cardIdx];
  const total     = session.cards.length;
  const pct       = Math.round(((cardIdx) / total) * 100);

  // Check if there's a checkpoint after this card
  const checkAfterThis = session.checkpoints?.find(c => c.afterCard === cardIdx + 1);

  const handleNext = () => {
    playClick();
    setFlipped(false);
    if (checkAfterThis && !cpShown) {
      setCheckpoint(checkAfterThis);
      setCpSelected(null);
      return;
    }
    setCpShown(false);
    setCheckpoint(null);
    if (cardIdx + 1 >= total) {
      playComplete();
      onComplete();
    } else {
      setCardIdx(i => i + 1);
    }
  };

  const handleCpAnswer = (idx) => {
    if (cpSelected !== null) return;
    setCpSelected(idx);
    setCpShown(true);
    if (idx === checkpoint.correctIndex) {
      playCorrect();
      toast.success('Correct! Keep going 🎯', { duration: 2000 });
    } else {
      playWrong();
    }
  };

  const handleCpContinue = () => {
    playClick();
    setCheckpoint(null);
    setCpShown(false);
    if (cardIdx + 1 >= total) { playComplete(); onComplete(); }
    else setCardIdx(i => i + 1);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background:'linear-gradient(90deg, #a78bfa, #00e5ff)' }}
            animate={{ width:`${pct}%` }} transition={{ duration:0.4 }} />
        </div>
        <span className="text-xs text-white/40 flex-shrink-0">{cardIdx + 1}/{total}</span>
        <span className="text-xs text-white/30 flex-shrink-0">~{session.estimatedMinutes}min</span>
      </div>

      <AnimatePresence mode="wait">
        {/* ── CHECKPOINT ── */}
        {checkpoint ? (
          <motion.div key="checkpoint"
            initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
            className="glass border border-neon-amber/30 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-neon-amber/20 flex items-center justify-center text-sm">✅</div>
              <div>
                <p className="font-syne font-bold text-sm text-neon-amber">Quick Check</p>
                <p className="text-xs text-white/40">Let's make sure you've got this</p>
              </div>
            </div>
            <p className="text-base font-semibold leading-relaxed mb-5">{checkpoint.question}</p>
            <div className="space-y-2.5 mb-4">
              {checkpoint.options.map((opt, i) => {
                let cls = 'border-brand-border text-white/70 hover:border-brand-border2';
                if (cpSelected !== null) {
                  if (i === checkpoint.correctIndex)  cls = 'border-neon-green bg-neon-green/10 text-neon-green';
                  else if (i === cpSelected)           cls = 'border-red-400 bg-red-500/10 text-red-400';
                  else                                 cls = 'border-brand-border text-white/30 opacity-50';
                }
                return (
                  <button key={i} onClick={() => handleCpAnswer(i)} disabled={cpSelected !== null}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${cls}`}>
                    <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {['A','B','C','D'][i]}
                    </span>
                    {opt}
                    {cpSelected !== null && i === checkpoint.correctIndex && <CheckCircle size={14} className="ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            {cpSelected !== null && (
              <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}>
                <div className={`px-4 py-3 rounded-xl text-xs mb-4 border ${cpSelected===checkpoint.correctIndex ? 'bg-neon-green/10 border-neon-green/20 text-neon-green/80' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                  {checkpoint.explanation}
                </div>
                <button onClick={handleCpContinue}
                  style={{ background:'linear-gradient(135deg, #a78bfa, #00e5ff)', color:'#060912' }}
                  className="w-full py-3 rounded-2xl font-semibold text-sm">
                  Continue to next card →
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* ── LESSON CARD ── */
          <motion.div key={cardIdx}
            initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
            className="glass border border-brand-border rounded-3xl overflow-hidden">
            {/* Card header */}
            <div className="px-6 pt-6 pb-4" style={{ background:'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(0,229,255,0.06))' }}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{card.emoji}</span>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Card {cardIdx+1} of {total}</span>
                  </div>
                  <h3 className="font-syne font-black text-xl leading-tight">{card.title}</h3>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Main content */}
              <p className="text-white/80 leading-relaxed text-sm">{card.content}</p>

              {/* Formula box */}
              {card.formula && (
                <div className="bg-black/30 border border-brand-border2 rounded-2xl p-4">
                  {card.formulaLabel && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan mb-2">{card.formulaLabel}</p>
                  )}
                  <code className="text-cyan font-mono text-lg font-bold block text-center">{card.formula}</code>
                </div>
              )}

              {/* Example */}
              {card.example && (
                <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">📌 Example</p>
                  <p className="text-sm text-white/70 leading-relaxed">{card.example}</p>
                </div>
              )}

              {/* Key points */}
              {card.keyPoints?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2.5">Key Points</p>
                  <div className="space-y-2">
                    {card.keyPoints.map((pt, i) => (
                      <motion.div key={i}
                        initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.1 }}
                        className="flex items-start gap-2.5 text-sm text-white/70">
                        <span className="w-5 h-5 rounded-full bg-cyan/20 text-cyan flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                        {pt}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="px-6 pb-6 flex items-center gap-3">
              {cardIdx > 0 && (
                <button onClick={() => { playClick(); setFlipped(false); setCardIdx(i => i-1); }}
                  className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
                  <ChevronLeft size={16} /> Previous
                </button>
              )}
              <button onClick={handleNext}
                style={{ background:'linear-gradient(135deg, #a78bfa, #00e5ff)', color:'#060912' }}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2">
                {checkAfterThis && !cpShown ? <>Quick Check <CheckCircle size={15} /></> : cardIdx+1 >= total ? <>Go to Quiz 📝</> : <>Next Card <ChevronRight size={15} /></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── PHASE: End Quiz ──────────────────────────────────────────────────────── */
function EndQuiz({ session, onComplete }) {
  const [quiz,     setQuiz]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [current,  setCurrent]  = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers,  setAnswers]  = useState([]);
  const [showExp,  setShowExp]  = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [deepExp,  setDeepExp]  = useState('');

  useEffect(() => {
    generateQuiz(session.subject, session.topic, session.level, 5)
      .then(r => { setQuiz(r.data); setLoading(false); })
      .catch(() => { toast.error('Quiz generation failed'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto glass border border-brand-border rounded-3xl p-12 text-center">
      <Loader size={32} className="text-violet-400 animate-spin mx-auto mb-4" />
      <p className="text-white/60 font-syne font-bold text-lg">Generating your quiz...</p>
      <p className="text-white/30 text-sm mt-2">Based on what you just learned in {session.topic}</p>
    </div>
  );

  if (!quiz) return null;

  const q     = quiz.questions[current];
  const total = quiz.questions.length;

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExp(true);
    setDeepExp('');
    if (idx === q.correctIndex) playCorrect();
    else playWrong();
    setAnswers(prev => [...prev, { questionIndex:current, selectedIndex:idx, correct: idx === q.correctIndex }]);
  };

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const res = await explainAnswer(q.question, q.options[q.correctIndex], session.subject);
      setDeepExp(res.data.explanation);
    } catch { setDeepExp('Explanation unavailable. Make sure the backend server is running.'); }
    finally { setExplaining(false); }
  };

  const next = () => {
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-sm text-white/40 flex-1">📝 End-of-Session Quiz — <span className="text-violet-400 font-semibold">{session.topic}</span></div>
        <span className="text-xs text-white/40">{current+1}/{total}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-5">
        <motion.div className="h-full rounded-full" style={{ background:'linear-gradient(90deg,#a78bfa,#00e5ff)' }}
          animate={{ width:`${(current/total)*100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
          className="glass border border-brand-border rounded-3xl p-6 mb-4">
          <p className="text-xs text-violet-400 font-bold uppercase tracking-widest mb-3">Question {current+1}</p>
          <p className="text-lg font-semibold leading-relaxed mb-5">{q.question}</p>
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              let cls = 'border-brand-border text-white/70 hover:border-brand-border2';
              if (selected !== null) {
                if (i === q.correctIndex)  cls = 'border-neon-green bg-neon-green/10 text-neon-green';
                else if (i === selected)   cls = 'border-red-400 bg-red-500/10 text-red-400';
                else                       cls = 'border-brand-border text-white/25 opacity-50';
              }
              return (
                <motion.button key={i} whileHover={selected===null ? {x:3} : {}}
                  onClick={() => handleSelect(i)} disabled={selected!==null}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all disabled:cursor-default ${cls}`}>
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {['A','B','C','D'][i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {selected!==null && i===q.correctIndex && <CheckCircle size={14} className="flex-shrink-0" />}
                  {selected!==null && i===selected && i!==q.correctIndex && <XCircle size={14} className="flex-shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {showExp && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          className={`rounded-2xl px-4 py-3.5 mb-3 border text-sm ${selected===q.correctIndex ? 'bg-neon-green/10 border-neon-green/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <p className="font-semibold text-white mb-1">{selected===q.correctIndex ? '✅ Correct!' : '❌ Incorrect'}</p>
          <p className="text-white/60 text-xs">{q.explanation}</p>
          {/* Explain deeper button */}
          {selected !== q.correctIndex && (
            <div className="mt-3">
              {deepExp ? (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-xs text-violet-300 leading-relaxed">
                  🧠 <strong>Deeper explanation:</strong> {deepExp}
                </div>
              ) : (
                <button onClick={handleExplain} disabled={explaining}
                  className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50">
                  {explaining ? <Loader size={11} className="animate-spin" /> : <HelpCircle size={11} />}
                  Explain this answer in more detail
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {selected !== null && (
        <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={next}
          style={{ background:'linear-gradient(135deg, #a78bfa, #00e5ff)', color:'#060912' }}
          className="w-full py-3 rounded-2xl font-semibold text-sm">
          {current+1 >= total ? 'See Results 🏆' : 'Next Question →'}
        </motion.button>
      )}
    </div>
  );
}

/* ─── PHASE: Results ───────────────────────────────────────────────────────── */
function SessionResults({ session, quizResult, onRestart, onNewSession }) {
  const { user }                         = useAuth();
  const { updateProfileLocal, refreshProfile } = useUserData();
  const [flashcards, setFlashcards]      = useState([]);
  const [fcLoading,  setFcLoading]       = useState(false);
  const [currentFc,  setCurrentFc]       = useState(0);
  const [showBack,   setShowBack]        = useState(false);
  const [saved,      setSaved]           = useState(false);

  const score    = quizResult.total > 0 ? Math.round((quizResult.correct / quizResult.total) * 100) : 0;
  const xpEarned = quizResult.correct * 15 + (score===100 ? 75 : score>=80 ? 40 : 20) + 50; // bonus 50 XP for completing session
  const color    = score>=80 ? '#34d399' : score>=60 ? '#a78bfa' : '#ffb830';

  useEffect(() => {
    if (saved) return;
    const save = async () => {
      if (score === 100) { triggerConfetti(); playPerfect(); }
      else { playXP(); }

      const res = await saveQuizResultToFirestore(user?.uid, {
        subject: session.subject, topic: session.topic,
        score, totalQuestions: quizResult.total,
        correctAnswers: quizResult.correct, difficulty: session.level,
      });
      if (res?.newBadges?.length > 0) {
        res.newBadges.forEach(b => toast.success(`🏆 ${b.name}!`, { duration:4000 }));
      }
      if (res) { updateProfileLocal({ xp: res.newXp, level: res.newLevel }); await refreshProfile(); }
      setSaved(true);

      // Auto-generate flashcards for wrong answers
      const wrongQs = quizResult.quiz.questions
        .filter((_, i) => !quizResult.answers[i]?.correct)
        .map(q => q.question);
      if (wrongQs.length > 0) {
        setFcLoading(true);
        generateFlashcards(session.subject, session.topic, wrongQs)
          .then(r => { setFlashcards(r.data.flashcards || []); setFcLoading(false); })
          .catch(() => setFcLoading(false));
      }
    };
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emoji = score===100 ? '🏆' : score>=80 ? '🎉' : score>=60 ? '💪' : '📚';

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Score card */}
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="glass border border-brand-border rounded-3xl p-7 text-center"
        style={{ borderColor: `${color}30` }}>
        <div className="text-5xl mb-3">{emoji}</div>
        <h2 className="font-syne font-black text-5xl mb-1" style={{ color }}>{score}%</h2>
        <p className="text-white/50 text-sm mb-0.5">{quizResult.correct}/{quizResult.total} correct · {session.topic}</p>
        <p className="text-white/30 text-xs mb-5">Session complete · {session.subject}</p>

        {/* XP */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <motion.div
            initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.5, type:'spring' }}
            className="flex items-center gap-2 bg-neon-amber/10 border border-neon-amber/30 rounded-full px-5 py-2 text-neon-amber font-bold">
            <Zap size={16} /> +{xpEarned} XP earned
          </motion.div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { l:'Score',         v:`${score}%`,              c:color },
            { l:'Session XP',    v:`+${xpEarned}`,           c:'#ffb830' },
            { l:'Correct',       v:`${quizResult.correct}/${quizResult.total}`, c:'#34d399' },
          ].map(({ l, v, c }) => (
            <div key={l} className="bg-white/[0.04] rounded-xl p-3">
              <div className="font-syne font-black text-lg" style={{ color:c }}>{v}</div>
              <div className="text-[10px] text-white/30">{l}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onRestart}
            className="flex-1 btn-outline py-2.5 text-sm flex items-center justify-center gap-1.5">
            <RotateCcw size={13} />Retry Quiz
          </button>
          <button onClick={onNewSession}
            style={{ background:'linear-gradient(135deg,#a78bfa,#00e5ff)', color:'#060912' }}
            className="flex-1 py-2.5 rounded-2xl font-semibold text-sm">
            New Session →
          </button>
        </div>
      </motion.div>

      {/* Flashcards for wrong answers */}
      {(fcLoading || flashcards.length > 0) && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="glass border border-violet-500/20 rounded-3xl p-5">
          <h3 className="font-syne font-bold text-base mb-1 flex items-center gap-2">
            <Layers size={16} className="text-violet-400" />Review Flashcards
          </h3>
          <p className="text-xs text-white/40 mb-4">AI-generated for the questions you got wrong</p>

          {fcLoading ? (
            <div className="flex items-center gap-2 text-sm text-white/40 py-4 justify-center">
              <Loader size={15} className="animate-spin text-violet-400" />Generating flashcards...
            </div>
          ) : (
            <>
              {/* Flashcard flip */}
              <div className="relative h-36 mb-4 cursor-pointer" onClick={() => { playClick(); setShowBack(b => !b); }}
                style={{ perspective:'1000px' }}>
                <motion.div animate={{ rotateY: showBack ? 180 : 0 }}
                  transition={{ duration: 0.4 }} style={{ transformStyle:'preserve-3d', width:'100%', height:'100%' }}>
                  {/* Front */}
                  <div className="absolute inset-0 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex flex-col items-center justify-center px-5 text-center"
                    style={{ backfaceVisibility:'hidden' }}>
                    <p className="text-xs text-violet-400 font-semibold mb-2">QUESTION</p>
                    <p className="text-sm font-semibold text-white">{flashcards[currentFc]?.front}</p>
                    <p className="text-xs text-white/30 mt-3 flex items-center gap-1"><Eye size={11} />Tap to reveal answer</p>
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 rounded-2xl bg-cyan/10 border border-cyan/20 flex flex-col items-center justify-center px-5 text-center"
                    style={{ backfaceVisibility:'hidden', transform:'rotateY(180deg)' }}>
                    <p className="text-xs text-cyan font-semibold mb-2">ANSWER</p>
                    <p className="text-sm text-white leading-relaxed">{flashcards[currentFc]?.back}</p>
                    {flashcards[currentFc]?.hint && (
                      <p className="text-[10px] text-white/30 mt-2 italic">💡 {flashcards[currentFc].hint}</p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button onClick={() => { playClick(); setShowBack(false); setCurrentFc(i => Math.max(0, i-1)); }}
                  disabled={currentFc===0} className="p-2 rounded-xl glass border border-brand-border disabled:opacity-30">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-white/40">{currentFc+1} / {flashcards.length}</span>
                <button onClick={() => { playClick(); setShowBack(false); setCurrentFc(i => Math.min(flashcards.length-1, i+1)); }}
                  disabled={currentFc===flashcards.length-1} className="p-2 rounded-xl glass border border-brand-border disabled:opacity-30">
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ────────────────────────────────────────────────────────────── */
export default function StudySessionPage() {
  const [phase,   setPhase]   = useState('setup');   // setup | lesson | quiz | results
  const [session, setSession] = useState(null);
  const [quizRes, setQuizRes] = useState(null);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      {/* Header with phase indicator */}
      <div className="mb-6 pt-10 lg:pt-0">
        <h1 className="font-syne font-black text-2xl md:text-3xl mb-1">Study Sessions</h1>
        <p className="text-white/40 text-sm">AI teaches you first, then quizzes you on what you learned</p>

        {/* Phase breadcrumb */}
        {session && (
          <div className="flex items-center gap-2 mt-3">
            {[
              { id:'setup',   label:'Setup' },
              { id:'lesson',  label:`Lesson: ${session.topic}` },
              { id:'quiz',    label:'Quiz' },
              { id:'results', label:'Results' },
            ].map((p, i) => {
              const phases  = ['setup','lesson','quiz','results'];
              const current = phases.indexOf(phase);
              const idx     = phases.indexOf(p.id);
              return (
                <React.Fragment key={p.id}>
                  <span className={`text-xs font-medium ${idx === current ? 'text-violet-400' : idx < current ? 'text-white/40' : 'text-white/20'}`}>
                    {p.label}
                  </span>
                  {i < 3 && <ChevronRight size={12} className="text-white/15" />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {phase === 'setup' && (
        <SessionSetup onStart={(s) => { setSession(s); setPhase('lesson'); }} />
      )}
      {phase === 'lesson' && session && (
        <LessonCards session={session} onComplete={() => setPhase('quiz')} />
      )}
      {phase === 'quiz' && session && (
        <EndQuiz session={session} onComplete={(r) => { setQuizRes(r); setPhase('results'); }} />
      )}
      {phase === 'results' && session && quizRes && (
        <SessionResults
          session={session}
          quizResult={quizRes}
          onRestart={() => setPhase('quiz')}
          onNewSession={() => { setSession(null); setQuizRes(null); setPhase('setup'); }}
        />
      )}
    </div>
  );
}

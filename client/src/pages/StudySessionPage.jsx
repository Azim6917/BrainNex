import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronRight, ChevronLeft, Zap, CheckCircle,
  XCircle, Brain, RotateCcw, Trophy, Layers, ArrowRight,
  HelpCircle, Eye, EyeOff, Loader, Clock
} from 'lucide-react';
import { generateStudySession, generateQuiz, generateFlashcards, explainAnswer } from '../utils/api';
import { saveQuizResultToFirestore } from '../utils/firestoreUtils';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { audioSystem } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Geography','Literature','Economics','Psychology'];

/* ─── PHASE: Setup ─────────────────────────────────────────────────────────── */
function SessionSetup({ onStart }) {
  const { profile } = useUserData();
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic,   setTopic]   = useState('');
  const [level,   setLevel]   = useState('intermediate');
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!topic.trim()) { toast.error('Enter a topic to study'); return; }
    setLoading(true);
    try {
      const res = await generateStudySession(subject, topic, level, profile?.grade);
      audioSystem.playClick();
      onStart({ ...res.data, grade: profile?.grade });
    } catch (err) {
      if (!err.response) {
        toast.error('Backend server not running — start it with: npm run dev in /server');
      } else {
        toast.error('Failed to generate session. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="glass-card p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm">
            <BookOpen size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="font-jakarta font-black text-2xl text-txt mb-1">Start Study Session</h2>
            <p className="text-sm font-medium text-txt3">AI teaches you step by step, then quizzes you</p>
          </div>
        </div>

        {/* How it works mini-guide */}
        <div className="bg-space-800 border border-white/5 rounded-2xl p-5 mb-8 relative z-10 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-txt3 mb-4">How it works:</p>
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            {[
              { icon:'📖', label:'5 lesson cards' },
              { icon:'✅', label:'2 checkpoints' },
              { icon:'📝', label:'End quiz' },
              { icon:'🏆', label:'XP + badges' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center text-center flex-1">
                  <span className="text-2xl mb-2 drop-shadow-sm">{s.icon}</span>
                  <span className="text-[10px] font-bold text-txt3 uppercase tracking-wider">{s.label}</span>
                </div>
                {i < 3 && <ChevronRight size={16} className="text-white/10 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-txt3 mb-3 block">Subject</label>
            <div className="flex flex-wrap gap-2.5">
              {SUBJECTS.map(s => (
                <button key={s} onClick={() => { audioSystem.playClick(); setSubject(s); }}
                  className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all border shadow-sm ${s===subject ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-transparent border-border text-txt3 hover:border-white/20 hover:text-txt2'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-txt3 mb-3 block">
              Topic <span className="text-white/20 ml-1 font-medium lowercase">(be specific for best lessons)</span>
            </label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key==='Enter' && start()}
              placeholder="e.g. Photosynthesis, Quadratic Equations, French Revolution..."
              className="input-field text-sm" autoFocus />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-txt3 mb-3 block">Your Level</label>
            <div className="flex gap-3">
              {['beginner','intermediate','advanced'].map(l => (
                <button key={l} onClick={() => { audioSystem.playClick(); setLevel(l); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize border transition-all shadow-sm ${l===level ? l==='beginner' ? 'bg-green-500/10 border-green-500/40 text-green-500' : l==='intermediate' ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-transparent border-border text-txt3 hover:border-white/20'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={start} disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-all btn-primary shadow-glow-primary mt-4">
            {loading
              ? <><Loader size={18} className="animate-spin" />Generating your lesson...</>
              : <><BookOpen size={18} />Start Learning Session</>}
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
    audioSystem.playClick();
    setFlipped(false);
    if (checkAfterThis && !cpShown) {
      setCheckpoint(checkAfterThis);
      setCpSelected(null);
      return;
    }
    setCpShown(false);
    setCheckpoint(null);
    if (cardIdx + 1 >= total) {
      audioSystem.playQuizComplete();
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
      audioSystem.playCorrect();
      toast.success('Correct! Keep going 🎯', { duration: 2000 });
    } else {
      audioSystem.playWrong();
    }
  };

  const handleCpContinue = () => {
    audioSystem.playClick();
    setCheckpoint(null);
    setCpShown(false);
    if (cardIdx + 1 >= total) { audioSystem.playQuizComplete(); onComplete(); }
    else setCardIdx(i => i + 1);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-2 bg-space-800 rounded-full overflow-hidden shadow-inner">
          <motion.div className="h-full rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]"
            style={{ background:'linear-gradient(90deg, var(--primary), var(--cyan))' }}
            animate={{ width:`${pct}%` }} transition={{ duration:0.4 }} />
        </div>
        <span className="text-xs font-bold text-txt3 flex-shrink-0 bg-space-800 px-3 py-1.5 rounded-lg border border-white/5">{cardIdx + 1}/{total}</span>
        <span className="text-xs font-bold text-txt3 flex-shrink-0 bg-space-800 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5"><Clock size={12}/>~{session.estimatedMinutes}min</span>
      </div>

      <AnimatePresence mode="wait">
        {/* ── CHECKPOINT ── */}
        {checkpoint ? (
          <motion.div key="checkpoint"
            initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
            className="glass-card border-amber-500/30 p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg shadow-sm">✅</div>
              <div>
                <p className="font-jakarta font-black text-base text-amber-500 tracking-tight">Quick Check</p>
                <p className="text-xs font-medium text-txt3">Let's make sure you've got this</p>
              </div>
            </div>
            <p className="text-lg font-bold leading-relaxed mb-6 text-txt">{checkpoint.question}</p>
            <div className="space-y-3 mb-6">
              {checkpoint.options.map((opt, i) => {
                let cls = 'bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt';
                if (cpSelected !== null) {
                  cls = 'bg-space-800 border-border text-txt3 opacity-60';
                  if (i === checkpoint.correctIndex)  cls = 'border-green-500/50 bg-green-500/10 text-green-500 font-medium';
                  else if (i === cpSelected)           cls = 'border-red-500/50 bg-red-500/10 text-red-500 font-medium';
                }
                return (
                  <button key={i} onClick={() => handleCpAnswer(i)} disabled={cpSelected !== null}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-sm text-left transition-all ${cls}`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm ${cpSelected===null ? 'bg-space-900 text-txt2' : i===checkpoint.correctIndex ? 'bg-green-500/20 text-green-500' : i===cpSelected ? 'bg-red-500/20 text-red-500' : 'bg-space-900 text-txt3'}`}>
                      {['A','B','C','D'][i]}
                    </span>
                    <span className="flex-1 text-base">{opt}</span>
                    {cpSelected !== null && i === checkpoint.correctIndex && <CheckCircle size={18} className="ml-auto flex-shrink-0 text-green-500" />}
                    {cpSelected !== null && i === cpSelected && i !== checkpoint.correctIndex && <XCircle size={18} className="ml-auto flex-shrink-0 text-red-500" />}
                  </button>
                );
              })}
            </div>
            {cpSelected !== null && (
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                <div className={`px-5 py-4 rounded-xl text-sm font-medium mb-6 border border-l-4 ${cpSelected===checkpoint.correctIndex ? 'bg-green-500/5 border-green-500/20 border-l-green-500 text-txt2' : 'bg-red-500/5 border-red-500/20 border-l-red-500 text-txt2'}`}>
                  {checkpoint.explanation}
                </div>
                <button onClick={handleCpContinue}
                  className="btn-primary w-full py-4 font-bold text-base shadow-glow-primary">
                  Continue to next card →
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* ── LESSON CARD ── */
          <motion.div key={cardIdx}
            initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
            className="glass-card overflow-hidden shadow-lg">
            {/* Card header */}
            <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-primary/10 to-transparent border-b border-border">
              <div className="flex items-center gap-4">
                <span className="text-5xl drop-shadow-md">{card.emoji}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-md shadow-sm border border-primary/20">Card {cardIdx+1} of {total}</span>
                  </div>
                  <h3 className="font-jakarta font-black text-2xl leading-tight text-txt">{card.title}</h3>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* Main content */}
              <p className="text-txt2 font-medium leading-relaxed text-base">{card.content}</p>

              {/* Formula box */}
              {card.formula && (
                <div className="bg-space-800 border border-border rounded-2xl p-5 shadow-inner">
                  {card.formulaLabel && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan mb-2.5 opacity-80">{card.formulaLabel}</p>
                  )}
                  <code className="text-cyan font-mono text-xl font-bold block text-center tracking-wide">{card.formula}</code>
                </div>
              )}

              {/* Example */}
              {card.example && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2.5 flex items-center gap-1.5"><Zap size={12}/> Example</p>
                  <p className="text-sm font-medium text-txt2 leading-relaxed">{card.example}</p>
                </div>
              )}

              {/* Key points */}
              {card.keyPoints?.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-txt3 mb-3 pl-1">Key Points</p>
                  <div className="space-y-3">
                    {card.keyPoints.map((pt, i) => (
                      <motion.div key={i}
                        initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.1 }}
                        className="flex items-start gap-3 text-sm font-medium text-txt2">
                        <span className="w-6 h-6 rounded-full bg-cyan/20 text-cyan flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm border border-cyan/30 mt-0.5">{i+1}</span>
                        <span className="pt-0.5 leading-relaxed">{pt}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="px-8 pb-8 pt-2 flex items-center gap-4">
              {cardIdx > 0 && (
                <button onClick={() => { audioSystem.playClick(); setFlipped(false); setCardIdx(i => i-1); }}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-space-800 border border-border hover:border-white/20 transition-all text-txt2 hover:text-txt shadow-sm">
                  <ChevronLeft size={20} />
                </button>
              )}
              <button onClick={handleNext}
                className="flex-1 btn-primary py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-glow-primary">
                {checkAfterThis && !cpShown ? <>Quick Check <CheckCircle size={18} /></> : cardIdx+1 >= total ? <>Go to Quiz 📝</> : <>Next Card <ChevronRight size={18} /></>}
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
    generateQuiz(session.subject, session.topic, session.level, 5, session.grade)
      .then(r => { setQuiz(r.data); setLoading(false); })
      .catch(() => { toast.error('Quiz generation failed'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto glass-card p-16 text-center shadow-lg">
      <Loader size={40} className="text-primary animate-spin mx-auto mb-6" />
      <p className="text-txt font-jakarta font-black text-2xl mb-2">Generating your quiz...</p>
      <p className="text-txt3 font-medium text-base">Based on what you just learned in <span className="text-primary">{session.topic}</span></p>
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
    if (idx === q.correctIndex) audioSystem.playCorrect();
    else audioSystem.playWrong();
    setAnswers(prev => [...prev, { questionIndex:current, selectedIndex:idx, correct: idx === q.correctIndex }]);
  };

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const res = await explainAnswer(q.question, q.options[q.correctIndex], session.subject, session.grade);
      setDeepExp(res.data.explanation);
    } catch { setDeepExp('Explanation unavailable. Make sure the backend server is running.'); }
    finally { setExplaining(false); }
  };

  const next = () => {
    audioSystem.playClick();
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
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-sm font-semibold text-txt2 flex-1 bg-space-800 px-4 py-2.5 rounded-xl border border-white/5 shadow-sm truncate">
          📝 End-of-Session Quiz — <span className="text-primary">{session.topic}</span>
        </div>
        <span className="text-sm font-bold text-txt3 bg-space-800 px-4 py-2.5 rounded-xl border border-white/5 shadow-sm flex-shrink-0">{current+1}/{total}</span>
      </div>
      <div className="h-2 bg-space-800 rounded-full overflow-hidden mb-6 shadow-inner">
        <motion.div className="h-full rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]" style={{ background:'linear-gradient(90deg,var(--primary),var(--cyan))' }}
          animate={{ width:`${(current/total)*100}%` }} transition={{ duration:0.4 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
          className="glass-card p-6 md:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
          <p className="text-xs text-primary font-bold uppercase tracking-widest mb-4">Question {current+1}</p>
          <p className="text-xl font-jakarta font-bold leading-relaxed mb-6 text-txt relative z-10">{q.question}</p>
          <div className="space-y-3 relative z-10">
            {q.options.map((opt, i) => {
              let cls = 'bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt';
              if (selected !== null) {
                cls = 'bg-space-800 border-border text-txt3 opacity-60';
                if (i === q.correctIndex)  cls = 'border-green-500/50 bg-green-500/10 text-green-500 font-medium';
                else if (i === selected)   cls = 'border-red-500/50 bg-red-500/10 text-red-500 font-medium';
              }
              return (
                <motion.button key={i} whileHover={selected===null ? { scale: 1.01 } : {}} whileTap={selected===null ? { scale: 0.99 } : {}}
                  onClick={() => handleSelect(i)} disabled={selected!==null}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-base text-left transition-all ${cls}`}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm ${selected===null ? 'bg-space-900 text-txt2' : i===q.correctIndex ? 'bg-green-500/20 text-green-500' : i===selected ? 'bg-red-500/20 text-red-500' : 'bg-space-900 text-txt3'}`}>
                    {['A','B','C','D'][i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {selected!==null && i===q.correctIndex && <CheckCircle size={18} className="flex-shrink-0 text-green-500 drop-shadow-sm" />}
                  {selected!==null && i===selected && i!==q.correctIndex && <XCircle size={18} className="flex-shrink-0 text-red-500 drop-shadow-sm" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showExp && (
          <motion.div initial={{ opacity:0, y:10, height: 0 }} animate={{ opacity:1, y:0, height: 'auto' }}
            className={`rounded-2xl px-6 py-5 mb-6 border text-sm shadow-sm border-l-4 ${selected===q.correctIndex ? 'bg-green-500/5 border-green-500/20 border-l-green-500' : 'bg-red-500/5 border-red-500/20 border-l-red-500'}`}>
            <p className={`font-bold text-base mb-2 ${selected===q.correctIndex ? 'text-green-500' : 'text-red-500'}`}>{selected===q.correctIndex ? '✅ Correct!' : '❌ Incorrect'}</p>
            <p className="text-txt2 font-medium leading-relaxed">{q.explanation}</p>
            {/* Explain deeper button */}
            {selected !== q.correctIndex && (
              <div className="mt-4">
                {deepExp ? (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-primary font-medium leading-relaxed shadow-sm">
                    🧠 <strong className="uppercase tracking-wider text-xs mr-1 opacity-80">Deeper explanation:</strong> {deepExp}
                  </div>
                ) : (
                  <button onClick={handleExplain} disabled={explaining}
                    className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-light transition-colors mt-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 shadow-sm disabled:opacity-50">
                    {explaining ? <Loader size={14} className="animate-spin" /> : <HelpCircle size={14} />}
                    Explain this answer in more detail
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selected !== null && (
        <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={next}
          className="btn-primary w-full py-4 rounded-2xl font-bold text-base shadow-glow-primary">
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
  const color    = score>=80 ? 'text-green-500' : score>=60 ? 'text-primary' : 'text-amber-500';

  useEffect(() => {
    if (saved) return;
    const save = async () => {
      if (score === 100) { triggerConfetti(); audioSystem.playPerfect(); }
      else { audioSystem.playXP(); }

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
        generateFlashcards(session.subject, session.topic, wrongQs, session.grade)
          .then(r => { setFlashcards(r.data.flashcards || []); setFcLoading(false); })
          .catch(() => setFcLoading(false));
      }
    };
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emoji = score===100 ? '🏆' : score>=80 ? '🎉' : score>=60 ? '💪' : '📚';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score card */}
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="glass-card p-10 text-center relative overflow-hidden shadow-lg border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="text-6xl mb-4 drop-shadow-md">{emoji}</div>
        <h2 className={`font-jakarta font-black text-6xl mb-2 drop-shadow-sm ${color}`}>{score}%</h2>
        <p className="text-txt2 font-medium text-base mb-1">{quizResult.correct}/{quizResult.total} correct · <span className="text-txt">{session.topic}</span></p>
        <p className="text-txt3 font-bold uppercase tracking-widest text-xs mb-8">Session complete · {session.subject}</p>

        {/* XP */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <motion.div
            initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.5, type:'spring' }}
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-6 py-3 text-amber-500 font-bold shadow-sm">
            <Zap size={18} /> +{xpEarned} XP earned
          </motion.div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { l:'Score',         v:`${score}%`,              c:color },
            { l:'Session XP',    v:`+${xpEarned}`,           c:'text-amber-500' },
            { l:'Correct',       v:`${quizResult.correct}/${quizResult.total}`, c:'text-green-500' },
          ].map(({ l, v, c }) => (
            <div key={l} className="bg-space-800 border border-border rounded-2xl p-4 shadow-sm">
              <div className={`font-jakarta font-black text-2xl mb-1 ${c}`}>{v}</div>
              <div className="text-[10px] font-bold text-txt3 uppercase tracking-wider">{l}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={() => { audioSystem.playClick(); onRestart(); }}
            className="flex-1 btn-outline py-3.5 text-sm flex items-center justify-center gap-2 bg-space-800 shadow-sm">
            <RotateCcw size={16} />Retry Quiz
          </button>
          <button onClick={() => { audioSystem.playClick(); onNewSession(); }}
            className="flex-1 btn-primary py-3.5 text-sm shadow-glow-primary">
            New Session →
          </button>
        </div>
      </motion.div>

      {/* Flashcards for wrong answers */}
      {(fcLoading || flashcards.length > 0) && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="glass-card p-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-sm">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-base text-txt">Review Flashcards</h3>
              <p className="text-xs font-medium text-txt3">AI-generated for the questions you got wrong</p>
            </div>
          </div>

          {fcLoading ? (
            <div className="flex items-center gap-2 text-sm font-bold text-primary py-10 justify-center">
              <Loader size={18} className="animate-spin" />Generating personalized flashcards...
            </div>
          ) : (
            <div className="mt-6">
              {/* Flashcard flip */}
              <div className="relative h-48 mb-4 cursor-pointer" onClick={() => { audioSystem.playClick(); setShowBack(b => !b); }}
                style={{ perspective:'1000px' }}>
                <motion.div animate={{ rotateY: showBack ? 180 : 0 }}
                  transition={{ duration: 0.4 }} style={{ transformStyle:'preserve-3d', width:'100%', height:'100%' }}>
                  {/* Front */}
                  <div className="absolute inset-0 rounded-2xl bg-space-800 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center px-6 text-center"
                    style={{ backfaceVisibility:'hidden' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-txt3 bg-white/5 px-2 py-1 rounded-md mb-4">Question</p>
                    <p className="text-lg font-bold text-txt leading-relaxed">{flashcards[currentFc]?.front}</p>
                    <p className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full mt-4 flex items-center gap-1.5"><Eye size={12} />Tap to reveal answer</p>
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 rounded-2xl bg-green-500/10 border border-green-500/30 shadow-[0_10px_30px_rgba(16,185,129,0.1)] flex flex-col items-center justify-center px-6 text-center"
                    style={{ backfaceVisibility:'hidden', transform:'rotateY(180deg)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-500/20 px-2 py-1 rounded-md mb-4">Answer</p>
                    <p className="text-base font-medium text-txt leading-relaxed">{flashcards[currentFc]?.back}</p>
                    {flashcards[currentFc]?.hint && (
                      <p className="text-[10px] text-txt3 mt-3 italic font-medium">💡 {flashcards[currentFc].hint}</p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between px-2">
                <button onClick={() => { audioSystem.playClick(); setShowBack(false); setCurrentFc(i => Math.max(0, i-1)); }}
                  disabled={currentFc===0} className="w-10 h-10 flex items-center justify-center rounded-xl bg-space-800 border border-border hover:border-white/20 disabled:opacity-30 disabled:hover:border-border transition-all shadow-sm text-txt2 hover:text-txt">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-1.5">
                  {flashcards.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentFc ? 'bg-primary w-4' : 'bg-white/10'}`} />
                  ))}
                </div>
                <button onClick={() => { audioSystem.playClick(); setShowBack(false); setCurrentFc(i => Math.min(flashcards.length-1, i+1)); }}
                  disabled={currentFc===flashcards.length-1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-space-800 border border-border hover:border-white/20 disabled:opacity-30 disabled:hover:border-border transition-all shadow-sm text-txt2 hover:text-txt">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ────────────────────────────────────────────────────────────── */
export default function StudySessionPage() {
  const { profile } = useUserData();
  const [phase,   setPhase]   = useState('setup');   // setup | lesson | quiz | results
  const [session, setSession] = useState(null);
  const [quizRes, setQuizRes] = useState(null);

  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto w-full">
      {/* Header with phase indicator */}
      <div className="mb-8 pt-12 lg:pt-0">
        <h1 className="font-jakarta font-black text-3xl md:text-4xl text-txt mb-2">Study Sessions</h1>
        <p className="text-sm font-medium text-txt3">AI teaches you first, then quizzes you on what you learned</p>

        {/* Phase breadcrumb */}
        {session && (
          <div className="flex items-center gap-3 mt-5 bg-space-800 inline-flex px-4 py-2 rounded-xl border border-white/5 shadow-sm">
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
                  <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${idx === current ? 'text-primary' : idx < current ? 'text-txt3' : 'text-txt3/40'}`}>
                    {p.label}
                  </span>
                  {i < 3 && <ChevronRight size={14} className="text-white/10" />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={phase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {phase === 'setup' && (
            <SessionSetup onStart={(s) => { setSession({...s, grade:profile?.grade}); setPhase('lesson'); }} />
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

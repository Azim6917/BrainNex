import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, CheckCircle, XCircle, RotateCcw, Brain, Keyboard, HelpCircle, Layers, Loader, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import { generateQuiz, generateFlashcards, explainAnswer } from '../utils/api';
import { saveQuizResultToFirestore } from '../utils/firestoreUtils';
import { useUserData } from '../context/UserDataContext';
import { useAuth }     from '../context/AuthContext';
import { audioSystem } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';
import toast from 'react-hot-toast';

const SENIOR_SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Geography','Literature','Economics','Psychology','Other'];
const JUNIOR_SUBJECTS = ['Maths','Science','English','Social Studies','Art','Other'];
const DIFFICULTIES    = ['beginner','intermediate','advanced'];
const TIMER_OPTIONS   = [
  { label:'No Timer 😊',   seconds:0,  desc:'Relaxed — take your time' },
  { label:'Normal ⏱',      seconds:60, desc:'60 seconds per question' },
  { label:'Challenge 🔥',  seconds:30, desc:'30 seconds — fast pace!' },
];

function isJuniorGrade(g) { return ['Class 1','Class 2','Class 3','Class 4','Class 5'].includes(g); }

/* ── Setup ── */
function QuizSetup({ onStart, currentDifficulty, grade }) {
  const junior   = isJuniorGrade(grade);
  const subjects = junior ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS;
  const [subject,    setSubject]    = useState(subjects[0]);
  const [topic,      setTopic]      = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [difficulty, setDifficulty] = useState(junior ? 'beginner' : currentDifficulty||'intermediate');
  const [numQ,       setNumQ]       = useState(5);
  const [timerIdx,   setTimerIdx]   = useState(1);
  const [loading,    setLoading]    = useState(false);

  const start = async () => {
    if (!topic.trim()) { toast.error(junior ? 'What do you want to learn about? 😊' : 'Please enter a topic'); return; }
    setLoading(true);
    try {
      const actualSubject = subject === 'Other' ? customSubject.trim() : subject;
if (subject === 'Other' && !customSubject.trim()) { toast.error('Please type a subject first'); setLoading(false); return; }
const res = await generateQuiz(actualSubject, topic, difficulty, numQ, grade);
      audioSystem.playClick();
      onStart(res.data, TIMER_OPTIONS[timerIdx].seconds);
    } catch (err) {
      if (!err.response) toast.error('Backend server not running. Start it with: npm run dev in /server');
      else toast.error('Failed to generate quiz. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="glass-card p-6 md:p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-primary/20 text-primary shadow-sm">
            {junior ? '🎮' : <Brain size={24} />}
          </div>
          <div>
            <h2 className="font-jakarta font-black text-2xl text-txt mb-1">
              {junior ? 'Let\'s Make a Fun Quiz! 🌟' : 'AI Quiz Generator'}
            </h2>
            <p className="text-sm font-medium text-txt3">Powered by Claude AI</p>
          </div>
        </div>

        {!junior && (
          <div className="flex items-center gap-2 text-xs mb-6 px-4 py-3 rounded-xl bg-space-800 border border-white/5 text-txt3">
            <Keyboard size={14} className="text-txt2" />
            <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded text-xs bg-space-900 border border-white/10 text-txt2">1</kbd> <kbd className="px-1.5 py-0.5 rounded text-xs bg-space-900 border border-white/10 text-txt2">2</kbd> <kbd className="px-1.5 py-0.5 rounded text-xs bg-space-900 border border-white/10 text-txt2">3</kbd> <kbd className="px-1.5 py-0.5 rounded text-xs bg-space-900 border border-white/10 text-txt2">4</kbd> to pick · <kbd className="px-1.5 py-0.5 rounded text-xs bg-space-900 border border-white/10 text-txt2">Enter</kbd> for next</span>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-3 block text-txt2">
              {junior ? 'Pick a Subject 📚' : 'Subject'}
            </label>
           <div
  className="flex flex-wrap gap-2.5 lg:overflow-visible lg:max-h-none overflow-y-auto"
  style={{ maxHeight: typeof window !== 'undefined' && window.innerWidth < 1024 ? '180px' : 'none' }}
>
  {subjects.map(s => (
    <button key={s} onClick={() => { audioSystem.playClick(); setSubject(s); if (s !== 'Other') setCustomSubject(''); }}
      className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all border ${s===subject ? 'bg-primary/10 border-primary/50 text-primary shadow-sm' : 'bg-transparent border-border text-txt3 hover:border-white/20 hover:text-txt2'}`}>
      {s}
    </button>
  ))}
</div>

{subject === 'Other' && (
  <div className="mt-3">
    <input
      value={customSubject}
      onChange={e => setCustomSubject(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && e.target.blur()}
      placeholder="Type subject or topic e.g. Python, UPSC..."
      className="input-field text-sm"
      autoFocus
    />
  </div>
)}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-3 block text-txt2">
              {junior ? 'What do you want to learn about? 🤔' : 'Topic'}
            </label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key==='Enter' && start()}
              placeholder={junior ? "e.g. Animals, Counting, Fruits..." : "e.g. Newton's Laws, Photosynthesis..."}
              className="input-field text-sm" />
          </div>

          {!junior && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-3 block text-txt2">Difficulty</label>
                <div className="flex gap-3">
                  {DIFFICULTIES.map(d => (
                    <button key={d} onClick={() => { audioSystem.playClick(); setDifficulty(d); }}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize border transition-all ${
                        d===difficulty 
                          ? (d==='beginner' ? 'bg-green-500/10 border-green-500/50 text-green-500' : d==='intermediate' ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-red-500/10 border-red-500/50 text-red-500') 
                          : 'bg-transparent border-border text-txt3 hover:border-white/20 hover:text-txt2'
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-3 block text-txt2">Timer Mode</label>
                <div className="flex gap-3">
                  {TIMER_OPTIONS.map((t,i) => (
                    <button key={t.label} onClick={() => { audioSystem.playClick(); setTimerIdx(i); }}
                      className={`flex-1 py-3 px-2 rounded-xl text-center border transition-all ${
                        i===timerIdx ? 'bg-primary/10 border-primary/50 text-primary shadow-sm' : 'bg-transparent border-border text-txt3 hover:border-white/20 hover:text-txt2'
                      }`}>
                      <div className="text-sm font-bold mb-1">{t.label}</div>
                      <div className="text-[10px] font-medium opacity-80">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-widest text-txt2">
                {junior ? `How many questions? 🔢` : `Number of Questions`}
              </label>
              <span className="text-sm font-bold text-primary">{numQ}</span>
            </div>
            <input type="range" min={junior?3:3} max={junior?5:10} step={1} value={numQ}
              onChange={e => setNumQ(+e.target.value)} className="w-full accent-primary" />
          </div>

          <button onClick={start} disabled={loading}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base shadow-glow-primary mt-4">
            {loading ? <><Loader size={18} className="animate-spin" />{junior?'Making your quiz...':'Generating Quiz...'}</> : junior ? '🎮 Start Fun Quiz!' : <><Zap size={18} />Generate Quiz with AI</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Active Quiz ── */
function ActiveQuiz({ quiz, timerSeconds, grade, onComplete }) {
  const [current,  setCurrent]  = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers,  setAnswers]  = useState([]);
  const [showExp,  setShowExp]  = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerSeconds||60);
  const [explaining,setExplaining]=useState(false);
  const [deepExp,  setDeepExp]  = useState('');
  const timerRef = useRef(null);
  const junior   = isJuniorGrade(grade);

  const q     = quiz.questions[current];
  const total = quiz.questions.length;

  const handleSelect = useCallback((idx) => {
    if (selected!==null) return;
    clearInterval(timerRef.current);
    setSelected(idx);
    setShowExp(true);
    setDeepExp('');
    if (idx===q.correctIndex) audioSystem.playCorrect();
    else audioSystem.playWrong();
    setAnswers(prev => [...prev, { questionIndex:current, selectedIndex:idx, correct:idx===q.correctIndex }]);
  }, [selected, q, current]);

  useEffect(() => {
    if (!timerSeconds) return;
    setTimeLeft(timerSeconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t<=1) { clearInterval(timerRef.current); handleSelect(-1); return 0; }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, timerSeconds]);

  useEffect(() => {
    if (junior) return; // no keyboard shortcuts for kids
    const handler = e => {
      if (['1','2','3','4'].includes(e.key)) handleSelect(+e.key-1);
      if (e.key==='Enter' && selected!==null) next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, current]);

  const next = () => {
    audioSystem.playClick();
    if (current+1>=total) {
      const correct = answers.filter(a=>a.correct).length;
      onComplete({ quiz, answers, correct, total });
    } else {
      setSelected(null); setShowExp(false); setDeepExp(''); setCurrent(c=>c+1);
    }
  };

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const res = await explainAnswer(q.question, q.options[q.correctIndex], quiz.subject, grade);
      setDeepExp(res.data.explanation);
    } catch { setDeepExp('Backend not running. Start the server for detailed explanations.'); }
    finally { setExplaining(false); }
  };

  const timerColor = !timerSeconds ? 'var(--primary)' : timeLeft<=10 ? 'var(--red)' : timeLeft<=20 ? 'var(--amber)' : 'var(--primary)';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold truncate max-w-[250px] text-txt2 bg-space-800 px-3 py-1.5 rounded-lg border border-white/5">{quiz.title}</span>
        <div className="flex items-center gap-4 flex-shrink-0">
          {timerSeconds>0 && <span className="font-mono text-sm font-bold flex items-center gap-1.5 bg-space-800 px-3 py-1.5 rounded-lg border border-white/5 shadow-sm" style={{ color:timerColor }}><Clock size={14}/>{timeLeft}s</span>}
          <span className="text-sm font-bold text-txt2 bg-space-800 px-3 py-1.5 rounded-lg border border-white/5">{current+1} / {total}</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden mb-6 bg-space-800 shadow-inner">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan shadow-[0_0_10px_rgba(124,58,237,0.5)]"
          animate={{ width:`${(current/total)*100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
          className="glass-card p-6 md:p-8 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {junior ? `Question ${current+1} 🤔` : `Question ${current+1}`}
            </p>
            {!junior && <p className="text-[10px] font-medium text-txt3 bg-white/5 px-2 py-1 rounded-md">Keys 1–4 to select</p>}
          </div>
          <p className={`font-jakarta font-bold leading-relaxed mb-6 text-txt relative z-10 ${junior ? 'text-xl' : 'text-lg md:text-xl'}`}>
            {q.question}
          </p>
          <div className="space-y-3 relative z-10">
            {q.options.map((opt, i) => {
              let bg = 'bg-space-800', bc = 'border-border', tc = 'text-txt2', hover = 'hover:border-white/20 hover:text-txt';
              if (selected!==null) {
                hover = '';
                if (i===q.correctIndex)       { bg='bg-green-500/10'; bc='border-green-500/50'; tc='text-green-500'; }
                else if (i===selected)        { bg='bg-red-500/10'; bc='border-red-500/50'; tc='text-red-500'; }
                else                          { tc='text-txt3'; }
              }
              return (
                <motion.button key={i} whileHover={selected===null ? { scale: 1.01 } : {}} whileTap={selected===null ? { scale: 0.99 } : {}}
                  onClick={() => handleSelect(i)} disabled={selected!==null}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-sm text-left transition-all font-medium ${bg} ${bc} ${tc} ${hover}`}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm ${selected===null ? 'bg-space-900 text-txt2' : (i===q.correctIndex ? 'bg-green-500/20 text-green-500' : i===selected ? 'bg-red-500/20 text-red-500' : 'bg-space-900 text-txt3')}`}>
                    {junior ? ['A','B','C','D'][i] : i+1}
                  </span>
                  <span className="flex-1 text-base">{opt}</span>
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
          <motion.div initial={{ opacity:0, y:8, height: 0 }} animate={{ opacity:1, y:0, height: 'auto' }}
            className={`glass-card p-5 mb-4 text-sm border-l-4 ${selected===q.correctIndex ? 'border-l-green-500 bg-green-500/5' : 'border-l-red-500 bg-red-500/5'}`}>
            <p className={`font-bold mb-2 text-base ${selected===q.correctIndex ? 'text-green-500' : 'text-red-500'}`}>
              {selected===q.correctIndex ? (junior?'🎉 Correct! You\'re amazing!':'✅ Correct!') : (junior?'😅 Oops! Let\'s see the right answer':'❌ Incorrect')}
            </p>
            <p className="text-sm font-medium leading-relaxed text-txt2">{q.explanation}</p>
            {!junior && selected!==q.correctIndex && (
              <div className="mt-3">
                {deepExp ? (
                  <div className="mt-3 px-4 py-3 rounded-xl text-sm font-medium leading-relaxed bg-primary/10 text-primary border border-primary/20 shadow-sm">
                    🧠 {deepExp}
                  </div>
                ) : (
                  <button onClick={handleExplain} disabled={explaining}
                    className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-light transition-colors mt-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                    {explaining ? <Loader size={12} className="animate-spin"/> : <HelpCircle size={12}/>}
                    Explain in more detail
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selected!==null && (
        <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }}
          onClick={next} className="btn-primary w-full py-4 text-base shadow-glow-primary">
          {current+1>=total ? (junior?'See how I did! 🎊':'See Results →') : (junior?'Next question! →':'Next Question →')}
        </motion.button>
      )}
    </div>
  );
}

/* ── Results ── */
function QuizResults({ result, quiz, onRetry, onNew, grade }) {
  const { user }                            = useAuth();
  const { updateProfileLocal, refreshProfile } = useUserData();
  const [saved,      setSaved]      = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [fcLoad,     setFcLoad]     = useState(false);
  const [fcIdx,      setFcIdx]      = useState(0);
  const [showBack,   setShowBack]   = useState(false);
  const [wrongQs,    setWrongQs]    = useState([]);
  const junior = isJuniorGrade(grade);

  const score    = result.total>0 ? Math.round((result.correct/result.total)*100) : 0;
  const xpEarned = result.correct*10 + (score===100?50:score>=80?25:10);
  const emoji    = score===100 ? '🏆' : score>=80 ? '🎉' : score>=60 ? '👍' : '📚';

useEffect(() => {
  if (saved) return;
  const save = async () => {
    if (score===100) { triggerConfetti(); audioSystem.playPerfect(); }
    else if (score>=60) { audioSystem.playQuizComplete(); }
    else audioSystem.playXP();

    // Build per-question detail for quiz history
    const questionsDetail = quiz.questions.map((q, i) => ({
      question:          q.question,
      options:           q.options,
      correctIndex:      q.correctIndex,
      userSelectedIndex: result.answers[i]?.selectedIndex ?? -1,
      explanation:       q.explanation || '',
    }));

    const res = await saveQuizResultToFirestore(user?.uid, {
      subject:quiz.subject, topic:quiz.topic, score,
      totalQuestions:result.total, correctAnswers:result.correct, difficulty:quiz.difficulty,
      questions: questionsDetail,
    });
    if (res?.newBadges?.length>0) res.newBadges.forEach(b => toast.success(`🏆 ${b.name}!`, { duration:4000 }));
    if (res) { updateProfileLocal({ xp:res.newXp, level:res.newLevel }); await refreshProfile(); }
    setSaved(true);

    const wq = quiz.questions.filter((_,i) => !result.answers[i]?.correct).map(q => q.question);
    setWrongQs(wq);
  };
  save();

}, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="glass-card p-8 md:p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="text-6xl mb-4 drop-shadow-md">{emoji}</div>
        <h2 className={`font-jakarta font-black text-6xl mb-2 drop-shadow-sm ${score>=80?'text-green-500':score>=60?'text-primary':'text-amber-500'}`}>{score}%</h2>
        <p className="text-base font-medium text-txt2 mb-1">
          {junior ? `You got ${result.correct} right out of ${result.total}! ${score===100?'Perfect! 🌟':'Keep it up! 💪'}` : `${result.correct} correct out of ${result.total}`}
        </p>
        <p className="text-xs font-bold text-txt3 uppercase tracking-widest mb-6">{quiz.topic} • {quiz.difficulty}</p>

        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.4, type:'spring' }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl mb-8 text-sm font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-sm">
          <Zap size={16} />+{xpEarned} XP earned!
        </motion.div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[{l:'Score',v:`${score}%`,c:score>=80?'text-green-500':score>=60?'text-primary':'text-amber-500'},{l:'Correct',v:`${result.correct}/${result.total}`,c:'text-green-500'},{l:'XP',v:`+${xpEarned}`,c:'text-amber-500'}].map(({l,v,c}) => (
            <div key={l} className="rounded-2xl p-4 bg-space-800 border border-border shadow-sm">
              <div className={`font-jakarta font-black text-2xl mb-1 ${c}`}>{v}</div>
              <div className="text-xs font-bold text-txt3 uppercase tracking-wider">{l}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-8 text-left max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {quiz.questions.map((q,i) => {
            const ok = result.answers[i]?.correct??false;
            return (
              <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${ok?'bg-green-500/5 border-green-500/20':'bg-red-500/5 border-red-500/20'}`}>
                {ok ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-green-500"/> : <XCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500"/>}
                <span className={ok ? 'text-green-500/90' : 'text-red-500/90'}>{q.question}</span>
              </div>
            );
          })}
        </div>

<div className="flex gap-3 flex-wrap">
  <button onClick={() => { audioSystem.playClick(); onRetry(); }} className="btn-outline flex-1 py-3.5 text-base flex items-center justify-center gap-2 shadow-sm bg-space-800">
    <RotateCcw size={16}/>{junior?'Try Again! 🔄':'Retry Quiz'}
  </button>
  <button onClick={() => { audioSystem.playClick(); onNew(); }} className="btn-primary flex-1 py-3.5 text-base shadow-glow-primary">
    {junior?'New Quiz! 🎮':'Create New Quiz'}
  </button>
  {!junior && wrongQs.length > 0 && (
    <button
      onClick={async () => {
        if (flashcards.length > 0) return;
        audioSystem.playClick();
        setFcLoad(true);
        try {
          const r = await generateFlashcards(quiz.subject, quiz.topic, wrongQs, grade);
          setFlashcards(r.data.flashcards || []);
        } catch { }
        setFcLoad(false);
      }}
      disabled={fcLoad}
      className="btn-outline w-full py-3.5 text-base flex items-center justify-center gap-2 shadow-sm bg-space-800 border-primary/30 text-primary hover:border-primary/60"
    >
      {fcLoad
        ? <><div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin"/>Generating flashcards...</>
        : <><Layers size={16}/>Review Flashcards</>
      }
    </button>
  )}
</div>
      </motion.div>

      {/* Flashcards — senior only */}
      {!junior && flashcards.length>0 && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="glass-card p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-sm">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-base text-txt">Review Flashcards</h3>
              <p className="text-xs font-medium text-txt3">AI-generated for questions you got wrong</p>
            </div>
          </div>
          
          {fcLoad ? (
            <div className="flex items-center gap-2 text-sm font-bold py-10 justify-center text-primary">
              <Loader size={18} className="animate-spin"/> Generating personalized flashcards...
            </div>
          ) : (
            <div className="mt-6">
              <div className="relative h-48 mb-4 cursor-pointer perspective-1000" onClick={() => { audioSystem.playClick(); setShowBack(b=>!b); }}>
                <AnimatePresence mode="wait">
                  {!showBack ? (
                    <motion.div key="f" initial={{ rotateY:90 }} animate={{ rotateY:0 }} exit={{ rotateY:-90 }} transition={{ duration: 0.3 }}
                      className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center px-6 text-center border bg-space-800 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                      <p className="text-[10px] font-bold mb-3 text-txt3 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">Question</p>
                      <p className="text-lg font-bold text-txt leading-relaxed">{flashcards[fcIdx]?.front}</p>
                      <p className="text-[10px] font-bold mt-4 flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1.5 rounded-full"><Eye size={12}/>Tap to reveal</p>
                    </motion.div>
                  ) : (
                    <motion.div key="b" initial={{ rotateY:-90 }} animate={{ rotateY:0 }} exit={{ rotateY:90 }} transition={{ duration: 0.3 }}
                      className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center px-6 text-center border bg-green-500/10 border-green-500/30 shadow-[0_10px_30px_rgba(16,185,129,0.1)]">
                      <p className="text-[10px] font-bold mb-3 text-green-500 uppercase tracking-widest bg-green-500/20 px-2 py-1 rounded-md">Answer</p>
                      <p className="text-base font-medium leading-relaxed text-txt">{flashcards[fcIdx]?.back}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-between px-2">
                <button onClick={() => { audioSystem.playClick(); setShowBack(false); setFcIdx(i=>Math.max(0,i-1)); }}
                  disabled={fcIdx===0} className="w-10 h-10 flex items-center justify-center rounded-xl bg-space-800 border border-border hover:border-white/20 disabled:opacity-30 disabled:hover:border-border transition-all shadow-sm">
                  <ChevronLeft size={18} className="text-txt2" />
                </button>
                <div className="flex gap-1.5">
                  {flashcards.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === fcIdx ? 'bg-primary w-4' : 'bg-white/10'}`} />
                  ))}
                </div>
                <button onClick={() => { audioSystem.playClick(); setShowBack(false); setFcIdx(i=>Math.min(flashcards.length-1,i+1)); }}
                  disabled={fcIdx===flashcards.length-1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-space-800 border border-border hover:border-white/20 disabled:opacity-30 disabled:hover:border-border transition-all shadow-sm">
                  <ChevronRight size={18} className="text-txt2" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function QuizPage() {
  const { profile } = useUserData();
  const grade       = profile?.grade || '';
  const [phase,   setPhase]   = useState('setup');
  const [quiz,    setQuiz]    = useState(null);
  const [timer,   setTimer]   = useState(60);
  const [result,  setResult]  = useState(null);
  const junior = isJuniorGrade(grade);

  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto w-full">
      <div className="mb-8 pt-12 lg:pt-0">
        <h1 className="font-jakarta font-black text-3xl md:text-4xl text-txt mb-2">{junior ? 'Quiz Time! 🎮' : 'AI Quiz Generator'}</h1>
        <p className="text-sm font-medium text-txt3">
          {junior ? 'Let\'s test what you know! 🌟' : 'Custom quizzes · Keyboard shortcuts · AI explanations · Flashcards'}
        </p>
      </div>
      {phase==='setup'   && <QuizSetup   onStart={(q,t)=>{ setQuiz(q); setTimer(t); setPhase('active'); }} currentDifficulty={profile?.currentDifficulty} grade={grade} />}
      {phase==='active'  && quiz   && <ActiveQuiz  quiz={quiz} timerSeconds={timer} grade={grade} onComplete={r=>{ setResult(r); setPhase('results'); }} />}
      {phase==='results' && result && <QuizResults result={result} quiz={quiz} grade={grade} onRetry={()=>setPhase('active')} onNew={()=>{ setQuiz(null); setPhase('setup'); }} />}
    </div>
  );
}

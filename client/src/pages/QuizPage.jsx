import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, CheckCircle, XCircle, RotateCcw, Brain, Keyboard, HelpCircle, Layers, Loader, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import { generateQuiz, generateFlashcards, explainAnswer } from '../utils/api';
import { saveQuizResultToFirestore, getQuizHistoryFromFirestore } from '../utils/firestoreUtils';
import { useUserData } from '../context/UserDataContext';
import { useAuth }     from '../context/AuthContext';
import { useTheme }    from '../context/ThemeContext';
import { playCorrect, playWrong, playXP, playPerfect, playClick, playQuizComplete } from '../utils/soundEffects';
import { triggerConfetti } from '../utils/confetti';
import toast from 'react-hot-toast';

const SENIOR_SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Geography','Literature','Economics','Psychology'];
const JUNIOR_SUBJECTS = ['Maths','Science','English','Social Studies','Art'];
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
  const [difficulty, setDifficulty] = useState(junior ? 'beginner' : currentDifficulty||'intermediate');
  const [numQ,       setNumQ]       = useState(5);
  const [timerIdx,   setTimerIdx]   = useState(1);
  const [loading,    setLoading]    = useState(false);

  const start = async () => {
    if (!topic.trim()) { toast.error(junior ? 'What do you want to learn about? 😊' : 'Please enter a topic'); return; }
    setLoading(true);
    try {
      const res = await generateQuiz(subject, topic, difficulty, numQ, grade);
      playClick();
      onStart(res.data, TIMER_OPTIONS[timerIdx].seconds);
    } catch (err) {
      if (!err.response) toast.error('Backend server not running. Start it with: npm run dev in /server');
      else toast.error('Failed to generate quiz. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="rounded-2xl p-6 md:p-8 border" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl" style={{ background:'var(--cyan-bg)' }}>
            {junior ? '🎮' : '🧠'}
          </div>
          <div>
            <h2 className="font-syne font-bold text-xl" style={{ color:'var(--txt)' }}>
              {junior ? 'Let\'s Make a Fun Quiz! 🌟' : 'AI Quiz Generator'}
            </h2>
            <p className="text-xs" style={{ color:'var(--txt3)' }}>Powered by Claude AI</p>
          </div>
        </div>

        {!junior && (
          <div className="flex items-center gap-2 text-xs mb-5 px-3 py-2 rounded-xl border" style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--txt3)' }}>
            <Keyboard size={12} /><span>Tip: Press <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background:'var(--bg3)' }}>1</kbd> <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background:'var(--bg3)' }}>2</kbd> <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background:'var(--bg3)' }}>3</kbd> <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background:'var(--bg3)' }}>4</kbd> to pick · <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background:'var(--bg3)' }}>Enter</kbd> for next</span>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color:'var(--txt3)' }}>
              {junior ? 'Pick a Subject 📚' : 'Subject'}
            </label>
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <button key={s} onClick={() => { playClick(); setSubject(s); }}
                  className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
                  style={{
                    background:  s===subject ? 'var(--cyan-bg)' : 'transparent',
                    borderColor: s===subject ? 'var(--cyan)'    : 'var(--border2)',
                    color:       s===subject ? 'var(--cyan)'    : 'var(--txt2)',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color:'var(--txt3)' }}>
              {junior ? 'What do you want to learn about? 🤔' : 'Topic'}
            </label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key==='Enter' && start()}
              placeholder={junior ? "e.g. Animals, Counting, Fruits..." : "e.g. Newton's Laws, Photosynthesis..."}
              className="input-dark text-sm" />
          </div>

          {!junior && (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color:'var(--txt3)' }}>Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button key={d} onClick={() => { playClick(); setDifficulty(d); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all"
                      style={{
                        background:  d===difficulty ? (d==='beginner'?'rgba(52,211,153,0.15)':d==='intermediate'?'var(--cyan-bg)':'rgba(248,113,113,0.15)') : 'transparent',
                        borderColor: d===difficulty ? (d==='beginner'?'var(--green)':d==='intermediate'?'var(--cyan)':'var(--red)') : 'var(--border2)',
                        color:       d===difficulty ? (d==='beginner'?'var(--green)':d==='intermediate'?'var(--cyan)':'var(--red)') : 'var(--txt2)',
                      }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color:'var(--txt3)' }}>Timer Mode</label>
                <div className="flex gap-2">
                  {TIMER_OPTIONS.map((t,i) => (
                    <button key={t.label} onClick={() => { playClick(); setTimerIdx(i); }}
                      className="flex-1 py-2.5 px-2 rounded-xl text-center border transition-all"
                      style={{
                        background:  i===timerIdx ? 'var(--cyan-bg)' : 'transparent',
                        borderColor: i===timerIdx ? 'var(--cyan)'    : 'var(--border2)',
                        color:       i===timerIdx ? 'var(--cyan)'    : 'var(--txt2)',
                      }}>
                      <div className="text-xs font-semibold">{t.label}</div>
                      <div className="text-[9px] mt-0.5 opacity-70">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color:'var(--txt3)' }}>
              {junior ? `How many questions? 🔢 (${numQ})` : `Questions: ${numQ}`}
            </label>
            <input type="range" min={junior?3:3} max={junior?5:10} step={1} value={numQ}
              onChange={e => setNumQ(+e.target.value)} className="w-full" style={{ accentColor:'var(--cyan)' }} />
          </div>

          <button onClick={start} disabled={loading}
            className="btn-cyan w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold">
            {loading ? <><Loader size={15} className="animate-spin" />{junior?'Making your quiz...':'Generating Quiz...'}</> : junior ? '🎮 Start Fun Quiz!' : <><Zap size={15} />Generate Quiz with AI</>}
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
    if (idx===q.correctIndex) playCorrect();
    else playWrong();
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
    playClick();
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

  const timerColor = !timerSeconds ? 'var(--cyan)' : timeLeft<=10 ? 'var(--red)' : timeLeft<=20 ? 'var(--amber)' : 'var(--cyan)';

  return (
    <div className="max-w-2xl mx-auto px-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs truncate max-w-[200px]" style={{ color:'var(--txt2)' }}>{quiz.title}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          {timerSeconds>0 && <span className="font-mono text-sm flex items-center gap-1" style={{ color:timerColor }}><Clock size={13}/>{timeLeft}s</span>}
          <span className="text-sm" style={{ color:'var(--txt2)' }}>{current+1}/{total}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background:'var(--border2)' }}>
        <motion.div className="h-full rounded-full" style={{ background:'var(--cyan)' }}
          animate={{ width:`${(current/total)*100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
          className="rounded-2xl p-5 mb-4 border" style={{ background:'var(--card)', borderColor:'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--cyan)' }}>
              {junior ? `Question ${current+1} 🤔` : `Question ${current+1}`}
            </p>
            {!junior && <p className="text-[10px]" style={{ color:'var(--txt3)' }}>Keys 1–4 to select</p>}
          </div>
          <p className={`font-semibold leading-relaxed mb-5 ${junior ? 'text-lg' : 'text-base md:text-lg'}`} style={{ color:'var(--txt)' }}>
            {q.question}
          </p>
          <div className="space-y-2.5">
            {q.options.map((opt, i) => {
              let bg = 'transparent', bc = 'var(--border2)', tc = 'var(--txt2)';
              if (selected!==null) {
                if (i===q.correctIndex)       { bg='rgba(52,211,153,0.12)'; bc='var(--green)'; tc='var(--green)'; }
                else if (i===selected)        { bg='rgba(248,113,113,0.12)'; bc='var(--red)'; tc='var(--red)'; }
                else                          { tc='var(--txt3)'; }
              }
              return (
                <motion.button key={i} whileHover={selected===null ? {x:3} : {}}
                  onClick={() => handleSelect(i)} disabled={selected!==null}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all"
                  style={{ background:bg, borderColor:bc, color:tc }}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background:'var(--border2)', color:'var(--txt2)' }}>
                    {junior ? ['A','B','C','D'][i] : i+1}
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
            className="rounded-2xl px-4 py-3.5 mb-3 border text-sm"
            style={{
              background: selected===q.correctIndex ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              borderColor: selected===q.correctIndex ? 'var(--green)' : 'var(--red)',
            }}>
            <p className="font-semibold mb-1" style={{ color:'var(--txt)' }}>
              {selected===q.correctIndex ? (junior?'🎉 Correct! You\'re amazing!':'✅ Correct!') : (junior?'😅 Oops! Let\'s see the right answer':'❌ Incorrect')}
            </p>
            <p className="text-xs leading-relaxed" style={{ color:'var(--txt2)' }}>{q.explanation}</p>
            {!junior && selected!==q.correctIndex && (
              <div className="mt-2">
                {deepExp ? (
                  <div className="mt-2 px-3 py-2 rounded-xl text-xs leading-relaxed" style={{ background:'var(--cyan-bg)', color:'var(--cyan)', border:'1px solid var(--cyan-bdr)' }}>
                    🧠 {deepExp}
                  </div>
                ) : (
                  <button onClick={handleExplain} disabled={explaining}
                    className="flex items-center gap-1.5 text-xs transition-colors" style={{ color:'var(--cyan)' }}>
                    {explaining ? <Loader size={11} className="animate-spin"/> : <HelpCircle size={11}/>}
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
          onClick={next} className="btn-cyan w-full py-3 text-sm font-semibold">
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
  const junior = isJuniorGrade(grade);

  const score    = result.total>0 ? Math.round((result.correct/result.total)*100) : 0;
  const xpEarned = result.correct*10 + (score===100?50:score>=80?25:10);
  const emoji    = score===100 ? '🏆' : score>=80 ? '🎉' : score>=60 ? '👍' : '📚';

  useEffect(() => {
    if (saved) return;
    const save = async () => {
      if (score===100) { triggerConfetti(); playPerfect(); }
      else if (score>=60) { playQuizComplete(); }
      else playXP();

      const res = await saveQuizResultToFirestore(user?.uid, {
        subject:quiz.subject, topic:quiz.topic, score,
        totalQuestions:result.total, correctAnswers:result.correct, difficulty:quiz.difficulty,
      });
      if (res?.newBadges?.length>0) res.newBadges.forEach(b => toast.success(`🏆 ${b.name}!`, { duration:4000 }));
      if (res) { updateProfileLocal({ xp:res.newXp, level:res.newLevel }); await refreshProfile(); }
      setSaved(true);

      const wrongQs = quiz.questions.filter((_,i) => !result.answers[i]?.correct).map(q => q.question);
      if (wrongQs.length>0 && !junior) {
        setFcLoad(true);
        generateFlashcards(quiz.subject, quiz.topic, wrongQs, grade)
          .then(r => { setFlashcards(r.data.flashcards||[]); setFcLoad(false); })
          .catch(() => setFcLoad(false));
      }
    };
    save();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-4 px-2">
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="rounded-2xl p-6 md:p-8 text-center border"
        style={{ background:'var(--card)', borderColor:'var(--border)' }}>
        <div className="text-5xl mb-3">{emoji}</div>
        <h2 className="font-syne font-black text-5xl mb-1" style={{ color:score>=80?'var(--green)':score>=60?'var(--cyan)':'var(--amber)' }}>{score}%</h2>
        <p className="text-sm mb-0.5" style={{ color:'var(--txt2)' }}>
          {junior ? `You got ${result.correct} right out of ${result.total}! ${score===100?'Perfect! 🌟':'Keep it up! 💪'}` : `${result.correct} correct out of ${result.total}`}
        </p>
        <p className="text-xs mb-5" style={{ color:'var(--txt3)' }}>{quiz.topic} · {quiz.difficulty}</p>

        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.4, type:'spring' }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-5 text-sm font-bold"
          style={{ background:'rgba(255,184,48,0.12)', border:'1px solid rgba(255,184,48,0.3)', color:'var(--amber)' }}>
          <Zap size={14} />+{xpEarned} XP earned!
        </motion.div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[{l:'Score',v:`${score}%`,c:score>=80?'var(--green)':score>=60?'var(--cyan)':'var(--amber)'},{l:'Correct',v:`${result.correct}/${result.total}`,c:'var(--green)'},{l:'XP',v:`+${xpEarned}`,c:'var(--amber)'}].map(({l,v,c}) => (
            <div key={l} className="rounded-xl p-3" style={{ background:'var(--bg3)' }}>
              <div className="font-syne font-black text-lg" style={{ color:c }}>{v}</div>
              <div className="text-[10px]" style={{ color:'var(--txt3)' }}>{l}</div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 mb-5 text-left max-h-40 overflow-y-auto">
          {quiz.questions.map((q,i) => {
            const ok = result.answers[i]?.correct??false;
            return (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: ok?'rgba(52,211,153,0.08)':'rgba(248,113,113,0.08)' }}>
                {ok ? <CheckCircle size={11} className="flex-shrink-0 mt-0.5" style={{ color:'var(--green)' }}/> : <XCircle size={11} className="flex-shrink-0 mt-0.5" style={{ color:'var(--red)' }}/>}
                <span style={{ color: ok?'var(--green)':'var(--red)', opacity:0.85 }}>{q.question.length>65?q.question.substring(0,65)+'...':q.question}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onRetry} className="btn-outline flex-1 py-2.5 text-sm flex items-center justify-center gap-1.5">
            <RotateCcw size={13}/>{junior?'Try Again! 🔄':'Retry'}
          </button>
          <button onClick={onNew} className="btn-cyan flex-1 py-2.5 text-sm">
            {junior?'New Quiz! 🎮':'New Quiz →'}
          </button>
        </div>
      </motion.div>

      {/* Flashcards — senior only */}
      {!junior && (fcLoad||flashcards.length>0) && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="rounded-2xl p-5 border" style={{ background:'var(--card)', borderColor:'var(--cyan-bdr)' }}>
          <h3 className="font-syne font-bold text-sm mb-1 flex items-center gap-2" style={{ color:'var(--txt)' }}>
            <Layers size={14} style={{ color:'var(--cyan)' }}/>Review Flashcards
          </h3>
          <p className="text-xs mb-4" style={{ color:'var(--txt3)' }}>AI-generated for questions you got wrong</p>
          {fcLoad ? (
            <div className="flex items-center gap-2 text-sm py-4 justify-center" style={{ color:'var(--txt3)' }}>
              <Loader size={14} className="animate-spin" style={{ color:'var(--cyan)' }}/>Generating...
            </div>
          ) : (
            <>
              <div className="relative h-32 mb-4 cursor-pointer" onClick={() => { playClick(); setShowBack(b=>!b); }}>
                <AnimatePresence mode="wait">
                  {!showBack ? (
                    <motion.div key="f" initial={{ rotateY:90 }} animate={{ rotateY:0 }} exit={{ rotateY:-90 }}
                      className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center px-4 text-center border"
                      style={{ background:'var(--cyan-bg)', borderColor:'var(--cyan-bdr)' }}>
                      <p className="text-[10px] font-bold mb-1" style={{ color:'var(--cyan)' }}>QUESTION</p>
                      <p className="text-sm font-semibold" style={{ color:'var(--txt)' }}>{flashcards[fcIdx]?.front}</p>
                      <p className="text-[10px] mt-2 flex items-center gap-1" style={{ color:'var(--txt3)' }}><Eye size={10}/>Tap to reveal</p>
                    </motion.div>
                  ) : (
                    <motion.div key="b" initial={{ rotateY:-90 }} animate={{ rotateY:0 }} exit={{ rotateY:90 }}
                      className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center px-4 text-center border"
                      style={{ background:'rgba(52,211,153,0.08)', borderColor:'var(--green)' }}>
                      <p className="text-[10px] font-bold mb-1" style={{ color:'var(--green)' }}>ANSWER</p>
                      <p className="text-sm leading-relaxed" style={{ color:'var(--txt)' }}>{flashcards[fcIdx]?.back}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => { playClick(); setShowBack(false); setFcIdx(i=>Math.max(0,i-1)); }}
                  disabled={fcIdx===0} className="p-2 rounded-xl border disabled:opacity-30"
                  style={{ background:'var(--card)', borderColor:'var(--border)' }}>
                  <ChevronLeft size={15} style={{ color:'var(--txt2)' }}/>
                </button>
                <span className="text-xs" style={{ color:'var(--txt3)' }}>{fcIdx+1}/{flashcards.length}</span>
                <button onClick={() => { playClick(); setShowBack(false); setFcIdx(i=>Math.min(flashcards.length-1,i+1)); }}
                  disabled={fcIdx===flashcards.length-1} className="p-2 rounded-xl border disabled:opacity-30"
                  style={{ background:'var(--card)', borderColor:'var(--border)' }}>
                  <ChevronRight size={15} style={{ color:'var(--txt2)' }}/>
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
  const { profile } = useUserData();
  const grade       = profile?.grade || '';
  const [phase,   setPhase]   = useState('setup');
  const [quiz,    setQuiz]    = useState(null);
  const [timer,   setTimer]   = useState(60);
  const [result,  setResult]  = useState(null);
  const junior = isJuniorGrade(grade);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6 pt-12 lg:pt-0">
        <h1 className="page-title">{junior ? 'Quiz Time! 🎮' : 'AI Quiz Generator'}</h1>
        <p className="page-sub">
          {junior ? 'Let\'s test what you know! 🌟' : 'Custom quizzes · Keyboard shortcuts · AI explanations · Auto flashcards'}
        </p>
      </div>
      {phase==='setup'   && <QuizSetup   onStart={(q,t)=>{ setQuiz(q); setTimer(t); setPhase('active'); }} currentDifficulty={profile?.currentDifficulty} grade={grade} />}
      {phase==='active'  && quiz   && <ActiveQuiz  quiz={quiz} timerSeconds={timer} grade={grade} onComplete={r=>{ setResult(r); setPhase('results'); }} />}
      {phase==='results' && result && <QuizResults result={result} quiz={quiz} grade={grade} onRetry={()=>setPhase('active')} onNew={()=>{ setQuiz(null); setPhase('setup'); }} />}
    </div>
  );
}

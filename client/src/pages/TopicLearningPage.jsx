import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, CheckCircle, AlertTriangle, Lightbulb,
  Star, ChevronRight, ExternalLink, Zap, RotateCcw
} from 'lucide-react';
import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { generateTopicLesson, generateTopicQuiz, generateTopicResources } from '../utils/api';
import { saveQuizResultToFirestore } from '../utils/firestoreUtils';
import { audioSystem } from '../utils/audio';
import toast from 'react-hot-toast';

/* ── Section type config ── */
const sectionStyles = {
  text:      { border: '3px solid rgba(139, 92, 246, 0.5)',  bg: 'rgba(139, 92, 246, 0.04)' },
  highlight: { border: '3px solid rgba(14, 165, 233, 0.6)',  bg: 'rgba(14, 165, 233, 0.05)' },
  example:   { border: '3px solid rgba(16, 185, 129, 0.6)',  bg: 'rgba(16, 185, 129, 0.05)' },
  warning:   { border: '3px solid rgba(245, 158, 11, 0.6)',  bg: 'rgba(245, 158, 11, 0.05)'  },
};

const sectionIcons = {
  text:      BookOpen,
  highlight: Lightbulb,
  example:   Star,
  warning:   AlertTriangle,
};

const resourceTypeColors = {
  documentation: { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' },
  tutorial:      { bg: 'rgba(14, 165, 233, 0.12)',  color: '#0EA5E9' },
  video:         { bg: 'rgba(239, 68, 68, 0.12)',   color: '#EF4444' },
  course:        { bg: 'rgba(16, 185, 129, 0.12)',  color: '#10B981' },
};

/* ── Skeleton ── */
function Skeleton({ lines = 4 }) {
  return (
    <div className="glass-card p-6 animate-pulse space-y-3">
      <div className="h-5 bg-white/10 rounded-lg w-2/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-white/5 rounded-lg" style={{ width: `${85 - i * 10}%` }} />
      ))}
    </div>
  );
}

/* ── Lesson Section Card ── */
function LessonSection({ section }) {
  const style = sectionStyles[section.type] || sectionStyles.text;
  const Icon  = sectionIcons[section.type] || BookOpen;
  return (
    <div className="rounded-2xl p-5 mb-4"
      style={{ borderLeft: style.border, background: style.bg, border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-txt3 flex-shrink-0" />
        <h3 className="font-jakarta font-bold text-sm text-txt uppercase tracking-wider">{section.heading}</h3>
      </div>
      <p className="text-txt2 text-sm leading-relaxed font-medium">{section.content}</p>
    </div>
  );
}

/* ── Quiz Component ── */
function QuizSection({ pathId, topicIndex, topic, subject, level, user }) {
  const [started,   setStarted]   = useState(false);
  const [quiz,      setQuiz]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [selected,  setSelected]  = useState(null);
  const [answered,  setAnswered]  = useState(false);
  const [score,     setScore]     = useState(0);
  const [done,      setDone]      = useState(false);
  const [direction, setDirection] = useState(1);

  const loadQuiz = async () => {
    audioSystem.playClick();
    setStarted(true);
    setLoading(true);
    try {
      // Check cache
      const cacheRef = doc(db, 'users', user.uid, 'savedPaths', pathId, 'topicQuiz', String(topicIndex));
      const cached   = await getDoc(cacheRef);
      if (cached.exists()) {
        setQuiz(cached.data().quiz);
        setLoading(false);
        return;
      }
      // Generate
      const res  = await generateTopicQuiz(subject, topic, level);
      const data = res.data;
      setQuiz(data);
      // Cache
      await setDoc(cacheRef, { quiz: data, cachedAt: serverTimestamp() });
    } catch {
      toast.error('Failed to load quiz. Please try again.');
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (idx) => {
    if (answered) return;
    audioSystem.playClick();
    setSelected(idx);
    setAnswered(true);
    if (idx === quiz.questions[current].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = async () => {
    audioSystem.playClick();
    if (current + 1 >= quiz.questions.length) {
      setDone(true);
      const finalScore    = Math.round(((score + (selected === quiz.questions[current].correctIndex ? 1 : 0)) / quiz.questions.length) * 100);
      const correctCount  = score + (selected === quiz.questions[current].correctIndex ? 1 : 0);
      const result = await saveQuizResultToFirestore(user.uid, {
        subject,
        topic,
        score: finalScore,
        totalQuestions: quiz.questions.length,
        correctAnswers: correctCount,
        difficulty: level,
      });
      if (result?.xpEarned) {
        toast.success(`+${result.xpEarned} XP earned! 🎉`);
      }
    } else {
      setDirection(1);
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const finalScore = done ? Math.round((score / quiz.questions.length) * 100) : 0;

  if (!started) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <Zap size={24} className="text-primary" />
        </div>
        <h3 className="font-jakarta font-black text-xl text-txt mb-2">Test Your Knowledge</h3>
        <p className="text-txt3 text-sm mb-6">5 questions to reinforce what you just learned</p>
        <button onClick={loadQuiz} className="btn-primary px-8 py-3 flex items-center gap-2 mx-auto">
          Start Quiz <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  if (loading) return <Skeleton lines={5} />;

  if (done) {
    const passed = finalScore >= 60;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl
          ${passed ? 'bg-green-500/10 border-2 border-green-500/40' : 'bg-red-500/10 border-2 border-red-500/40'}`}>
          {passed ? '🎉' : '📚'}
        </div>
        <h3 className="font-jakarta font-black text-2xl text-txt mb-1">
          {passed ? 'Great job!' : 'Keep practicing!'}
        </h3>
        <p className="text-txt3 text-sm mb-6">
          You scored <span className="font-black" style={{ color: passed ? '#10B981' : '#EF4444' }}>{finalScore}%</span>
          {' '}({score}/{quiz.questions.length} correct)
        </p>
        <button onClick={() => { setDone(false); setCurrent(0); setScore(0); setSelected(null); setAnswered(false); audioSystem.playClick(); }}
          className="btn-outline px-6 py-3 flex items-center gap-2 mx-auto text-sm">
          <RotateCcw size={15} /> Retry Quiz
        </button>
      </motion.div>
    );
  }

  const question = quiz?.questions?.[current];
  if (!question) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-bold text-txt3 uppercase tracking-widest">
          Question {current + 1} / {quiz.questions.length}
        </span>
        <div className="h-2 flex-1 mx-4 bg-space-800 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary"
            animate={{ width: `${((current) / quiz.questions.length) * 100}%` }}
            transition={{ duration: 0.4 }} />
        </div>
        <span className="text-xs font-bold text-primary">{score} correct</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 30 }}
          transition={{ duration: 0.2 }}>
          <p className="font-jakarta font-bold text-lg text-txt mb-6 leading-snug">{question.question}</p>
          <div className="space-y-3 mb-6">
            {question.options.map((opt, idx) => {
              const isCorrect  = idx === question.correctIndex;
              const isSelected = idx === selected;
              let borderColor = 'var(--border)';
              let bgColor     = 'var(--bg2)';
              let textColor   = 'var(--txt2)';
              if (answered) {
                if (isCorrect)                      { borderColor = '#10B981'; bgColor = 'rgba(16,185,129,0.08)'; textColor = '#10B981'; }
                else if (isSelected && !isCorrect)  { borderColor = '#EF4444'; bgColor = 'rgba(239,68,68,0.08)';  textColor = '#EF4444'; }
              } else if (isSelected) {
                borderColor = 'var(--primary)'; bgColor = 'rgba(139,92,246,0.08)'; textColor = 'var(--primary)';
              }
              return (
                <button key={idx} onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all border"
                  style={{ borderColor, background: bgColor, color: textColor }}>
                  <span className="font-black mr-3">{String.fromCharCode(65 + idx)}.</span>{opt}
                </button>
              );
            })}
          </div>
          {answered && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl mb-4 text-xs text-txt2 font-medium"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              💡 {question.explanation}
            </motion.div>
          )}
          {answered && (
            <button onClick={handleNext} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm">
              {current + 1 >= quiz.questions.length ? 'See Results' : 'Next Question'} <ChevronRight size={16} />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Main Page ── */
export default function TopicLearningPage() {
  const { pathId, topicIndex } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [topic,     setTopic]     = useState(null);    // node data from path
  const [pathMeta,  setPathMeta]  = useState(null);    // subject, level, goal
  const [lesson,    setLesson]    = useState(null);
  const [resources, setResources] = useState(null);
  const [lessonLoading,    setLessonLoading]    = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  /* Load path + topic node */
  useEffect(() => {
    if (!user?.uid || !pathId) return;
    (async () => {
      try {
        const pathSnap = await getDoc(doc(db, 'users', user.uid, 'savedPaths', pathId));
        if (!pathSnap.exists()) { toast.error('Path not found.'); navigate(-1); return; }
        const pData = pathSnap.data();
        setPathMeta({ subject: pData.subject, level: pData.level, goal: pData.goal });
        const node = pData.nodes?.[Number(topicIndex)];
        if (!node) { toast.error('Topic not found.'); navigate(-1); return; }
        setTopic(node);
      } catch { toast.error('Failed to load topic.'); }
    })();
  }, [user?.uid, pathId, topicIndex]);

  /* Load lesson */
  useEffect(() => {
    if (!topic || !pathMeta || !user?.uid) return;
    (async () => {
      setLessonLoading(true);
      try {
        const cacheRef = doc(db, 'users', user.uid, 'savedPaths', pathId, 'topicContent', String(topicIndex));
        const cached   = await getDoc(cacheRef);
        if (cached.exists()) {
          setLesson(cached.data().lesson);
        } else {
          const res  = await generateTopicLesson(pathMeta.subject, topic.title, pathMeta.level, pathMeta.goal || '🎯 Master the Basics');
          const data = res.data;
          setLesson(data);
          await setDoc(cacheRef, { lesson: data, cachedAt: serverTimestamp() });
        }
      } catch { toast.error('Failed to load lesson content.'); }
      finally  { setLessonLoading(false); }
    })();
  }, [topic, pathMeta]);

  /* Load resources */
  useEffect(() => {
    if (!topic || !pathMeta || !user?.uid) return;
    (async () => {
      setResourcesLoading(true);
      try {
        const cacheRef = doc(db, 'users', user.uid, 'savedPaths', pathId, 'topicResources', String(topicIndex));
        const cached   = await getDoc(cacheRef);
        if (cached.exists()) {
          setResources(cached.data().resources);
        } else {
          const res  = await generateTopicResources(pathMeta.subject, topic.title);
          const data = res.data.resources;
          setResources(data);
          await setDoc(cacheRef, { resources: data, cachedAt: serverTimestamp() });
        }
      } catch { toast.error('Failed to load resources.'); }
      finally  { setResourcesLoading(false); }
    })();
  }, [topic, pathMeta]);

  const levelColors = { beginner: '#10B981', intermediate: '#0EA5E9', advanced: '#8B5CF6' };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
      {/* Back button */}
      <button onClick={() => { audioSystem.playClick(); navigate(-1); }}
        className="flex items-center gap-2 text-txt3 hover:text-txt text-sm font-semibold mb-6 transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Path
      </button>

      {/* Header */}
      {topic && pathMeta ? (
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-bold px-3 py-1 rounded-lg"
              style={{ background: `${levelColors[pathMeta.level] || '#8B5CF6'}15`, color: levelColors[pathMeta.level] || '#8B5CF6', border: `1px solid ${levelColors[pathMeta.level] || '#8B5CF6'}30` }}>
              {pathMeta.level}
            </span>
            <span className="text-xs font-bold text-txt3 px-3 py-1 rounded-lg"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              {pathMeta.subject}
            </span>
          </div>
          <h1 className="font-jakarta font-black text-2xl md:text-3xl text-txt leading-tight">{topic.title}</h1>
          <p className="text-txt3 text-sm mt-2 font-medium">{topic.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs font-bold text-txt3">⏱ ~{topic.estimatedMinutes} min</span>
            <span className="text-xs font-bold text-amber-500">+{topic.xpReward} XP</span>
          </div>
        </div>
      ) : (
        <div className="mb-8 animate-pulse">
          <div className="h-6 bg-white/10 rounded-lg w-1/4 mb-3" />
          <div className="h-8 bg-white/10 rounded-lg w-3/4 mb-2" />
          <div className="h-4 bg-white/5 rounded-lg w-full" />
        </div>
      )}

      {/* ── SECTION A: Lesson ── */}
      <div className="mb-10">
        <h2 className="font-jakarta font-black text-lg text-txt mb-5 flex items-center gap-2">
          <BookOpen size={18} className="text-primary" /> Lesson Content
        </h2>
        {lessonLoading ? (
          <div className="space-y-4">
            <Skeleton lines={4} /><Skeleton lines={3} /><Skeleton lines={5} />
          </div>
        ) : lesson ? (
          <div>
            {lesson.sections?.map(s => <LessonSection key={s.id} section={s} />)}
            {lesson.keyTakeaways?.length > 0 && (
              <div className="mt-6 p-5 rounded-2xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">Key Takeaways</p>
                <div className="flex flex-wrap gap-2">
                  {lesson.keyTakeaways.map((t, i) => (
                    <span key={i} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-txt2"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card p-6 text-center text-txt3 text-sm">Failed to load lesson.</div>
        )}
      </div>

      {/* ── SECTION B: Quiz ── */}
      {topic && pathMeta && user && (
        <div className="mb-10">
          <h2 className="font-jakarta font-black text-lg text-txt mb-5 flex items-center gap-2">
            <Zap size={18} className="text-amber-500" /> Test Your Knowledge
          </h2>
          <QuizSection
            pathId={pathId}
            topicIndex={Number(topicIndex)}
            topic={topic.title}
            subject={pathMeta.subject}
            level={pathMeta.level}
            user={user}
          />
        </div>
      )}

      {/* ── SECTION C: Resources ── */}
      <div className="mb-10">
        <h2 className="font-jakarta font-black text-lg text-txt mb-5 flex items-center gap-2">
          <ExternalLink size={18} className="text-cyan-500" /> Learning Resources
        </h2>
        {resourcesLoading ? (
          <div className="space-y-3"><Skeleton lines={2} /><Skeleton lines={2} /></div>
        ) : resources?.length > 0 ? (
          <div className="space-y-3">
            {resources.map((r, i) => {
              const typeStyle = resourceTypeColors[r.type] || resourceTypeColors.tutorial;
              return (
                <motion.a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  onClick={() => audioSystem.playClick()}
                  className="glass-card p-5 flex items-start gap-4 group cursor-pointer block hover:border-primary/30 transition-all"
                  style={{ textDecoration: 'none' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <p className="font-bold text-sm text-txt group-hover:text-primary transition-colors truncate">{r.title}</p>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md flex-shrink-0"
                        style={{ background: typeStyle.bg, color: typeStyle.color }}>
                        {r.type}
                      </span>
                    </div>
                    <p className="text-xs text-txt3 leading-relaxed">{r.description}</p>
                    <p className="text-[10px] font-bold text-txt3 mt-1.5 uppercase tracking-wider">{r.platform}</p>
                  </div>
                  <ExternalLink size={15} className="text-txt3 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                </motion.a>
              );
            })}
            <p className="text-xs text-center mt-3 font-medium" style={{ color: 'var(--txt3)' }}>
              🔗 Links are AI-suggested. Verify before use.
            </p>
          </div>
        ) : (
          <div className="glass-card p-6 text-center text-txt3 text-sm">No resources available.</div>
        )}
      </div>
    </div>
  );
}

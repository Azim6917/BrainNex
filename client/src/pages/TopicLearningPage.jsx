import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, CheckCircle, AlertTriangle, Lightbulb,
  Star, ChevronRight, ExternalLink, Zap, RotateCcw, LayoutTemplate
} from 'lucide-react';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
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
    <div className="rounded-2xl p-6 mb-5"
      style={{ borderLeft: style.border, background: style.bg, border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-txt3 flex-shrink-0" />
        <h3 className="font-jakarta font-bold text-sm text-txt uppercase tracking-wider">{section.heading}</h3>
      </div>
      <div className="text-txt2 text-sm leading-relaxed font-medium space-y-2 whitespace-pre-wrap">
        {section.content}
      </div>
    </div>
  );
}

/* ── Quiz Component ── */
function QuizSection({ pathId, topicIndex, topic, subject, level, user, onQuizPass }) {
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
      const cacheRef = doc(db, 'users', user.uid, 'savedPaths', pathId, 'topicQuiz', String(topicIndex));
      const cached   = await getDoc(cacheRef);
      if (cached.exists()) {
        setQuiz(cached.data().quiz);
        setLoading(false);
        return;
      }
      const res  = await generateTopicQuiz(subject, topic, level);
      const data = res.data;
      setQuiz(data);
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
      const correctCount  = score + (selected === quiz.questions[current].correctIndex ? 1 : 0);
      const finalScore    = Math.round((correctCount / quiz.questions.length) * 100);
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
      if (finalScore >= 60) {
        onQuizPass();
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
      <div className="glass-card p-10 text-center shadow-lg border border-primary/20">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
          <Zap size={28} className="text-amber-500" />
        </div>
        <h3 className="font-jakarta font-black text-2xl text-txt mb-2">Test Your Knowledge</h3>
        <p className="text-txt3 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          Take a quick 5-question quiz to reinforce your understanding of the core concepts in this lesson.
        </p>
        <button onClick={loadQuiz} className="btn-primary px-8 py-3.5 flex items-center justify-center gap-2 mx-auto shadow-glow-primary w-full max-w-xs">
          Start Quiz <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  if (loading) return <Skeleton lines={5} />;

  if (done) {
    const passed = finalScore >= 60;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 text-center shadow-lg border border-primary/20">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg
          ${passed ? 'bg-green-500/10 border-2 border-green-500/40' : 'bg-red-500/10 border-2 border-red-500/40'}`}>
          {passed ? '🎉' : '📚'}
        </div>
        <h3 className="font-jakarta font-black text-3xl text-txt mb-2">
          {passed ? 'Great job!' : 'Keep practicing!'}
        </h3>
        <p className="text-txt3 text-base mb-8">
          You scored <span className="font-black text-lg mx-1" style={{ color: passed ? '#10B981' : '#EF4444' }}>{finalScore}%</span>
          ({score}/{quiz.questions.length} correct)
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => { setDone(false); setCurrent(0); setScore(0); setSelected(null); setAnswered(false); audioSystem.playClick(); }}
            className="btn-outline px-6 py-3.5 flex items-center gap-2 text-sm bg-space-800">
            <RotateCcw size={16} /> Retry Quiz
          </button>
        </div>
      </motion.div>
    );
  }

  const question = quiz?.questions?.[current];
  if (!question) return null;

  return (
    <div className="glass-card p-8 border border-white/5 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <span className="text-xs font-bold text-txt3 uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          Question {current + 1} of {quiz.questions.length}
        </span>
        <div className="h-2.5 flex-1 mx-6 bg-space-800 rounded-full overflow-hidden shadow-inner border border-white/5">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500"
            animate={{ width: `${((current) / quiz.questions.length) * 100}%` }}
            transition={{ duration: 0.4 }} />
        </div>
        <span className="text-sm font-bold text-primary px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">{score} correct</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 40 }}
          transition={{ duration: 0.25 }}>
          <p className="font-jakarta font-bold text-xl text-txt mb-8 leading-relaxed">{question.question}</p>
          <div className="space-y-4 mb-8">
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
                  className="w-full text-left px-5 py-4 rounded-xl text-sm font-semibold transition-all border shadow-sm"
                  style={{ borderColor, background: bgColor, color: textColor }}>
                  <span className="font-black mr-4 text-txt3">{String.fromCharCode(65 + idx)}.</span>{opt}
                </button>
              );
            })}
          </div>
          {answered && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl mb-6 text-sm text-txt2 font-medium leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid var(--primary)' }}>
              <span className="font-bold text-primary mr-2">Explanation:</span> {question.explanation}
            </motion.div>
          )}
          {answered && (
            <button onClick={handleNext} className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-sm shadow-glow-primary">
              {current + 1 >= quiz.questions.length ? 'See Results' : 'Next Question'} <ChevronRight size={18} />
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

  const [activeTab, setActiveTab] = useState('lesson');
  const [nodes,     setNodes]     = useState([]);      // all nodes in path
  const [topic,     setTopic]     = useState(null);    // current node
  const [pathMeta,  setPathMeta]  = useState(null);    // subject, level, goal
  
  const [lesson,    setLesson]    = useState(null);
  const [resources, setResources] = useState(null);
  const [lessonLoading,    setLessonLoading]    = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  // Reset state on path or topic index change
  useEffect(() => {
    setLesson(null);
    setResources(null);
    setActiveTab('lesson');
    setLessonLoading(true);
    setResourcesLoading(true);
  }, [pathId, topicIndex]);

  /* Load path + topic node */
  useEffect(() => {
    if (!user?.uid || !pathId) return;
    (async () => {
      try {
        const pathSnap = await getDoc(doc(db, 'users', user.uid, 'savedPaths', pathId));
        if (!pathSnap.exists()) { toast.error('Path not found.'); navigate(-1); return; }
        const pData = pathSnap.data();
        setPathMeta({ subject: pData.subject, level: pData.level, goal: pData.goal });
        setNodes(pData.nodes || []);
        
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
  }, [topic, pathMeta, pathId, topicIndex, user?.uid]);

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
  }, [topic, pathMeta, pathId, topicIndex, user?.uid]);

  const handleNextTopic = async () => {
    if (!user?.uid || !pathId) return;
    audioSystem.playClick();
    
    const currentIndex = Number(topicIndex);
    const nextIndex = currentIndex + 1;
    
    // Update nodes status
    const updatedNodes = [...nodes];
    updatedNodes[currentIndex].status = 'completed';
    if (nextIndex < updatedNodes.length) {
      if (updatedNodes[nextIndex].status === 'locked') {
        updatedNodes[nextIndex].status = 'current';
      }
    }

    try {
      await updateDoc(doc(db, 'users', user.uid, 'savedPaths', pathId), {
        nodes: updatedNodes
      });
      if (nextIndex < updatedNodes.length) {
        navigate(`/app/learn/${pathId}/${nextIndex}`);
      } else {
        toast.success('🎉 You have completed this learning path!');
        navigate(`/app/learning-path`, { state: { loadedPath: { nodes: updatedNodes, totalTopics: nodes.length, subject: pathMeta.subject }, pathId }});
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to progress to next topic.');
    }
  };

  const levelColors = { beginner: '#10B981', intermediate: '#0EA5E9', advanced: '#8B5CF6' };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Back button */}
      <button onClick={() => { audioSystem.playClick(); navigate(-1); }}
        className="inline-flex items-center gap-2 text-txt3 hover:text-txt text-sm font-semibold mb-6 transition-colors group px-4 py-2 rounded-xl bg-white/5 border border-white/10">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Path
      </button>

      {/* Header Container */}
      <div className="glass-card p-6 md:p-8 mb-8 border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none" />
        
        {topic && pathMeta ? (
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: `${levelColors[pathMeta.level] || '#8B5CF6'}15`, color: levelColors[pathMeta.level] || '#8B5CF6', border: `1px solid ${levelColors[pathMeta.level] || '#8B5CF6'}30` }}>
                {pathMeta.level}
              </span>
              <span className="text-xs font-bold text-txt3 px-3 py-1.5 rounded-lg bg-space-800 border border-border">
                {pathMeta.subject}
              </span>
              <span className="text-xs font-bold text-txt3 px-3 py-1.5 rounded-lg bg-space-800 border border-border">
                Topic {Number(topicIndex) + 1} of {nodes.length}
              </span>
            </div>
            <h1 className="font-jakarta font-black text-3xl md:text-4xl text-txt leading-tight mb-3">
              {topic.title}
            </h1>
            <p className="text-txt2 text-base max-w-3xl font-medium leading-relaxed">{topic.description}</p>
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/10">
              <span className="flex items-center gap-2 text-sm font-bold text-txt3">
                <div className="p-1.5 bg-white/5 rounded-md"><Clock size={14} /></div> ~{topic.estimatedMinutes} min
              </span>
              <span className="flex items-center gap-2 text-sm font-bold text-amber-500">
                <div className="p-1.5 bg-amber-500/10 rounded-md"><Zap size={14} /></div> +{topic.xpReward} XP
              </span>
            </div>
          </div>
        ) : (
          <div className="animate-pulse">
            <div className="h-6 bg-white/10 rounded-lg w-1/4 mb-4" />
            <div className="h-10 bg-white/10 rounded-lg w-3/4 mb-4" />
            <div className="h-4 bg-white/5 rounded-lg w-full mb-6" />
            <div className="h-10 bg-white/5 rounded-lg w-1/3" />
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 mb-8 p-1.5 bg-space-800 rounded-2xl border border-white/5 shadow-sm overflow-x-auto custom-scrollbar">
        {[
          { id: 'lesson',    label: 'Lesson',    icon: BookOpen,      color: 'text-primary' },
          { id: 'quiz',      label: 'Quiz',      icon: Zap,           color: 'text-amber-500' },
          { id: 'resources', label: 'Resources', icon: ExternalLink,  color: 'text-cyan-500' }
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => { audioSystem.playClick(); setActiveTab(tab.id); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                ${active ? 'bg-space-dark text-txt shadow-md border border-white/10' : 'text-txt3 hover:text-txt2 hover:bg-white/5'}`}>
              <tab.icon size={16} className={active ? tab.color : 'opacity-70'} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* LESSON TAB */}
          {activeTab === 'lesson' && (
            <motion.div key="lesson" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {lessonLoading ? (
                <div className="space-y-6">
                  <Skeleton lines={5} /><Skeleton lines={4} /><Skeleton lines={6} />
                </div>
              ) : lesson ? (
                <div className="glass-card p-6 md:p-8">
                  <div className="max-w-4xl mx-auto">
                    {lesson.sections?.map(s => <LessonSection key={s.id} section={s} />)}
                    
                    {lesson.keyTakeaways?.length > 0 && (
                      <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 shadow-inner">
                        <h4 className="flex items-center gap-2 text-sm font-black text-primary uppercase tracking-widest mb-4">
                          <CheckCircle size={16} /> Key Takeaways
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {lesson.keyTakeaways.map((t, i) => (
                            <div key={i} className="flex items-start gap-3 bg-space-800 p-4 rounded-xl border border-white/5">
                              <span className="text-primary font-bold mt-0.5">✓</span>
                              <span className="text-sm font-medium text-txt2 leading-relaxed">{t}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card p-10 text-center text-txt3 font-medium">Failed to load lesson.</div>
              )}
            </motion.div>
          )}

          {/* QUIZ TAB */}
          {activeTab === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {topic && pathMeta && user && (
                <div className="max-w-3xl mx-auto">
                  <QuizSection
                    pathId={pathId}
                    topicIndex={Number(topicIndex)}
                    topic={topic.title}
                    subject={pathMeta.subject}
                    level={pathMeta.level}
                    user={user}
                    onQuizPass={() => {}} // Could trigger a completion effect
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* RESOURCES TAB */}
          {activeTab === 'resources' && (
            <motion.div key="resources" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {resourcesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Skeleton lines={2} /><Skeleton lines={2} /><Skeleton lines={2} /><Skeleton lines={2} />
                </div>
              ) : resources?.length > 0 ? (
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {resources.map((r, i) => {
                      const typeStyle = resourceTypeColors[r.type] || resourceTypeColors.tutorial;
                      return (
                        <motion.a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                          whileHover={{ y: -4, scale: 1.02 }}
                          onClick={() => audioSystem.playClick()}
                          className="glass-card p-6 flex flex-col h-full group cursor-pointer block hover:border-cyan-500/30 transition-all shadow-md"
                          style={{ textDecoration: 'none' }}>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider"
                              style={{ background: typeStyle.bg, color: typeStyle.color }}>
                              {r.type}
                            </span>
                            <span className="text-[10px] font-bold text-txt3 uppercase tracking-wider bg-white/5 px-2 py-1 rounded border border-white/10">
                              {r.platform}
                            </span>
                          </div>
                          <h4 className="font-bold text-base text-txt group-hover:text-cyan-500 transition-colors mb-2 leading-tight">
                            {r.title}
                          </h4>
                          <p className="text-sm text-txt3 leading-relaxed flex-1">
                            {r.description}
                          </p>
                          <div className="mt-5 pt-4 border-t border-white/5 flex items-center text-xs font-bold text-cyan-500 group-hover:text-cyan-400">
                            Open Resource <ExternalLink size={14} className="ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </motion.a>
                      );
                    })}
                  </div>
                  <p className="text-xs text-center mt-8 font-medium bg-space-800 py-3 rounded-xl border border-white/5 max-w-md mx-auto text-txt3">
                    <span className="text-primary mr-1">ℹ</span> Links are AI-suggested search queries or documentation links. Verify before use.
                  </p>
                </div>
              ) : (
                <div className="glass-card p-10 text-center text-txt3 font-medium">No resources available.</div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Next Topic Bottom Bar */}
      <div className="mt-12 flex justify-between items-center pt-6 border-t border-white/10">
        <div className="text-sm font-medium text-txt3">
          Topic {Number(topicIndex) + 1} of {nodes.length}
        </div>
        <button onClick={handleNextTopic} 
          className="btn-primary px-8 py-3.5 flex items-center gap-2 font-bold shadow-glow-primary">
          {Number(topicIndex) + 1 >= nodes.length ? 'Complete Path 🏆' : 'Next Topic'} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

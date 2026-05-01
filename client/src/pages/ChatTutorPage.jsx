import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, RefreshCw, ChevronDown, Clock, Trash2, Plus, Loader2, X, Check, PenLine } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { useAuth }     from '../context/AuthContext';
import { useTheme }    from '../context/ThemeContext';
import { chatWithAI }  from '../utils/api';
import { audioSystem } from '../utils/audio';
import BrainNexLogo from '../components/BrainNexLogo';
import toast from 'react-hot-toast';
import {
  collection, doc, setDoc, updateDoc, getDocs,
  deleteDoc, query, orderBy, limit, serverTimestamp, arrayUnion, Timestamp,
} from 'firebase/firestore';
import { db } from '../utils/firebase';

/* ── Subjects differ by grade ── */
const JUNIOR_SUBJECTS  = ['Maths','Science','English','Social Studies','Art','Music'];
const SENIOR_SUBJECTS  = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Geography','Literature','Economics','Psychology'];

function isJunior(grade) {
  return ['Class 1','Class 2','Class 3','Class 4','Class 5'].includes(grade);
}
function isMiddle(grade) {
  return ['Class 6','Class 7','Class 8'].includes(grade);
}

/* ── Firestore helpers ── */
const sessionsRef = (uid) => collection(db, 'chatHistory', uid, 'sessions');
const sessionRef  = (uid, sid) => doc(db, 'chatHistory', uid, 'sessions', sid);

async function fsLoadSessions(uid) {
  try {
    const q    = query(sessionsRef(uid), orderBy('updatedAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Firestore load sessions failed, using localStorage:', err.message);
    return null; // signal fallback
  }
}

async function fsCreateSession(uid, sessionId, subject, grade, firstUserMsg) {
  try {
    const title = firstUserMsg?.substring(0, 40) || 'New Chat';
    await setDoc(sessionRef(uid, sessionId), {
      sessionId,
      subject,
      grade,
      title,
      createdAt:  serverTimestamp(),
      updatedAt:  serverTimestamp(),
      messages:   [],
    });
    return true;
  } catch (err) {
    console.warn('Firestore createSession failed:', err.message);
    return false;
  }
}

async function fsAppendMessage(uid, sessionId, message, title) {
  try {
    const fsMsg = { role: message.role, content: message.content, timestamp: Timestamp.now() };
    await updateDoc(sessionRef(uid, sessionId), {
      messages:  arrayUnion(fsMsg),
      updatedAt: serverTimestamp(),
      ...(title ? { title } : {}),
    });
    return true;
  } catch (err) {
    console.warn('Firestore appendMessage failed:', err.message);
    return false;
  }
}

async function fsDeleteSession(uid, sessionId) {
  try {
    await deleteDoc(sessionRef(uid, sessionId));
    return true;
  } catch (err) {
    console.warn('Firestore deleteSession failed:', err.message);
    return false;
  }
}

/* ── localStorage fallback ── */
const HIST_KEY    = uid => `bn-chat-hist-${uid}`;
function lsLoad(uid)    { try { return JSON.parse(localStorage.getItem(HIST_KEY(uid)) || '[]'); } catch { return []; } }
function lsSave(uid, s) { try { localStorage.setItem(HIST_KEY(uid), JSON.stringify(s.slice(-20))); } catch {} }

/* ── Markdown formatter ── */
function formatMsg(text) {
  return text
    .replace(/```([\s\S]*?)```/g, '<pre className="bg-space-900 border border-border p-3 rounded-xl overflow-x-auto text-xs my-2 font-mono"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-primary">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong className="font-bold text-txt">$1</strong>')
    .replace(/\*([^*]+)\*/g,     '<em className="italic">$1</em>')
    .replace(/^- (.+)/gm,        '<li className="ml-4 list-disc marker:text-primary">$1</li>')
    .replace(/(<li className="ml-4 list-disc marker:text-primary">[\s\S]*?<\/li>)/g, '<ul className="my-2 space-y-1">$1</ul>')
    .replace(/\n\n/g, '</p><p className="my-2">')
    .replace(/\n/g,   '<br/>')
    .replace(/^(.+)$/, '<p className="my-1">$1</p>');
}

/* ── Greeting based on grade ── */
function getGreeting(grade, name) {
  if (isJunior(grade)) {
    const firstName = (name || 'friend').split(' ')[0];
    return `Hi ${firstName}! 👋 I'm Nex, your super friendly learning buddy! 🌟\n\nI'm here to help you learn cool things about **${grade}** subjects! What would you like to learn today? You can ask me anything! 😊`;
  }
  if (isMiddle(grade)) {
    return `Hey! I'm **Nex**, your AI tutor 🧠\n\nI'm here to help you understand concepts, solve problems, or quiz you on any topic. What are we studying today?`;
  }
  return `Hey! I'm **Nex**, your personal AI tutor 🧠\n\nI can explain concepts, solve problems, or quiz you on any topic. What subject are we tackling today?`;
}

export default function ChatTutorPage() {
  const { user }    = useAuth();
  const { profile } = useUserData();
  const { kidMode } = useTheme();

  const grade    = profile?.grade || '';
  const junior   = isJunior(grade) || kidMode;
  const subjects = junior ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS;

  const [sessions,        setSessions]        = useState([]);
  const [histLoading,     setHistLoading]      = useState(false);
  const [activeSession,   setActiveSession]   = useState(null);
  const [messages,        setMessages]        = useState([{ role:'assistant', content:getGreeting(grade, user?.displayName) }]);
  const [input,           setInput]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [subject,         setSubject]         = useState(() => {
    const saved = localStorage.getItem('brainnex-tutor-subject');
    return saved || subjects[0];
  });
  const [showSubjects,    setShowSubjects]    = useState(false);
  const [showOtherInput,  setShowOtherInput]  = useState(false);
  const [customInput,     setCustomInput]     = useState('');
  const [listening,       setListening]       = useState(false);
  const [showHistory,     setShowHistory]     = useState(false);
  const [usingFs,         setUsingFs]         = useState(true); // tracks if Firestore is working
  const [isDesktop,       setIsDesktop]       = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  const msgEnd        = useRef(null);
  const recogRef      = useRef(null);
  const activeIdRef   = useRef(null); // keep in sync without stale closure
  const sessionCreatedRef = useRef(false); // prevent double-create races

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);
  useEffect(() => { activeIdRef.current = activeSession; }, [activeSession]);
  useEffect(() => { localStorage.setItem('brainnex-tutor-subject', subject); }, [subject]);

  /* ── Load history from Firestore when panel opens ── */
  const loadHistory = useCallback(async () => {
    if (!user?.uid) return;
    setHistLoading(true);
    const fsSessions = await fsLoadSessions(user.uid);
    if (fsSessions !== null) {
      setUsingFs(true);
      setSessions(fsSessions);
    } else {
      setUsingFs(false);
      setSessions(lsLoad(user.uid));
    }
    setHistLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory, loadHistory]);

  /* ── Send message ── */
  const send = async () => {
    if (!input.trim() || loading) return;
    const userContent = input.trim();
    const userMsg = { role:'user', content:userContent };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    audioSystem.playClick();

    const currentSessionId = activeIdRef.current;

    try {
      /* ── Create Firestore session on first user message ── */
      if (!currentSessionId && !sessionCreatedRef.current) {
        sessionCreatedRef.current = true;
        const newId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        setActiveSession(newId);
        activeIdRef.current = newId;

        if (usingFs) {
          const ok = await fsCreateSession(user.uid, newId, subject, grade, userContent);
          if (!ok) setUsingFs(false);
        }
        if (!usingFs) {
          // localStorage fallback: create session object
          const localSess = { id: newId, title: userContent.substring(0,40), subject, grade, messages:[], createdAt: new Date().toISOString() };
          setSessions(prev => { const u=[localSess,...prev]; lsSave(user.uid,u); return u; });
        }
      }

      const sid = activeIdRef.current;

      /* ── Save user message ── */
      if (usingFs && sid) {
        const title = messages.find(m=>m.role==='user')?.content?.substring(0,40) || userContent.substring(0,40);
        await fsAppendMessage(user.uid, sid, userMsg, !currentSessionId ? title : null);
      }

      /* ── Call AI ── */
      const history = [...messages, userMsg].slice(-10).map(m => ({ role:m.role, content:m.content }));
      const res = await chatWithAI(history, subject, profile?.currentDifficulty||'intermediate', grade);
      const aiMsg = { role:'assistant', content:res.data.content };
      setMessages(m => [...m, aiMsg]);

      /* ── Save AI response ── */
      if (usingFs && sid) {
        await fsAppendMessage(user.uid, sid, aiMsg, null);
      } else if (!usingFs) {
        // Update localStorage sessions
        setSessions(prev => {
          const updated = prev.map(s => s.id === sid ? { ...s, messages:[...s.messages, userMsg, aiMsg] } : s);
          lsSave(user.uid, updated);
          return updated;
        });
      }
    } catch {
      toast.error('AI unavailable. Is the backend server running?');
      setMessages(m => m.slice(0, -1));
      sessionCreatedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    audioSystem.playClick();
    setActiveSession(null);
    activeIdRef.current = null;
    sessionCreatedRef.current = false;
    setMessages([{ role:'assistant', content:getGreeting(grade, user?.displayName) }]);
  };

  const loadSession = (s) => {
    audioSystem.playClick();
    setActiveSession(s.id);
    activeIdRef.current = s.id;
    sessionCreatedRef.current = true; // session already exists
    // messages array from Firestore docs (strip Firestore Timestamp from display)
    const msgs = (s.messages || []).map(m => ({ role:m.role, content:m.content }));
    // prepend greeting if empty
    setMessages(msgs.length ? msgs : [{ role:'assistant', content:getGreeting(grade, user?.displayName) }]);
    setSubject(s.subject || subjects[0]);
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    audioSystem.playClick();
    if (usingFs) {
      await fsDeleteSession(user.uid, id);
    }
    setSessions(prev => {
      const u = prev.filter(s => s.id !== id);
      lsSave(user.uid, u);
      return u;
    });
    if (activeIdRef.current === id) newChat();
  };

  /* ── Voice ── */
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice not supported in this browser'); return; }
    const r = new SR();
    r.lang = 'en-IN';
    r.onstart  = () => setListening(true);
    r.onresult = e => { setInput(e.results[0][0].transcript); setListening(false); };
    r.onerror  = () => setListening(false);
    r.onend    = () => setListening(false);
    recogRef.current = r;
    r.start();
  };

  /* Quick prompts */
  const quickPrompts = junior
    ? [`What is ${subject}?`, `Tell me something cool about ${subject}!`, `Can you teach me something easy?`, `Can you make a quiz for me? 🎮`]
    : [`Explain the basics of ${subject}`, `Quiz me on ${subject}`, `Give me a practice problem`, `What are common mistakes in ${subject}?`];

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] m-2 lg:m-4 overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl">

      {/* ── History sidebar ── */}

      {/* Mobile dim overlay — separate AnimatePresence */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            key="hist-overlay"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed lg:absolute inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            key="hist-panel"
            initial={isDesktop ? { width: 0, opacity: 0 } : { x: '-100%', opacity: 0 }}
            animate={isDesktop ? { width: 260, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={isDesktop ? { width: 0, opacity: 0 } : { x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className={`flex-shrink-0 flex flex-col overflow-hidden backdrop-blur-xl ${isDesktop ? 'relative z-auto' : 'fixed inset-y-0 left-0 z-50 w-full sm:w-[320px]'}`}
            style={{ background: 'rgba(13, 13, 26, 0.95)', borderRight: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <div style={{ width: isDesktop ? 260 : '100%' }} className="flex flex-col h-full">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <span className="flex items-center gap-2" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.35)' }}>
                  <Clock size={14} /> HISTORY
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={newChat}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Plus size={16} />
                  </button>
                  <button onClick={() => setShowHistory(false)}
                    className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {histLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 size={20} className="animate-spin text-primary opacity-60" />
                    <p className="text-xs text-txt3 font-medium">Loading history...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-10 px-6">
                    <Clock size={24} className="mx-auto mb-3 text-txt3 opacity-50" />
                    <p className="text-xs text-txt3 font-medium">Chat history appears here after your first conversation.</p>
                  </div>
                ) : sessions.map(s => (
                  <div key={s.id} onClick={() => { loadSession(s); if(!isDesktop) setShowHistory(false); }}
                    className={`group flex items-center justify-between px-5 py-3.5 cursor-pointer transition-all border-l-2
                      ${activeSession===s.id ? 'bg-primary/10 border-primary shadow-inner' : 'border-transparent hover:bg-white/5'}`}>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className={`text-sm font-semibold truncate mb-0.5 ${activeSession===s.id ? 'text-primary' : 'text-txt2 group-hover:text-txt'}`}>
                        {s.title || 'Chat'}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-txt3 truncate">{s.subject}</p>
                    </div>
                    <button onClick={e => deleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-red-500/10 text-txt3 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main chat ── */}
      <div className="flex-1 flex flex-col min-w-0 relative" style={{ background: '#0d0d1a' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between flex-shrink-0 relative z-10" style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(10px)', padding: '10px 14px' }}>
          <style>{`@keyframes customPulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }`}</style>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button onClick={() => { audioSystem.playClick(); setShowHistory(!showHistory); }}
              className="p-2 rounded-xl bg-space-900 border border-white/10 hover:border-white/20 transition-all text-white/50 hover:text-white shadow-sm flex-shrink-0">
              <Clock size={16} />
            </button>
            <div className="flex items-center justify-center pr-1 flex-shrink-0">
              <BrainNexLogo size="md" iconOnly />
            </div>
            <div className="min-w-0">
              <p className="font-jakarta font-black text-base text-white tracking-tight truncate">
                {junior ? 'Nex — Buddy! 🌟' : 'Nex AI Tutor'}
              </p>
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-green-500 uppercase tracking-widest mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" style={{ animation: 'customPulse 2s ease-in-out infinite' }} />
                <span className="truncate">Online · {subject}{grade && <span className="text-white/40"> · {grade}</span>}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Subject picker — hidden on xs, visible sm+ */}
            <div className="relative group hidden sm:flex items-center gap-2">
              {showOtherInput ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    placeholder="Type any subject or topic..."
                    className="focus:outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(139,92,246,0.35)',
                      borderRadius: '12px', padding: '8px 14px', color: 'white', fontSize: '14px', width: '220px'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(139,92,246,0.70)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(139,92,246,0.35)'; e.target.style.boxShadow = 'none'; }}
                    onKeyDown={e => { if (e.key === 'Enter') { if(customInput.trim()){ setSubject(customInput.trim()); setShowOtherInput(false); setShowSubjects(false); setCustomInput(''); } } }}
                    autoFocus
                  />
                  <button onClick={() => { if(customInput.trim()){ setSubject(customInput.trim()); setShowOtherInput(false); setShowSubjects(false); setCustomInput(''); } }} className="bg-primary hover:bg-primary/80 transition-colors text-white p-2 rounded-xl flex-shrink-0">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setShowOtherInput(false)} className="bg-white/10 hover:bg-white/20 transition-colors text-white/50 hover:text-white p-2 rounded-xl flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => { audioSystem.playClick(); setShowSubjects(!showSubjects); }}
                    className="flex items-center gap-2 transition-all shadow-sm"
                    style={{
                      background: 'rgba(139, 92, 246, 0.12)', border: '1.5px solid rgba(139, 92, 246, 0.30)',
                      borderRadius: '50px', padding: '8px 18px', color: 'white', fontWeight: 600
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.22)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.50)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.30)'; }}
                  >
                    {subject} <ChevronDown size={14} className={`transition-transform ${showSubjects ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showSubjects && (
                      <motion.div initial={{ opacity:0, y:4, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:4, scale:0.95 }}
                        transition={{ duration:0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 z-50 overflow-y-auto custom-scrollbar"
                        style={{ background: '#1a1a2e', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', padding: '6px' }}>
                        {subjects.map(s => (
                          <button key={s} onClick={() => { audioSystem.playClick(); setSubject(s); setShowSubjects(false); }}
                            className="w-full flex items-center gap-3 text-left transition-colors"
                            style={{
                              padding: '10px 16px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
                              color: s === subject ? '#8B72FF' : 'rgba(255, 255, 255, 0.70)',
                              background: s === subject ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                            }}
                            onMouseOver={(e) => { if(s!==subject){ e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'; e.currentTarget.style.color = 'white'; } }}
                            onMouseOut={(e) => { if(s!==subject){ e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.70)'; } }}
                          >
                            {s}
                          </button>
                        ))}
                        <button onClick={() => { audioSystem.playClick(); setShowOtherInput(true); setShowSubjects(false); }}
                          className="w-full flex items-center gap-3 text-left transition-colors"
                          style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.70)' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'; e.currentTarget.style.color = 'white'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.70)'; }}
                        >
                          <PenLine size={14} /> Other
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
            <button onClick={newChat}
              className="p-2.5 rounded-xl border transition-all bg-space-900 border-white/10 text-white/50 hover:border-white/20 hover:text-white shadow-sm">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Subject Selector Row */}
        <div className="sm:hidden px-3 pt-3 pb-1 relative z-10 w-full flex-shrink-0">
           <button onClick={() => { audioSystem.playClick(); setShowSubjects(true); }}
             className="w-full flex items-center justify-between transition-all shadow-sm"
             style={{
                background: 'rgba(139, 92, 246, 0.12)', border: '1.5px solid rgba(139, 92, 246, 0.30)',
                borderRadius: '50px', padding: '10px 20px', color: 'white', fontWeight: 600, fontSize: '14px'
             }}>
             <span className="truncate pr-4">{subject}</span>
             <ChevronDown size={16} className="flex-shrink-0" />
           </button>
        </div>

        {/* Mobile Bottom Sheet for Subjects */}
        <AnimatePresence>
          {showSubjects && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="sm:hidden fixed inset-0 z-[998]"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                onClick={() => { setShowSubjects(false); setShowOtherInput(false); }}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="sm:hidden fixed bottom-0 left-0 right-0 z-[999] flex flex-col"
                style={{
                  background: '#1a1a2e',
                  borderRadius: '20px 20px 0 0',
                  borderTop: '1px solid rgba(139, 92, 246, 0.25)',
                  padding: '20px 16px',
                  maxHeight: '85vh',
                }}
              >
                <div style={{
                  width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)',
                  borderRadius: '2px', margin: '0 auto 16px'
                }} />
                
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pb-6">
                  {subjects.map(s => (
                    <button key={s} onClick={() => { audioSystem.playClick(); setSubject(s); setShowOtherInput(false); setShowSubjects(false); }}
                      className="w-full flex items-center justify-between transition-colors"
                      style={{
                        padding: '14px 16px', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', minHeight: '48px',
                        color: s === subject && !showOtherInput ? '#8B72FF' : 'rgba(255, 255, 255, 0.70)',
                        background: s === subject && !showOtherInput ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255,255,255,0.03)',
                      }}>
                      <span>{s}</span>
                      {s === subject && !showOtherInput && <Check size={18} className="text-primary" />}
                    </button>
                  ))}
                  
                  <button onClick={() => { audioSystem.playClick(); setShowOtherInput(true); }}
                      className="w-full flex items-center gap-3 transition-colors"
                      style={{
                        padding: '14px 16px', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', minHeight: '48px',
                        color: showOtherInput ? '#8B72FF' : 'rgba(255, 255, 255, 0.70)',
                        background: showOtherInput ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255,255,255,0.03)',
                      }}>
                      <PenLine size={18} /> <span>Other</span>
                  </button>

                  {showOtherInput && (
                    <div className="mt-2 flex flex-col gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
                      <input 
                        type="text"
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        placeholder="Type any subject or topic..."
                        className="focus:outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(139,92,246,0.35)',
                          borderRadius: '12px', padding: '10px 16px', color: 'white', fontSize: '14px', width: '100%'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(139,92,246,0.70)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(139,92,246,0.35)'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button onClick={() => { if(customInput.trim()){ setSubject(customInput.trim()); setShowOtherInput(false); setShowSubjects(false); setCustomInput(''); } }} 
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-glow-primary">
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 pb-[80px] sm:pb-6 space-y-4 sm:space-y-6 custom-scrollbar relative z-0">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                className={`flex gap-2 sm:gap-4 ${msg.role==='user' ? 'justify-end' : ''} ${msg.role==='user' ? 'ml-auto' : ''} max-w-full sm:max-w-3xl w-full`}>
                {msg.role==='assistant' && (
                  <div className="flex items-center justify-center flex-shrink-0 mt-1 w-7 h-7 sm:w-auto sm:h-auto">
                    <BrainNexLogo size="sm" iconOnly />
                  </div>
                )}
                <div className={`px-3 sm:px-5 py-3 sm:py-4 text-[14px] sm:text-sm leading-relaxed shadow-sm ${
                  msg.role==='user'
                    ? 'text-white bg-gradient-to-br from-primary to-cyan max-w-[88vw] sm:max-w-xl'
                    : 'chat-prose text-white/80 max-w-[88vw] sm:max-w-xl'
                }`}
                style={{
                  borderRadius: '16px',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                  borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                  ...(msg.role === 'assistant' ? { background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(139, 92, 246, 0.15)' } : { border: 'none' })
                }}>
                  {msg.role==='assistant'
                    ? <div dangerouslySetInnerHTML={{ __html:formatMsg(msg.content) }} />
                    : msg.content}
                </div>
                {msg.role==='user' && (
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-1 bg-gradient-to-br from-primary to-cyan shadow-sm border-none">
                    {(user?.displayName||'U')[0].toUpperCase()}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="flex gap-4">
              <div className="flex items-center justify-center flex-shrink-0 w-7 h-7 sm:w-auto sm:h-auto mt-1">
                <BrainNexLogo size="sm" iconOnly />
              </div>
              <div className="px-5 py-4 shadow-sm flex items-center" style={{ borderRadius: '16px', borderTopLeftRadius: '4px', background:'rgba(255, 255, 255, 0.04)', border:'1px solid rgba(139, 92, 246, 0.15)' }}>
                <div className="flex gap-1.5"><div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"/><div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay:'0.15s'}}/><div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay:'0.3s'}}/></div>
              </div>
            </motion.div>
          )}
          <div ref={msgEnd} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && (
          <div className="px-3 sm:px-6 pb-2 sm:pb-3 flex overflow-x-auto custom-scrollbar-hide gap-2 relative z-10 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.custom-scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
            {quickPrompts.map(p => (
              <button key={p} onClick={() => { audioSystem.playClick(); setInput(p); }}
                className="whitespace-nowrap text-[13px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 transition-all shadow-sm flex-shrink-0"
                style={{
                  background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.20)',
                  borderRadius: '50px', color: 'rgba(255, 255, 255, 0.70)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.18)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.45)'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)'; e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.20)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.70)'; }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="sm:relative fixed bottom-0 left-0 right-0 px-3 sm:px-6 py-3 sm:py-5 flex-shrink-0 z-20 bg-[#0d0d1a] border-t border-white/5 sm:border-none" style={{ minHeight: '56px' }}>
          {listening && (
            <p className="text-xs font-bold mb-2 sm:mb-3 flex items-center gap-2 animate-pulse text-amber-500 uppercase tracking-widest">
              <Mic size={14} /> {junior ? '🎤 Listening!' : 'Listening...'}
            </p>
          )}
          <div className="flex gap-2 sm:gap-3 items-end">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.50)'; e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.12)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.target.style.boxShadow = 'none'; }}
              placeholder={junior ? `Ask me anything! 😊` : `Ask about ${subject}...`}
              rows={1} className="flex-1 resize-none max-h-24 overflow-y-auto px-3 sm:px-4 py-3 sm:py-3.5 text-[16px] sm:text-sm text-white placeholder-white/30 focus:outline-none transition-all"
              style={{ lineHeight:'1.5', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px' }} />

            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              onClick={listening ? () => { recogRef.current?.stop(); setListening(false); } : startListening}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${
                listening ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-white/50 hover:text-white'
              }`}
              style={!listening ? { background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px' } : { borderRadius: '14px' }}>
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </motion.button>

            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              onClick={send} disabled={!input.trim() || loading}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 disabled:opacity-40 bg-primary shadow-glow-primary text-white border-none"
              style={{ borderRadius: '14px' }}>
              <Send size={16} />
            </motion.button>
          </div>
          <p className="hidden sm:block" style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.20)', letterSpacing: '1px', textAlign: 'center', padding: '8px' }}>
            Powered By BrainNex · {junior ? 'Specially designed for young learners 🌟' : 'Responses may not always be perfect'}
          </p>
        </div>
      </div>
    </div>
  );
}

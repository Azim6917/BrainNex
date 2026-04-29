import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, RefreshCw, ChevronDown, Clock, Trash2, Plus } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { useAuth }     from '../context/AuthContext';
import { useTheme }    from '../context/ThemeContext';
import { chatWithAI }  from '../utils/api';
import { audioSystem } from '../utils/audio';
import toast from 'react-hot-toast';

/* ── Subjects differ by grade ── */
const JUNIOR_SUBJECTS  = ['Maths','Science','English','Social Studies','Art','Music'];
const SENIOR_SUBJECTS  = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Geography','Literature','Economics','Psychology'];

function isJunior(grade) {
  return ['Class 1','Class 2','Class 3','Class 4','Class 5'].includes(grade);
}
function isMiddle(grade) {
  return ['Class 6','Class 7','Class 8'].includes(grade);
}

/* ── Chat history (localStorage) ── */
const HIST_KEY = uid => `bn-chat-hist-${uid}`;
function loadSessions(uid) { try { return JSON.parse(localStorage.getItem(HIST_KEY(uid))||'[]'); } catch { return []; } }
function saveSessions(uid, s) { try { localStorage.setItem(HIST_KEY(uid), JSON.stringify(s.slice(-20))); } catch {} }

/* ── Markdown formatter ── */
function formatMsg(text) {
  return text
    .replace(/```([\s\S]*?)```/g, '<pre className="bg-space-900 border border-border p-3 rounded-xl overflow-x-auto text-xs my-2 font-mono"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-primary">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong className="font-bold text-txt">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em className="italic">$1</em>')
    .replace(/^- (.+)/gm, '<li className="ml-4 list-disc marker:text-primary">$1</li>')
    .replace(/(<li className="ml-4 list-disc marker:text-primary">[\s\S]*?<\/li>)/g, '<ul className="my-2 space-y-1">$1</ul>')
    .replace(/\n\n/g, '</p><p className="my-2">')
    .replace(/\n/g, '<br/>')
    .replace(/^(.+)$/, '<p className="my-1">$1</p>');
}

/* ── Greeting based on grade ── */
function getGreeting(grade, name) {
  if (isJunior(grade)) {
    const firstName = (name||'friend').split(' ')[0];
    return `Hi ${firstName}! 👋 I'm Nex, your super friendly learning buddy! 🌟\n\nI'm here to help you learn cool things about **${grade}** subjects! What would you like to learn today? You can ask me anything! 😊`;
  }
  if (isMiddle(grade)) {
    return `Hey! I'm **Nex**, your AI tutor 🧠\n\nI'm here to help you understand concepts, solve problems, or quiz you on any topic. What are we studying today?`;
  }
  return `Hey! I'm **Nex**, your personal AI tutor 🧠\n\nI can explain concepts, solve problems, or quiz you on any topic. What subject are we tackling today?`;
}

export default function ChatTutorPage() {
  const { user }     = useAuth();
  const { profile }  = useUserData();
  const { kidMode }  = useTheme();

  const grade    = profile?.grade    || '';
  const junior   = isJunior(grade) || kidMode;
  const subjects = junior ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS;

  const [sessions,      setSessions]      = useState(() => loadSessions(user?.uid));
  const [activeSession, setActiveSession] = useState(null);
  const [messages,      setMessages]      = useState([{
    role:'assistant',
    content: getGreeting(grade, user?.displayName)
  }]);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [subject,      setSubject]      = useState(subjects[0]);
  const [showSubjects, setShowSubjects] = useState(false);
  const [listening,    setListening]    = useState(false);
  const [showHistory,  setShowHistory]  = useState(true);
  const msgEnd      = useRef(null);
  const recogRef    = useRef(null);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  /* Save sessions on message update */
  useEffect(() => {
    if (!user?.uid || messages.length <= 1) return;
    const title = messages.find(m => m.role==='user')?.content?.substring(0,40) || 'New Chat';
    setSessions(prev => {
      let updated;
      if (activeSession) {
        updated = prev.map(s => s.id===activeSession ? { ...s, messages, title } : s);
      } else {
        const id = Date.now().toString();
        setActiveSession(id);
        updated = [{ id, title, subject, messages, grade, createdAt:new Date().toISOString() }, ...prev];
      }
      saveSessions(user.uid, updated);
      return updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  /* Voice */
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice not supported in this browser'); return; }
    const r = new SR();
    r.lang = 'en-IN';
    r.onstart  = () => setListening(true);
    r.onresult = e => { setInput(e.results[0][0].transcript); setListening(false); };
    r.onerror  = () => { setListening(false); };
    r.onend    = () => setListening(false);
    recogRef.current = r;
    r.start();
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role:'user', content:input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    audioSystem.playClick(); // Equivalent to playMessageSend if distinct not available
    try {
      const history = [...messages, userMsg].slice(-10).map(m => ({ role:m.role, content:m.content }));
      const res = await chatWithAI(history, subject, profile?.currentDifficulty||'intermediate', grade);
      setMessages(m => [...m, { role:'assistant', content:res.data.content }]);
    } catch {
      toast.error('AI unavailable. Is the backend server running?');
      setMessages(m => m.slice(0,-1));
    } finally { setLoading(false); }
  };

  const newChat = () => {
    audioSystem.playClick();
    setActiveSession(null);
    setMessages([{ role:'assistant', content:getGreeting(grade, user?.displayName) }]);
  };

  const loadSession = s => {
    audioSystem.playClick();
    setActiveSession(s.id);
    setMessages(s.messages);
    setSubject(s.subject || subjects[0]);
  };

  const deleteSession = (e, id) => {
    e.stopPropagation(); audioSystem.playClick();
    setSessions(prev => { const u=prev.filter(s=>s.id!==id); saveSessions(user?.uid,u); return u; });
    if (activeSession===id) newChat();
  };

  /* Quick prompts vary by grade */
  const quickPrompts = junior
    ? [`What is ${subject}?`, `Tell me something cool about ${subject}!`, `Can you teach me something easy?`, `Can you make a quiz for me? 🎮`]
    : [`Explain the basics of ${subject}`, `Quiz me on ${subject}`, `Give me a practice problem`, `What are common mistakes in ${subject}?`];

  return (
    <div className="h-full min-h-[calc(100vh-2rem)] m-4 flex overflow-hidden rounded-3xl border border-border shadow-2xl glass-card">

      {/* ── History sidebar ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width:0, opacity:0 }} animate={{ width:260, opacity:1 }} exit={{ width:0, opacity:0 }}
            className="flex-shrink-0 flex flex-col overflow-hidden border-r border-border bg-space-900/50 backdrop-blur-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-txt2">
                <Clock size={14} /> History
              </span>
              <button onClick={newChat}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
              {sessions.length===0 ? (
                <div className="text-center py-10 px-6">
                  <Clock size={24} className="mx-auto mb-3 text-txt3 opacity-50" />
                  <p className="text-xs text-txt3 font-medium">Chat history appears here after your first conversation.</p>
                </div>
              ) : sessions.map(s => (
                <div key={s.id} onClick={() => loadSession(s)}
                  className={`group flex items-center justify-between px-5 py-3 cursor-pointer transition-all border-l-2
                    ${activeSession===s.id ? 'bg-primary/10 border-primary shadow-inner' : 'border-transparent hover:bg-white/5'}`}>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className={`text-sm font-semibold truncate mb-0.5 ${activeSession===s.id ? 'text-primary' : 'text-txt2 group-hover:text-txt'}`}>
                      {s.title||'Chat'}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-txt3 truncate">{s.subject}</p>
                  </div>
                  <button onClick={e => deleteSession(e,s.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-red-500/10 text-txt3 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main chat ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-space-dark/40 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-space-800/80 backdrop-blur-md flex-shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => { audioSystem.playClick(); setShowHistory(h=>!h); }}
              className="p-2 rounded-xl bg-space-900 border border-border hover:border-white/20 transition-all text-txt3 hover:text-txt shadow-sm">
              <Clock size={16} />
            </button>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-primary/20 text-primary shadow-sm border border-primary/30">
              {junior ? '🐙' : '🧠'}
            </div>
            <div>
              <p className="font-jakarta font-black text-base text-txt tracking-tight">
                {junior ? 'Nex — Your Learning Buddy! 🌟' : 'Nex AI Tutor'}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-500 uppercase tracking-widest mt-0.5">
                <span className="w-2 h-2 rounded-full animate-blink bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Online · {subject}
                {grade && <span className="text-txt3">· {grade}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Subject picker */}
            <div className="relative">
              <button onClick={() => { audioSystem.playClick(); setShowSubjects(!showSubjects); }}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-all bg-space-900 border-border text-txt2 hover:border-white/20 shadow-sm">
                {subject} <ChevronDown size={14} className={`text-txt3 transition-transform ${showSubjects ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showSubjects && (
                  <motion.div initial={{ opacity:0, y:4, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:4, scale:0.95 }}
                    transition={{ duration:0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl py-2 z-50 shadow-2xl border border-border bg-space-800 max-h-64 overflow-y-auto custom-scrollbar">
                    {subjects.map(s => (
                      <button key={s} onClick={() => { audioSystem.playClick(); setSubject(s); setShowSubjects(false); }}
                        className={`w-full text-left px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/5
                          ${s===subject ? 'text-primary bg-primary/5' : 'text-txt2'}`}>
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={newChat}
              className="p-2.5 rounded-xl border transition-all bg-space-900 border-border text-txt3 hover:border-white/20 hover:text-txt shadow-sm">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar relative z-0">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                className={`flex gap-4 ${msg.role==='user' ? 'justify-end' : ''} max-w-3xl ${msg.role==='user' ? 'ml-auto' : ''}`}>
                {msg.role==='assistant' && (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-1 bg-primary/20 text-primary shadow-sm border border-primary/30">
                    {junior ? '🐙' : '🧠'}
                  </div>
                )}
                <div className={`px-5 py-4 text-sm leading-relaxed max-w-xl shadow-sm ${
                  msg.role==='user' 
                    ? 'text-white rounded-2xl rounded-tr-sm bg-primary border border-primary-light/50' 
                    : 'rounded-2xl rounded-tl-sm chat-prose bg-space-800 border border-border text-txt2'
                }`}>
                  {msg.role==='assistant'
                    ? <div dangerouslySetInnerHTML={{ __html:formatMsg(msg.content) }} />
                    : msg.content}
                </div>
                {msg.role==='user' && (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-1 bg-gradient-to-br from-primary to-cyan shadow-sm">
                    {(user?.displayName||'U')[0].toUpperCase()}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="flex gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 bg-primary/20 text-primary shadow-sm border border-primary/30">
                {junior ? '🐙' : '🧠'}
              </div>
              <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-space-800 border border-border shadow-sm flex items-center">
                <div className="flex gap-1.5"><div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"/><div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay:'0.15s'}}/><div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay:'0.3s'}}/></div>
              </div>
            </motion.div>
          )}
          <div ref={msgEnd} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && (
          <div className="px-6 pb-3 flex flex-wrap gap-2.5 relative z-10">
            {quickPrompts.map(p => (
              <button key={p} onClick={() => { audioSystem.playClick(); setInput(p); }}
                className="text-xs font-bold px-4 py-2 rounded-full border transition-all bg-space-800 border-border text-txt3 hover:border-white/20 hover:text-txt2 shadow-sm">
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-5 border-t border-border bg-space-800/90 backdrop-blur-md flex-shrink-0 relative z-10">
          {listening && (
            <p className="text-xs font-bold mb-3 flex items-center gap-2 animate-pulse text-amber-500 uppercase tracking-widest">
              <Mic size={14} /> {junior ? '🎤 Speak now, I\'m listening!' : 'Listening...'}
            </p>
          )}
          <div className="flex gap-3 items-end">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
              placeholder={junior ? `Ask me anything about ${subject}! 😊` : `Ask about ${subject}... (Enter to send)`}
              rows={1} className="input-field flex-1 resize-none max-h-32 overflow-y-auto py-3.5" style={{ lineHeight:'1.5' }} />
            
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale:0.95 }}
              onClick={listening ? () => { recogRef.current?.stop(); setListening(false); } : startListening}
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${
                listening ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-space-900 border border-border text-txt3 hover:text-txt'
              }`}>
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </motion.button>
            
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              onClick={send} disabled={!input.trim()||loading}
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 btn-primary shadow-glow-primary">
              <Send size={18} />
            </motion.button>
          </div>
          <p className="text-[10px] font-bold text-center mt-3 text-txt3 uppercase tracking-widest">
            Powered By BrainNex · {junior ? 'Specially designed for young learners 🌟' : 'Responses may not always be perfect'}
          </p>
        </div>
      </div>
    </div>
  );
}

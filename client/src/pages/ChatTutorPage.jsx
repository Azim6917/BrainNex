import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, RefreshCw, ChevronDown, Clock, Trash2, Plus } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { useAuth }     from '../context/AuthContext';
import { useTheme }    from '../context/ThemeContext';
import { chatWithAI }  from '../utils/api';
import { playClick, playMessageSend } from '../utils/soundEffects';
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
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(.+)$/, '<p>$1</p>');
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
    playMessageSend();
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
    playClick();
    setActiveSession(null);
    setMessages([{ role:'assistant', content:getGreeting(grade, user?.displayName) }]);
  };

  const loadSession = s => {
    playClick();
    setActiveSession(s.id);
    setMessages(s.messages);
    setSubject(s.subject || subjects[0]);
  };

  const deleteSession = (e, id) => {
    e.stopPropagation(); playClick();
    setSessions(prev => { const u=prev.filter(s=>s.id!==id); saveSessions(user?.uid,u); return u; });
    if (activeSession===id) newChat();
  };

  /* Quick prompts vary by grade */
  const quickPrompts = junior
    ? [`What is ${subject}?`, `Tell me something cool about ${subject}!`, `Can you teach me something easy?`, `Can you make a quiz for me? 🎮`]
    : [`Explain the basics of ${subject}`, `Quiz me on ${subject}`, `Give me a practice problem`, `What are common mistakes in ${subject}?`];

  return (
    <div className="h-screen flex overflow-hidden" style={{ background:'var(--bg)' }}>

      {/* ── History sidebar ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width:0, opacity:0 }} animate={{ width:220, opacity:1 }} exit={{ width:0, opacity:0 }}
            className="flex-shrink-0 flex flex-col overflow-hidden border-r"
            style={{ width:220, background:'var(--bg)', borderColor:'var(--border)' }}>
            <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor:'var(--border)' }}>
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color:'var(--txt2)' }}>
                <Clock size={12} /> History
              </span>
              <button onClick={newChat}
                className="text-xs flex items-center gap-1 font-semibold" style={{ color:'var(--cyan)' }}>
                <Plus size={12} /> New
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {sessions.length===0 ? (
                <p className="text-center py-8 text-xs px-4" style={{ color:'var(--txt3)' }}>
                  Chat history appears here after your first conversation.
                </p>
              ) : sessions.map(s => (
                <div key={s.id} onClick={() => loadSession(s)}
                  className="group flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors"
                  style={{ background: activeSession===s.id ? 'var(--cyan-bg)' : 'transparent',
                           borderLeft: activeSession===s.id ? '2px solid var(--cyan)' : '2px solid transparent' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: activeSession===s.id ? 'var(--cyan)' : 'var(--txt2)' }}>
                      {s.title||'Chat'}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color:'var(--txt3)' }}>{s.subject}</p>
                  </div>
                  <button onClick={e => deleteSession(e,s.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    style={{ color:'var(--txt3)' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main chat ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => { playClick(); setShowHistory(h=>!h); }}
              className="p-1.5 rounded-lg transition-colors" style={{ color:'var(--txt3)' }}>
              <Clock size={15} />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background:'linear-gradient(135deg,var(--cyan-bg),rgba(167,139,250,0.15))', border:'1px solid var(--cyan-bdr)' }}>
              {junior ? '🐙' : '🧠'}
            </div>
            <div>
              <p className="font-syne font-bold text-sm" style={{ color:'var(--txt)' }}>
                {junior ? 'Nex — Your Learning Buddy! 🌟' : 'Nex AI Tutor'}
              </p>
              <div className="flex items-center gap-1.5 text-xs" style={{ color:'var(--green)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background:'var(--green)' }} />
                Online · {subject}
                {grade && <span style={{ color:'var(--txt3)' }}>· {grade}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Subject picker */}
            <div className="relative">
              <button onClick={() => { playClick(); setShowSubjects(!showSubjects); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all"
                style={{ background:'var(--card)', borderColor:'var(--border2)', color:'var(--txt2)' }}>
                {subject} <ChevronDown size={11} className={showSubjects ? 'rotate-180' : ''} />
              </button>
              <AnimatePresence>
                {showSubjects && (
                  <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:4 }}
                    className="absolute right-0 top-full mt-1 w-48 rounded-xl py-1 z-50 shadow-2xl border max-h-56 overflow-y-auto"
                    style={{ background:'var(--bg3)', borderColor:'var(--border2)' }}>
                    {subjects.map(s => (
                      <button key={s} onClick={() => { playClick(); setSubject(s); setShowSubjects(false); }}
                        className="w-full text-left px-4 py-2 text-xs transition-colors hover:opacity-80"
                        style={{ color: s===subject ? 'var(--cyan)' : 'var(--txt2)', background: s===subject ? 'var(--cyan-bg)' : 'transparent' }}>
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={newChat}
              className="p-2 rounded-xl border transition-all"
              style={{ background:'var(--card)', borderColor:'var(--border)', color:'var(--txt3)' }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                className={`flex gap-3 ${msg.role==='user' ? 'justify-end' : ''} max-w-2xl ${msg.role==='user' ? 'ml-auto' : ''}`}>
                {msg.role==='assistant' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                    style={{ background:'linear-gradient(135deg,var(--cyan-bg),rgba(167,139,250,0.15))', border:'1px solid var(--cyan-bdr)' }}>
                    {junior ? '🐙' : '🧠'}
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-md ${
                  msg.role==='user' ? 'text-white rounded-br-sm' : 'rounded-bl-sm chat-prose'
                }`}
                  style={msg.role==='user'
                    ? { background:'var(--cyan)' }
                    : { background:'var(--card)', border:'1px solid var(--border)', color:'var(--txt)' }}>
                  {msg.role==='assistant'
                    ? <div dangerouslySetInnerHTML={{ __html:formatMsg(msg.content) }} />
                    : msg.content}
                </div>
                {msg.role==='user' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background:'linear-gradient(135deg,var(--violet),var(--cyan))' }}>
                    {(user?.displayName||'U')[0].toUpperCase()}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                style={{ background:'var(--card)', border:'1px solid var(--border)' }}>
                {junior ? '🐙' : '🧠'}
              </div>
              <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm" style={{ background:'var(--card)', border:'1px solid var(--border)' }}>
                <div className="flex gap-1.5"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
              </div>
            </motion.div>
          )}
          <div ref={msgEnd} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {quickPrompts.map(p => (
              <button key={p} onClick={() => { playClick(); setInput(p); }}
                className="text-xs px-3 py-1.5 rounded-full border transition-all"
                style={{ background:'var(--card)', borderColor:'var(--border2)', color:'var(--txt2)' }}>
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 border-t flex-shrink-0"
          style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
          {listening && (
            <p className="text-xs mb-2 flex items-center gap-1.5 animate-pulse" style={{ color:'var(--amber)' }}>
              <Mic size={12} /> {junior ? '🎤 Speak now, I\'m listening!' : 'Listening...'}
            </p>
          )}
          <div className="flex gap-2 items-end">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
              placeholder={junior ? `Ask me anything about ${subject}! 😊` : `Ask about ${subject}... (Enter to send)`}
              rows={1} className="input-dark flex-1 resize-none max-h-28 overflow-y-auto" style={{ lineHeight:'1.5', paddingTop:10 }} />
            <motion.button whileTap={{ scale:0.92 }}
              onClick={listening ? () => { recogRef.current?.stop(); setListening(false); } : startListening}
              className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 transition-all"
              style={listening
                ? { background:'#ef4444', color:'#fff', border:'none' }
                : { background:'var(--card)', borderColor:'var(--border2)', color:'var(--txt3)' }}>
              {listening ? <MicOff size={15} /> : <Mic size={15} />}
            </motion.button>
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }}
              onClick={send} disabled={!input.trim()||loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
              style={{ background:'var(--cyan)', color:'#fff' }}>
              <Send size={15} />
            </motion.button>
          </div>
          <p className="text-[10px] text-center mt-2" style={{ color:'var(--txt3)' }}>
            Powered by Claude AI · {junior ? 'Specially designed for young learners 🌟' : 'Responses may not always be perfect'}
          </p>
        </div>
      </div>
    </div>
  );
}

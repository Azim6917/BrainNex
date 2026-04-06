// import React, { useState, useRef, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Send, Mic, MicOff, RefreshCw, ChevronDown } from 'lucide-react';
// import { useUserData } from '../context/UserDataContext';
// import { chatWithAI } from '../utils/api';
// import toast from 'react-hot-toast';

// const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Geography', 'Literature', 'Economics'];

// function formatMessage(text) {
//   // Convert markdown-ish text to HTML
//   let html = text
//     .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
//     .replace(/`([^`]+)`/g, '<code>$1</code>')
//     .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
//     .replace(/\*([^*]+)\*/g, '<em>$1</em>')
//     .replace(/^- (.+)/gm, '<li>$1</li>')
//     .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
//     .replace(/\n\n/g, '</p><p>')
//     .replace(/\n/g, '<br/>');
//   return `<p>${html}</p>`;
// }

// export default function ChatTutorPage() {
//   const { profile } = useUserData();
//   const [messages, setMessages]   = useState([
//     { role: 'assistant', content: `Hey! I'm **Nex**, your personal AI tutor 🧠\n\nI can help you understand any concept, solve problems, or quiz you on any topic. What subject are we tackling today?` }
//   ]);
//   const [input, setInput]         = useState('');
//   const [loading, setLoading]     = useState(false);
//   const [subject, setSubject]     = useState(SUBJECTS[0]);
//   const [listening, setListening] = useState(false);
//   const [showSubjects, setShowSubjects] = useState(false);
//   const messagesEndRef = useRef(null);
//   const recognitionRef = useRef(null);

//   useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

//   /* ── Voice Q&A ── */
//   const startListening = () => {
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) { toast.error('Voice input not supported in this browser.'); return; }
//     const recognition = new SpeechRecognition();
//     recognition.lang = 'en-IN';
//     recognition.continuous = false;
//     recognition.interimResults = false;
//     recognition.onstart  = () => setListening(true);
//     recognition.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
//     recognition.onerror  = () => { setListening(false); toast.error('Voice input failed. Try again.'); };
//     recognition.onend    = () => setListening(false);
//     recognitionRef.current = recognition;
//     recognition.start();
//   };

//   const stopListening = () => {
//     recognitionRef.current?.stop();
//     setListening(false);
//   };

//   const sendMessage = async () => {
//     if (!input.trim() || loading) return;
//     const userMsg = { role: 'user', content: input.trim() };
//     setMessages(m => [...m, userMsg]);
//     setInput('');
//     setLoading(true);

//     try {
//       const history = [...messages, userMsg].slice(-12).map(m => ({
//         role: m.role === 'assistant' ? 'assistant' : 'user',
//         content: m.content,
//       }));
//       const res = await chatWithAI(history, subject, profile?.currentDifficulty || 'intermediate');
//       setMessages(m => [...m, { role: 'assistant', content: res.data.content }]);
//     } catch (err) {
//       toast.error('AI response failed. Please try again.');
//       setMessages(m => m.slice(0, -1));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const clearChat = () => {
//     setMessages([{ role: 'assistant', content: `Chat cleared! I'm ready for a new topic. What would you like to learn about ${subject}?` }]);
//   };

//   const quickPrompts = [
//     `Explain the basics of ${subject}`,
//     `Quiz me on ${subject}`,
//     `Give me a practice problem`,
//     `What are common mistakes in ${subject}?`,
//   ];

//   return (
//     <div className="h-screen flex flex-col">
//       {/* Top bar */}
//       <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg2">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-violet-500 flex items-center justify-center text-xl">🧠</div>
//           <div>
//             <p className="font-syne font-bold">Nex AI Tutor</p>
//             <div className="flex items-center gap-1.5 text-xs text-neon-green">
//               <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink" />
//               Online · {subject}
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center gap-3">
//           {/* Subject picker */}
//           <div className="relative">
//             <button onClick={() => setShowSubjects(!showSubjects)}
//               className="flex items-center gap-2 glass border border-brand-border2 rounded-xl px-3 py-2 text-sm hover:bg-white/[0.06] transition-all">
//               {subject} <ChevronDown size={13} />
//             </button>
//             <AnimatePresence>
//               {showSubjects && (
//                 <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
//                   className="absolute right-0 top-full mt-1 w-48 bg-brand-bg3 border border-brand-border2 rounded-xl py-1 z-50 shadow-2xl">
//                   {SUBJECTS.map(s => (
//                     <button key={s} onClick={() => { setSubject(s); setShowSubjects(false); }}
//                       className={`w-full text-left px-4 py-2 text-sm hover:bg-white/[0.06] transition-colors ${s === subject ? 'text-cyan' : 'text-white/70'}`}>
//                       {s}
//                     </button>
//                   ))}
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//           <button onClick={clearChat} className="p-2 rounded-xl glass border border-brand-border hover:bg-white/[0.06] transition-all">
//             <RefreshCw size={15} className="text-white/40" />
//           </button>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
//         <AnimatePresence initial={false}>
//           {messages.map((msg, i) => (
//             <motion.div key={i}
//               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
//               className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-3xl ${msg.role === 'user' ? 'ml-auto' : ''}`}>
//               {msg.role === 'assistant' && (
//                 <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan to-violet-500 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">🧠</div>
//               )}
//               <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-lg ${
//                 msg.role === 'user'
//                   ? 'bg-cyan text-brand-bg font-medium rounded-br-sm'
//                   : 'bg-white/[0.06] border border-white/[0.08] text-white rounded-bl-sm chat-prose'
//               }`}>
//                 {msg.role === 'assistant'
//                   ? <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
//                   : msg.content}
//               </div>
//               {msg.role === 'user' && (
//                 <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan flex items-center justify-center text-xs font-bold text-brand-bg flex-shrink-0 mt-0.5">
//                   {(profile?.displayName || 'U')[0].toUpperCase()}
//                 </div>
//               )}
//             </motion.div>
//           ))}
//         </AnimatePresence>

//         {/* Typing indicator */}
//         {loading && (
//           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
//             <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan to-violet-500 flex items-center justify-center text-sm flex-shrink-0">🧠</div>
//             <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/[0.08]">
//               <div className="flex gap-1.5">
//                 <div className="typing-dot" />
//                 <div className="typing-dot" />
//                 <div className="typing-dot" />
//               </div>
//             </div>
//           </motion.div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Quick prompts (show only at start) */}
//       {messages.length <= 2 && (
//         <div className="px-6 pb-2 flex flex-wrap gap-2">
//           {quickPrompts.map(p => (
//             <button key={p} onClick={() => setInput(p)}
//               className="text-xs glass border border-brand-border2 rounded-full px-3 py-1.5 text-white/60 hover:text-white hover:border-white/20 transition-all">
//               {p}
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Input bar */}
//       <div className="px-6 py-4 border-t border-brand-border bg-brand-bg2">
//         {listening && (
//           <div className="flex items-center gap-2 text-xs text-neon-amber mb-2 animate-pulse">
//             <Mic size={12} /> Listening... speak now
//           </div>
//         )}
//         <div className="flex gap-3 items-end">
//           <textarea
//             value={input}
//             onChange={e => setInput(e.target.value)}
//             onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
//             placeholder={`Ask Nex anything about ${subject}... (Enter to send, Shift+Enter for new line)`}
//             rows={1}
//             className="input-dark flex-1 resize-none max-h-32 overflow-y-auto text-sm leading-relaxed py-3"
//             style={{ lineHeight: '1.5' }}
//           />
//           {/* Voice button */}
//           <motion.button
//             whileTap={{ scale: 0.92 }}
//             onClick={listening ? stopListening : startListening}
//             className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${listening ? 'bg-red-500 text-white animate-pulse' : 'glass border border-brand-border2 text-white/50 hover:text-white hover:border-white/20'}`}
//           >
//             {listening ? <MicOff size={16} /> : <Mic size={16} />}
//           </motion.button>
//           {/* Send button */}
//           <motion.button
//             whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
//             onClick={sendMessage}
//             disabled={!input.trim() || loading}
//             className="w-11 h-11 rounded-xl bg-cyan flex items-center justify-center text-brand-bg flex-shrink-0 disabled:opacity-40 transition-all"
//           >
//             <Send size={16} />
//           </motion.button>
//         </div>
//         <p className="text-xs text-white/20 mt-2 text-center">Powered by Claude AI · Responses may not always be perfect · Always verify important information</p>
//       </div>
//     </div>
//   );
// }


import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, RefreshCw, ChevronDown, Clock, Trash2, Plus } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { useAuth } from '../context/AuthContext';
import { chatWithAI } from '../utils/api';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Geography','Literature','Economics','Psychology'];

const STORAGE_KEY = (uid) => `brainnex-chat-history-${uid}`;
const MAX_SESSIONS = 20;  // keep last 20 sessions

function formatMessage(text) {
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

/* ── Load/save sessions from localStorage ── */
function loadSessions(uid) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(uid));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveSessions(uid, sessions) {
  try {
    localStorage.setItem(STORAGE_KEY(uid), JSON.stringify(sessions.slice(-MAX_SESSIONS)));
  } catch { /* storage full */ }
}

export default function ChatTutorPage() {
  const { user }    = useAuth();
  const { profile } = useUserData();

  /* sessions: [{id, title, subject, messages, createdAt}] */
  const [sessions,       setSessions]       = useState(() => loadSessions(user?.uid));
  const [activeSession,  setActiveSession]  = useState(null);  // session id
  const [messages,       setMessages]       = useState([{
    role: 'assistant',
    content: `Hey! I'm **Nex**, your personal AI tutor 🧠\n\nI can explain concepts, solve problems, or quiz you on any topic. What are we studying today?`
  }]);
  const [input,          setInput]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [subject,        setSubject]        = useState(SUBJECTS[0]);
  const [showSubjects,   setShowSubjects]   = useState(false);
  const [listening,      setListening]      = useState(false);
  const [showHistory,    setShowHistory]    = useState(true);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* Save current session whenever messages change */
  useEffect(() => {
    if (!user?.uid || messages.length <= 1) return;
    const title = messages.find(m => m.role === 'user')?.content?.substring(0, 40) || 'New Chat';

    setSessions(prev => {
      let updated;
      if (activeSession) {
        updated = prev.map(s => s.id === activeSession ? { ...s, messages, title } : s);
      } else {
        const newId = Date.now().toString();
        setActiveSession(newId);
        updated = [{ id: newId, title, subject, messages, createdAt: new Date().toISOString() }, ...prev];
      }
      saveSessions(user.uid, updated);
      return updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  /* Voice Q&A */
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice input not supported in this browser.'); return; }
    const r = new SR();
    r.lang = 'en-IN';
    r.onstart  = () => setListening(true);
    r.onresult = e => { setInput(e.results[0][0].transcript); setListening(false); };
    r.onerror  = () => { setListening(false); toast.error('Voice input failed.'); };
    r.onend    = () => setListening(false);
    recognitionRef.current = r;
    r.start();
  };
  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = [...messages, userMsg].slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
      const res = await chatWithAI(history, subject, profile?.currentDifficulty || 'intermediate');
      setMessages(m => [...m, { role: 'assistant', content: res.data.content }]);
    } catch {
      toast.error('AI response failed. Is the backend server running?');
      setMessages(m => m.slice(0, -1));
    } finally { setLoading(false); }
  };

  const startNewChat = () => {
    setActiveSession(null);
    setMessages([{ role: 'assistant', content: `Starting a fresh session! What topic in **${subject}** can I help you with?` }]);
  };

  const loadSession = (session) => {
    setActiveSession(session.id);
    setMessages(session.messages);
    setSubject(session.subject || SUBJECTS[0]);
  };

  const deleteSession = (e, sessionId) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveSessions(user?.uid, updated);
      return updated;
    });
    if (activeSession === sessionId) startNewChat();
  };

  const quickPrompts = [
    `Explain the basics of ${subject}`,
    `Quiz me on ${subject}`,
    `Give me a practice problem in ${subject}`,
    `What are common mistakes in ${subject}?`,
  ];

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── HISTORY SIDEBAR ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 bg-brand-bg border-r border-brand-border flex flex-col overflow-hidden"
            style={{ width: 240 }}>
            <div className="p-3 border-b border-brand-border flex items-center justify-between">
              <span className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                <Clock size={12} /> Chat History
              </span>
              <button onClick={startNewChat}
                className="flex items-center gap-1 text-xs text-cyan hover:text-cyan/80 transition-colors">
                <Plus size={13} /> New
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/20 px-4">
                  Your chat history will appear here after your first conversation.
                </div>
              ) : (
                sessions.map(s => (
                  <div key={s.id}
                    onClick={() => loadSession(s)}
                    className={`group flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors hover:bg-white/[0.04] ${activeSession === s.id ? 'bg-cyan/10 border-r-2 border-cyan' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${activeSession === s.id ? 'text-cyan' : 'text-white/70'}`}>
                        {s.title || 'Chat'}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {s.subject} · {s.messages?.length - 1 || 0} msgs
                      </p>
                    </div>
                    <button onClick={e => deleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-400 text-white/30">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CHAT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-brand-border bg-brand-bg2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHistory(h => !h)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white">
              <Clock size={15} />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00e5ff22, #a78bfa22)', border: '1px solid rgba(0,229,255,0.3)' }}>
              🧠
            </div>
            <div>
              <p className="font-syne font-bold text-sm">Nex AI Tutor</p>
              <div className="flex items-center gap-1.5 text-xs text-neon-green">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink" />
                Online · {subject}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Subject picker */}
            <div className="relative">
              <button onClick={() => setShowSubjects(!showSubjects)}
                className="flex items-center gap-2 glass border border-brand-border2 rounded-xl px-3 py-1.5 text-xs hover:bg-white/[0.06] transition-all">
                {subject} <ChevronDown size={11} className={showSubjects ? 'rotate-180' : ''} />
              </button>
              <AnimatePresence>
                {showSubjects && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute right-0 top-full mt-1 w-52 bg-brand-bg3 border border-brand-border2 rounded-xl py-1 z-50 shadow-2xl max-h-60 overflow-y-auto">
                    {SUBJECTS.map(s => (
                      <button key={s} onClick={() => { setSubject(s); setShowSubjects(false); }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-white/[0.06] transition-colors ${s === subject ? 'text-cyan' : 'text-white/70'}`}>
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={startNewChat}
              className="p-2 rounded-xl glass border border-brand-border hover:bg-white/[0.06] transition-all" title="New chat">
              <RefreshCw size={14} className="text-white/40" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-2xl ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #00e5ff22, #a78bfa22)', border: '1px solid rgba(0,229,255,0.2)' }}>
                    🧠
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-md ${
                  msg.role === 'user'
                    ? 'bg-cyan text-brand-bg font-medium rounded-br-sm'
                    : 'bg-white/[0.06] border border-white/[0.08] text-white rounded-bl-sm chat-prose'
                }`}>
                  {msg.role === 'assistant'
                    ? <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                    : msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-brand-bg flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #00e5ff)' }}>
                    {(profile?.displayName || user?.displayName || 'U')[0].toUpperCase()}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00e5ff22, #a78bfa22)', border: '1px solid rgba(0,229,255,0.2)' }}>
                🧠
              </div>
              <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/[0.08]">
                <div className="flex gap-1.5">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {quickPrompts.map(p => (
              <button key={p} onClick={() => setInput(p)}
                className="text-xs glass border border-brand-border2 rounded-full px-3 py-1.5 text-white/60 hover:text-white hover:border-white/20 transition-all">
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 border-t border-brand-border bg-brand-bg2 flex-shrink-0">
          {listening && (
            <div className="flex items-center gap-2 text-xs text-neon-amber mb-2 animate-pulse">
              <Mic size={12} /> Listening... speak now
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Ask about ${subject}... (Enter to send)`}
              rows={1} className="input-dark flex-1 resize-none max-h-28 overflow-y-auto text-sm py-3 leading-relaxed" />
            <motion.button whileTap={{ scale: 0.92 }}
              onClick={listening ? stopListening : startListening}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                listening ? 'bg-red-500 text-white animate-pulse' : 'glass border border-brand-border2 text-white/50 hover:text-white'}`}>
              {listening ? <MicOff size={15} /> : <Mic size={15} />}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
              onClick={sendMessage} disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-cyan flex items-center justify-center text-brand-bg flex-shrink-0 disabled:opacity-40 transition-all">
              <Send size={15} />
            </motion.button>
          </div>
          <p className="text-[10px] text-white/20 mt-2 text-center">
            Powered by Claude AI · Chat history saved locally on your device
          </p>
        </div>
      </div>
    </div>
  );
}

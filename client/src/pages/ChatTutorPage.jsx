import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, RefreshCw, ChevronDown } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';
import { chatWithAI } from '../utils/api';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Geography', 'Literature', 'Economics'];

function formatMessage(text) {
  // Convert markdown-ish text to HTML
  let html = text
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  return `<p>${html}</p>`;
}

export default function ChatTutorPage() {
  const { profile } = useUserData();
  const [messages, setMessages]   = useState([
    { role: 'assistant', content: `Hey! I'm **Nex**, your personal AI tutor 🧠\n\nI can help you understand any concept, solve problems, or quiz you on any topic. What subject are we tackling today?` }
  ]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [subject, setSubject]     = useState(SUBJECTS[0]);
  const [listening, setListening] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ── Voice Q&A ── */
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Voice input not supported in this browser.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart  = () => setListening(true);
    recognition.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    recognition.onerror  = () => { setListening(false); toast.error('Voice input failed. Try again.'); };
    recognition.onend    = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].slice(-12).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
      const res = await chatWithAI(history, subject, profile?.currentDifficulty || 'intermediate');
      setMessages(m => [...m, { role: 'assistant', content: res.data.content }]);
    } catch (err) {
      toast.error('AI response failed. Please try again.');
      setMessages(m => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: `Chat cleared! I'm ready for a new topic. What would you like to learn about ${subject}?` }]);
  };

  const quickPrompts = [
    `Explain the basics of ${subject}`,
    `Quiz me on ${subject}`,
    `Give me a practice problem`,
    `What are common mistakes in ${subject}?`,
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-violet-500 flex items-center justify-center text-xl">🧠</div>
          <div>
            <p className="font-syne font-bold">Nex AI Tutor</p>
            <div className="flex items-center gap-1.5 text-xs text-neon-green">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink" />
              Online · {subject}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Subject picker */}
          <div className="relative">
            <button onClick={() => setShowSubjects(!showSubjects)}
              className="flex items-center gap-2 glass border border-brand-border2 rounded-xl px-3 py-2 text-sm hover:bg-white/[0.06] transition-all">
              {subject} <ChevronDown size={13} />
            </button>
            <AnimatePresence>
              {showSubjects && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-brand-bg3 border border-brand-border2 rounded-xl py-1 z-50 shadow-2xl">
                  {SUBJECTS.map(s => (
                    <button key={s} onClick={() => { setSubject(s); setShowSubjects(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/[0.06] transition-colors ${s === subject ? 'text-cyan' : 'text-white/70'}`}>
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={clearChat} className="p-2 rounded-xl glass border border-brand-border hover:bg-white/[0.06] transition-all">
            <RefreshCw size={15} className="text-white/40" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-3xl ${msg.role === 'user' ? 'ml-auto' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan to-violet-500 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">🧠</div>
              )}
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-lg ${
                msg.role === 'user'
                  ? 'bg-cyan text-brand-bg font-medium rounded-br-sm'
                  : 'bg-white/[0.06] border border-white/[0.08] text-white rounded-bl-sm chat-prose'
              }`}>
                {msg.role === 'assistant'
                  ? <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  : msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan flex items-center justify-center text-xs font-bold text-brand-bg flex-shrink-0 mt-0.5">
                  {(profile?.displayName || 'U')[0].toUpperCase()}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan to-violet-500 flex items-center justify-center text-sm flex-shrink-0">🧠</div>
            <div className="px-4 py-3.5 rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/[0.08]">
              <div className="flex gap-1.5">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts (show only at start) */}
      {messages.length <= 2 && (
        <div className="px-6 pb-2 flex flex-wrap gap-2">
          {quickPrompts.map(p => (
            <button key={p} onClick={() => setInput(p)}
              className="text-xs glass border border-brand-border2 rounded-full px-3 py-1.5 text-white/60 hover:text-white hover:border-white/20 transition-all">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-brand-border bg-brand-bg2">
        {listening && (
          <div className="flex items-center gap-2 text-xs text-neon-amber mb-2 animate-pulse">
            <Mic size={12} /> Listening... speak now
          </div>
        )}
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={`Ask Nex anything about ${subject}... (Enter to send, Shift+Enter for new line)`}
            rows={1}
            className="input-dark flex-1 resize-none max-h-32 overflow-y-auto text-sm leading-relaxed py-3"
            style={{ lineHeight: '1.5' }}
          />
          {/* Voice button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={listening ? stopListening : startListening}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${listening ? 'bg-red-500 text-white animate-pulse' : 'glass border border-brand-border2 text-white/50 hover:text-white hover:border-white/20'}`}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </motion.button>
          {/* Send button */}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-cyan flex items-center justify-center text-brand-bg flex-shrink-0 disabled:opacity-40 transition-all"
          >
            <Send size={16} />
          </motion.button>
        </div>
        <p className="text-xs text-white/20 mt-2 text-center">Powered by Claude AI · Responses may not always be perfect · Always verify important information</p>
      </div>
    </div>
  );
}

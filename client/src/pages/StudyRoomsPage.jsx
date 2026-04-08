import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Send, LogOut, Plus, Trash2, FileQuestion,
  BookOpen, MessageCircle, Wifi, WifiOff, X, CheckCircle, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateQuiz } from '../utils/api';
import { playRoomJoin, playMessageSend, playCreate, playClick, playCorrect, playWrong, playQuizComplete } from '../utils/soundEffects';
import toast from 'react-hot-toast';

const SUBJECTS   = ['Mathematics','Physics','Chemistry','Biology','Computer Science','General','History','Economics'];
const ROOM_MSGS  = id => `bn-room-msgs-${id}`;
const ROOM_MAT   = id => `bn-room-mat-${id}`;
const CUSTOM_KEY = 'bn-custom-rooms';

const loadArr = key => { try { return JSON.parse(localStorage.getItem(key)||'[]'); } catch { return []; } };
const saveArr = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

const DEMO_ROOMS = [
  { id:'r-math', name:'Calculus Study Group',    subject:'Mathematics',      emoji:'🧮', count:4 },
  { id:'r-phys', name:'Physics Problem Solving', subject:'Physics',           emoji:'⚡', count:6 },
  { id:'r-cs',   name:'DSA & Algorithms',        subject:'Computer Science', emoji:'💻', count:3 },
  { id:'r-chem', name:'Organic Chemistry Help',  subject:'Chemistry',         emoji:'⚗️', count:2 },
];

function RoomCard({ room, onJoin, onDelete }) {
  return (
    <motion.div whileHover={{ y:-2 }}
      className="glass border border-brand-border rounded-2xl p-5 cursor-pointer hover:border-brand-border2 transition-all relative group"
      onClick={() => onJoin(room)}>
      {onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(room.id); }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center transition-opacity">
          <Trash2 size={11} />
        </button>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-xl">{room.emoji}</div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-neon-green/20 text-neon-green rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink" />Live
        </span>
      </div>
      <h3 className="font-syne font-bold text-sm mb-1 pr-6">{room.name}</h3>
      <p className="text-xs text-white/40 mb-3">{room.subject}</p>
      <div className="flex items-center justify-between text-xs text-white/30">
        <div className="flex items-center gap-1"><Users size={10} />{room.count}</div>
        <span className="text-cyan text-xs">Join →</span>
      </div>
    </motion.div>
  );
}

/* ── Group Quiz inside room ── */
function GroupQuiz({ room, user, onClose }) {
  const [phase,    setPhase]    = useState('setup');
  const [topic,    setTopic]    = useState('');
  const [quiz,     setQuiz]     = useState(null);
  const [current,  setCurrent]  = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers,  setAnswers]  = useState([]);
  const [loading,  setLoading]  = useState(false);

  const start = async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return; }
    setLoading(true);
    try {
      const res = await generateQuiz(room.subject, topic, 'intermediate', 5);
      setQuiz(res.data);
      setPhase('quiz');
    } catch { toast.error('Failed to generate quiz. Is the server running?'); }
    finally { setLoading(false); }
  };

  const pick = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === quiz.questions[current].correctIndex) playCorrect();
    else playWrong();
    setAnswers(a => [...a, { correct: i === quiz.questions[current].correctIndex }]);
  };

  const next = () => {
    playClick();
    if (current + 1 >= quiz.questions.length) {
      playQuizComplete();
      setPhase('results');
    } else {
      setSelected(null);
      setCurrent(c => c+1);
    }
  };

  const q    = quiz?.questions[current];
  const score = phase === 'results' ? Math.round((answers.filter(a=>a.correct).length / quiz.questions.length)*100) : 0;

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9 }}
        className="glass border border-brand-border2 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne font-bold text-lg flex items-center gap-2"><FileQuestion size={16} className="text-cyan" />Group Quiz — {room.name}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
        </div>

        {phase === 'setup' && (
          <div className="space-y-4">
            <p className="text-sm text-white/50">Generate a quiz for your study group on any topic in <span className="text-cyan">{room.subject}</span>.</p>
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key==='Enter'&&start()}
              placeholder={`Topic in ${room.subject}...`} className="input-dark w-full text-sm" autoFocus />
            <button onClick={start} disabled={loading} className="btn-cyan w-full py-3 text-sm disabled:opacity-50">
              {loading ? 'Generating...' : '🎮 Start Group Quiz'}
            </button>
          </div>
        )}

        {phase === 'quiz' && q && (
          <>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-cyan rounded-full transition-all" style={{ width:`${(current/quiz.questions.length)*100}%` }} />
            </div>
            <p className="text-xs text-cyan font-bold uppercase tracking-widest mb-2">Question {current+1}/{quiz.questions.length}</p>
            <p className="font-semibold text-base leading-relaxed mb-4">{q.question}</p>
            <div className="space-y-2.5 mb-4">
              {q.options.map((opt, i) => {
                let cls = 'border-brand-border text-white/70 hover:border-brand-border2';
                if (selected !== null) {
                  if (i===q.correctIndex)  cls='border-neon-green bg-neon-green/10 text-neon-green';
                  else if (i===selected)   cls='border-red-400 bg-red-500/10 text-red-400';
                  else                     cls='border-brand-border text-white/25 opacity-50';
                }
                return (
                  <button key={i} onClick={() => pick(i)} disabled={selected!==null}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${cls}`}>
                    <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">{['A','B','C','D'][i]}</span>
                    <span className="flex-1">{opt}</span>
                    {selected!==null && i===q.correctIndex && <CheckCircle size={14} className="flex-shrink-0" />}
                    {selected!==null && i===selected && i!==q.correctIndex && <XCircle size={14} className="flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <div className={`rounded-xl px-4 py-3 mb-4 text-xs ${selected===q.correctIndex?'bg-neon-green/10 text-neon-green':'bg-red-500/10 text-red-300'}`}>
                {q.explanation}
              </div>
            )}
            {selected !== null && (
              <button onClick={next} className="btn-cyan w-full py-3 text-sm">
                {current+1>=quiz.questions.length ? 'See Results →' : 'Next →'}
              </button>
            )}
          </>
        )}

        {phase === 'results' && (
          <div className="text-center">
            <div className="text-5xl mb-3">{score===100?'🏆':score>=80?'🎉':'📚'}</div>
            <h3 className="font-syne font-black text-4xl mb-1" style={{ color: score>=80?'#34d399':score>=60?'#00e5ff':'#ffb830' }}>{score}%</h3>
            <p className="text-white/40 text-sm mb-6">{answers.filter(a=>a.correct).length}/{quiz.questions.length} correct on {quiz.topic}</p>
            <div className="flex gap-3">
              <button onClick={() => { setPhase('setup'); setTopic(''); setAnswers([]); setCurrent(0); setSelected(null); }} className="flex-1 btn-outline py-2.5 text-sm">New Quiz</button>
              <button onClick={onClose} className="flex-1 btn-cyan py-2.5 text-sm">Close</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Study Material panel ── */
function MaterialPanel({ roomId }) {
  const [materials, setMaterials] = useState(() => loadArr(ROOM_MAT(roomId)));
  const [newMat, setNewMat] = useState({ title:'', content:'' });
  const [adding, setAdding] = useState(false);

  const save = () => {
    if (!newMat.title.trim() || !newMat.content.trim()) { toast.error('Fill in both fields'); return; }
    playCreate();
    const updated = [{ id:Date.now(), ...newMat, addedAt:new Date().toISOString() }, ...materials];
    setMaterials(updated); saveArr(ROOM_MAT(roomId), updated);
    setNewMat({ title:'', content:'' }); setAdding(false);
    toast.success('Material added!');
  };

  const del = (id) => { playClick(); const u = materials.filter(m=>m.id!==id); setMaterials(u); saveArr(ROOM_MAT(roomId), u); };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border flex-shrink-0">
        <h3 className="font-syne font-bold text-sm flex items-center gap-2"><BookOpen size={14} className="text-violet-400" />Study Material</h3>
        <button onClick={() => setAdding(!adding)} className="text-xs text-cyan hover:underline">+ Add</button>
      </div>

      {adding && (
        <div className="px-4 py-3 border-b border-brand-border bg-violet-500/5">
          <input value={newMat.title} onChange={e => setNewMat(m=>({...m,title:e.target.value}))}
            placeholder="Title (e.g. Newton's Laws Summary)" className="input-dark w-full text-xs mb-2" />
          <textarea value={newMat.content} onChange={e => setNewMat(m=>({...m,content:e.target.value}))}
            placeholder="Add notes, formulas, key points..." rows={3}
            className="input-dark w-full text-xs resize-none mb-2" />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 btn-outline py-1.5 text-xs">Cancel</button>
            <button onClick={save} className="flex-1 btn-cyan py-1.5 text-xs">Save</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {materials.length === 0 ? (
          <div className="text-center py-8 text-white/25 text-xs">
            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
            No study material yet. Add notes, formulas, or summaries for your group!
          </div>
        ) : (
          materials.map(m => (
            <div key={m.id} className="glass border border-brand-border rounded-xl p-3 group relative">
              <button onClick={() => del(m.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-5 h-5 rounded bg-red-500/20 text-red-400 flex items-center justify-center transition-opacity">
                <X size={10} />
              </button>
              <p className="font-semibold text-xs text-violet-400 mb-1 pr-5">{m.title}</p>
              <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">{m.content}</p>
              <p className="text-[9px] text-white/20 mt-2">{new Date(m.addedAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function StudyRoomsPage() {
  const { user } = useAuth();
  const [phase,       setPhase]       = useState('browse');
  const [room,        setRoom]        = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [createOpen,  setCreateOpen]  = useState(false);
  const [newRoom,     setNewRoom]     = useState({ name:'', subject:SUBJECTS[0] });
  const [customRooms, setCustomRooms] = useState(() => loadArr(CUSTOM_KEY));
  const [activeTab,   setActiveTab]   = useState('chat'); // chat | material
  const [groupQuizOpen, setGroupQuizOpen] = useState(false);
  const [socketOk,    setSocketOk]    = useState(false);
  const msgEnd  = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const joinRoom = (r) => {
    const persisted = loadArr(ROOM_MSGS(r.id));
    const joinMsg   = { system:true, text:`You joined "${r.name}". ${persisted.length} previous messages loaded.`, ts:new Date().toISOString() };
    setMessages([...persisted, joinMsg]);
    setRoom(r);
    setPhase('room');
    playRoomJoin();

    // Try socket
    import('socket.io-client').then(({ io }) => {
      const s = io('http://localhost:5000', { transports:['websocket','polling'], timeout:2500, reconnectionAttempts:1 });
      s.on('connect', () => { setSocketOk(true); s.emit('join-room', { roomId:r.id, roomName:r.name, subject:r.subject, uid:user.uid, displayName:user.displayName||'Student' }); });
      s.on('new-message', d => { setMessages(m => { const u=[...m,d]; saveArr(ROOM_MSGS(r.id),u); return u; }); });
      s.on('user-joined', d => addSys(r.id, d.message));
      s.on('user-left',   d => addSys(r.id, d.message));
      s.on('connect_error', () => setSocketOk(false));
      socketRef.current = s;
    }).catch(() => setSocketOk(false));
  };

  const addSys = (roomId, text) => {
    const msg = { system:true, text, ts:new Date().toISOString() };
    setMessages(m => { const u=[...m,msg]; saveArr(ROOM_MSGS(roomId),u); return u; });
  };

  const leaveRoom = () => {
    if (socketRef.current) { socketRef.current.emit('leave-room',{ roomId:room.id, displayName:user.displayName }); socketRef.current.disconnect(); socketRef.current=null; }
    setSocketOk(false); setPhase('browse'); setRoom(null); setMessages([]);
  };

  const sendMsg = () => {
    if (!input.trim()) return;
    const msg = { uid:user.uid, displayName:user.displayName||'You', message:input.trim(), timestamp:new Date().toISOString() };
    if (socketRef.current?.connected) {
      socketRef.current.emit('room-message', { roomId:room.id, ...msg });
    } else {
      setMessages(m => { const u=[...m,msg]; saveArr(ROOM_MSGS(room.id),u); return u; });
    }
    playMessageSend();
    setInput('');
  };

  const createRoom = () => {
    if (!newRoom.name.trim()) { toast.error('Enter a name'); return; }
    const emojis = { Mathematics:'🧮', Physics:'⚡', Chemistry:'⚗️', Biology:'🔬', 'Computer Science':'💻', General:'📚', History:'📜', Economics:'💰' };
    const r = { id:`c-${Date.now()}`, name:newRoom.name.trim(), subject:newRoom.subject, emoji:emojis[newRoom.subject]||'📚', count:1, custom:true };
    const updated = [r,...customRooms];
    setCustomRooms(updated); saveArr(CUSTOM_KEY, updated);
    setCreateOpen(false); setNewRoom({ name:'', subject:SUBJECTS[0] });
    playCreate(); joinRoom(r);
  };

  const deleteRoom = (id) => { playClick(); const u=customRooms.filter(r=>r.id!==id); setCustomRooms(u); saveArr(CUSTOM_KEY,u); localStorage.removeItem(ROOM_MSGS(id)); localStorage.removeItem(ROOM_MAT(id)); };

  // BROWSE
  if (phase === 'browse') return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-5 pt-12 lg:pt-0">
        <div>
          <h1 className="font-syne font-black text-2xl md:text-3xl mb-1">Study Rooms</h1>
          <p className="text-white/40 text-sm">Chat · Group Quizzes · Shared Study Material</p>
        </div>
        <button onClick={() => { playClick(); setCreateOpen(true); }} className="btn-cyan flex items-center gap-2 text-sm py-2.5">
          <Plus size={15} />Create Room
        </button>
      </div>

      <div className={`flex items-center gap-2 rounded-xl p-3 mb-4 text-xs border ${socketOk ? 'bg-neon-green/10 border-neon-green/20 text-neon-green' : 'bg-white/[0.03] border-brand-border text-white/35'}`}>
        {socketOk ? <Wifi size={12} /> : <WifiOff size={12} />}
        {socketOk ? 'Real-time server connected — multiplayer active!' : 'Local mode: chat and materials save on your device. Start the backend server for multiplayer.'}
      </div>

      {customRooms.length > 0 && <>
        <p className="text-xs text-white/30 mb-2 uppercase tracking-widest font-semibold">Your Rooms</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {customRooms.map(r => <RoomCard key={r.id} room={r} onJoin={joinRoom} onDelete={deleteRoom} />)}
        </div>
      </>}

      <p className="text-xs text-white/30 mb-2 uppercase tracking-widest font-semibold">Public Rooms</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEMO_ROOMS.map(r => <RoomCard key={r.id} room={r} onJoin={joinRoom} onDelete={null} />)}
      </div>

      <AnimatePresence>
        {createOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}
              className="glass border border-brand-border2 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h2 className="font-syne font-bold text-xl mb-5">Create Study Room</h2>
              <div className="space-y-4 mb-5">
                <input value={newRoom.name} onChange={e => setNewRoom(r=>({...r,name:e.target.value}))}
                  onKeyDown={e => e.key==='Enter'&&createRoom()}
                  placeholder="Room name e.g. JEE Physics Group" className="input-dark w-full text-sm" autoFocus />
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECTS.map(s => (
                    <button key={s} onClick={() => setNewRoom(r=>({...r,subject:s}))}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${s===newRoom.subject?'bg-cyan/20 border-cyan/40 text-cyan':'border-brand-border text-white/40'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCreateOpen(false)} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
                <button onClick={createRoom} className="flex-1 btn-cyan py-2.5 text-sm">Create & Join →</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ROOM
  return (
    <div className="h-screen flex flex-col pt-14 lg:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-bg2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan/10 flex items-center justify-center text-base">{room?.emoji}</div>
          <div>
            <p className="font-syne font-bold text-sm">{room?.name}</p>
            <p className="text-xs text-white/40 flex items-center gap-1.5">
              <Users size={9} />{room?.subject}
              <span className={socketOk ? 'text-neon-green' : 'text-neon-amber'}>· {socketOk ? 'Live' : 'Local'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Group quiz button */}
          <button onClick={() => setGroupQuizOpen(true)}
            className="flex items-center gap-1.5 text-xs glass border border-cyan/20 text-cyan rounded-xl px-3 py-1.5 hover:border-cyan/40 transition-all">
            <FileQuestion size={12} />Group Quiz
          </button>
          <button onClick={leaveRoom}
            className="flex items-center gap-1.5 text-xs text-red-400 border border-red-500/20 rounded-xl px-3 py-1.5 hover:bg-red-500/10 transition-all">
            <LogOut size={12} />Leave
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border flex-shrink-0 bg-brand-bg">
        {[
          { id:'chat',     label:'💬 Chat',            },
          { id:'material', label:'📚 Study Material', },
        ].map(t => (
          <button key={t.id} onClick={() => { playClick(); setActiveTab(t.id); }}
            className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab===t.id ? 'border-cyan text-cyan' : 'border-transparent text-white/40 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) =>
                  msg.system ? (
                    <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }}
                      className="text-center text-xs text-white/25 py-1">{msg.text}</motion.div>
                  ) : (
                    <motion.div key={i} initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }}
                      className={`flex gap-2.5 ${msg.uid===user.uid?'justify-end':''}`}>
                      {msg.uid !== user.uid && (
                        <div className="w-7 h-7 rounded-xl text-xs font-bold text-brand-bg flex items-center justify-center flex-shrink-0"
                          style={{ background:'linear-gradient(135deg,#a78bfa,#00e5ff)' }}>
                          {(msg.displayName||'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className={`max-w-xs flex flex-col ${msg.uid===user.uid?'items-end':''}`}>
                        {msg.uid !== user.uid && <p className="text-[10px] text-white/30 mb-0.5 ml-1">{msg.displayName}</p>}
                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${msg.uid===user.uid?'bg-cyan text-brand-bg font-medium rounded-br-sm':'bg-white/[0.06] border border-white/[0.08] rounded-bl-sm'}`}>
                          {msg.message}
                        </div>
                        <p className="text-[9px] text-white/15 mt-0.5 px-1">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}
                        </p>
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
              <div ref={msgEnd} />
            </div>
            {/* Input */}
            <div className="px-4 py-3 border-t border-brand-border bg-brand-bg2 flex-shrink-0">
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key==='Enter'&&sendMsg()}
                  placeholder="Send a message..." className="input-dark flex-1 text-sm" />
                <motion.button whileTap={{ scale:0.92 }} onClick={sendMsg} disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-cyan flex items-center justify-center text-brand-bg disabled:opacity-40">
                  <Send size={15} />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'material' && (
          <MaterialPanel roomId={room?.id} />
        )}
      </div>

      {/* Group Quiz Modal */}
      <AnimatePresence>
        {groupQuizOpen && <GroupQuiz room={room} user={user} onClose={() => setGroupQuizOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

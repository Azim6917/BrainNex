import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Send, LogOut, Plus, Trash2, FileQuestion,
  BookOpen, MessageCircle, Wifi, WifiOff, X, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateQuiz } from '../utils/api';
import { audioSystem } from '../utils/audio';
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
    <motion.div whileHover={{ y:-4, boxShadow:'0 10px 25px -5px rgba(0,0,0,0.2)' }}
      className="glass-card p-5 cursor-pointer transition-all relative group shadow-sm border-transparent hover:border-white/10"
      onClick={() => onJoin(room)}>
      {onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(room.id); }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center transition-opacity hover:bg-red-500/20">
          <Trash2 size={14} />
        </button>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center text-2xl shadow-sm border border-cyan/20">{room.emoji}</div>
        <span className="text-[10px] font-bold px-2.5 py-1 bg-green-500/10 text-green-500 border border-green-500/30 rounded-md flex items-center gap-1.5 uppercase tracking-wider shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-blink shadow-[0_0_8px_rgba(16,185,129,0.8)]" />Live
        </span>
      </div>
      <h3 className="font-jakarta font-black text-base mb-1.5 text-txt pr-6">{room.name}</h3>
      <p className="text-xs font-bold text-txt3 mb-4 uppercase tracking-wider">{room.subject}</p>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 bg-space-800 px-2 py-1 rounded-md text-[10px] font-bold text-txt2 uppercase tracking-widest border border-white/5 shadow-sm"><Users size={12} className="text-txt3"/>{room.count}</div>
        <span className="text-cyan text-xs font-bold hover:text-cyan-light transition-colors">Join Room →</span>
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
    audioSystem.playClick();
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
    if (i === quiz.questions[current].correctIndex) audioSystem.playCorrect();
    else audioSystem.playWrong();
    setAnswers(a => [...a, { correct: i === quiz.questions[current].correctIndex }]);
  };

  const next = () => {
    audioSystem.playClick();
    if (current + 1 >= quiz.questions.length) {
      audioSystem.playQuizComplete();
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
      className="fixed inset-0 bg-space-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.95, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }} exit={{ scale:0.95, y:20, opacity:0 }}
        className="glass-card border-cyan/20 p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto relative custom-scrollbar">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan/5 rounded-bl-full pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="font-jakarta font-black text-xl text-txt flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan/20 flex items-center justify-center text-cyan shadow-sm border border-cyan/30">
              <FileQuestion size={16} />
            </div>
            Group Quiz
          </h2>
          <button onClick={() => { audioSystem.playClick(); onClose(); }} className="p-2 rounded-lg text-txt3 hover:text-txt hover:bg-space-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {phase === 'setup' && (
          <div className="space-y-5 relative z-10">
            <p className="text-sm font-medium text-txt2 leading-relaxed">Generate a quiz for your study group on any topic in <span className="text-cyan font-bold">{room.subject}</span>.</p>
            <div>
              <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest block mb-2">Quiz Topic</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key==='Enter'&&start()}
                placeholder={`Topic in ${room.subject}...`} className="input-field w-full text-sm py-3" autoFocus />
            </div>
            <button onClick={start} disabled={loading} className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-glow-primary">
              {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Generating...</> : '🎮 Start Group Quiz'}
            </button>
          </div>
        )}

        {phase === 'quiz' && q && (
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-cyan font-bold uppercase tracking-widest">Question {current+1}/{quiz.questions.length}</p>
            </div>
            <div className="h-2 bg-space-800 rounded-full overflow-hidden mb-6 shadow-inner">
              <div className="h-full bg-cyan rounded-full transition-all shadow-[0_0_10px_rgba(0,229,255,0.5)]" style={{ width:`${(current/quiz.questions.length)*100}%` }} />
            </div>
            
            <p className="font-jakarta font-bold text-lg leading-relaxed mb-6 text-txt">{q.question}</p>
            <div className="space-y-3 mb-6">
              {q.options.map((opt, i) => {
                let cls = 'bg-space-800 border-border text-txt2 hover:border-white/20 hover:text-txt';
                if (selected !== null) {
                  cls = 'bg-space-800 border-border text-txt3 opacity-60';
                  if (i===q.correctIndex)  cls='border-green-500/50 bg-green-500/10 text-green-500 font-medium';
                  else if (i===selected)   cls='border-red-500/50 bg-red-500/10 text-red-500 font-medium';
                }
                return (
                  <button key={i} onClick={() => pick(i)} disabled={selected!==null}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-sm text-left transition-all ${cls}`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm ${selected===null?'bg-space-900 text-txt2':i===q.correctIndex?'bg-green-500/20 text-green-500':i===selected?'bg-red-500/20 text-red-500':'bg-space-900 text-txt3'}`}>{['A','B','C','D'][i]}</span>
                    <span className="flex-1 text-base">{opt}</span>
                    {selected!==null && i===q.correctIndex && <CheckCircle size={18} className="flex-shrink-0 text-green-500 drop-shadow-sm" />}
                    {selected!==null && i===selected && i!==q.correctIndex && <XCircle size={18} className="flex-shrink-0 text-red-500 drop-shadow-sm" />}
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                <div className={`rounded-xl px-5 py-4 mb-5 text-sm font-medium border border-l-4 shadow-sm ${selected===q.correctIndex?'bg-green-500/5 border-green-500/20 border-l-green-500 text-txt2':'bg-red-500/5 border-red-500/20 border-l-red-500 text-txt2'}`}>
                  {q.explanation}
                </div>
                <button onClick={next} className="btn-primary w-full py-4 text-base font-bold shadow-glow-primary">
                  {current+1>=quiz.questions.length ? 'See Results 🏆' : 'Next Question →'}
                </button>
              </motion.div>
            )}
          </div>
        )}

        {phase === 'results' && (
          <div className="text-center relative z-10 py-4">
            <div className="text-6xl mb-4 drop-shadow-md">{score===100?'🏆':score>=80?'🎉':'📚'}</div>
            <h3 className="font-jakarta font-black text-6xl mb-2 drop-shadow-sm" style={{ color: score>=80?'#10B981':score>=60?'var(--primary)':'#F59E0B' }}>{score}%</h3>
            <p className="text-txt2 font-medium text-base mb-1">{answers.filter(a=>a.correct).length}/{quiz.questions.length} correct</p>
            <p className="text-txt3 font-bold uppercase tracking-widest text-xs mb-8">Topic: {quiz.topic}</p>
            <div className="flex gap-4">
              <button onClick={() => { audioSystem.playClick(); setPhase('setup'); setTopic(''); setAnswers([]); setCurrent(0); setSelected(null); }} className="flex-1 btn-outline py-3.5 text-sm bg-space-800 shadow-sm">New Quiz</button>
              <button onClick={() => { audioSystem.playClick(); onClose(); }} className="flex-1 btn-primary py-3.5 text-sm shadow-glow-primary">Close</button>
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
    audioSystem.playCreate();
    const updated = [{ id:Date.now(), ...newMat, addedAt:new Date().toISOString() }, ...materials];
    setMaterials(updated); saveArr(ROOM_MAT(roomId), updated);
    setNewMat({ title:'', content:'' }); setAdding(false);
    toast.success('Material added!');
  };

  const del = (id) => { audioSystem.playClick(); const u = materials.filter(m=>m.id!==id); setMaterials(u); saveArr(ROOM_MAT(roomId), u); };

  return (
    <div className="h-full flex flex-col bg-space-dark/40">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-space-800/80 backdrop-blur-md flex-shrink-0">
        <h3 className="font-jakarta font-bold text-base flex items-center gap-2.5 text-txt">
          <div className="p-1.5 rounded-lg bg-primary/20 text-primary shadow-sm border border-primary/30">
            <BookOpen size={16} />
          </div>
          Study Material
        </h3>
        <button onClick={() => { audioSystem.playClick(); setAdding(!adding); }} className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg">
          <Plus size={12}/> Add
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden">
            <div className="p-5 border-b border-border bg-primary/5">
              <input value={newMat.title} onChange={e => setNewMat(m=>({...m,title:e.target.value}))}
                placeholder="Title (e.g. Newton's Laws Summary)" className="input-field w-full text-sm mb-3 py-2.5" />
              <textarea value={newMat.content} onChange={e => setNewMat(m=>({...m,content:e.target.value}))}
                placeholder="Add notes, formulas, key points..." rows={4}
                className="input-field w-full text-sm resize-none mb-4 py-3" />
              <div className="flex gap-3">
                <button onClick={() => { audioSystem.playClick(); setAdding(false); }} className="flex-1 btn-outline py-2.5 text-sm bg-space-800">Cancel</button>
                <button onClick={save} className="flex-1 btn-primary py-2.5 text-sm shadow-glow-primary">Save Material</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar">
        {materials.length === 0 ? (
          <div className="text-center py-16 text-txt3">
            <div className="w-16 h-16 rounded-2xl bg-space-800 border border-border flex items-center justify-center mx-auto mb-4 shadow-sm">
              <BookOpen size={24} className="text-primary opacity-60" />
            </div>
            <p className="font-bold text-sm mb-1 text-txt2">No study material yet.</p>
            <p className="text-xs font-medium max-w-[200px] mx-auto">Add notes, formulas, or summaries for your group!</p>
          </div>
        ) : (
          materials.map(m => (
            <motion.div key={m.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass-card p-5 group relative shadow-sm border-primary/10">
              <button onClick={() => del(m.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center transition-opacity hover:bg-red-500/20">
                <X size={14} />
              </button>
              <div className="flex items-center gap-2 mb-2 pr-8">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <p className="font-jakarta font-bold text-base text-txt">{m.title}</p>
              </div>
              <p className="text-sm font-medium text-txt2 leading-relaxed whitespace-pre-wrap bg-space-800 p-4 rounded-xl border border-white/5">{m.content}</p>
              <p className="text-[10px] font-bold text-txt3 uppercase tracking-wider mt-3 pl-1 flex items-center gap-1.5">
                <Clock size={10}/> {new Date(m.addedAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
              </p>
            </motion.div>
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
    audioSystem.playRoomJoin();

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
    audioSystem.playClick();
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
    audioSystem.playClick();
    setInput('');
  };

  const createRoom = () => {
    if (!newRoom.name.trim()) { toast.error('Enter a name'); return; }
    const emojis = { Mathematics:'🧮', Physics:'⚡', Chemistry:'⚗️', Biology:'🔬', 'Computer Science':'💻', General:'📚', History:'📜', Economics:'💰' };
    const r = { id:`c-${Date.now()}`, name:newRoom.name.trim(), subject:newRoom.subject, emoji:emojis[newRoom.subject]||'📚', count:1, custom:true };
    const updated = [r,...customRooms];
    setCustomRooms(updated); saveArr(CUSTOM_KEY, updated);
    setCreateOpen(false); setNewRoom({ name:'', subject:SUBJECTS[0] });
    audioSystem.playCreate(); joinRoom(r);
  };

  const deleteRoom = (id) => { audioSystem.playClick(); const u=customRooms.filter(r=>r.id!==id); setCustomRooms(u); saveArr(CUSTOM_KEY,u); localStorage.removeItem(ROOM_MSGS(id)); localStorage.removeItem(ROOM_MAT(id)); };

  // BROWSE
  if (phase === 'browse') return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pt-12 lg:pt-0 gap-4">
        <div>
          <h1 className="font-jakarta font-black text-3xl md:text-4xl text-txt mb-2">Study Rooms</h1>
          <p className="text-sm font-medium text-txt3">Chat · Group Quizzes · Shared Study Material</p>
        </div>
        <button onClick={() => { audioSystem.playClick(); setCreateOpen(true); }} className="btn-primary flex items-center justify-center gap-2 text-sm py-3 px-6 shadow-glow-primary self-start md:self-auto">
          <Plus size={18} />Create Room
        </button>
      </div>

      <div className={`flex items-center gap-3 rounded-xl p-4 mb-8 text-sm font-medium border shadow-sm ${socketOk ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-space-800 border-border text-txt3'}`}>
        {socketOk ? <div className="p-1.5 bg-green-500/20 rounded-md"><Wifi size={16} /></div> : <div className="p-1.5 bg-white/5 rounded-md"><WifiOff size={16} /></div>}
        {socketOk ? 'Real-time server connected — multiplayer active!' : 'Local mode: chat and materials save on your device. Start the backend server for multiplayer.'}
      </div>

      {customRooms.length > 0 && <>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-primary rounded-full"/>
          <p className="text-xs text-txt3 uppercase tracking-widest font-bold">Your Rooms</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
          {customRooms.map(r => <RoomCard key={r.id} room={r} onJoin={joinRoom} onDelete={deleteRoom} />)}
        </div>
      </>}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-cyan rounded-full"/>
        <p className="text-xs text-txt3 uppercase tracking-widest font-bold">Public Rooms</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8">
        {DEMO_ROOMS.map(r => <RoomCard key={r.id} room={r} onJoin={joinRoom} onDelete={null} />)}
      </div>

      <AnimatePresence>
        {createOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-space-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ scale:0.95, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }} exit={{ scale:0.95, y:20, opacity:0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-8 max-w-md w-full shadow-2xl relative overflow-hidden border-primary/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none" />
              <h2 className="font-jakarta font-black text-2xl mb-6 text-txt relative z-10">Create Study Room</h2>
              <div className="space-y-6 mb-8 relative z-10">
                <div>
                  <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest block mb-2">Room Name</label>
                  <input value={newRoom.name} onChange={e => setNewRoom(r=>({...r,name:e.target.value}))}
                    onKeyDown={e => e.key==='Enter'&&createRoom()}
                    placeholder="e.g. JEE Physics Group" className="input-field w-full text-sm py-3" autoFocus />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest block mb-3">Subject</label>
                  <div className="flex flex-wrap gap-2.5">
                    {SUBJECTS.map(s => (
                      <button key={s} onClick={() => { audioSystem.playClick(); setNewRoom(r=>({...r,subject:s})); }}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all shadow-sm ${s===newRoom.subject?'bg-primary/10 border-primary/40 text-primary':'bg-space-800 border-border text-txt3 hover:border-white/20 hover:text-txt2'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 relative z-10">
                <button onClick={() => { audioSystem.playClick(); setCreateOpen(false); }} className="flex-1 btn-outline py-3.5 text-sm bg-space-800">Cancel</button>
                <button onClick={createRoom} className="flex-1 btn-primary py-3.5 text-sm shadow-glow-primary">Create & Join →</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ROOM
  return (
    <div className="h-full min-h-[calc(100vh-2rem)] m-4 flex flex-col rounded-3xl border border-border shadow-2xl overflow-hidden glass-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-space-800/80 backdrop-blur-md flex-shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl border border-primary/30 shadow-sm">{room?.emoji}</div>
          <div>
            <p className="font-jakarta font-black text-lg text-txt mb-0.5">{room?.name}</p>
            <p className="text-xs font-bold text-txt3 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center gap-1"><Users size={12} className="text-txt3"/>{room?.subject}</span>
              <span className={`px-1.5 py-0.5 rounded-md border ${socketOk ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>{socketOk ? 'Live' : 'Local'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Group quiz button */}
          <button onClick={() => { audioSystem.playClick(); setGroupQuizOpen(true); }}
            className="flex items-center gap-2 text-xs font-bold bg-cyan/10 border border-cyan/30 text-cyan rounded-xl px-4 py-2 hover:bg-cyan/20 transition-all shadow-sm">
            <FileQuestion size={14} />Group Quiz
          </button>
          <button onClick={leaveRoom}
            className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 hover:bg-red-500/20 transition-all shadow-sm">
            <LogOut size={14} />Leave
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0 bg-space-900/50">
        {[
          { id:'chat',     label:'💬 Room Chat',            },
          { id:'material', label:'📚 Study Material', },
        ].map(t => (
          <button key={t.id} onClick={() => { audioSystem.playClick(); setActiveTab(t.id); }}
            className={`px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab===t.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-txt3 hover:text-txt2 hover:bg-white/5'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col bg-space-dark/40">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar relative z-10">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) =>
                  msg.system ? (
                    <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }}
                      className="text-center text-xs font-medium text-txt3 py-2 px-4 bg-space-800 inline-block mx-auto rounded-xl border border-white/5 shadow-sm my-2">{msg.text}</motion.div>
                  ) : (
                    <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                      className={`flex gap-3 ${msg.uid===user.uid?'justify-end':''}`}>
                      {msg.uid !== user.uid && (
                        <div className="w-9 h-9 rounded-xl text-sm font-black text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm"
                          style={{ background:'linear-gradient(135deg,var(--primary),var(--cyan))' }}>
                          {(msg.displayName||'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className={`max-w-md flex flex-col ${msg.uid===user.uid?'items-end':''}`}>
                        {msg.uid !== user.uid && <p className="text-[10px] font-bold text-txt3 uppercase tracking-wider mb-1 ml-1">{msg.displayName}</p>}
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.uid===user.uid?'bg-primary text-white font-medium rounded-tr-sm':'bg-space-800 border border-border text-txt2 rounded-tl-sm'}`}>
                          {msg.message}
                        </div>
                        <p className="text-[9px] font-bold text-txt3 mt-1.5 px-1 uppercase tracking-widest">
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
            <div className="px-6 py-5 border-t border-border bg-space-800/90 backdrop-blur-md flex-shrink-0 relative z-10">
              <div className="flex gap-3">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key==='Enter'&&sendMsg()}
                  placeholder="Message the room..." className="input-field flex-1 text-sm py-3" />
                <motion.button whileHover={{scale:1.05}} whileTap={{ scale:0.95 }} onClick={sendMsg} disabled={!input.trim()}
                  className="w-12 h-12 rounded-xl btn-primary flex items-center justify-center disabled:opacity-40 shadow-glow-primary">
                  <Send size={18} />
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

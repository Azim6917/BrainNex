import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Send, LogOut, Plus, Trash2, FileQuestion,
  BookOpen, MessageCircle, Wifi, WifiOff, X, CheckCircle, 
  XCircle, Clock, Hand, Target, Palette, Eraser, Pen, Brush, Highlighter, Minus, Type, Info, Copy, Lock, Globe, Megaphone, Volume2, VolumeX, Settings, Timer, Smile
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateQuiz } from '../utils/api';
import { audioSystem } from '../utils/audio';
import toast from 'react-hot-toast';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, addDoc,
  updateDoc, increment, query, serverTimestamp, orderBy, where, getDocs, limit,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { awardBadgeToFirestore } from '../utils/firestoreUtils';

/* ── Emoji picker data ── */
const EMOJI_GROUPS = [
  { label: 'Smileys', emojis: ['😀','😂','🥲','😊','😍','🤔','😅','😎','🥳','😤','😢','😡','🤯','🥺','😏'] },
  { label: 'Hands',  emojis: ['👍','👎','👋','🙌','🤝','✌️','🤙','💪','🙏','👀','✅','❌','🔥','💡','⭐'] },
  { label: 'Study',  emojis: ['📚','📖','✏️','📝','🎯','💻','🧠','⚡','🏆','🎉','❓','💯','🚀','⏰','🔬'] },
];

function EmojiPicker({ onSelect, onClose }) {
  return (
    <motion.div initial={{ opacity:0, scale:0.92, y:8 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.92, y:8 }}
      className="absolute bottom-full mb-2 right-0 bg-space-800 border border-white/10 rounded-2xl p-3 shadow-2xl z-50 w-72">
      {EMOJI_GROUPS.map(g => (
        <div key={g.label} className="mb-2">
          <p className="text-[9px] font-bold text-txt3 uppercase tracking-widest mb-1">{g.label}</p>
          <div className="flex flex-wrap gap-1">
            {g.emojis.map(e => (
              <button key={e} onClick={() => onSelect(e)}
                className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-white/10 transition-colors">{e}</button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

/* ── Confirm modal ── */
function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}>
      <motion.div initial={{ scale:0.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.92, opacity:0 }}
        onClick={e => e.stopPropagation()}
        className="glass-card p-7 max-w-sm w-full text-center shadow-2xl border-white/10">
        <h3 className="font-jakarta font-black text-lg text-txt mb-3">{title}</h3>
        <p className="text-sm text-txt3 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-outline py-3 text-sm bg-space-800 border-white/10">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const SUBJECTS   = ['Mathematics','Physics','Chemistry','Biology','Computer Science','General','History','Economics'];

const DEMO_ROOMS = [
  { id:'r-math', name:'Calculus Study Group',    subject:'Mathematics',      emoji:'🧮', isDemo:true, participantCount:0, maxMembers: 15, description: 'Daily calculus problem solving and exam prep.' },
  { id:'r-phys', name:'Physics Problem Solving', subject:'Physics',           emoji:'⚡', isDemo:true, participantCount:0, maxMembers: 20, description: 'Tackling advanced physics concepts together.' },
  { id:'r-cs',   name:'DSA & Algorithms',        subject:'Computer Science', emoji:'💻', isDemo:true, participantCount:0, maxMembers: 50, description: 'Leetcode grinding and data structures review.' },
  { id:'r-chem', name:'Organic Chemistry Help',  subject:'Chemistry',         emoji:'⚗️', isDemo:true, participantCount:0, maxMembers: 10, description: 'Focusing on organic reactions and mechanisms.' },
];

function RoomCard({ room, onJoin, onDelete }) {
  return (
    <motion.div whileHover={{ y:-4, boxShadow:'0 10px 25px -5px rgba(0,0,0,0.2)' }}
      className="glass-card p-5 cursor-pointer transition-all relative group shadow-sm border border-transparent hover:border-white/10"
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
      <p className="text-xs font-bold text-txt3 uppercase tracking-wider mb-1">{room.subject}</p>
      
      {room.description && (
        <p className="text-[11px] text-txt2 mb-4 line-clamp-2 leading-relaxed opacity-80 h-8">
          {room.description.length > 60 ? room.description.substring(0, 60) + '...' : room.description}
        </p>
      )}
      {!room.description && <div className="h-8 mb-4" />}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 bg-space-800 px-2 py-1 rounded-md text-[10px] font-bold text-txt2 uppercase tracking-widest border border-white/5 shadow-sm">
          <Users size={12} className="text-txt3"/>
          {room.participantCount || 0}/{room.maxMembers || 10}
        </div>
        <span className="text-cyan text-xs font-bold hover:text-cyan-light transition-colors">Join Room →</span>
      </div>
    </motion.div>
  );
}

/* ── Group Quiz inside room ── */
function GroupQuiz({ room, user, onClose, socket, activeQuiz, onStartQuiz }) {
  const [phase,    setPhase]    = useState(activeQuiz ? 'quiz' : 'setup');
  const [topic,    setTopic]    = useState(activeQuiz?.topic || '');
  const [quiz,     setQuiz]     = useState(activeQuiz || null);
  const [current,  setCurrent]  = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers,  setAnswers]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [answeredBy, setAnsweredBy] = useState({}); 

  useEffect(() => {
    if (activeQuiz) {
       setQuiz(activeQuiz);
       setPhase('quiz');
    }
  }, [activeQuiz]);

  useEffect(() => {
    if (!socket) return;
    const handleAnswered = ({ displayName, questionIndex }) => {
      setAnsweredBy(prev => ({
         ...prev, [questionIndex]: [...(prev[questionIndex]||[]), displayName]
      }));
    };
    socket.on('group-quiz-answered', handleAnswered);
    return () => socket.off('group-quiz-answered', handleAnswered);
  }, [socket]);

  const start = async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return; }
    audioSystem.playClick();
    setLoading(true);
    try {
      const res = await generateQuiz(room.subject, topic, 'intermediate', 5);
      setQuiz(res.data);
      setPhase('quiz');
      if (onStartQuiz) onStartQuiz(res.data);
    } catch { toast.error('Failed to generate quiz. Is the server running?'); }
    finally { setLoading(false); }
  };

  const pick = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === quiz.questions[current].correctIndex) audioSystem.playCorrect();
    else audioSystem.playWrong();
    setAnswers(a => [...a, { correct: i === quiz.questions[current].correctIndex }]);
    if (socket) socket.emit('group-quiz-answer', { roomId:room.id, displayName:user.displayName, questionIndex:current });
  };

  const next = () => {
    audioSystem.playClick();
    if (current + 1 >= quiz.questions.length) {
      audioSystem.playQuizComplete();
      setPhase('results');
      const finalScore = Math.round((answers.filter(a=>a.correct).length / quiz.questions.length)*100);
      if (finalScore >= 80) {
        awardBadgeToFirestore(user.uid, 'group-quiz-win');
      }
    } else {
      setSelected(null);
      setCurrent(c => c+1);
    }
  };

  const q    = quiz?.questions[current];
  const score = phase === 'results' ? Math.round((answers.filter(a=>a.correct).length / quiz.questions.length)*100) : 0;
  const answeredNames = answeredBy[current] || [];

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ scale:0.95, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }} exit={{ scale:0.95, y:20, opacity:0 }}
        className="glass-card border border-white/10 p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto relative custom-scrollbar">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan/5 rounded-bl-full pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="font-jakarta font-black text-xl text-txt flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan/20 flex items-center justify-center text-cyan shadow-sm border border-cyan/20">
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
                placeholder={`Topic in ${room.subject}...`} className="input-field w-full text-sm py-3 border-white/10" autoFocus />
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
                let cls = 'bg-space-800 border-white/10 text-txt2 hover:border-white/20 hover:text-txt';
                if (selected !== null) {
                  cls = 'bg-space-800 border-white/10 text-txt3 opacity-60';
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
            {answeredNames.length > 0 && selected === null && (
               <p className="text-[10px] font-bold text-cyan uppercase tracking-widest mb-4">
                 Answered by: {answeredNames.join(', ')}
               </p>
            )}
            {selected !== null && (
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                <div className={`rounded-xl px-5 py-4 mb-5 text-sm font-medium border border-l-4 shadow-sm ${selected===q.correctIndex?'bg-green-500/5 border-white/10 border-l-green-500 text-txt2':'bg-red-500/5 border-white/10 border-l-red-500 text-txt2'}`}>
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
              <button onClick={() => { audioSystem.playClick(); setPhase('setup'); setTopic(''); setAnswers([]); setCurrent(0); setSelected(null); }} className="flex-1 btn-outline py-3.5 text-sm bg-space-800 border-white/10 shadow-sm">New Quiz</button>
              <button onClick={() => { audioSystem.playClick(); onClose(); }} className="flex-1 btn-primary py-3.5 text-sm shadow-glow-primary">Close</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Study Material panel ── */
function MaterialPanel({ roomId, user }) {
  const [materials, setMaterials] = useState([]);
  const [newMat, setNewMat] = useState({ title:'', content:'' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if(!roomId) return;
    const q = query(collection(db, `studyRooms/${roomId}/materials`), orderBy('addedAt', 'desc'));
    return onSnapshot(q, (snap) => setMaterials(snap.docs.map(d=>({id:d.id, ...d.data()}))));
  }, [roomId]);

  const save = async () => {
    if (!newMat.title.trim() || !newMat.content.trim()) { toast.error('Fill in both fields'); return; }
    audioSystem.playCreate();
    await setDoc(doc(collection(db, `studyRooms/${roomId}/materials`)), {
      title: newMat.title,
      content: newMat.content,
      addedBy: user.displayName || 'Anonymous',
      addedByUid: user.uid,
      addedAt: serverTimestamp()
    });
    setNewMat({ title:'', content:'' }); setAdding(false);
    toast.success('Material added!');
  };

  const del = async (id) => {
    audioSystem.playClick();
    await deleteDoc(doc(db, `studyRooms/${roomId}/materials`, id));
  };

  return (
    <div className="h-full flex flex-col bg-space-dark/40 relative z-10">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-space-800/80 backdrop-blur-md flex-shrink-0">
        <h3 className="font-jakarta font-bold text-base flex items-center gap-2.5 text-txt">
          <div className="p-1.5 rounded-lg bg-primary/20 text-primary shadow-sm border border-primary/20">
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
            <div className="p-5 border-b border-white/10 bg-primary/5">
              <input value={newMat.title} onChange={e => setNewMat(m=>({...m,title:e.target.value}))}
                placeholder="Title (e.g. Newton's Laws Summary)" className="input-field w-full text-sm mb-3 py-2.5 border-white/10" />
              <textarea value={newMat.content} onChange={e => setNewMat(m=>({...m,content:e.target.value}))}
                placeholder="Add notes, formulas, key points..." rows={4}
                className="input-field w-full text-sm resize-none mb-4 py-3 border-white/10" />
              <div className="flex gap-3">
                <button onClick={() => { audioSystem.playClick(); setAdding(false); }} className="flex-1 btn-outline py-2.5 text-sm bg-space-800 border-white/10">Cancel</button>
                <button onClick={save} className="flex-1 btn-primary py-2.5 text-sm shadow-glow-primary">Save Material</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar">
        {materials.length === 0 ? (
          <div className="text-center py-16 text-txt3">
            <div className="w-16 h-16 rounded-2xl bg-space-800 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <BookOpen size={24} className="text-primary opacity-60" />
            </div>
            <p className="font-bold text-sm mb-1 text-txt2">No study material yet.</p>
            <p className="text-xs font-medium max-w-[200px] mx-auto">Add notes, formulas, or summaries for your group!</p>
          </div>
        ) : (
          materials.map(m => (
            <motion.div key={m.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass-card p-5 group relative shadow-sm border border-white/10">
              {user.uid === m.addedByUid && (
                <button onClick={() => del(m.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center transition-opacity hover:bg-red-500/20">
                  <X size={14} />
                </button>
              )}
              <div className="flex items-center gap-2 mb-2 pr-8">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <p className="font-jakarta font-bold text-base text-txt">{m.title}</p>
              </div>
              <p className="text-sm font-medium text-txt2 leading-relaxed whitespace-pre-wrap bg-space-800 p-4 rounded-xl border border-white/5">{m.content}</p>
              <p className="text-[10px] font-bold text-txt3 uppercase tracking-wider mt-3 pl-1 flex items-center gap-1.5">
                <Clock size={10}/> {m.addedAt ? new Date(m.addedAt.toDate()).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Just now'}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Whiteboard panel ── */
function Whiteboard({ socket, roomId }) {
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [color, setColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState('pen'); 
  const [textInput, setTextInput] = useState(null); 

  const isDrawing = useRef(false);
  const lastPos = useRef({ x:0, y:0 });
  const startPos = useRef({ x:0, y:0 });

  const drawParams = {
    pen: { comp: 'source-over', alpha: 1, w: lineWidth },
    marker: { comp: 'source-over', alpha: 0.7, w: 8 },
    highlighter: { comp: 'source-over', alpha: 0.4, w: 16 },
    eraser: { comp: 'destination-out', alpha: 1, w: 20 },
    line: { comp: 'source-over', alpha: 1, w: lineWidth }
  };

  const drawLineFn = (ctx, data) => {
    const p = drawParams[data.tool] || drawParams.pen;
    ctx.globalCompositeOperation = p.comp;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.moveTo(data.x0, data.y0);
    ctx.lineTo(data.x1, data.y1);
    ctx.strokeStyle = data.tool === 'eraser' ? 'rgba(0,0,0,1)' : data.color;
    ctx.lineWidth = p.w;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };

  const drawTextFn = (ctx, data) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = data.color;
    ctx.fillText(data.text, data.x, data.y);
  };

  useEffect(() => {
    if (!socket) return;
    const handleDraw = ({ type, data }) => {
      const ctx = canvasRef.current.getContext('2d');
      if (type === 'line') drawLineFn(ctx, data);
      else if (type === 'text') drawTextFn(ctx, data);
    };
    socket.on('whiteboard-draw', handleDraw);
    socket.on('whiteboard-clear', () => {
      canvasRef.current.getContext('2d').clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
    });
    return () => {
      socket.off('whiteboard-draw', handleDraw);
      socket.off('whiteboard-clear');
    };
  }, [socket]);

  useEffect(() => {
    const handleResize = () => {
      [canvasRef.current, previewCanvasRef.current].forEach(c => {
        if (c && c.parentElement) {
          const temp = c === canvasRef.current ? c.toDataURL() : null;
          c.width = c.parentElement.clientWidth;
          c.height = c.parentElement.clientHeight;
          if (temp) {
            const img = new Image();
            img.src = temp;
            img.onload = () => c.getContext('2d').drawImage(img, 0, 0);
          }
        }
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => {
    if (tool === 'text') {
      if (textInput && textInput.text.trim()) {
        const data = { x: textInput.x, y: textInput.y + 16, color, text: textInput.text };
        drawTextFn(canvasRef.current.getContext('2d'), data);
        if (socket) socket.emit('whiteboard-draw', { roomId, type: 'text', data });
      }
      setTextInput({ x: getPos(e).x, y: getPos(e).y, text: '' });
      return;
    }
    isDrawing.current = true;
    lastPos.current = getPos(e);
    startPos.current = getPos(e);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const newPos = getPos(e);
    
    if (tool === 'line') {
      const pCtx = previewCanvasRef.current.getContext('2d');
      pCtx.clearRect(0,0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      drawLineFn(pCtx, { x0:startPos.current.x, y0:startPos.current.y, x1:newPos.x, y1:newPos.y, color, tool });
    } else {
      const data = { x0:lastPos.current.x, y0:lastPos.current.y, x1:newPos.x, y1:newPos.y, color, tool };
      drawLineFn(canvasRef.current.getContext('2d'), data);
      if (socket) socket.emit('whiteboard-draw', { roomId, type: 'line', data });
      lastPos.current = newPos;
    }
  };

  const stopDraw = (e) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const newPos = getPos(e);
    
    if (tool === 'line') {
      const pCtx = previewCanvasRef.current.getContext('2d');
      pCtx.clearRect(0,0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      const data = { x0:startPos.current.x, y0:startPos.current.y, x1:newPos.x, y1:newPos.y, color, tool };
      drawLineFn(canvasRef.current.getContext('2d'), data);
      if (socket) socket.emit('whiteboard-draw', { roomId, type: 'line', data });
    }
  };

  const placeText = () => {
    if (!textInput || !textInput.text.trim()) { setTextInput(null); return; }
    const data = { x: textInput.x, y: textInput.y + 16, color, text: textInput.text };
    drawTextFn(canvasRef.current.getContext('2d'), data);
    if (socket) socket.emit('whiteboard-draw', { roomId, type: 'text', data });
    setTextInput(null);
  };

  const clear = () => {
    canvasRef.current.getContext('2d').clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
    if (socket) socket.emit('whiteboard-clear', { roomId });
  };

  useEffect(() => {
    if (tool !== 'text' && textInput) {
      if (textInput.text.trim()) {
         const data = { x: textInput.x, y: textInput.y + 16, color, text: textInput.text };
         drawTextFn(canvasRef.current.getContext('2d'), data);
         if (socket) socket.emit('whiteboard-draw', { roomId, type: 'text', data });
      }
      setTextInput(null);
    }
  }, [tool]);

  const colors = ['#ffffff', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
  const widths = [2, 5, 10];

  return (
    <div className="h-full w-full relative flex flex-col bg-[#1a1a2e] z-10 overflow-hidden">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-4 bg-space-800/90 p-2 sm:p-3 rounded-2xl backdrop-blur-md shadow-lg border border-white/10">
        <div className="flex gap-1">
          {[
            { id:'pen', icon:<Pen size={16}/> },
            { id:'marker', icon:<Brush size={16}/> },
            { id:'highlighter', icon:<Highlighter size={16}/> },
            { id:'eraser', icon:<Eraser size={16}/> },
            { id:'line', icon:<Minus size={16}/> },
            { id:'text', icon:<Type size={16}/> },
          ].map(t => (
            <button key={t.id} onClick={()=>setTool(t.id)} className={`p-2 rounded-xl transition-all ${tool===t.id?'bg-primary/20 text-primary border border-primary/30':'text-txt3 hover:bg-white/5 border border-transparent'}`}>
              {t.icon}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex gap-1.5">
          {colors.map(c => (
            <button key={c} onClick={()=>setColor(c)} className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-transform ${color===c?'scale-110 border-white':'border-transparent hover:scale-110'}`} style={{background:c}}/>
          ))}
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex gap-1 items-center">
          {widths.map(w => (
            <button key={w} onClick={()=>setLineWidth(w)} className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-colors ${lineWidth===w?'bg-white/20':'hover:bg-white/10'}`}>
              <div className="bg-white rounded-full" style={{width:w+2, height:w+2}}/>
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-white/10" />
        <button onClick={clear} title="Clear All" className="p-2 rounded-xl hover:bg-red-500/20 text-red-400 border border-transparent transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex-1 w-full h-full relative cursor-crosshair">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
        <canvas ref={previewCanvasRef} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseOut={stopDraw} className="absolute inset-0 w-full h-full z-10" />
        
        {textInput && (
          <input 
            autoFocus
            value={textInput.text}
            onChange={e => setTextInput({...textInput, text: e.target.value})}
            onKeyDown={e => {
              if (e.key === 'Enter') placeText();
              if (e.key === 'Escape') setTextInput(null);
            }}
            style={{ left: textInput.x, top: textInput.y, color, font: '16px "Plus Jakarta Sans", sans-serif' }}
            className="absolute bg-transparent outline-none border-none whitespace-nowrap z-20"
            placeholder="Type..."
          />
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
  const [joinCodeOpen, setJoinCodeOpen] = useState(false);
  const [joinCode,    setJoinCode]    = useState('');
  const [newRoom,     setNewRoom]     = useState({ name:'', subject:SUBJECTS[0], description:'', type:'public', maxMembers:10, roomCode:'' });
  const [customRoomSubject, setCustomRoomSubject] = useState('');
  const [activeTab,   setActiveTab]   = useState('chat');
  const [groupQuizOpen, setGroupQuizOpen] = useState(false);
  const [socketOk,    setSocketOk]    = useState(false);
  const [participants, setParticipants] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // room id
  const [showLeaveConfirm,  setShowLeaveConfirm]  = useState(false);
  const [showEmojiPicker,   setShowEmojiPicker]   = useState(false);
  const inputRef = useRef(null);
  
  // Real-time features
  const [rooms, setRooms] = useState([]);
  const [customRooms, setCustomRooms] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizHost, setQuizHost] = useState(null);
  const [handRaised, setHandRaised] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusStarter, setFocusStarter] = useState('');
  const [focusTime, setFocusTime] = useState(0);

  // Host Privilege States
  const [roomOwnerUid, setRoomOwnerUid] = useState(null);
  const [chatLocked, setChatLocked] = useState(false);
  const [roomTimer, setRoomTimer] = useState(null);
  const [timerPopoverOpen, setTimerPopoverOpen] = useState(false);

  const msgEnd  = useRef(null);
  const socketRef = useRef(null);
  
  const isHost = user.uid === roomOwnerUid;
  const uniqueParticipants = participants.filter((p, idx, arr) => arr.findIndex(x => x.uid === p.uid) === idx);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // Focus Mode Timer
  useEffect(() => {
    let intv;
    if (focusMode) intv = setInterval(() => setFocusTime(t=>t+1), 1000);
    return () => clearInterval(intv);
  }, [focusMode]);

  // Room Timer Countdown
  useEffect(() => {
    let intv;
    if (roomTimer && roomTimer.secondsLeft > 0) {
      intv = setInterval(() => {
        setRoomTimer(prev => {
          if (!prev) return null;
          if (prev.secondsLeft <= 1) {
             clearInterval(intv);
             return { ...prev, secondsLeft: 0 };
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(intv);
  }, [roomTimer !== null]);

  useEffect(() => {
    if (roomTimer && roomTimer.secondsLeft === 0) {
      if (isHost && socketRef.current) {
        socketRef.current.emit('room-timer-end', { roomId: room?.id, label: roomTimer.label });
      }
    }
  }, [roomTimer?.secondsLeft, isHost, room?.id]);

  // Decrement handler for leaving
  const decrementCount = async (id) => {
    try { await updateDoc(doc(db, 'studyRooms', id), { participantCount: increment(-1) }); } catch {}
  };

  useEffect(() => {
    const handleUnload = () => { if (room) decrementCount(room.id); };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [room]);

  // Load Firestore Rooms
  useEffect(() => {
    const q = query(collection(db, 'studyRooms'));
    const unsub = onSnapshot(q, async (snap) => {
      const allRooms = snap.docs.map(d => ({id: d.id, ...d.data()}));
      if (allRooms.length === 0) {
        for (const r of DEMO_ROOMS) {
          await setDoc(doc(db, 'studyRooms', r.id), r);
        }
      } else {
        setRooms(allRooms.filter(r => r.isDemo || r.type === 'public'));
        setCustomRooms(allRooms.filter(r => !r.isDemo && r.createdBy === user.uid));
      }
    });
    return unsub;
  }, [user.uid]);

  const joinRoom = async (r) => {
    try { await updateDoc(doc(db, 'studyRooms', r.id), { participantCount: increment(1) }); } catch {}
    setRoomOwnerUid(r.createdBy || null);
    setRoom(r);
    setPhase('room');
    setActiveTab('chat');
    audioSystem.playRoomJoin();

    /* Load last 50 messages from Firestore */
    try {
      const q    = query(collection(db, 'studyRooms', r.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
      const snap = await getDocs(q);
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString() })));
    } catch {}

    const apiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5000';

    import('socket.io-client').then(({ io }) => {
      const s = io(apiUrl, { transports:['websocket','polling'], timeout:2500, reconnectionAttempts:1 });
      
      const handleLeaveLocal = () => {
        setPhase('browse'); setRoom(null); setMessages([]);
        setHandRaised(false); setFocusMode(false); setActiveQuiz(null); setParticipants([]);
        setRoomOwnerUid(null); setChatLocked(false); setRoomTimer(null); setSocketOk(false);
        s.disconnect();
      };

      s.on('connect', () => { 
        setSocketOk(true); 
        s.emit('join-room', { roomId:r.id, roomName:r.name, subject:r.subject, uid:user.uid, displayName:user.displayName||'Student' }); 
      });
      s.on('new-message', d => { setMessages(m => [...m,d]); });
      s.on('user-joined', d => addSys(d.message));
      s.on('user-left',   d => addSys(d.message));
      s.on('room-update', d => setParticipants(d.participants || []));
      s.on('raise-hand', d => { toast(`✋ ${d.displayName} raised their hand!`, { icon:'✋' }); });
      s.on('group-quiz-start', d => { setActiveQuiz(d.quiz); setQuizHost(d.host); setGroupQuizOpen(true); });
      s.on('focus-mode-toggle', d => { setFocusMode(d.active); setFocusStarter(d.starter); if(d.active) setFocusTime(0); });
      s.on('connect_error', () => setSocketOk(false));
      
      // Host feature listeners
      s.on('you-were-kicked', () => {
        toast.error('You were removed from this room by the host');
        decrementCount(r.id);
        handleLeaveLocal();
      });
      s.on('host-transferred', d => {
        setRoomOwnerUid(d.newHostUid);
        toast(`👑 ${d.newHostName} is now the host`);
      });
      s.on('chat-lock-toggle', d => {
        setChatLocked(d.locked);
        toast(d.locked ? `🔇 ${d.by} locked the room chat` : `🔊 ${d.by} unlocked the room chat`);
      });
      s.on('room-timer-start', d => {
        setRoomTimer({ secondsLeft: d.seconds, label: d.label });
      });
      s.on('room-timer-end', d => {
        setRoomTimer(null);
        audioSystem.playCorrect();
        toast(`⏱ ${d.label} timer ended!`);
      });
      s.on('room-announcement', d => {
        setMessages(m => [...m, { announcement: true, text: d.text, ts: new Date().toISOString() }]);
      });
      s.on('room-ended', () => {
        toast.error('The host ended this room');
        handleLeaveLocal();
      });

      socketRef.current = s;
    }).catch(() => setSocketOk(false));
  };

  const addSys = (text) => {
    const msg = { system:true, text, ts:new Date().toISOString() };
    setMessages(m => [...m,msg]);
  };

  const leaveRoom = async (skipDecrement = false) => {
    audioSystem.playClick();
    if (room && !skipDecrement) await decrementCount(room.id);
    if (socketRef.current) { 
      socketRef.current.emit('leave-room',{ roomId:room?.id, displayName:user.displayName }); 
      socketRef.current.disconnect(); 
      socketRef.current=null; 
    }
    setSocketOk(false); setPhase('browse'); setRoom(null); setMessages([]);
    setHandRaised(false); setFocusMode(false); setActiveQuiz(null); setParticipants([]);
    setRoomOwnerUid(null); setChatLocked(false); setRoomTimer(null);
  };

  const sendMsg = () => {
    if (!input.trim() || focusMode || (chatLocked && !isHost)) return;
    const msg = { uid:user.uid, displayName:user.displayName||'You', message:input.trim(), timestamp:new Date().toISOString() };
    if (socketRef.current?.connected) {
      socketRef.current.emit('room-message', { roomId:room.id, ...msg });
    } else {
      setMessages(m => [...m, msg]);
    }
    /* Persist to Firestore */
    if (room?.id) {
      addDoc(collection(db, 'studyRooms', room.id, 'messages'), {
        uid: user.uid, displayName: user.displayName || 'You',
        message: input.trim(), timestamp: serverTimestamp(),
      }).catch(() => {});
    }
    audioSystem.playClick();
    setInput('');
  };

  const joinWithCode = async () => {
    if (!joinCode.trim()) return toast.error('Enter a room code');
    audioSystem.playClick();
    const qSnap = await getDocs(query(collection(db, 'studyRooms'), where('roomCode', '==', joinCode.trim().toUpperCase())));
    if (qSnap.empty) {
      toast.error('Invalid room code');
    } else {
      const r = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
      setJoinCodeOpen(false);
      setJoinCode('');
      joinRoom(r);
    }
  };

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const createRoom = async () => {
    if (!newRoom.name.trim()) { toast.error('Enter a name'); return; }
    audioSystem.playCreate();
    const id = `c-${Date.now()}`;
    const emojis = { Mathematics:'🧮', Physics:'⚡', Chemistry:'⚗️', Biology:'🔬', 'Computer Science':'💻', General:'📚', History:'📜', Economics:'💰' };
    const actualSubject = newRoom.subject === 'Other' ? (customRoomSubject.trim() || 'General') : newRoom.subject;
    const r = { 
      id, name:newRoom.name.trim(), subject: actualSubject, emoji:emojis[actualSubject]||'📚', 
      isDemo:false, createdBy:user.uid, participantCount:0,
      description: newRoom.description.trim(),
      type: newRoom.type,
      maxMembers: newRoom.maxMembers,
      roomCode: newRoom.roomCode
    };
    await setDoc(doc(db, 'studyRooms', id), r);
    awardBadgeToFirestore(user.uid, 'study-room-create');
    setCreateOpen(false);
    setNewRoom({ name:'', subject:SUBJECTS[0], description:'', type:'public', maxMembers:10, roomCode:'' });
    setCustomRoomSubject('');
    joinRoom(r);
  };

  const deleteRoom = async (id) => { 
    audioSystem.playClick();
    await deleteDoc(doc(db, 'studyRooms', id));
  };

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    if (!el) { setInput(p => p + emoji); setShowEmojiPicker(false); return; }
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const next  = input.slice(0, start) + emoji + input.slice(end);
    setInput(next);
    setShowEmojiPicker(false);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
  };

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    if (next && socketRef.current) socketRef.current.emit('raise-hand', { roomId:room.id, displayName:user.displayName });
  };

  const toggleFocus = () => {
    const next = !focusMode;
    if (socketRef.current) socketRef.current.emit('focus-mode-toggle', { roomId:room.id, active:next, starter:user.displayName });
    setFocusMode(next);
    setFocusStarter(user.displayName);
    if (next) setFocusTime(0);
  };

  const handleStartQuiz = (quizData) => {
    setActiveQuiz(quizData);
    setQuizHost(user.displayName);
    if (socketRef.current) socketRef.current.emit('group-quiz-start', { roomId:room.id, quiz:quizData, host:user.displayName });
  };

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  // BROWSE
  if (phase === 'browse') return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pt-12 lg:pt-0 gap-4">
        <div>
          <h1 className="font-jakarta font-black text-3xl md:text-4xl text-txt mb-2">Study Rooms</h1>
          <p className="text-sm font-medium text-txt3">Chat · Group Quizzes · Shared Study Material</p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button onClick={() => { audioSystem.playClick(); setJoinCodeOpen(true); }} className="btn-outline flex items-center justify-center gap-2 text-sm py-3 px-6 bg-space-800 border-white/10">
            <Lock size={18} />Join via Code
          </button>
          <button onClick={() => { audioSystem.playClick(); setCreateOpen(true); }} className="btn-primary flex items-center justify-center gap-2 text-sm py-3 px-6 shadow-glow-primary">
            <Plus size={18} />Create Room
          </button>
        </div>
      </div>

      <div className={`flex items-center gap-3 rounded-xl p-4 mb-4 text-sm font-medium border shadow-sm ${socketOk ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'hidden'}`}>
        {socketOk && <><div className="p-1.5 bg-green-500/20 rounded-md"><Wifi size={16} /></div>Real-time server connected — multiplayer active!</>}
      </div>

      <div className="flex items-start gap-3 rounded-xl p-4 mb-8 text-sm font-medium bg-cyan/5 border border-cyan/20 text-cyan/80 shadow-sm">
        <div className="p-1.5 bg-cyan/10 rounded-md flex-shrink-0"><Info size={16} className="text-cyan" /></div>
        <p>To invite friends, share your room name or code. Both must be on the same deployed version of BrainNex.</p>
      </div>

      {customRooms.length > 0 && <>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-primary rounded-full"/>
          <p className="text-xs text-txt3 uppercase tracking-widest font-bold">Your Rooms</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
          {customRooms.map(r => <RoomCard key={r.id} room={r} onJoin={joinRoom} onDelete={(id) => { audioSystem.playClick(); setShowDeleteConfirm(id); }} />)}
        </div>
      </>}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-cyan rounded-full"/>
        <p className="text-xs text-txt3 uppercase tracking-widest font-bold">Public Rooms</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8">
        {rooms.map(r => <RoomCard key={r.id} room={r} onJoin={joinRoom} onDelete={null} />)}
      </div>

      <AnimatePresence>
        {createOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-space-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ scale:0.95, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }} exit={{ scale:0.95, y:20, opacity:0 }}
              onClick={e => e.stopPropagation()}
              className="p-8 max-w-md w-full shadow-2xl relative overflow-hidden border border-white/10 rounded-2xl"
              style={{ background: 'var(--bg2)', opacity: 1 }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none" />
              <h2 className="font-jakarta font-black text-2xl mb-6 text-txt relative z-10">Create Study Room</h2>
              <div className="space-y-5 mb-8 relative z-10">
                <div>
                  <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest block mb-2">Room Name</label>
                  <input value={newRoom.name} onChange={e => setNewRoom(r=>({...r,name:e.target.value}))}
                    placeholder="e.g. JEE Physics Group" className="input-field w-full text-sm py-3 border-white/10" autoFocus />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest">Room Description</label>
                    <span className="text-[10px] text-txt3">{newRoom.description.length}/120</span>
                  </div>
                  <textarea value={newRoom.description} onChange={e => setNewRoom(r=>({...r,description:e.target.value.substring(0,120)}))}
                    placeholder="What will your group study? (optional)" className="input-field w-full text-sm py-2 border-white/10 resize-none h-20" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest block mb-3">Subject</label>
                  <div className="flex flex-wrap gap-2.5">
                    {SUBJECTS.map(s => (
                      <button key={s} onClick={() => { audioSystem.playClick(); setNewRoom(r=>({...r,subject:s})); }}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all shadow-sm ${s===newRoom.subject?'bg-primary/10 border-primary/40 text-primary':'bg-space-800 border-white/10 text-txt3 hover:border-white/20 hover:text-txt2'}`}>{s}</button>
                    ))}
                    <button onClick={() => { audioSystem.playClick(); setNewRoom(r=>({...r,subject:'Other'})); }}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all shadow-sm ${'Other'===newRoom.subject?'bg-primary/10 border-primary/40 text-primary':'bg-space-800 border-white/10 text-txt3 hover:border-white/20 hover:text-txt2'}`}>Other</button>
                  </div>
                  {newRoom.subject === 'Other' && (
                    <input value={customRoomSubject} onChange={e => setCustomRoomSubject(e.target.value)}
                      placeholder="e.g. Web Development, Astronomy..." className="input-field w-full text-sm py-2.5 border-white/10 mt-3" />
                  )}
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest block mb-2">Room Type</label>
                    <div className="flex bg-space-800 p-1 rounded-xl border border-white/10">
                      <button onClick={()=>setNewRoom(r=>({...r,type:'public'}))} className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${newRoom.type==='public'?'bg-primary text-white':'text-txt3'}`}><Globe size={12}/>Public</button>
                      <button onClick={()=>setNewRoom(r=>({...r,type:'private', roomCode:r.roomCode||generateCode()}))} className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${newRoom.type==='private'?'bg-primary text-white':'text-txt3'}`}><Lock size={12}/>Private</button>
                    </div>
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest block mb-2">Limit</label>
                    <input type="number" min="2" max="50" value={newRoom.maxMembers} onChange={e=>setNewRoom(r=>({...r,maxMembers:parseInt(e.target.value)||10}))}
                      className="input-field w-full text-sm py-2 text-center border-white/10" />
                  </div>
                </div>
                {newRoom.type === 'private' && (
                  <div>
                    <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest block mb-2">Room Code</label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-space-800 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono tracking-widest text-center flex items-center justify-center text-txt">
                        {newRoom.roomCode}
                      </div>
                      <button onClick={()=>{navigator.clipboard.writeText(newRoom.roomCode); toast.success('Code Copied!');}} className="btn-outline px-4 bg-space-800 border-white/10 text-txt2 hover:text-txt flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"><Copy size={14}/>Copy</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4 relative z-10">
                <button onClick={() => { audioSystem.playClick(); setCreateOpen(false); }} className="flex-1 btn-outline py-3.5 text-sm bg-space-800 border-white/10">Cancel</button>
                <button onClick={createRoom} className="flex-1 btn-primary py-3.5 text-sm shadow-glow-primary">Create & Join →</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {joinCodeOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-space-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setJoinCodeOpen(false)}>
            <motion.div initial={{ scale:0.95, y:20, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }} exit={{ scale:0.95, y:20, opacity:0 }}
              onClick={e => e.stopPropagation()}
              className="p-8 max-w-sm w-full shadow-2xl relative overflow-hidden border border-white/10 rounded-2xl"
              style={{ background: 'var(--bg2)', opacity: 1 }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan/10 rounded-bl-full pointer-events-none" />
              <h2 className="font-jakarta font-black text-2xl mb-6 text-txt relative z-10">Join Room</h2>
              <div className="space-y-5 mb-8 relative z-10">
                <div>
                  <label className="text-[10px] font-bold text-txt3 uppercase tracking-widest block mb-2">Room Code</label>
                  <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key==='Enter'&&joinWithCode()}
                    placeholder="e.g. A1B2C3" className="input-field w-full text-lg py-3 border-white/10 text-center font-mono tracking-widest uppercase" autoFocus />
                </div>
              </div>
              <div className="flex gap-4 relative z-10">
                <button onClick={() => { audioSystem.playClick(); setJoinCodeOpen(false); }} className="flex-1 btn-outline py-3 text-sm bg-space-800 border-white/10">Cancel</button>
                <button onClick={joinWithCode} className="flex-1 btn-primary py-3 text-sm shadow-glow-primary">Join Room →</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete room confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <ConfirmModal
            title="Delete Room?"
            message="Are you sure you want to delete this room? All messages and materials will be permanently deleted."
            confirmLabel="Delete"
            confirmClass="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20"
            onConfirm={() => { deleteRoom(showDeleteConfirm); setShowDeleteConfirm(null); }}
            onCancel={() => setShowDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );

  // ROOM
  return (
    <div className="h-full min-h-[calc(100vh-2rem)] m-4 flex flex-col rounded-3xl border border-white/10 shadow-2xl overflow-hidden glass-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-white/10 bg-space-800/80 backdrop-blur-md flex-shrink-0 relative z-20 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl border border-primary/20 shadow-sm">{room?.emoji}</div>
          <div>
            <p className="font-jakarta font-black text-lg text-txt mb-0.5">{room?.name}</p>
            <p className="text-xs font-bold text-txt3 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center gap-1"><Users size={12} className="text-txt3"/>{uniqueParticipants.length} Live</span>
              <span className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1.5 ${socketOk ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                {socketOk && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-blink shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                {socketOk ? `${uniqueParticipants.length} Live Now` : 'Local'}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {roomTimer && (
            <div className="flex items-center gap-2 bg-primary/20 border border-primary/50 text-primary px-3 py-1.5 rounded-xl font-mono text-sm font-bold shadow-sm mr-2">
              ⏱ {formatTime(roomTimer.secondsLeft)}
              {isHost && (
                <button onClick={() => {
                  if(socketRef.current) socketRef.current.emit('room-timer-end', { roomId: room.id, label: roomTimer.label + ' (Cancelled)' });
                }} className="hover:text-white transition-colors ml-1"><X size={14}/></button>
              )}
            </div>
          )}

          {isHost && (
            <div className="relative">
              <button onClick={() => setTimerPopoverOpen(!timerPopoverOpen)} title="Start a room-wide timer"
                className="flex items-center gap-2 text-xs font-bold text-txt2 bg-space-700/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 hover:bg-space-700 transition-all shadow-sm">
                <Timer size={14} />Set Timer
              </button>
              {timerPopoverOpen && (
                <div className="absolute top-full mt-2 right-0 bg-space-800 border border-white/10 rounded-xl p-2 w-48 z-50 shadow-2xl">
                  {[ {l:'5 min', s:300}, {l:'10 min', s:600}, {l:'15 min', s:900}, {l:'25 min (Pomodoro)', s:1500}, {l:'30 min', s:1800} ].map(opt => (
                    <button key={opt.l} onClick={() => {
                      setTimerPopoverOpen(false);
                      if (socketRef.current) socketRef.current.emit('room-timer-start', { roomId: room.id, seconds: opt.s, label: opt.l, startedBy: user.displayName });
                    }} className="block w-full text-left px-3 py-2 text-xs hover:bg-white/5 rounded-lg text-txt2 hover:text-txt">
                      {opt.l}
                    </button>
                  ))}
                  <button onClick={() => {
                    setTimerPopoverOpen(false);
                    const m = parseInt(prompt('Enter minutes:'), 10);
                    if (m > 0 && socketRef.current) socketRef.current.emit('room-timer-start', { roomId: room.id, seconds: m * 60, label: `${m} min`, startedBy: user.displayName });
                  }} className="block w-full text-left px-3 py-2 text-xs hover:bg-white/5 rounded-lg text-txt2 hover:text-txt border-t border-white/10 mt-1 pt-2">Custom</button>
                </div>
              )}
            </div>
          )}

          {isHost && (
            <button onClick={() => {
              const next = !chatLocked;
              if (socketRef.current) socketRef.current.emit('chat-lock-toggle', { roomId: room.id, locked: next, by: user.displayName });
              setChatLocked(next);
            }} title={chatLocked ? "Unlock room chat" : "Lock room chat"}
              className={`flex items-center gap-2 text-xs font-bold rounded-xl px-3 sm:px-4 py-2 transition-all shadow-sm border ${chatLocked ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-space-700/50 border-white/10 text-txt2 hover:bg-space-700'}`}>
              {chatLocked ? <><VolumeX size={14}/>Unlock Chat</> : <><Volume2 size={14}/>Lock Chat</>}
            </button>
          )}

          {/* Raise Hand button */}
          <button onClick={toggleHand} title="Raise your hand to get the group's attention"
            className={`flex items-center gap-2 text-xs font-bold rounded-xl px-3 sm:px-4 py-2 transition-all shadow-sm border ${handRaised ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-space-700/50 border-white/10 text-txt2 hover:bg-space-700'}`}>
            <Hand size={14} />{handRaised ? 'Lower Hand' : 'Raise Hand'}
          </button>
          
          {/* Focus Mode button */}
          <button onClick={toggleFocus} title="Start a distraction-free focus session for the whole room"
            className={`flex items-center gap-2 text-xs font-bold rounded-xl px-3 sm:px-4 py-2 transition-all shadow-sm border ${focusMode ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-space-700/50 border-white/10 text-txt2 hover:bg-space-700'}`}>
            <Target size={14} />Focus Mode
          </button>

          {/* Group quiz button */}
          <button onClick={() => { audioSystem.playClick(); setGroupQuizOpen(true); }} title="Generate and share a live quiz with your study group"
            className="flex items-center gap-2 text-xs font-bold bg-cyan/10 border border-cyan/20 text-cyan rounded-xl px-3 sm:px-4 py-2 hover:bg-cyan/20 transition-all shadow-sm">
            <FileQuestion size={14} />Group Quiz
          </button>

          <button onClick={() => { audioSystem.playClick(); setShowLeaveConfirm(true); }} title="Leave this study room"
            className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/30 rounded-xl px-3 sm:px-4 py-2 hover:bg-red-500/20 transition-all shadow-sm">
            <LogOut size={14} />Leave
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 flex-shrink-0 bg-space-900/50 overflow-x-auto custom-scrollbar-hide relative z-10">
        <style>{`.custom-scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        {[
          { id:'chat',     label:'💬 Room Chat',            },
          { id:'members',  label:'👥 Members',            },
          { id:'material', label:'📚 Study Material', },
          { id:'whiteboard', label:'🎨 Whiteboard', },
          ...(isHost ? [{ id:'host', label:'⚙️ Host Controls' }] : []),
        ].map(t => (
          <button key={t.id} onClick={() => { audioSystem.playClick(); setActiveTab(t.id); }}
            className={`whitespace-nowrap px-6 sm:px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab===t.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-txt3 hover:text-txt2 hover:bg-white/5'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none z-0" />
        
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col bg-space-dark/40 relative z-10">
            {focusMode && (
              <div className="bg-primary/20 border-b border-primary/20 px-6 py-2 flex items-center justify-between shadow-inner flex-shrink-0">
                 <p className="text-xs font-bold text-primary-light flex items-center gap-2">
                    <Target size={14} className="animate-pulse" /> 
                    Focus Mode active — started by {focusStarter}
                 </p>
                 <p className="text-xs font-mono font-bold text-primary-light">
                    {formatTime(focusTime)}
                 </p>
              </div>
            )}
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) =>
                  msg.announcement ? (
                    <motion.div key={i} initial={{opacity:0, y:10}} animate={{opacity:1,y:0}}
                      className="w-full bg-purple-500/20 border border-purple-500/50 rounded-xl p-4 my-4 flex items-center gap-4 text-purple-200">
                      <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0"><Megaphone size={20}/></div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-purple-400 mb-1">Room Announcement</p>
                        <p className="text-sm font-medium">{msg.text}</p>
                      </div>
                    </motion.div>
                  ) : msg.system ? (
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
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm border ${msg.uid===user.uid?'bg-primary text-white font-medium rounded-tr-sm border-primary/50':'bg-space-800 border-white/10 text-txt2 rounded-tl-sm'}`}>
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
            <div className="px-6 py-5 border-t border-white/10 bg-space-800/90 backdrop-blur-md flex-shrink-0">
              <div className="flex gap-3 relative">
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key==='Enter'&&sendMsg()} disabled={focusMode || (chatLocked && !isHost)}
                  placeholder={focusMode ? "Chat disabled during Focus Mode" : (chatLocked && !isHost) ? "🔇 Chat locked by host" : "Message the room..."}
                  className="input-field flex-1 text-sm py-3 disabled:opacity-50 border-white/10" />
                {/* Emoji button */}
                <div className="relative">
                  <button onClick={() => setShowEmojiPicker(p => !p)}
                    className="w-12 h-12 rounded-xl bg-space-700 border border-white/10 flex items-center justify-center text-txt3 hover:text-txt hover:bg-space-800 transition-all">
                    <Smile size={18} />
                  </button>
                  <AnimatePresence>
                    {showEmojiPicker && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} />}
                  </AnimatePresence>
                </div>
                {/* Send button */}
                <motion.button whileHover={{scale:1.05}} whileTap={{ scale:0.95 }} onClick={sendMsg} disabled={!input.trim() || focusMode || (chatLocked && !isHost)}
                  className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all shadow-glow-primary"
                  style={{ background: 'linear-gradient(135deg, var(--primary), #7c3aed)', border: '1px solid rgba(139,92,246,0.4)' }}>
                  <Send size={18} className="text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="h-full overflow-y-auto px-6 py-6 custom-scrollbar bg-space-dark/40 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {uniqueParticipants.map(p => (
                  <div key={p.uid} className="glass-card p-4 flex items-center justify-between shadow-sm border-white/5 group">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl text-lg font-black text-white flex items-center justify-center flex-shrink-0 shadow-sm"
                            style={{ background:'linear-gradient(135deg,var(--primary),var(--cyan))' }}>
                          {(p.displayName||'U')[0].toUpperCase()}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-jakarta font-bold text-base text-txt truncate">{p.displayName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {p.uid === user.uid && <span className="text-[10px] inline-block font-bold px-2 py-0.5 bg-primary/20 text-primary rounded-md uppercase tracking-wider border border-primary/20">You</span>}
                            {p.uid === roomOwnerUid && <span className="text-[10px] inline-block font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md uppercase tracking-wider">👑 Host</span>}
                          </div>
                       </div>
                     </div>
                     {isHost && p.uid !== user.uid && (
                       <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => {
                           if(socketRef.current) socketRef.current.emit('transfer-host', { roomId:room.id, newHostUid: p.uid, newHostName: p.displayName, previousHostName: user.displayName });
                         }} className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 border border-amber-500/20 shadow-sm flex items-center gap-1"><Settings size={10}/> Make Host</button>
                         <button onClick={() => {
                           if(socketRef.current) socketRef.current.emit('kick-user', { roomId:room.id, targetUid: p.uid, kickedBy: user.displayName });
                           toast(`Removed ${p.displayName} from the room`);
                         }} className="text-[10px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 border border-red-500/20 shadow-sm flex items-center gap-1"><X size={10}/> Remove</button>
                       </div>
                     )}
                  </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'host' && isHost && (
          <div className="p-6 h-full overflow-y-auto bg-space-dark/40 relative z-10 custom-scrollbar">
            <h2 className="text-xl font-bold text-txt mb-6 flex items-center gap-2"><Settings size={20} className="text-primary"/> Host Controls</h2>
            
            <div className="mb-8 p-5 bg-space-800 rounded-xl border border-white/10 shadow-sm">
              <p className="text-sm text-txt2 mb-2"><span className="font-bold text-txt uppercase tracking-wider text-xs mr-2">Room Name:</span> {room.name}</p>
              <p className="text-sm text-txt2 mb-2"><span className="font-bold text-txt uppercase tracking-wider text-xs mr-2">Subject:</span> {room.subject}</p>
              {room.type === 'private' && <p className="text-sm text-txt2"><span className="font-bold text-txt uppercase tracking-wider text-xs mr-2">Code:</span> <span className="font-mono text-cyan bg-cyan/10 px-2 py-0.5 rounded border border-cyan/20">{room.roomCode}</span></p>}
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-bold text-txt mb-3 uppercase tracking-wider">Room Announcement</h3>
              <div className="flex gap-3">
                <input id="announcementInput" placeholder="Type announcement for all members..." className="input-field flex-1 text-sm border-white/10" />
                <button onClick={() => {
                  const val = document.getElementById('announcementInput').value;
                  if(val && socketRef.current) {
                     socketRef.current.emit('room-announcement', { roomId: room.id, text: val });
                     document.getElementById('announcementInput').value = '';
                     toast.success('Announcement sent');
                     setActiveTab('chat');
                  }
                }} className="btn-primary px-6 py-2.5 text-sm flex gap-2 shadow-glow-primary"><Megaphone size={16}/> Send</button>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-bold text-txt mb-3 uppercase tracking-wider">Whiteboard</h3>
              <button onClick={() => {
                if (socketRef.current) socketRef.current.emit('whiteboard-clear', { roomId: room.id });
                toast.success('Whiteboard cleared for everyone');
              }} className="btn-outline border-white/10 text-txt2 hover:bg-space-800 px-5 py-2.5 text-sm flex gap-2"><Eraser size={16}/>Clear Whiteboard for All</button>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <button onClick={async () => {
                if (window.confirm('Are you sure you want to end this room? This cannot be undone.')) {
                  if(socketRef.current) socketRef.current.emit('room-ended', { roomId: room.id });
                  await deleteRoom(room.id);
                  leaveRoom(true);
                }
              }} className="bg-red-500/10 text-red-500 border border-red-500/30 px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-500/20 shadow-sm flex items-center gap-2">
                <Trash2 size={16}/> End Room
              </button>
            </div>
          </div>
        )}

        {activeTab === 'material' && (
          <MaterialPanel roomId={room?.id} user={user} />
        )}

        <div className={`absolute inset-0 z-20 ${activeTab === 'whiteboard' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <Whiteboard socket={socketRef.current} roomId={room?.id} />
        </div>
      </div>

      {/* Group Quiz Modal */}
      <AnimatePresence>
        {groupQuizOpen && <GroupQuiz room={room} user={user} onClose={() => setGroupQuizOpen(false)} socket={socketRef.current} activeQuiz={activeQuiz} host={quizHost} onStartQuiz={handleStartQuiz} />}
      </AnimatePresence>

      {/* Leave confirm */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <ConfirmModal
            title="Leave Room?"
            message="Are you sure you want to leave this room?"
            confirmLabel="Leave"
            confirmClass="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20"
            onConfirm={() => { setShowLeaveConfirm(false); leaveRoom(false); }}
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}



import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, LogOut, Plus, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','Computer Science','General','History','Economics'];
const ROOM_MSGS_KEY = (roomId) => `brainnex-room-msgs-${roomId}`;
const CUSTOM_ROOMS_KEY = 'brainnex-custom-rooms';

function loadRoomMessages(roomId) {
  try { return JSON.parse(localStorage.getItem(ROOM_MSGS_KEY(roomId)) || '[]'); } catch { return []; }
}
function saveRoomMessages(roomId, messages) {
  try { localStorage.setItem(ROOM_MSGS_KEY(roomId), JSON.stringify(messages.slice(-100))); } catch {}
}
function loadCustomRooms() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_ROOMS_KEY) || '[]'); } catch { return []; }
}
function saveCustomRooms(rooms) {
  localStorage.setItem(CUSTOM_ROOMS_KEY, JSON.stringify(rooms));
}

const DEMO_ROOMS = [
  { id:'room-math-001', name:'Calculus Study Group',    subject:'Mathematics',      emoji:'🧮', count:4 },
  { id:'room-phys-001', name:'Physics Problem Solving', subject:'Physics',           emoji:'⚡', count:6 },
  { id:'room-cs-001',   name:'DSA & Algorithms',        subject:'Computer Science', emoji:'💻', count:3 },
  { id:'room-chem-001', name:'Organic Chemistry Help',  subject:'Chemistry',         emoji:'⚗️', count:2 },
];

function RoomCard({ room, onJoin, onDelete }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass border border-brand-border rounded-2xl p-5 cursor-pointer transition-all hover:border-brand-border2 relative group"
      onClick={() => onJoin(room)}>
      {onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(room.id); }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
          <Trash2 size={11} />
        </button>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-lg">{room.emoji}</div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-neon-green/20 text-neon-green rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink" />Live
        </span>
      </div>
      <h3 className="font-syne font-bold text-sm mb-1 pr-6">{room.name}</h3>
      <p className="text-xs text-white/40 mb-3">{room.subject}</p>
      <div className="flex items-center justify-between text-xs text-white/30">
        <div className="flex items-center gap-1.5"><Users size={10} />{room.count} students</div>
        <span className="text-cyan">Join →</span>
      </div>
    </motion.div>
  );
}

export default function StudyRoomsPage() {
  const { user } = useAuth();
  const [phase,        setPhase]        = useState('browse');
  const [currentRoom,  setCurrentRoom]  = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [createOpen,   setCreateOpen]   = useState(false);
  const [newRoom,      setNewRoom]      = useState({ name:'', subject: SUBJECTS[0] });
  const [customRooms,  setCustomRooms]  = useState(loadCustomRooms);
  const [socketOk,     setSocketOk]     = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef      = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const tryConnectSocket = useCallback((room) => {
    try {
      // Dynamic import to avoid crash if socket.io-client not installed
      import('socket.io-client').then(({ io }) => {
        const socket = io('http://localhost:5000', { transports:['websocket','polling'], timeout:3000, reconnectionAttempts:1 });
        socket.on('connect', () => {
          setSocketOk(true);
          socket.emit('join-room', { roomId:room.id, roomName:room.name, subject:room.subject, uid:user.uid, displayName:user.displayName||'Student' });
        });
        socket.on('new-message', d => {
          setMessages(prev => {
            const updated = [...prev, d];
            saveRoomMessages(room.id, updated);
            return updated;
          });
        });
        socket.on('user-joined', d => addSystem(room.id, d.message));
        socket.on('user-left',   d => addSystem(room.id, d.message));
        socket.on('connect_error', () => setSocketOk(false));
        socketRef.current = socket;
      }).catch(() => setSocketOk(false));
    } catch { setSocketOk(false); }
  }, [user]);

  const addSystem = (roomId, text) => {
    const msg = { system:true, text, ts:new Date().toISOString() };
    setMessages(prev => { const u = [...prev, msg]; saveRoomMessages(roomId, u); return u; });
  };

  const joinRoom = (room) => {
    // Load persisted messages first
    const persisted = loadRoomMessages(room.id);
    const joinMsg   = { system:true, text:`You joined "${room.name}". ${persisted.length > 0 ? `${persisted.length} previous messages loaded.` : ''}`, ts:new Date().toISOString() };
    setMessages([...persisted, joinMsg]);
    setCurrentRoom(room);
    setPhase('room');
    tryConnectSocket(room);
    toast.success(`Joined ${room.name}!`);
  };

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId:currentRoom.id, displayName:user.displayName });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocketOk(false);
    setPhase('browse');
    setCurrentRoom(null);
    setMessages([]);
  };

  const sendMsg = () => {
    if (!input.trim()) return;
    const msg = {
      uid: user.uid, displayName: user.displayName||'You',
      message: input.trim(), timestamp: new Date().toISOString(),
    };
    if (socketRef.current?.connected) {
      socketRef.current.emit('room-message', { roomId:currentRoom.id, ...msg });
    } else {
      // Local mode — save immediately
      setMessages(prev => {
        const updated = [...prev, msg];
        saveRoomMessages(currentRoom.id, updated);
        return updated;
      });
    }
    setInput('');
  };

  const createRoom = () => {
    if (!newRoom.name.trim()) { toast.error('Enter a room name'); return; }
    const emojis = { Mathematics:'🧮', Physics:'⚡', Chemistry:'⚗️', Biology:'🔬', 'Computer Science':'💻', General:'📚', History:'📜', Economics:'💰' };
    const room = {
      id:      `custom-${Date.now()}`,
      name:    newRoom.name.trim(),
      subject: newRoom.subject,
      emoji:   emojis[newRoom.subject] || '📚',
      count:   1, custom: true,
    };
    const updated = [room, ...customRooms];
    setCustomRooms(updated);
    saveCustomRooms(updated);
    setCreateOpen(false);
    setNewRoom({ name:'', subject:SUBJECTS[0] });
    joinRoom(room);
  };

  const deleteCustomRoom = (roomId) => {
    const updated = customRooms.filter(r => r.id !== roomId);
    setCustomRooms(updated);
    saveCustomRooms(updated);
    localStorage.removeItem(ROOM_MSGS_KEY(roomId));
    toast.success('Room deleted');
  };

  // ── BROWSE ──
  if (phase === 'browse') return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-5 pt-10 lg:pt-0">
        <div>
          <h1 className="font-syne font-black text-2xl md:text-3xl mb-1">Study Rooms</h1>
          <p className="text-white/40 text-sm">Collaborative learning — messages saved locally</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-cyan flex items-center gap-2 text-sm py-2.5">
          <Plus size={15} />Create Room
        </button>
      </div>

      {/* Backend status */}
      <div className={`flex items-center gap-2 rounded-xl p-3 mb-4 text-xs border ${socketOk ? 'bg-neon-green/10 border-neon-green/20 text-neon-green' : 'bg-white/[0.03] border-brand-border text-white/35'}`}>
        {socketOk ? <Wifi size={12} /> : <WifiOff size={12} />}
        {socketOk ? 'Real-time server connected — multiplayer active!'
          : 'Local mode: messages save to your device. Start the backend server for real-time multiplayer.'}
      </div>

      {customRooms.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-white/30 mb-2 uppercase tracking-widest font-semibold">Your Rooms</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customRooms.map(r => <RoomCard key={r.id} room={r} onJoin={joinRoom} onDelete={deleteCustomRoom} />)}
          </div>
        </div>
      )}
      <p className="text-xs text-white/30 mb-2 uppercase tracking-widest font-semibold">Public Rooms</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEMO_ROOMS.map(r => <RoomCard key={r.id} room={r} onJoin={joinRoom} onDelete={null} />)}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {createOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}
              className="glass border border-brand-border2 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h2 className="font-syne font-bold text-xl mb-1">Create Study Room</h2>
              <p className="text-xs text-white/40 mb-5">Messages are saved locally on your device</p>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Room Name</label>
                  <input value={newRoom.name} onChange={e => setNewRoom(r => ({ ...r, name:e.target.value }))}
                    onKeyDown={e => e.key==='Enter' && createRoom()}
                    placeholder="e.g. JEE Physics Group" className="input-dark w-full text-sm" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Subject</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUBJECTS.map(s => (
                      <button key={s} onClick={() => setNewRoom(r => ({ ...r, subject:s }))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${s===newRoom.subject ? 'bg-cyan/20 border-cyan/40 text-cyan' : 'border-brand-border text-white/40'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
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

  // ── ROOM CHAT ──
  return (
    <div className="h-screen flex flex-col pt-14 lg:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-bg2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan/10 flex items-center justify-center">{currentRoom?.emoji}</div>
          <div>
            <p className="font-syne font-bold text-sm">{currentRoom?.name}</p>
            <p className="text-xs text-white/40 flex items-center gap-1">
              <Users size={9} />{currentRoom?.subject}
              <span className={socketOk ? 'text-neon-green' : 'text-neon-amber'}> · {socketOk ? 'Live' : 'Local'}</span>
            </p>
          </div>
        </div>
        <button onClick={leaveRoom}
          className="flex items-center gap-1.5 text-xs text-red-400 border border-red-500/20 rounded-xl px-3 py-1.5 hover:bg-red-500/10 transition-all">
          <LogOut size={12} />Leave
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) =>
            msg.system ? (
              <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="text-center text-xs text-white/25 py-1">{msg.text}</motion.div>
            ) : (
              <motion.div key={i} initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }}
                className={`flex gap-2.5 ${msg.uid === user.uid ? 'justify-end' : ''}`}>
                {msg.uid !== user.uid && (
                  <div className="w-7 h-7 rounded-xl text-xs font-bold text-brand-bg flex items-center justify-center flex-shrink-0"
                    style={{ background:'linear-gradient(135deg,#a78bfa,#00e5ff)' }}>
                    {(msg.displayName||'U')[0].toUpperCase()}
                  </div>
                )}
                <div className={`max-w-xs flex flex-col ${msg.uid===user.uid ? 'items-end' : 'items-start'}`}>
                  {msg.uid !== user.uid && <p className="text-[10px] text-white/30 mb-0.5 ml-1">{msg.displayName}</p>}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${msg.uid===user.uid ? 'bg-cyan text-brand-bg font-medium rounded-br-sm' : 'bg-white/[0.06] border border-white/[0.08] rounded-bl-sm'}`}>
                    {msg.message}
                  </div>
                  <p className="text-[9px] text-white/15 mt-0.5 px-1">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : ''}
                  </p>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-brand-border bg-brand-bg2 flex-shrink-0">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && sendMsg()}
            placeholder="Send a message..." className="input-dark flex-1 text-sm" />
          <motion.button whileTap={{ scale:0.92 }} onClick={sendMsg} disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-cyan flex items-center justify-center text-brand-bg disabled:opacity-40">
            <Send size={15} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

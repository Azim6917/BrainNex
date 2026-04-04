import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Users, Send, LogOut, Plus, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
// import { v4 as uuidv4 } from 'uuid';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'General'];
const socketRef = { current: null };

function RoomCard({ room, onJoin }) {
  return (
    <motion.div whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.2)' }}
      className="glass border border-brand-border rounded-2xl p-5 cursor-pointer transition-all"
      onClick={() => onJoin(room)}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-cyan/20 flex items-center justify-center text-lg">{room.emoji}</div>
        <span className="text-xs font-semibold px-2 py-1 bg-neon-green/20 text-neon-green rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink" /> Live
        </span>
      </div>
      <h3 className="font-syne font-bold text-base mb-1">{room.name}</h3>
      <p className="text-xs text-white/40 mb-3">{room.subject}</p>
      <div className="flex items-center justify-between text-xs text-white/30">
        <div className="flex items-center gap-1.5"><Users size={11} /> {room.count} students</div>
        <span>Join →</span>
      </div>
    </motion.div>
  );
}

const DEMO_ROOMS = [
  { id: 'room-math-001', name: 'Calculus Study Group', subject: 'Mathematics', emoji: '🧮', count: 4 },
  { id: 'room-phys-001', name: 'Physics Problem Solving', subject: 'Physics', emoji: '⚡', count: 6 },
  { id: 'room-cs-001',   name: 'DSA & Algorithms',       subject: 'Computer Science', emoji: '💻', count: 3 },
  { id: 'room-chem-001', name: 'Organic Chemistry Help', subject: 'Chemistry', emoji: '⚗️', count: 2 },
];

export default function StudyRoomsPage() {
  const { user } = useAuth();
  const [phase, setPhase]         = useState('browse'); // browse | room
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [participants, setParticipants] = useState([]);
  const [input, setInput]         = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoom, setNewRoom]     = useState({ name: '', subject: SUBJECTS[0] });
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const initSocket = () => {
    if (socketRef.current) return;
    socketRef.current = io('/', { transports: ['websocket', 'polling'] });
  };

  const joinRoom = (room) => {
    initSocket();
    const socket = socketRef.current;

    socket.emit('join-room', {
      roomId:      room.id,
      roomName:    room.name,
      subject:     room.subject,
      uid:         user.uid,
      displayName: user.displayName || 'Student',
    });

    socket.on('room-joined', ({ participants: p }) => {
      setParticipants(p);
      setMessages([{ system: true, text: `You joined ${room.name}`, ts: new Date().toISOString() }]);
    });
    socket.on('room-update',  ({ participants: p }) => setParticipants(p));
    socket.on('user-joined',  (d) => setMessages(m => [...m, { system: true, text: d.message, ts: d.timestamp }]));
    socket.on('user-left',    (d) => setMessages(m => [...m, { system: true, text: d.message, ts: d.timestamp }]));
    socket.on('new-message',  (d) => setMessages(m => [...m, d]));

    setCurrentRoom(room);
    setPhase('room');
    toast.success(`Joined ${room.name}!`);
  };

  const leaveRoom = () => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('leave-room', { roomId: currentRoom.id, displayName: user.displayName });
      socketRef.current.off('room-joined');
      socketRef.current.off('room-update');
      socketRef.current.off('user-joined');
      socketRef.current.off('user-left');
      socketRef.current.off('new-message');
    }
    setPhase('browse');
    setCurrentRoom(null);
    setMessages([]);
    setParticipants([]);
  };

  const sendMsg = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('room-message', {
      roomId:      currentRoom.id,
      message:     input.trim(),
      displayName: user.displayName || 'Student',
      uid:         user.uid,
    });
    setInput('');
  };

  const createRoom = () => {
    if (!newRoom.name.trim()) { toast.error('Enter a room name'); return; }
    const room = {
      id:      `room-${uuidv4()}`,
      name:    newRoom.name,
      subject: newRoom.subject,
      emoji:   '📚',
      count:   0,
    };
    joinRoom(room);
    setCreateOpen(false);
    setNewRoom({ name: '', subject: SUBJECTS[0] });
  };

  /* BROWSE */
  if (phase === 'browse') return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-black text-3xl mb-1">Study Rooms</h1>
          <p className="text-white/40 text-sm">Real-time collaborative learning with peers</p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="btn-cyan flex items-center gap-2 text-sm py-2.5">
          <Plus size={16} /> Create Room
        </button>
      </div>

      {/* Info banner */}
      <div className="glass border border-cyan/20 rounded-2xl p-4 mb-6 flex gap-3 text-sm">
        <div className="text-2xl">💡</div>
        <div>
          <p className="font-semibold text-cyan mb-0.5">How Study Rooms Work</p>
          <p className="text-white/50 text-xs leading-relaxed">Join a room to chat in real-time with other students studying the same subject. Ask questions, share resources, and learn together. Rooms require the backend server to be running for real-time features.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DEMO_ROOMS.map(r => <RoomCard key={r.id} room={r} onJoin={joinRoom} />)}
      </div>

      {/* Create room modal */}
      <AnimatePresence>
        {createOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="glass border border-brand-border2 rounded-2xl p-6 max-w-sm w-full">
              <h2 className="font-syne font-bold text-xl mb-5">Create Study Room</h2>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Room Name</label>
                  <input value={newRoom.name} onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))}
                    placeholder="e.g. JEE Physics Group" className="input-dark w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Subject</label>
                  <select value={newRoom.subject} onChange={e => setNewRoom(r => ({ ...r, subject: e.target.value }))}
                    className="input-dark w-full">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCreateOpen(false)} className="flex-1 btn-outline py-2.5 text-sm">Cancel</button>
                <button onClick={createRoom} className="flex-1 btn-cyan py-2.5 text-sm">Create & Join</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ROOM CHAT */
  return (
    <div className="h-screen flex flex-col">
      {/* Room header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-brand-border bg-brand-bg2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan/20 flex items-center justify-center text-lg">📚</div>
          <div>
            <p className="font-syne font-bold text-sm">{currentRoom?.name}</p>
            <p className="text-xs text-white/40 flex items-center gap-1.5">
              <Users size={10} /> {participants.length} online · {currentRoom?.subject}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Participants avatars */}
          <div className="flex -space-x-2">
            {participants.slice(0, 5).map((p, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan border-2 border-brand-bg2 flex items-center justify-center text-xs font-bold text-brand-bg">
                {(p.displayName || 'U')[0].toUpperCase()}
              </div>
            ))}
          </div>
          <button onClick={leaveRoom}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 glass border border-red-500/20 rounded-xl px-3 py-1.5 transition-all">
            <LogOut size={13} /> Leave
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => msg.system ? (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-xs text-white/25 py-1">
              {msg.text}
            </motion.div>
          ) : (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.uid === user.uid ? 'justify-end' : ''}`}>
              {msg.uid !== user.uid && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-400 to-cyan flex items-center justify-center text-xs font-bold text-brand-bg flex-shrink-0">
                  {(msg.displayName || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className={`max-w-xs ${msg.uid === user.uid ? 'items-end' : 'items-start'} flex flex-col`}>
                {msg.uid !== user.uid && <p className="text-[10px] text-white/30 mb-1 ml-1">{msg.displayName}</p>}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${msg.uid === user.uid ? 'bg-cyan text-brand-bg font-medium rounded-br-sm' : 'bg-white/[0.06] border border-white/[0.08] rounded-bl-sm'}`}>
                  {msg.message}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-brand-border bg-brand-bg2">
        <div className="flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Send a message to the room..."
            className="input-dark flex-1 text-sm" />
          <motion.button whileTap={{ scale: 0.92 }} onClick={sendMsg}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl bg-cyan flex items-center justify-center text-brand-bg disabled:opacity-40">
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
